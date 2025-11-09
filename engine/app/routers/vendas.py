# app/routers/vendas.py
from typing import List, Dict
from datetime import date, datetime
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload, selectinload
from .. import models, schemas
from ..utils.security import verify_password
from ..database import get_db

router = APIRouter(prefix="/vendas", tags=["Vendas"])

# --- ROTAS DE DASHBOARD ---

@router.get("/resumo-diario-dinamico", response_model=List[schemas.ResumoDiario])
def get_resumo_diario_dinamico(db: Session = Depends(get_db)):
    """
    Retorna o faturamento agrupado por dia e por PDV.
    """
    resultado_query = (
        db.query(
            func.date(models.Venda.data_hora).label("sale_date"),
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("daily_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(models.Venda.status == "concluida")
        .group_by("sale_date", "pdv_id", "pdv_name")
        .order_by("sale_date")
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

@router.get("/resumo-hoje-por-hora", response_model=List[schemas.ResumoPorHora])
def get_resumo_hoje_por_hora(db: Session = Depends(get_db)):
    """
    Retorna o faturamento de HOJE, agrupado por hora e por PDV.
    """
    today = date.today()
    
    resultado_query = (
        db.query(
            func.strftime('%H:00', models.Venda.data_hora).label("sale_hour"),
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("hourly_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(
            models.Venda.status == "concluida",
            func.date(models.Venda.data_hora) == today # Filtra apenas por HOJE
        )
        .group_by("sale_hour", "pdv_id", "pdv_name")
        .order_by("sale_hour")
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
    valor_total_pago = sum(p.valor for p in request.pagamentos)
    
    if round(valor_total_pago, 2) < round(request.total_calculado, 2):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pagamento insuficiente. Total: {request.total_calculado:.2f}, Pago: {valor_total_pago:.2f}"
        )
        
    valor_troco = max(0.0, valor_total_pago - request.total_calculado)

    try:
        with db.begin():
            # 1. Busca e trava a venda
            venda = db.query(models.Venda).filter(
                models.Venda.pdv_id == request.pdv_db_id,
                models.Venda.operador_id == request.operador_db_id,
                models.Venda.status == "em_andamento"
            ).with_for_update().first()

            if not venda:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma venda 'em andamento' encontrada para este operador/PDV.")

            # 2. Atualiza status da venda
            venda.status = "concluida"
            venda.cliente_id = request.cliente_db_id
            
            # (Opcional: Auditoria de valor se necessário)
            # if round(venda.valor_total, 2) != round(request.total_calculado, 2): ...

            db.add(venda)
            
            # 3. Processa os pagamentos
            for pagamento in request.pagamentos:
                
                # --- PAGAMENTO CREDIÁRIO ---
                if pagamento.tipo == 'crediario':
                    if not request.cliente_db_id:
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cliente não identificado para venda em crediário.")
                    
                    # A. Busca o Cliente e TRAVA a linha para evitar condições de corrida
                    db_cliente = db.query(models.Cliente).filter(
                        models.Cliente.id == request.cliente_db_id
                    ).with_for_update().first()
                    
                    if not db_cliente:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente do crediário não encontrado.")
                        
                    # B. VALIDAÇÃO 1: Status da Conta (O Porteiro)
                    if db_cliente.status_conta != 'ativo':
                         raise HTTPException(
                             status_code=status.HTTP_403_FORBIDDEN, # 403 = Bloqueado/Atrasado
                             detail=f"Compra negada: A conta de {db_cliente.nome} não está ativa (Status: {db_cliente.status_conta.upper()})."
                         )
                    
                    # C. VALIDAÇÃO 2: Limite de Crédito (O Gerente)
                    # Calcula o limite ANTES de adicionar a nova compra
                    limite_disponivel = (db_cliente.limite_credito - db_cliente.saldo_devedor)
                    
                    if not db_cliente.trust_mode and pagamento.valor > limite_disponivel:
                         # --- LÓGICA DE OVERRIDE ---
                         autorizado = False
                         # Verifica se o "crachá" (senha de admin) foi enviado
                         if request.override_auth and request.override_auth.admin_senha:
                             # Tenta autenticar o admin com a senha fornecida
                             # (Requer que get_admin_by_password_only esteja acessível aqui)
                             admin = get_admin_by_password_only(request.override_auth, db)
                             if admin:
                                 autorizado = True
                                 print(f"AUDITORIA: Override de limite para Cliente {db_cliente.id} autorizado por Admin {admin.id}")

                         if not autorizado:
                             # 🛑 GATILHO DO MODAL DE SENHA (402)
                             raise HTTPException(
                                 status_code=status.HTTP_402_PAYMENT_REQUIRED, 
                                 detail=f"Limite insuficiente. Disponível: R$ {limite_disponivel:.2f}. Necessário: R$ {pagamento.valor:.2f}"
                             )
                    
                    # D. EFETIVAÇÃO: Só chega aqui se passou por todas as travas
                    db_cliente.saldo_devedor += pagamento.valor
                    db.add(db_cliente)
                    
                    db_transacao = models.TransacaoCrediario(
                        cliente_id=request.cliente_db_id,
                        tipo='compra',
                        valor=pagamento.valor,
                        descricao=f"Venda #{venda.id}",
                        venda_id=venda.id
                    )
                    db.add(db_transacao)
                
                # --- PAGAMENTO DINHEIRO ---
                if pagamento.tipo == 'dinheiro':
                    db_mov = models.MovimentacaoCaixa(
                        tipo='suprimento',
                        valor=pagamento.valor,
                        pdv_id=request.pdv_db_id,
                        operador_id=request.operador_db_id
                    )
                    db.add(db_mov)

            # 4. Registra Troco (se houver)
            if valor_troco > 0:
                db_troco_mov = models.MovimentacaoCaixa(
                    tipo='sangria',
                    valor=valor_troco,
                    # descricao=f"Troco Venda #{venda.id}", # REMOVIDO pois não existe na tabela
                    pdv_id=request.pdv_db_id,
                    operador_id=request.operador_db_id
                )
                db.add(db_troco_mov)

            # 5. Finaliza metadados
            venda.forma_pagamento = "misto" if len(request.pagamentos) > 1 else request.pagamentos[0].tipo
            db.add(venda)

            # Commit automático pelo db.begin()

            return schemas.PdvVendaResponse(
                venda_id=venda.id,
                mensagem=f"Venda #{venda.id} finalizada com sucesso!",
                troco=valor_troco
            )
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"ERRO DE TRANSAÇÃO: {e}") 
        # traceback.print_exc() # Útil para depuração
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar a venda: {str(e)}"
        )

@router.post("/adicionar-item-smart", response_model=schemas.Venda)
def adicionar_item_smart(request: schemas.AdicionarItemSmartRequest, db: Session = Depends(get_db)):
    
    now = datetime.utcnow()
    produto = db.query(models.Produto).options(
        joinedload(models.Produto.promocoes) 
    ).filter(
        models.Produto.codigo_barras == request.codigo_barras
    ).first()
    
    if not produto:
        raise HTTPException(status_code=404, detail=f"Produto com código '{request.codigo_barras}' não encontrado.")

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
    if melhor_promocao_nome:
         print(f"AUDITORIA: Aplicando promoção '{melhor_promocao_nome}'. Preço final para {produto.nome}: R$ {preco_final}")

    venda = db.query(models.Venda).filter(
        models.Venda.pdv_id == request.pdv_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        pdv = db.query(models.Pdv).filter(models.Pdv.id == request.pdv_id).first()
        if not pdv:
            raise HTTPException(status_code=404, detail="PDV não encontrado")
        
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
        db.flush()

    item_existente = db.query(models.VendaItem).filter(
        models.VendaItem.venda_id == venda.id,
        models.VendaItem.produto_id == produto.id
    ).first()

    if item_existente:
        item_existente.quantidade += request.quantidade
        print(f"Item {produto.nome} incrementado para Qtd: {item_existente.quantidade}")
    else:
        venda_item = models.VendaItem(
            venda_id=venda.id,
            produto_id=produto.id,
            quantidade=request.quantidade,
            preco_unitario_na_venda=preco_final
        )
        db.add(venda_item)
        print(f"Item {produto.nome} (Qtd: {request.quantidade}) adicionado ao preço R$ {preco_final}")
    
    db.flush() 
    
    total_calc = db.query(
        func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda)
    ).filter(models.VendaItem.venda_id == venda.id).scalar() or 0.0

    venda.valor_total = total_calc
    db.add(venda)
    db.commit()

    venda_atualizada = db.query(models.Venda).options(
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(models.Venda.id == venda.id).first()
    
    return venda_atualizada

def get_admin_by_password_only(
    auth_request: schemas.AdminAuthRequest, 
    db: Session = Depends(get_db)
):
    """
    Verifica a senha (código de barras) contra TODOS os usuários 'admin'.
    Retorna o primeiro admin que corresponder.
    """
    if not auth_request.admin_senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O código de autorização (senha) é obrigatório."
        )

    admins = db.query(models.Usuario).filter(models.Usuario.funcao == "admin").all()
    
    if not admins:
        raise HTTPException(status_code=404, detail="Nenhum administrador cadastrado.")

    for admin_user in admins:
        if verify_password(auth_request.admin_senha, admin_user.senha_hash):
            return admin_user
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Código de Administrador inválido."
    )

def get_admin_from_remover_request(
    payload: schemas.RemoverItemRequest, 
    db: Session = Depends(get_db)
):
    """
    Dependência intermediária que extrai 'auth' do payload de REMOÇÃO
    e usa a verificação 'password_only'.
    Esta é a única definição desta função.
    """
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


@router.delete("/{venda_id}/cancelar", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_venda_em_andamento(
    venda_id: int, 
    admin_user: models.Usuario = Depends(get_admin_by_password_only), 
    db: Session = Depends(get_db)
):
    """
    Cancela e deleta uma venda que ainda está 'em_andamento'.
    Requer autenticação de admin (código de barras).
    Esta é a única definição desta rota.
    """
    venda = db.query(models.Venda).options(
        selectinload(models.Venda.itens) # Carrega os itens para o estorno
    ).filter(
        models.Venda.id == venda_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda 'em andamento' não encontrada.")
    
    print(f"AUDITORIA: Venda #{venda_id} cancelada por Admin ID: {admin_user.id} ({admin_user.nome})")

    for item in venda.itens:
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
        preco_unitario_na_venda=request.preco_unitario
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