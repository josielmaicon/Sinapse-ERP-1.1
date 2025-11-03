# app/routers/vendas.py
from typing import List, Dict
from datetime import date
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from .. import models, schemas
from ..utils.security import verify_password
from ..database import get_db
from datetime import datetime

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    return db.query(models.Venda).all()

@router.get("/resumo-diario-dinamico", response_model=List[schemas.ResumoDiario])
def get_resumo_diario_dinamico(db: Session = Depends(get_db)):
    """
    Retorna o faturamento agrupado por dia e por PDV.
    Esta é uma rota flexível que funciona com qualquer número de PDVs.
    """
    # 1. A consulta no banco de dados agora é mais simples:
    # Agrupamos por data E por pdv.
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

    # 2. A lógica de transformação em Python:
    # Agrupamos os resultados por data em um dicionário.
    dados_agrupados: Dict[date, schemas.ResumoDiario] = {}
    for row in resultado_query:
        if row.sale_date not in dados_agrupados:
            dados_agrupados[row.sale_date] = schemas.ResumoDiario(
                date=row.sale_date,
                faturamento_total_dia=0,
                faturamento_por_pdv=[]
            )
        
        # Adiciona o faturamento do PDV específico
        dados_agrupados[row.sale_date].faturamento_por_pdv.append(
            schemas.FaturamentoPorPdv(pdv_id=row.pdv_id, pdv_nome=row.pdv_name, total=row.daily_total)
        )
        # Soma para o total do dia
        dados_agrupados[row.sale_date].faturamento_total_dia += row.daily_total
            
    # 3. Retorna a lista de valores do dicionário.
    return list(dados_agrupados.values())

@router.get("/top-produtos", response_model=List[schemas.ProdutoMaisVendido])
def get_top_produtos(limit: int = 5, db: Session = Depends(get_db)):
    """
    Calcula e retorna os produtos mais vendidos por valor total.
    """
    # Esta consulta agrupa os itens de venda por produto,
    # soma o valor total de cada um, ordena do maior para o menor
    # e pega os 'limit' primeiros.
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
    Usa a função 'strftime' do SQLite para extrair a hora da data/hora.
    """
    today = date.today()
    
    # 1. A consulta agrupa por hora E por pdv_id
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

    # 2. A lógica de transformação em Python (pivotação)
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

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    vendas = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida)
    ).order_by(models.Venda.data_hora.desc()).all()
    
    # Debug: imprime no terminal
    for venda in vendas:
        print("Venda ID:", venda.id, "Nota:", venda.nota_fiscal_saida)
    
    return vendas

@router.post("/iniciar", response_model=schemas.Venda)
def iniciar_venda(request: schemas.IniciarVendaRequest, db: Session = Depends(get_db)):
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
    
    # Cria o item
    venda_item = models.VendaItem(
        venda_id=venda.id,
        produto_id=item.produto_id,
        quantidade=item.quantidade,
        preco_unitario_na_venda=produto.preco_venda
    )
    db.add(venda_item)

    # Atualiza o total acumulado
    venda.valor_total += item.quantidade * produto.preco_venda
    db.commit()
    db.refresh(venda)
    return venda

@router.post("/{venda_id}/finalizar", response_model=schemas.Venda)
def finalizar_venda_existente(venda_id: int, pagamento: schemas.FinalizarVendaRequest, db: Session = Depends(get_db)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda or venda.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Venda não encontrada ou já concluída.")

    venda.status = "concluida"
    venda.forma_pagamento = pagamento.forma_pagamento
    db.commit()
    db.refresh(venda)
    return venda

@router.post("/adicionar-item-smart", response_model=schemas.Venda)
def adicionar_item_smart(request: schemas.AdicionarItemSmartRequest, db: Session = Depends(get_db)):
    """
    Uma rota otimizada que faz 3 coisas em 1 chamada de API:
    1. Busca o Produto pelo código de barras.
    2. Busca a Venda 'em_andamento' ou CRIA uma nova.
    3. Adiciona/Incrementa o VendaItem.
    4. Retorna a Venda completa e atualizada.
    """
    
    # 1. BUSCA O PRODUTO
    produto = db.query(models.Produto).filter(models.Produto.codigo_barras == request.codigo_barras).first()
    if not produto:
        raise HTTPException(status_code=404, detail=f"Produto com código '{request.codigo_barras}' não encontrado.")

    # 2. BUSCA OU CRIA A VENDA (Lógica "Lazy")
    # Tenta encontrar a venda ativa primeiro
    venda = db.query(models.Venda).filter(
        models.Venda.pdv_id == request.pdv_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        # Se não houver, CRIA a venda (lógica da sua rota /iniciar)
        pdv = db.query(models.Pdv).filter(models.Pdv.id == request.pdv_id).first()
        if not pdv:
             raise HTTPException(status_code=404, detail="PDV não encontrado") # Segurança
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        codigo_venda_str = f"VENDA_{timestamp}_{pdv.nome.upper().replace(' ', '')}"
        
        venda = models.Venda(
            pdv_id=request.pdv_id,
            operador_id=request.operador_id,
            status="em_andamento",
            codigo_venda=codigo_venda_str
        )
        db.add(venda)
        db.flush() # Força a 'venda.id' a ser gerada

    # 3. ADICIONA/INCREMENTA O ITEM
    # (Lógica da sua rota /adicionar-item)
    item_existente = db.query(models.VendaItem).filter(
        models.VendaItem.venda_id == venda.id,
        models.VendaItem.produto_id == produto.id
    ).first()

    if item_existente:
        item_existente.quantidade += request.quantidade
    else:
        venda_item = models.VendaItem(
            venda_id=venda.id,
            produto_id=produto.id,
            quantidade=request.quantidade,
            preco_unitario_na_venda=produto.preco_venda
        )
        db.add(venda_item)
    
    # 4. RECALCULA O TOTAL E FAZ O COMMIT
    # (É mais seguro recalcular tudo)
    db.flush() # Garante que todos os itens estão na sessão
    
    total_calc = db.query(
        func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda)
    ).filter(models.VendaItem.venda_id == venda.id).scalar() or 0.0

    venda.valor_total = total_calc
    db.add(venda)
    db.commit()

    # 5. RETORNA A VENDA COMPLETA
    # (A parte crucial que seu 'adicionar-item' antigo não fazia direito)
    venda_atualizada = db.query(models.Venda).options(
        # Usamos 'selectinload' para carregar os 'itens'
        # e depois 'joinedload' para carregar o 'produto' de cada 'item'
        selectinload(models.Venda.itens).joinedload(models.VendaItem.produto)
    ).filter(models.Venda.id == venda.id).first()
    
    return venda_atualizada

def get_verified_admin(auth_request: schemas.AdminAuthRequest, db: Session = Depends(get_db)):
    admin_user = db.query(models.Usuario).filter(
        models.Usuario.email == auth_request.admin_email,
        models.Usuario.funcao == "admin" # Garante que só admin pode autorizar
    ).first()
    
    if not admin_user or not verify_password(auth_request.admin_senha, admin_user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais de Administrador inválidas."
        )
    return admin_user # Retorna o objeto completo do admin

@router.delete("/{venda_id}/cancelar", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_venda_em_andamento(
    venda_id: int, 
    auth: schemas.AdminAuthRequest, # Recebe o corpo com as credenciais
    admin_user: models.Usuario = Depends(get_verified_admin), # Dependência para auditar
    db: Session = Depends(get_db)
):
    venda = db.query(models.Venda).filter(
        models.Venda.id == venda_id,
        models.Venda.status == "em_andamento"
    ).first()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda 'em andamento' não encontrada.")
    
    # [OPCIONAL] Logar a ação de cancelamento na tabela de auditoria com admin_user.id
    print(f"AUDITORIA: Venda #{venda_id} cancelada por Admin ID: {admin_user.id}")

    db.delete(venda)
    db.commit()
    return None

@router.post("/{venda_id}/itens/{item_venda_id}/remover", response_model=schemas.Venda)
def remover_item_da_venda_auditada(
    venda_id: int, 
    item_venda_id: int, 
    auth: schemas.AdminAuthRequest,
    db: Session = Depends(get_db),
    admin_user: models.Usuario = Depends(get_verified_admin),
):
    
    item = db.query(models.VendaItem).filter(models.VendaItem.id == item_venda_id).first()
    
    if not item or item.venda_id != venda_id:
        raise HTTPException(status_code=404, detail="Item não encontrado nesta venda.")

    print(f"AUDITORIA: Item ID: {item_venda_id} removido/ajustado por Admin ID: {admin_user.id}")
    
    db.delete(item)
    db.flush()
    
    raise HTTPException(status_code=501, detail="Lógica de remoção/ajuste de item não implementada.")
