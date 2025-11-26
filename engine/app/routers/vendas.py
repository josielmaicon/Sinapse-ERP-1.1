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
            detail=f"Pagamento insuficiente. Total: {request.total_calculado}, Pago: {valor_total_pago}"
        )
        
    valor_troco = max(0, valor_total_pago - request.total_calculado)

    try:
        with db.begin():
            venda = db.query(models.Venda).filter(
                models.Venda.pdv_id == request.pdv_db_id,
                models.Venda.operador_id == request.operador_db_id,
                models.Venda.status == "em_andamento"
            ).with_for_update().first()

            if not venda:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma venda 'em andamento' encontrada.")

            venda.status = "concluida"
            venda.cliente_id = request.cliente_db_id
            db.add(venda)
            
            for pagamento in request.pagamentos:
                if pagamento.tipo == 'crediario':
                    if not request.cliente_db_id:
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cliente não identificado.")
                    
                    db_cliente = db.query(models.Cliente).filter(
                        models.Cliente.id == request.cliente_db_id
                    ).with_for_update().first()
                    
                    if not db_cliente:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente do crediário não encontrado.")
                        
                    # --- ✅ A LÓGICA DE OVERRIDE CORRIGIDA ---
                    
                    autorizado_por_override = False
                    admin_autorizador = None
                    
                    # 1. O GERENTE APRESENTA O CRACHÁ?
                    if request.override_auth and request.override_auth.admin_senha:
                        try:
                            admin_autorizador = get_admin_by_password_only(request.override_auth, db)
                            if admin_autorizador:
                                autorizado_por_override = True
                                print(f"AUDITORIA: Override de limite/status para Cliente {db_cliente.id} AUTORIZADO por Admin {admin_autorizador.id}")
                        except HTTPException as e:
                            # Se a senha do crachá estiver ERRADA, retorna 401
                            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Senha de autorização inválida: {e.detail}")

                    # 2. SE O GERENTE NÃO AUTORIZOU, o Porteiro (Status) e o Gerente (Limite) entram
                    if not autorizado_por_override:
                        
                        # 2a. Verificação de Status (O Porteiro)
                        if db_cliente.status_conta != 'ativo':
                             raise HTTPException(
                                 status_code=status.HTTP_403_FORBIDDEN, # 403 (Bloqueado)
                                 detail=f"Conta de {db_cliente.nome} não está ativa (Status: {db_cliente.status_conta.upper()})."
                             )
                        
                        # 2b. Verificação de Limite (O Gerente de Limite)
                        limite_disponivel = (db_cliente.limite_credito - db_cliente.saldo_devedor)
                        if not db_cliente.trust_mode and pagamento.valor > limite_disponivel:
                             raise HTTPException(
                                 status_code=status.HTTP_402_PAYMENT_REQUIRED, # 402 (Sem Limite)
                                 detail=f"Limite insuficiente. Disponível: R$ {limite_disponivel:.2f}"
                             )
                    
                    # 3. Processa a transação (agora seguro, pois foi validado OU autorizado)
                    db_cliente.saldo_devedor += pagamento.valor
                    db.add(db_cliente)
                    
                    db_transacao = models.TransacaoCrediario(
                        cliente_id=request.cliente_db_id,
                        tipo='compra',
                        valor=pagamento.valor,
                        # Adiciona a auditoria na descrição da transação
                        descricao=f"Venda #{venda.id}" + (" (AUTORIZADA)" if autorizado_por_override else ""),
                        venda_id=venda.id
                    )
                    db.add(db_transacao)
                
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

            try:
                fiscal_service.inicializar_nota_para_venda(venda.id, db)
                db.commit() # Salva a nota pendente
            except Exception as e:
                print(f"ERRO AO INICIAR NOTA FISCAL: {e}")
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