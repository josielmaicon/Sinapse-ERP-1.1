# app/routers/products.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta, datetime
from .. import models, schemas
from sqlalchemy import and_
from ..database import get_db, engine


models.Base.metadata.create_all(bind=engine)
router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)

@router.post("/", response_model=schemas.Produto)
def create_product(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    db_produto = models.Produto(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/", response_model=List[schemas.Produto])
def get_all_products(db: Session = Depends(get_db)):
    produtos = db.query(models.Produto).all()
    return produtos

@router.delete("/{produto_id}")
def delete_produto(produto_id: int, db: Session = Depends(get_db)):
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    item_vinculado = db.query(models.VendaItem).filter(models.VendaItem.produto_id == produto_id).first()
    if item_vinculado:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir este produto, pois ele já foi utilizado em uma venda."
        )

    db.delete(db_produto)
    db.commit()
    return {"ok": True, "message": "Produto excluído com sucesso"} 

@router.get("/barcode/{codigo_barras}", response_model=schemas.ProdutoComPromocao)
def get_produto_por_codigo_barras(codigo_barras: str, db: Session = Depends(get_db)):
    """
    Busca um produto, verifica promoções ativas e calcula o preço final.
    """
    now = datetime.utcnow()

    db_produto = db.query(models.Produto).options(
        joinedload(models.Produto.promocoes).contains_eager(models.Promocao)
    ).filter(
        models.Produto.codigo_barras == codigo_barras
    ).first()
    
    if not db_produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com código de barras '{codigo_barras}' não encontrado no estoque."
        )

    promocoes_validas = [
        p for p in db_produto.promocoes
        if p.data_inicio <= now and (p.data_fim is None or p.data_fim >= now)
    ]
    
    preco_final = db_produto.preco_venda
    melhor_promocao = None
    
    for promo in promocoes_validas:
        preco_promocional = db_produto.preco_venda
        
        if promo.tipo == 'percentual':
            preco_promocional = db_produto.preco_venda * (1 - promo.valor / 100.0)
        
        elif promo.tipo == 'preco_fixo':
            preco_promocional = promo.valor
            
        if preco_promocional < preco_final:
            preco_final = preco_promocional
            melhor_promocao = promo
            
    return schemas.ProdutoComPromocao(
        **db_produto.__dict__,
        preco_final=preco_final,
        promocao_ativa=melhor_promocao.nome if melhor_promocao else None
    )

@router.put("/{produto_id}", response_model=schemas.Produto)
def update_produto(produto_id: int, produto_update: schemas.ProdutoUpdate, db: Session = Depends(get_db)):
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Pega os dados do update e converte para um dicionário
    update_data = produto_update.dict(exclude_unset=True)
    
    # Itera sobre os dados recebidos e atualiza o objeto do banco
    for key, value in update_data.items():
        setattr(db_produto, key, value)

    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/dashboard-stats/", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    seven_days_from_now = today + timedelta(days=7)

    low_stock_count = db.query(models.Produto).filter(
        models.Produto.quantidade_estoque <= models.Produto.estoque_minimo
    ).count()

    expired_count = db.query(models.Produto).filter(
        models.Produto.vencimento < today
    ).count()

    expiring_soon_count = db.query(models.Produto).filter(
        and_(
            models.Produto.vencimento >= today,
            models.Produto.vencimento <= seven_days_from_now
        )
    ).count()

    return schemas.DashboardStats(
        low_stock_count=low_stock_count,
        expired_count=expired_count,
        expiring_soon_count=expiring_soon_count
    )

@router.get("/stats-history", response_model=List[schemas.ResumoEstoqueDiario]) # Vamos criar esse schema
def get_stats_history(limit: int = 7, db: Session = Depends(get_db)):
    """
    Retorna o histórico de estatísticas do estoque dos últimos X dias.
    """
    history = (
        db.query(models.ResumoDiarioEstoque)
        .order_by(models.ResumoDiarioEstoque.data.desc())
        .limit(limit)
        .all()
    )
    # Retornamos a lista em ordem cronológica para o gráfico
    return list(reversed(history))

@router.get("/{produto_id}/historico", response_model=List[schemas.ProdutoMovimentacao])
def get_produto_historico(produto_id: int, db: Session = Depends(get_db)):
    """
    Retorna o histórico de movimentações (vendas) de um produto específico.
    """
    
    # Busca todos os itens de venda para este produto
    vendas_itens = (
        db.query(
            models.VendaItem,
            models.Usuario.nome.label("operador_nome"),
            models.Venda.id.label("venda_id_str")
        )
        .join(models.Venda, models.VendaItem.venda_id == models.Venda.id)
        .join(models.Usuario, models.Venda.operador_id == models.Usuario.id)
        .filter(models.VendaItem.produto_id == produto_id)
        .order_by(models.Venda.data_hora.desc())
        .all()
    )
    
    historico = []
    for item, operador, venda_id in vendas_itens:
        historico.append({
            "id": item.id,
            "data_hora": item.venda.data_hora,
            "tipo": "venda",
            "quantidade": -item.quantidade, # Venda é uma saída
            "usuario": operador,
            "nota": f"Venda #{venda_id}"
        })
    
    # No futuro, você pode adicionar 'entradas' e 'ajustes' aqui
    
    return historico

@router.get("/barcode/{codigo_barras}", response_model=schemas.Produto)
def get_produto_por_codigo_barras(codigo_barras: str, db: Session = Depends(get_db)):
    """
    Busca um único produto pelo seu 'codigo_barras'.
    Usado pelo Ponto de Venda (PDV) para adicionar itens ao carrinho.
    """
    db_produto = db.query(models.Produto).filter(
        models.Produto.codigo_barras == codigo_barras
    ).first()
    if not db_produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com código de barras '{codigo_barras}' não encontrado no estoque."
        )
    return db_produto
