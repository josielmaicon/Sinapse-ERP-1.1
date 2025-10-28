from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from .. import models, schemas
from ..database import get_db
from datetime import datetime, timedelta
from typing import Dict, List

router = APIRouter(
    prefix="/api/fiscal",
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
    # Removido o db.begin() explícito
    for venda_a_emitir in vendas_para_emitir:
        print(f"  - ID: {venda_a_emitir.id}, Valor: R$ {venda_a_emitir.valor_total:.2f}, Status Atual Real: {venda_a_emitir.status_fiscal if not venda_a_emitir.nota_fiscal_saida else venda_a_emitir.nota_fiscal_saida.status_sefaz}")
        
        # --- LÓGICA REAL (exemplo) ---
        # venda_a_emitir.status_fiscal = 'em_processamento' 
        # db.add(venda_a_emitir) # Adiciona à sessão para salvar a mudança
        # --- Fim da Lógica Real ---
        
        ids_emitidos.append(venda_a_emitir.id)
            
    # Commit será feito automaticamente pelo FastAPI/Depends(get_db) se não houver erro
            
    print(f"Valor Total a Emitir (Seleção): R$ {valor_acumulado:.2f}") 
    print(f"------------------------------------")
    
    # Verifica se realmente selecionamos alguma venda (pode não acontecer se todas forem 0 ou negativas)
    if not vendas_para_emitir:
         return schemas.ActionResponse(message="Não foi possível selecionar vendas válidas para atingir a meta (verificar valores).")

    return schemas.ActionResponse(message=f"{len(vendas_para_emitir)} venda(s) (IDs: {ids_emitidos}) enviada(s) para emissão para tentar atingir a meta.")
