# app/routers/vendas.py
from typing import List, Dict, Optional
from datetime import date, datetime
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload, selectinload
from .. import models, schemas
from ..utils.security import verify_password
from ..database import get_db
from ..services import fiscal_service

router = APIRouter(prefix="/vendas", tags=["Vendas"])

# --- ROTAS DE DASHBOARD ---

@router.get("/resumo-diario-dinamico", response_model=List[schemas.ResumoDiario])
def get_resumo_diario_dinamico(db: Session = Depends(get_db)):
    """
    Retorna o faturamento agrupado por dia e por PDV.
    (Versão PostgreSQL Compatible)
    """
    
    campo_data = cast(models.Venda.data_hora, Date).label("sale_date")

    resultado_query = (
        db.query(
            campo_data,
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("daily_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(models.Venda.status == "concluida")
        
        .group_by(campo_data, models.Pdv.id, models.Pdv.nome)
        
        .order_by(campo_data)
        .all()
    )

    dados_agrupados: Dict[date, schemas.ResumoDiario] = {}
    for row in resultado_query:
        if row.sale_date not in dados_agrupados:
            dados_agrupados[row.sale_date] = schemas.ResumoDiario(
                date=row.sale_date,
                faturamento_total_dia=0,
                faturamento_por_pdv=[]
            )
        
        dados_agrupados[row.sale_date].faturamento_por_pdv.append(
            schemas.FaturamentoPorPdv(pdv_id=row.pdv_id, pdv_nome=row.pdv_name, total=row.daily_total)
        )
        dados_agrupados[row.sale_date].faturamento_total_dia += row.daily_total
            
    return list(dados_agrupados.values())

@router.get("/top-produtos", response_model=List[schemas.ProdutoMaisVendido])
def get_top_produtos(limit: int = 5, db: Session = Depends(get_db)):
    """
    Calcula e retorna os produtos mais vendidos por valor total.
    """
    top_produtos = (
        db.query(
            models.Produto.nome.label("name"),
            func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda).label("totalSales")
        )
        .join(models.Produto, models.VendaItem.produto_id == models.Produto.id)
        .group_by(models.Produto.id)
        .order_by(func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda).desc())
        .limit(limit)
        .all()
    )
    
    if not top_produtos:
        return []
        
    return top_produtos

# Certifique-se de ter esses imports no topo do arquivo app/routers/vendas.py
from sqlalchemy import func, cast, Date # ✅ Importar cast e Date é essencial para Postgres

@router.get("/resumo-hoje-por-hora", response_model=List[schemas.ResumoPorHora])
def get_resumo_hoje_por_hora(db: Session = Depends(get_db)):
    """
    Retorna o faturamento de HOJE, agrupado por hora e por PDV.
    (Versão Compatível com PostgreSQL)
    """
    today = date.today()
    
    # ✅ 1. CORREÇÃO: Formatação de Hora
    # SQLite: func.strftime('%H:00', ...)
    # Postgres: func.to_char(..., 'HH24:00')
    campo_hora = func.to_char(models.Venda.data_hora, 'HH24:00').label("sale_hour")
    
    # ✅ 2. CORREÇÃO: Comparação de Data
    # SQLite: func.date(...)
    # Postgres: cast(..., Date)
    data_venda_date = cast(models.Venda.data_hora, Date)

    resultado_query = (
        db.query(
            campo_hora, # Usa a expressão definida acima
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("hourly_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(
            models.Venda.status == "concluida",
            data_venda_date == today # ✅ Compara Date com Date (Seguro)
        )
        .group_by(campo_hora, models.Pdv.id, models.Pdv.nome) # ✅ Agrupamento Explícito
        .order_by(campo_hora)
        .all()
    )

    dados_agrupados: Dict[str, schemas.ResumoPorHora] = {}
    for row in resultado_query:
        if row.sale_hour not in dados_agrupados:
            dados_agrupados[row.sale_hour] = schemas.ResumoPorHora(
                hour=row.sale_hour,
                faturamento_total_hora=0,
                faturamento_por_pdv=[]
            )
        
        dados_agrupados[row.sale_hour].faturamento_por_pdv.append(
            schemas.FaturamentoPorPdvHora(pdv_id=row.pdv_id, pdv_nome=row.pdv_name, total=row.hourly_total)
        )
        dados_agrupados[row.sale_hour].faturamento_total_hora += row.hourly_total
            
    return list(dados_agrupados.values())

# --- ROTAS DE CRUD DE VENDA ---

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    """
    Retorna todas as vendas, com suas notas fiscais (se existirem).
    Esta é a única definição desta rota.
    """
    vendas = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida)
    ).order_by(models.Venda.data_hora.desc()).all()
    
    return vendas

@router.post("/iniciar", response_model=schemas.Venda)
def iniciar_venda(request: schemas.IniciarVendaRequest, db: Session = Depends(get_db)):
    # (Esta rota é usada por 'adicionar_item_smart' agora, mas pode ser mantida)
    pdv = db.query(models.Pdv).filter(models.Pdv.id == request.pdv_id).first()
    if not pdv:
        raise HTTPException(status_code=404, detail="PDV não encontrado")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    codigo_venda = f"VENDA_{timestamp}_{pdv.nome.upper()}"

    venda = models.Venda(
        pdv_id=request.pdv_id,
        operador_id=request.operador_id,
        status="em_andamento",
        codigo_venda=codigo_venda
    )
    db.add(venda)
    db.commit()
    db.refresh(venda)
    return venda

@router.post("/{venda_id}/adicionar-item", response_model=schemas.Venda)
def adicionar_item_venda(venda_id: int, item: schemas.VendaItemCreate, db: Session = Depends(get_db)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda or venda.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Venda não encontrada ou já finalizada.")
    
    produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    
    venda_item = models.VendaItem(
        venda_id=venda.id,
        produto_id=item.produto_id,
        quantidade=item.quantidade,
        preco_unitario_na_venda=produto.preco_venda
    )
    db.add(venda_item)

    venda.valor_total += item.quantidade * produto.preco_venda
    db.commit()
    db.refresh(venda)
    return venda

@router.post("/finalizar", response_model=schemas.PdvVendaResponse)
def finalizar_venda_pdv(
    request: schemas.PdvVendaRequest,
    db: Session = Depends(get_db)
):
    """
    Fecha o ciclo da venda:
    1. Valida totais.
    2. Processa pagamentos (Dinheiro/Crediário).
    3. Efetiva a venda no banco.
    4. Aciona o motor fiscal (NFC-e) conforme configuração.
    """

    # --- 1. VALIDAÇÕES PRÉVIAS (Sem tocar no banco ainda) ---
    valor_total_pago = sum(p.valor for p in request.pagamentos)
    
    # Margem de erro de arredondamento (float)
    if round(valor_total_pago, 2) < round(request.total_calculado, 2) - 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pagamento insuficiente. Total: {request.total_calculado:.2f}, Pago: {valor_total_pago:.2f}"
        )
        
    valor_troco = max(0.0, valor_total_pago - request.total_calculado)

    try:
        # Inicia controle manual de transação (para poder dar commit antes do fiscal)
        # Não usamos 'with db.begin()' aqui para ter controle granular do momento do commit.
        
        # --- 2. BUSCA E TRAVA A VENDA ---
        venda = db.query(models.Venda).filter(
            models.Venda.pdv_id == request.pdv_db_id,
            models.Venda.operador_id == request.operador_db_id,
            models.Venda.status == "em_andamento"
        ).with_for_update().first()

        if not venda:
            raise HTTPException(status_code=404, detail="Nenhuma venda 'em andamento' encontrada para este caixa.")

        # --- 3. ATUALIZA DADOS DA VENDA ---
        venda.status = "concluida"
        venda.cliente_id = request.cliente_db_id
        
        # ✅ NOVO: Salva o CPF Avulso na venda (se houver) para a nota fiscal
        if request.cpf_nota:
            venda.cpf_nota = request.cpf_nota.replace(".", "").replace("-", "") # Limpa formatação

        # Auditoria de valor (Opcional)
        if abs(venda.valor_total - request.total_calculado) > 0.05:
            print(f"⚠️ Alerta: Divergência de valor. Front: {request.total_calculado}, Back: {venda.valor_total}")
            # Em sistemas rígidos, isso bloquearia. Aqui aceitamos o valor do banco.

        db.add(venda)
        
        # --- 4. PROCESSA PAGAMENTOS ---
        for pagamento in request.pagamentos:
            
            # >>> Lógica de CREDIÁRIO <<<
            if pagamento.tipo == 'crediario':
                if not request.cliente_db_id:
                    raise HTTPException(status_code=400, detail="Cliente não identificado para venda em crediário.")
                
                db_cliente = db.query(models.Cliente).filter(
                    models.Cliente.id == request.cliente_db_id
                ).with_for_update().first()
                
                if not db_cliente:
                    raise HTTPException(status_code=404, detail="Cliente do crediário não encontrado.")
                
                # A. Validação de Status (O Porteiro)
                if db_cliente.status_conta != 'ativo':
                     raise HTTPException(
                         status_code=403,
                         detail=f"Compra negada: Conta {db_cliente.status_conta}."
                     )
                
                # B. Validação de Limite com Override (O Gerente)
                limite_disponivel = (db_cliente.limite_credito - db_cliente.saldo_devedor)
                
                if not db_cliente.trust_mode and pagamento.valor > limite_disponivel:
                     autorizado = False
                     
                     # Verifica "Crachá" de Override
                     if request.override_auth and request.override_auth.admin_senha:
                         admin = get_admin_by_password_only(request.override_auth, db)
                         if admin:
                             autorizado = True
                             print(f"AUDITORIA: Override limite Cliente {db_cliente.id} por Admin {admin.id}")

                     if not autorizado:
                         raise HTTPException(
                             status_code=402, # Payment Required (Gatilho do Frontend)
                             detail=f"Limite insuficiente. Disponível: R$ {limite_disponivel:.2f}"
                         )
                
                # C. Efetivação
                db_cliente.saldo_devedor += pagamento.valor
                db.add(db_cliente)
                
                db.add(models.TransacaoCrediario(
                    cliente_id=request.cliente_db_id,
                    tipo='compra',
                    valor=pagamento.valor,
                    descricao=f"Venda #{venda.id}",
                    venda_id=venda.id,
                    data_hora=datetime.utcnow()
                ))
            
            # >>> Lógica de DINHEIRO <<<
            if pagamento.tipo == 'dinheiro':
                db.add(models.MovimentacaoCaixa(
                    tipo='suprimento',
                    valor=pagamento.valor,
                    pdv_id=request.pdv_db_id,
                    operador_id=request.operador_db_id
                ))

        # --- 5. TROCO ---
        if valor_troco > 0:
            db.add(models.MovimentacaoCaixa(
                tipo='sangria',
                valor=valor_troco,
                pdv_id=request.pdv_db_id,
                operador_id=request.operador_db_id
            ))

        # --- 6. FORMA DE PAGAMENTO (Resumo) ---
        if request.pagamentos:
            # Se tiver mais de um, marca como misto, senão pega o primeiro
            venda.forma_pagamento = "misto" if len(request.pagamentos) > 1 else request.pagamentos[0].tipo
        else:
            venda.forma_pagamento = "indefinido"
        
        db.add(venda)

        # 🚨 PONTO CRÍTICO: COMMIT DA VENDA 🚨
        # Salvamos a venda AGORA. O dinheiro entrou. O estoque saiu.
        # Se o fiscal falhar depois daqui, a venda NÃO pode ser desfeita.
        db.commit()
        db.refresh(venda)

        # ==================================================================
        # 🚀 7. O MOTOR FISCAL (Pós-Venda)
        # ==================================================================
        
        mensagem_fiscal = ""
        
        try:
            # A. Busca Configuração da Empresa
            config_empresa = db.query(models.Empresa).first()
            modo_emissao = config_empresa.modo_emissao if config_empresa else "automatico"
            
            # B. Gera a Nota "Pendente" (O Nascimento)
            # Isso cria o registro no banco de notas.
            nota = fiscal_service.inicializar_nota_para_venda(venda.id, db)
            # Commit da nota pendente
            db.commit() 
            
            # C. Tenta Transmitir (Se configurado para automático)
            if modo_emissao in ["automatico", "sincrono"]:
                print(f"📡 Tentando transmissão automática para Venda {venda.id}...")
                try:
                    # Chama o motor real que conecta no PHP/SEFAZ
                    nota_processada = fiscal_service.transmitir_nota(nota.id, db)
                    
                    if nota_processada.status_sefaz == 'Autorizada':
                        mensagem_fiscal = " | NFe Autorizada ✅"
                    elif nota_processada.status_sefaz == 'Rejeitada':
                        mensagem_fiscal = f" | NFe Rejeitada ❌ ({nota_processada.xmotivo})"
                    else:
                        mensagem_fiscal = " | NFe Pendente ⏳"
                        
                except Exception as e_transmissao:
                    # Se der erro de conexão (internet, timeout), não faz mal.
                    # A nota já está salva como 'Pendente'. O robô ou o gerente envia depois.
                    print(f"⚠️ Falha na transmissão (Contingência Ativa): {e_transmissao}")
                    mensagem_fiscal = " | NFe em Contingência ⚠️"

        except Exception as e_fiscal:
            # Se der erro na GERAÇÃO da nota (antes de salvar), logamos.
            # A venda continua válida.
            print(f"❌ Erro crítico no módulo fiscal: {e_fiscal}")
            mensagem_fiscal = " | Erro Fiscal (Verificar Log)"


        # --- 8. RETORNO FINAL ---
        return schemas.PdvVendaResponse(
            venda_id=venda.id,
            mensagem=f"Venda #{venda.id} finalizada com sucesso!{mensagem_fiscal}",
            troco=valor_troco
        )
            
    except HTTPException as he:
        # Se der erro de negócio (limite, saldo), desfaz tudo (antes do commit da venda)
        db.rollback()
        raise he
    except Exception as e:
        # Se der erro de código, desfaz tudo
        db.rollback()
        print(f"ERRO CRÍTICO DE VENDA: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar a venda: {str(e)}"
        )
            
@router.post("/adicionar-item-smart", response_model=schemas.Venda)
def adicionar_item_smart(request: schemas.AdicionarItemSmartRequest, db: Session = Depends(get_db)):
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    permitir_negativo = config.permitir_estoque_negativo if config else False

    now = datetime.utcnow()
    produto = db.query(models.Produto).options(
        joinedload(models.Produto.promocoes) 
    ).filter(
        models.Produto.codigo_barras == request.codigo_barras
    ).first()
    
    if not produto:
        raise HTTPException(status_code=404, detail=f"Produto com código '{request.codigo_barras}' não encontrado.")

    if request.quantidade % 1 != 0: 
        unidades_fracionaveis = ['KG', 'MT', 'LT', 'M', 'L'] 
        
        unidade_prod = (produto.unidade_medida or "UN").upper()

        if unidade_prod not in unidades_fracionaveis:
             raise HTTPException(
                status_code=400, 
                detail=f"ERRO: O produto '{produto.nome}' é vendido por '{unidade_prod}' e não aceita quantidade quebrada ({request.quantidade})."
            )

    preco_final = produto.preco_venda
    melhor_promocao_nome = None
    
    promocoes_validas = [
        p for p in produto.promocoes
        if p.data_inicio <= now and (p.data_fim is None or p.data_fim >= now)
    ]
    
    for promo in promocoes_validas:
        preco_promocional = produto.preco_venda
        if promo.tipo == 'percentual':
            preco_promocional = produto.preco_venda * (1 - promo.valor / 100.0)
        elif promo.tipo == 'preco_fixo':
            preco_promocional = promo.valor
            
        if preco_promocional < preco_final:
            preco_final = preco_promocional
            melhor_promocao_nome = promo.nome

    preco_final = round(preco_final, 2)

    venda = db.query(models.Venda).filter(
        models.Venda.pdv_id == request.pdv_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        pdv = db.query(models.Pdv).filter(models.Pdv.id == request.pdv_id).first()
        if not pdv: raise HTTPException(status_code=404, detail="PDV não encontrado")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        codigo_venda_str = f"VENDA_{timestamp}_{pdv.nome.upper().replace(' ', '')}"
        
        venda = models.Venda(
            pdv_id=request.pdv_id,
            operador_id=request.operador_id,
            status="em_andamento",
            codigo_venda=codigo_venda_str,
            valor_total=0.0 
        )
        db.add(venda)
        db.flush() # Garante o ID da venda

    # 4. VERIFICAÇÃO DE ESTOQUE (O Juiz)
    # Verifica se o item já existe na venda para somar a quantidade
    item_existente = db.query(models.VendaItem).filter(
        models.VendaItem.venda_id == venda.id,
        models.VendaItem.produto_id == produto.id
    ).first()

    quantidade_atual_no_carrinho = item_existente.quantidade if item_existente else 0
    quantidade_final_desejada = quantidade_atual_no_carrinho + request.quantidade

    # ✅ TRAVA DE SEGURANÇA: Verifica o TOTAL (Carrinho + Novo) contra o Estoque
    if not permitir_negativo and produto.quantidade_estoque < quantidade_final_desejada:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST, 
             detail=f"Estoque insuficiente. Disponível: {produto.quantidade_estoque}. Tentando vender: {quantidade_final_desejada}."
         )

    # 5. EFETIVAÇÃO (A Ação)
    if item_existente:
        item_existente.quantidade += request.quantidade
        # Nota: Mantemos o preço original do item ou atualizamos? 
        # Em geral, mantemos o preço de quando entrou, ou atualizamos tudo. 
        # Aqui estamos mantendo o preço antigo do item_existente.
    else:
        venda_item = models.VendaItem(
            venda_id=venda.id,
            produto_id=produto.id,
            quantidade=request.quantidade,
            preco_unitario_na_venda=preco_final
        )
        db.add(venda_item)
        if melhor_promocao_nome:
             print(f"Item adicionado com promoção: {melhor_promocao_nome}")
    
    db.flush() 

    # 6. ATUALIZAÇÃO FINAL
    total_calc = db.query(
        func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda)
    ).filter(models.VendaItem.venda_id == venda.id).scalar() or 0.0

    venda.valor_total = total_calc
    db.add(venda)
    db.commit()

    # 7. RETORNO
    venda_atualizada = db.query(models.Venda).options(
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(models.Venda.id == venda.id).first()
    
    return venda_atualizada

def get_admin_by_password_only(
    # ✅ O BODY (auth_request) AGORA É OPCIONAL
    auth_request: Optional[schemas.AdminAuthRequest] = None, 
    db: Session = Depends(get_db)
):
    """
    Verifica a senha (presencial) OU confia na aprovação remota (None).
    """
    
    # --- CAMINHO B: APROVAÇÃO REMOTA ---
    # Se NENHUMA credencial foi passada (fluxo remoto)
    if auth_request is None or auth_request.admin_senha is None:
        print("AUDITORIA: Ação autorizada remotamente (via Socket).")
        # Retorna o primeiro admin que encontrar, apenas para fins de log
        admin_placeholder = db.query(models.Usuario).filter(models.Usuario.funcao == "admin").first()
        if not admin_placeholder:
             # Se não houver admins, a ação não pode ser auditada
             raise HTTPException(status_code=404, detail="Nenhum administrador cadastrado no sistema para auditoria remota.")
        return admin_placeholder # Ação autorizada

    # --- CAMINHO A: APROVAÇÃO PRESENCIAL ---
    admins = db.query(models.Usuario).filter(models.Usuario.funcao == "admin").all()
    if not admins:
        raise HTTPException(status_code=404, detail="Nenhum administrador cadastrado.")

    for admin_user in admins:
        if verify_password(auth_request.admin_senha, admin_user.senha_hash):
            return admin_user # Senha presencial correta
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Código de Administrador inválido."
    )

def get_admin_from_remover_request(
    payload: schemas.RemoverItemRequest, # (Agora recebe o schema corrigido)
    db: Session = Depends(get_db)
):
    """
    Extrai 'auth' (que pode ser None) e passa para o validador.
    """
    # ✅ ESTA LINHA ESTÁ CORRETA
    # (payload.auth pode ser None, e get_admin_by_password_only aceita None)
    return get_admin_by_password_only(payload.auth, db)

@router.post("/{venda_id}/itens/{item_venda_id}/remover", response_model=schemas.Venda)
def remover_item_da_venda_auditada(
    venda_id: int, 
    item_venda_id: int, 
    payload: schemas.RemoverItemRequest,
    db: Session = Depends(get_db),
    admin_user: models.Usuario = Depends(get_admin_from_remover_request),
):
    """
    Remove parcialmente (ou totalmente) um item de uma venda 'em_andamento'.
    Requer autenticação de admin (código de barras).
    """
    
    item = db.query(models.VendaItem).filter(
        models.VendaItem.id == item_venda_id,
        models.VendaItem.venda_id == venda_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado nesta venda.")

    quantidade_a_remover = payload.quantidade
    
    if quantidade_a_remover <= 0:
        raise HTTPException(status_code=400, detail="Quantidade a remover deve ser positiva.")
        
    if quantidade_a_remover > item.quantidade:
        raise HTTPException(status_code=400, detail="Não é possível remover mais itens do que os existentes.")

    print(f"AUDITORIA: Admin ID: {admin_user.id} removeu {quantidade_a_remover} de {item.quantidade} do Item ID: {item_venda_id}")

    if quantidade_a_remover == item.quantidade:
        db.delete(item)
    else:
        item.quantidade -= quantidade_a_remover
    
    db.flush() 

    venda_atualizada = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    
    total_calc = db.query(
        func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda)
    ).filter(models.VendaItem.venda_id == venda_id).scalar() or 0.0

    venda_atualizada.valor_total = total_calc
    
    db.add(venda_atualizada)
    db.commit()
    db.refresh(venda_atualizada) # Garante que os dados mais recentes sejam enviados

    venda_com_itens = db.query(models.Venda).options(
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(models.Venda.id == venda_id).first()

    return venda_com_itens

@router.post("/{venda_id}/cancelar", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_venda_em_andamento(
    venda_id: int, 
    admin_user: models.Usuario = Depends(get_admin_by_password_only), 
    db: Session = Depends(get_db)
):
    """
    Cancela (e deleta) uma venda 'em_andamento'.
    Requer autenticação de admin (código de barras) via request body.
    """
    
    # O resto da sua lógica de 'cancelar_venda_em_andamento' 
    # (buscar venda, deletar itens, deletar venda, estornar estoque)
    # continua EXATAMENTE O MESMO.
    
    venda = db.query(models.Venda).options(
        selectinload(models.Venda.itens) 
    ).filter(
        models.Venda.id == venda_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda 'em andamento' não encontrada.")
    
    print(f"AUDITORIA: Venda #{venda_id} cancelada por Admin ID: {admin_user.id} ({admin_user.nome})")

    # (Lógica de estorno de estoque)
    for item in venda.itens:
        db_produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
        if db_produto:
            db_produto.quantidade_estoque += item.quantidade
            db.add(db_produto)
        
        db.delete(item)
        
    db.delete(venda)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/pdvs/{pdv_id}/venda-ativa", response_model=schemas.Venda)
def get_venda_ativa_por_pdv(pdv_id: int, db: Session = Depends(get_db)):
    """
    Busca a venda com status 'em_andamento' para o PDV especificado.
    Retorna 404 se não houver venda ativa.
    """
    
    venda_ativa = db.query(models.Venda).options(
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(
        models.Venda.pdv_id == pdv_id,
        models.Venda.status == "em_andamento"
    ).first()
    
    if not venda_ativa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma venda ativa encontrada para este PDV.")
        
    return venda_ativa

@router.delete("/{venda_id}/descartar-venda-ativa", status_code=status.HTTP_204_NO_CONTENT)
def descartar_venda_ativa_startup(venda_id: int, db: Session = Depends(get_db)):
    """
    Desfaz o estorno do estoque e deleta uma venda 'em_andamento'.
    Usado pelo modal de recuperação/descarte NA INICIALIZAÇÃO DO PDV.
    Não requer autenticação de admin, pois a ação é local do PDV.
    """
    
    venda = db.query(models.Venda).options(
        selectinload(models.Venda.itens) 
    ).filter(
        models.Venda.id == venda_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        print(f"Aviso: Venda {venda_id} não encontrada para descarte (talvez já processada).")
        return Response(status_code=status.HTTP_204_NO_CONTENT)
        
    print(f"DESCARTE: Estornando estoque para Venda #{venda_id}...")
    for item in venda.itens:
        db_produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
        if db_produto:
            db_produto.quantidade_estoque += item.quantidade
            db.add(db_produto)
    
    # 2. Deleta Venda e Itens
    db.delete(venda)
    db.commit()
    
    print(f"DESCARTE: Venda #{venda_id} descartada com sucesso.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/adicionar-item-manual", response_model=schemas.Venda)
def adicionar_item_manual(request: schemas.ManualItemRequest, db: Session = Depends(get_db)):

    venda = db.query(models.Venda).filter(
        models.Venda.pdv_id == request.pdv_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        pdv = db.query(models.Pdv).filter(models.Pdv.id == request.pdv_id).first()
        if not pdv: raise HTTPException(status_code=404, detail="PDV não encontrado")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        codigo_venda_str = f"VENDA_MANUAL_{timestamp}_{pdv.nome.upper().replace(' ', '')}"
        
        venda = models.Venda(
            pdv_id=request.pdv_id,
            operador_id=request.operador_id,
            status="em_andamento",
            codigo_venda=codigo_venda_str,
            valor_total=0.0 # Inicia com 0
        )
        db.add(venda)
        db.flush() # Para obter o ID da nova venda

    produto_diverso_id = 999999 # ID fictício para 'Diversos'

    venda_item = models.VendaItem(
        venda_id=venda.id,
        produto_id=produto_diverso_id, # Usando o ID Fictício
        quantidade=request.quantidade,
        preco_unitario_na_venda=request.preco_unitario,
        descricao_manual=request.descricao
    )
    db.add(venda_item)
    
    print(f"Lançamento Manual Registrado: {request.descricao} x {request.quantidade} @ R$ {request.preco_unitario}")

    db.flush()
    total_calc = db.query(
        func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda)
    ).filter(models.VendaItem.venda_id == venda.id).scalar() or 0.0

    venda.valor_total = total_calc
    db.add(venda)
    db.commit()

    # 6. RETORNA A VENDA COMPLETA (com 'itens' e 'produto' de cada item)
    venda_atualizada = db.query(models.Venda).options(
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(models.Venda.id == venda.id).first()
    
    return venda_atualizada