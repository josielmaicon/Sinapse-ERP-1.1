from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from .. import models, schemas
from ..database import get_db
from datetime import datetime, timedelta
from typing import Dict, List
from ..services import fiscal_service
import random
import string

router = APIRouter(
    prefix="/fiscal",
    tags=["Fiscal"]
)

@router.get("/summary")
def get_fiscal_summary(db: Session = Depends(get_db)):
    """
    Retorna os dados consolidados para os painéis da página Fiscal.
    """
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # Lógica para "Valor Comprado no Mês" (continua a mesma)
    total_comprado = db.query(func.sum(models.NotaFiscalEntrada.valor_total)).filter(
        models.NotaFiscalEntrada.data_emissao >= start_of_month.date()
    ).scalar() or 0

    # Lógica para "Valor Emitido no Mês" (continua a mesma)
    total_emitido = db.query(func.sum(models.Venda.valor_total)).join(models.NotaFiscalSaida).filter(
        models.NotaFiscalSaida.status_sefaz == 'Autorizada',
        models.NotaFiscalSaida.data_hora_autorizacao >= start_of_month
    ).scalar() or 0
    
    # ✅ LÓGICA PARA O GRÁFICO
    daily_issuance_query = db.query(
        extract('day', models.NotaFiscalSaida.data_hora_autorizacao).label('day'),
        func.sum(models.Venda.valor_total).label('issuedValue')
    ).join(models.Venda).filter(
        models.NotaFiscalSaida.status_sefaz == 'Autorizada',
        extract('month', models.NotaFiscalSaida.data_hora_autorizacao) == start_of_month.month
    ).group_by('day').order_by('day').all()

    # ✅ LÓGICA PARA OS INDICADORES DE AUDITORIA
    rejected_count = db.query(func.count(models.NotaFiscalSaida.id)).filter(
        models.NotaFiscalSaida.status_sefaz == 'Rejeitada'
    ).scalar() or 0
    
    old_pending_count = db.query(func.count(models.Venda.id)).filter(
        models.Venda.status_fiscal == 'pendente',
        models.Venda.data_hora < seven_days_ago
    ).scalar() or 0

    return {
        "total_comprado_mes": total_comprado,
        "total_emitido_mes": total_emitido,
        "resumo_diario": [
            {"day": int(row.day), "issuedValue": float(row.issuedValue or 0)}
            for row in daily_issuance_query
        ],
        "notas_rejeitadas": rejected_count,
        "pendentes_antigas": old_pending_count
    }

@router.get("/config", response_model=schemas.FiscalConfigResponse)
def get_fiscal_config(db: Session = Depends(get_db)):
    """Busca as configurações fiscais salvas no banco."""
    
    # Busca as chaves relevantes
    configs_db = db.query(models.Configuracao).filter(
        models.Configuracao.chave.in_([
            'fiscal_strategy', 
            'fiscal_goal_value', 
            'fiscal_autopilot_enabled'
        ])
    ).all()
    
    # Converte a lista de objetos em um dicionário chave: valor
    config_map: Dict[str, str] = {c.chave: c.valor for c in configs_db}

    # Monta a resposta, usando defaults se a chave não existir
    return schemas.FiscalConfigResponse(
        strategy=config_map.get('fiscal_strategy', 'coeficiente'),
        # Converte o valor salvo (string) para float, com fallback
        goal_value=float(config_map.get('fiscal_goal_value', '2.1')), 
        # Converte o valor salvo ('true'/'false') para bool, com fallback
        autopilot_enabled=(config_map.get('fiscal_autopilot_enabled', 'false').lower() == 'true') 
    )

# --- ✅ NOVA ROTA: Atualizar Configuração ---
@router.post("/config", response_model=schemas.FiscalConfigResponse)
def update_fiscal_config(
    config_update: schemas.FiscalConfigUpdateRequest,
    db: Session = Depends(get_db)
):
    """Salva/Atualiza as configurações fiscais no banco."""
    
    configs_to_save: Dict[str, str] = {
        'fiscal_strategy': config_update.strategy,
        'fiscal_goal_value': str(config_update.goal_value), # Salva como string
        'fiscal_autopilot_enabled': str(config_update.autopilot_enabled).lower() # Salva 'true' ou 'false'
    }

    with db.begin(): # Usa transação
        for key, value in configs_to_save.items():
            # Tenta encontrar a configuração existente
            db_config = db.query(models.Configuracao).filter(models.Configuracao.chave == key).first()
            if db_config:
                # Se existe, atualiza o valor
                db_config.valor = value
            else:
                # Se não existe, cria uma nova
                db_config = models.Configuracao(chave=key, valor=value)
                db.add(db_config)
                
    # Retorna a configuração que foi salva (já convertida pelo Pydantic)
    return schemas.FiscalConfigResponse(
        strategy=configs_to_save['fiscal_strategy'],
        goal_value=float(configs_to_save['fiscal_goal_value']),
        autopilot_enabled=(configs_to_save['fiscal_autopilot_enabled'] == 'true')
    )

def _simular_emissao_bem_sucedida(venda: models.Venda, db: Session):
    """
    Atualiza o status da venda e cria/atualiza NotaFiscalSaida 
    para simular uma emissão bem-sucedida. Envia mudanças com flush.
    """
    now = datetime.utcnow()
    chave_ficticia = f"NFe{venda.id}{''.join(random.choices(string.digits, k=34))}"[:44]
    protocolo_ficticio = f"Proto{random.randint(100000, 999999)}"

    nota_existente = db.query(models.NotaFiscalSaida).filter(
        models.NotaFiscalSaida.venda_id == venda.id
    ).first()

    if nota_existente:
        nota_existente.chave_acesso = chave_ficticia
        nota_existente.protocolo = protocolo_ficticio
        nota_existente.status_sefaz = 'Autorizada' 
        nota_existente.data_emissao = now 
        nota_existente.data_hora_autorizacao = now 
        db.add(nota_existente) 
        print(f"  - Nota Fiscal Saída ID {nota_existente.id} ATUALIZADA para Venda {venda.id}")
    else:
        nova_nota = models.NotaFiscalSaida(
            venda_id=venda.id,
            chave_acesso=chave_ficticia,
            protocolo=protocolo_ficticio,
            status_sefaz='Autorizada', 
            data_emissao=now,
            data_hora_autorizacao=now
        )
        db.add(nova_nota) 
        print(f"  - Nova Nota Fiscal Saída CRIADA para Venda {venda.id}")

    # Atualiza o status fiscal da Venda
    venda.status_fiscal = 'emitida' 
    db.add(venda) 
    
    # ✅ GARANTE QUE O SQL SEJA ENVIADO AO BANCO AGORA (dentro da transação)
    try:
        db.flush() 
        print(f"  - Mudanças para Venda {venda.id} enviadas ao DB (pré-commit).")
    except Exception as e:
        # Se o flush falhar, algo está errado com os dados ou o modelo
        print(f"  - ERRO DURANTE O FLUSH para Venda {venda.id}: {e}")
        # Importante: Levantar o erro aqui fará o FastAPI dar rollback
        raise e

@router.post("/emitir-meta", response_model=schemas.ActionResponse)
def trigger_emitir_meta(db: Session = Depends(get_db)):
    """
    Encontra vendas REALMENTE pendentes (considerando NotaFiscalSaida)
    e as marca para emissão (simulação) até atingir a meta configurada.
    """
    
    # 1. Busca a configuração atual
    current_config = get_fiscal_config(db) 
    
    if current_config.autopilot_enabled:
        return schemas.ActionResponse(message="Piloto automático está ativo. A emissão manual até a meta não é necessária.")

    # 2. Busca os totais atuais
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    total_comprado = db.query(func.sum(models.NotaFiscalEntrada.valor_total)).filter(
        models.NotaFiscalEntrada.data_emissao >= start_of_month.date() # Ajuste se data_emissao for datetime
    ).scalar() or 0.0

    total_emitido = db.query(func.sum(models.Venda.valor_total))\
        .join(models.NotaFiscalSaida, models.Venda.id == models.NotaFiscalSaida.venda_id)\
        .filter(
            # Considere todos os status que contam como "emitido com sucesso"
            models.NotaFiscalSaida.status_sefaz.in_(['Autorizada', 'Emitida']), 
            models.NotaFiscalSaida.data_hora_autorizacao >= start_of_month
    ).scalar() or 0.0

    # 3. Calcula a meta alvo
    calculated_goal = 0.0
    if current_config.strategy == "coeficiente":
        calculated_goal = total_comprado * current_config.goal_value
    elif current_config.strategy == "porcentagem":
        calculated_goal = total_comprado * (1 + current_config.goal_value / 100.0)
    elif current_config.strategy == "valor_fixo":
        calculated_goal = current_config.goal_value
    else: # Caso a estratégia seja inválida por algum motivo
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Estratégia fiscal configurada inválida.")
        
    valor_necessario = max(0.0, calculated_goal - total_emitido)

    if valor_necessario <= 0:
        return schemas.ActionResponse(message="A meta de emissão já foi atingida ou superada.")

    # 4. Busca vendas candidatas (status interno 'pendente') e pré-carrega a nota
    vendas_candidatas = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida) 
    ).filter(
        models.Venda.status_fiscal == 'pendente' 
        # Poderia adicionar filtro de data aqui se a meta for mensal e houver vendas antigas
        # models.Venda.data_hora >= start_of_month 
    ).order_by(models.Venda.data_hora.asc()).all()

    # 5. Filtra em Python para achar as REALMENTE pendentes
    vendas_realmente_pendentes: List[models.Venda] = []
    status_considerados_finais = ['autorizada', 'emitida', 'cancelada', 'rejeitada', 'nao_declarar'] # Status que impedem nova emissão (em minúsculas)

    for venda in vendas_candidatas:
        status_final = venda.status_fiscal.lower() # Começa com o status interno (em minúsculas)
        
        if venda.nota_fiscal_saida and venda.nota_fiscal_saida.status_sefaz:
             # Se existe nota E ela tem status SEFAZ, usa o status da SEFAZ
             status_sefaz_lower = venda.nota_fiscal_saida.status_sefaz.lower()
             
             # Se o status da SEFAZ NÃO for um dos finais, ainda pode ser considerado pendente
             if status_sefaz_lower not in status_considerados_finais:
                 status_final = status_sefaz_lower # Ex: 'em processamento' vindo da SEFAZ
             else:
                 status_final = status_sefaz_lower # Usa o status final da SEFAZ

        # Só adiciona se o status final NÃO for um dos que impedem a emissão
        if status_final not in status_considerados_finais:
             vendas_realmente_pendentes.append(venda)

    if not vendas_realmente_pendentes:
        return schemas.ActionResponse(message="Meta não atingida, mas não há vendas pendentes válidas para emitir no momento.")

    # 6. Seleciona vendas até atingir o valor necessário
    vendas_para_emitir: List[models.Venda] = []
    valor_acumulado = 0.0
    for venda in vendas_realmente_pendentes:
        # Adiciona a venda *antes* de verificar se ultrapassou,
        # para garantir que pelo menos uma seja emitida se necessário,
        # mesmo que ela sozinha ultrapasse um pouco a meta.
        vendas_para_emitir.append(venda)
        valor_acumulado += venda.valor_total
        if valor_acumulado >= valor_necessario:
            break # Paramos assim que atingimos ou ultrapassamos

    # 7. SIMULAÇÃO: Marcar as vendas para emissão
    print(f"--- SIMULAÇÃO: Emitir Meta Agora ---")
    print(f"Meta Calculada: R$ {calculated_goal:.2f}")
    print(f"Emitido Até Agora: R$ {total_emitido:.2f}")
    print(f"Valor Necessário: R$ {valor_necessario:.2f}")
    print(f"Vendas Realmente Pendentes Encontradas: {len(vendas_realmente_pendentes)}")
    print(f"Vendas Selecionadas para Emissão ({len(vendas_para_emitir)}):")
    
    ids_emitidos = []
    erros_emissao = []
    
    # ✅ LÓGICA REAL: Itera e tenta emitir (simuladamente) cada venda selecionada
    for venda_a_emitir in vendas_para_emitir:
        print(f"  - Tentando emitir Venda ID {venda_a_emitir.id} (Valor: R$ {venda_a_emitir.valor_total:.2f})...")
        try:
            # Chama a função auxiliar para fazer a mágica no DB
            _simular_emissao_bem_sucedida(venda_a_emitir, db)
            ids_emitidos.append(venda_a_emitir.id)
        except Exception as e:
            # Captura erros inesperados durante a atualização do DB
            print(f"  - ERRO ao processar Venda ID {venda_a_emitir.id} no DB: {e}")
            erros_emissao.append(f"DB Venda {venda_a_emitir.id}: {e}")
            # Considerar rollback PARCIAL aqui seria complexo sem db.begin() por item.
            # Por enquanto, apenas logamos e continuamos.
            
    print(f"Valor Total Emitido (Seleção): R$ {valor_acumulado:.2f}") 
    print(f"------------------------------------")
    
    if not ids_emitidos and not erros_emissao:
        return schemas.ActionResponse(message="Nenhuma venda válida selecionada ou encontrada para atingir a meta.")
        
    message = f"{len(ids_emitidos)} venda(s) marcada(s) como emitida(s) no banco."
    if erros_emissao:
        message += f" Erros: {'; '.join(erros_emissao)}"

    return schemas.ActionResponse(message=message)

@router.post("/emitir/lote", response_model=schemas.ActionResponse)
def trigger_emitir_lote(
    request_data: schemas.EmitirLoteRequest,
    db: Session = Depends(get_db)
):
    """
    Tenta MARCAR COMO EMITIDA uma lista específica de IDs de venda no DB.
    Verifica se cada venda está realmente pendente antes.
    """
    venda_ids_para_emitir = request_data.venda_ids
    if not venda_ids_para_emitir:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhum ID de venda fornecido.")

    # Busca as vendas solicitadas e pré-carrega suas notas fiscais de saída associadas
    vendas_solicitadas = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida) # Garante que a nota venha junto
    ).filter(
        models.Venda.id.in_(venda_ids_para_emitir)
    ).all()

    # Cria um dicionário para encontrar rapidamente a venda pelo ID
    vendas_encontradas_map = {venda.id: venda for venda in vendas_solicitadas}

    ids_processados = [] # Lista de IDs que foram marcados como emitidos com sucesso
    erros = [] # Lista de mensagens de erro ou avisos
    # Define quais status são considerados "finais" e impedem uma nova emissão
    status_considerados_finais = ['autorizada', 'emitida', 'cancelada', 'rejeitada', 'nao_declarar', 'não declarar']

    print(f"--- Processando Requisição: /fiscal/emitir/lote ---")
    print(f"IDs Solicitados para Emissão: {venda_ids_para_emitir}")

    # Itera sobre cada ID de venda que o frontend enviou
    for venda_id in venda_ids_para_emitir:
        venda = vendas_encontradas_map.get(venda_id)

        # 1. Verifica se a venda existe no banco
        if not venda:
            mensagem_erro = f"Venda ID {venda_id} não encontrada no banco de dados."
            print(f"  - ERRO: {mensagem_erro}")
            erros.append(mensagem_erro)
            continue # Pula para o próximo ID da lista

        # 2. Determina o status fiscal real da venda (considerando a Nota Fiscal Saída)
        status_final = venda.status_fiscal.lower() # Começa com o status interno da Venda
        if venda.nota_fiscal_saida and venda.nota_fiscal_saida.status_sefaz:
            # Se existe uma nota fiscal associada E ela tem um status da SEFAZ,
            # este status tem prioridade.
            status_sefaz_lower = venda.nota_fiscal_saida.status_sefaz.lower()
            # Atualiza o status_final apenas se o status da SEFAZ for relevante
            # (poderíamos ser mais específicos aqui se necessário)
            status_final = status_sefaz_lower

        # 3. Verifica se a venda já tem um status final que impede nova emissão
        if status_final in status_considerados_finais:
            mensagem_aviso = f"Venda ID {venda_id} já possui status final '{status_final}'. Nenhuma ação realizada."
            print(f"  - AVISO: {mensagem_aviso}")
            erros.append(mensagem_aviso) # Adiciona como aviso, não necessariamente erro
            continue # Pula para o próximo ID

        # 4. Se passou pelas verificações, tenta simular a emissão
        print(f"  - Tentando marcar como emitida a Venda ID {venda_id} (Valor: R$ {venda.valor_total:.2f})...")
        try:
            # Chama a função auxiliar que faz as alterações nos objetos SQLAlchemy
            # e chama db.flush() para enviar os comandos SQL ao banco (pré-commit)
            _simular_emissao_bem_sucedida(venda, db)
            ids_processados.append(venda_id)
            print(f"  - Venda ID {venda_id} marcada para commit.")
        except Exception as e:
            # Captura qualquer erro que ocorra durante o flush ou manipulação do objeto
            mensagem_erro_db = f"Erro ao processar Venda ID {venda_id} no DB: {e}"
            print(f"  - ERRO: {mensagem_erro_db}")
            erros.append(mensagem_erro_db)
            # Neste ponto, podemos decidir parar todo o lote (raise e) ou apenas pular esta venda.
            # Por padrão, vamos pular e tentar as outras. O FastAPI cuidará do rollback se necessário.
            # Se quiséssemos garantir que *ou todas* funcionam *ou nenhuma*, usaríamos db.begin()
            # no início da ROTA e db.rollback() aqui. Mas vamos manter simples por ora.
            continue # Pula para o próximo ID

    # 5. Tenta fazer o COMMIT explícito (para depuração e garantia)
    try:
        if ids_processados: # Só tenta commitar se alguma venda foi processada com sucesso
             print(f"Tentando commit explícito para IDs processados: {ids_processados}")
             db.commit() # Salva permanentemente TODAS as alterações feitas na sessão 'db'
             print("Commit explícito bem-sucedido.")
        else:
             print("Nenhuma venda foi processada com sucesso, commit explícito não realizado.")
             # Se houve erros, o FastAPI/Depends(get_db) provavelmente fará rollback de qualquer forma.

    except Exception as e_commit:
        # Captura erros durante o commit final (raro, mas pode acontecer)
        print(f"ERRO CRÍTICO durante o commit explícito: {e_commit}")
        db.rollback() # Garante que tudo seja desfeito se o commit falhar
        # Levanta um erro HTTP 500 para o frontend saber que a operação falhou
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro crítico ao salvar alterações no banco: {e_commit}")

    print(f"--- Fim do Processamento: /fiscal/emitir/lote ---")

    # 6. Monta a mensagem de resposta para o frontend
    message = f"{len(ids_processados)} de {len(venda_ids_para_emitir)} notas solicitadas foram marcadas como emitidas no banco."
    if erros:
        # Adiciona os erros/avisos à mensagem
        message += f" Detalhes: {'; '.join(erros)}"

    # Retorna a resposta
    return schemas.ActionResponse(message=message)


# ✅ NOVA ROTA: Emitir TODAS as vendas pendentes
@router.post("/emitir/pendentes", response_model=schemas.ActionResponse)
def trigger_emitir_pendentes(db: Session = Depends(get_db)):
    """
    Busca todas as notas fiscais que precisam ser enviadas (pendentes ou rejeitadas)
    e tenta transmitir uma por uma usando o Motor Fiscal.
    """
    
    # 1. Busca Notas "Encalhadas" (Pendente, Rejeitada ou Erro)
    #    Não olhamos mais para a Venda, olhamos para o Documento Fiscal.
    notas_para_emitir = db.query(models.NotaFiscalSaida).filter(
        models.NotaFiscalSaida.status_sefaz.in_(['pendente', 'rejeitada', 'erro'])
    ).all()

    if not notas_para_emitir:
        return schemas.ActionResponse(message="Não há notas pendentes para emitir no momento.")

    sucessos = 0
    falhas = 0
    erros_msg = []

    print(f"--- INICIANDO LOTE: {len(notas_para_emitir)} notas ---")
    
    for nota in notas_para_emitir:
        try:
            print(f"  > Transmitindo Nota ID {nota.id}...")
            
            # 🚀 Chama o Motor Real (o mesmo do botão individual)
            nota_atualizada = fiscal_service.transmitir_nota(nota.id, db)
            
            if nota_atualizada.status_sefaz == 'autorizada':
                sucessos += 1
            else:
                falhas += 1
                # Guarda a mensagem de erro da primeira falha para mostrar no toast
                if len(erros_msg) < 3: 
                    erros_msg.append(f"Nota {nota.id}: {nota_atualizada.xmotivo}")
                    
        except Exception as e:
            print(f"  X Erro Crítico Nota {nota.id}: {e}")
            falhas += 1
            erros_msg.append(f"Nota {nota.id}: Erro interno")

    # 3. Relatório Final
    resumo = f"Processamento concluído. {sucessos} autorizadas, {falhas} falhas."
    if erros_msg:
        resumo += f" Detalhes: {', '.join(erros_msg)}..."
        
    return schemas.ActionResponse(message=resumo)

@router.post("/emitir/{venda_id}", response_model=schemas.Venda) # Ou um schema mais específico
def trigger_emitir_single(venda_id: int, db: Session = Depends(get_db)):
    """
    (SIMULAÇÃO) Tenta emitir uma única nota fiscal para a venda especificada.
    Retorna a venda atualizada (ou um status).
    """
    venda = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida)
    ).filter(models.Venda.id == venda_id).first()

    if not venda:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada.")

    print(f"--- SIMULAÇÃO: Emitir Nota Única ---")
    print(f"  - Processando Venda ID {venda.id}...")
    
    try:
        _simular_emissao_bem_sucedida(venda, db)
    except Exception as e:
        print(f"  - ERRO ao processar Venda ID {venda.id} no DB: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao atualizar banco de dados para Venda {venda.id}: {e}")
    
    print(f"--- Fim do Processamento ---")
    
    db.refresh(venda, ['nota_fiscal_saida']) 
    return venda

@router.post("/notas/{nota_id}/transmitir") # URL canônica
def transmitir_nota_manual(nota_id: int, db: Session = Depends(get_db)):
    try:
        nota_atualizada = fiscal_service.transmitir_nota(nota_id, db)
        return {
            "status": nota_atualizada.status,
            "mensagem": nota_atualizada.xmotivo,
            "protocolo": nota_atualizada.protocolo
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")