# app/routers/vendas.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.post("/", response_model=schemas.Venda)
def create_venda(venda: schemas.VendaCreate, db: Session = Depends(get_db)):
    
    valor_total_calculado = 0
    
    # Inicia a criação da venda com status 'em_andamento'
    db_venda = models.Venda(
        operador_id=venda.operador_id,
        cliente_id=venda.cliente_id,
        pdv_id=venda.pdv_id,
        status="em_andamento" 
    )
    db.add(db_venda)
    db.commit() # Salva a venda para obter um ID

    # Itera sobre os itens recebidos do frontend
    for item in venda.itens:
        db_produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
        if not db_produto:
            raise HTTPException(status_code=404, detail=f"Produto com ID {item.produto_id} não encontrado")

        # Lógica de negócio: deduzir do estoque
        db_produto.quantidade_estoque -= item.quantidade

        # Cria o item da venda, ligando ao ID da venda
        db_venda_item = models.VendaItem(
            venda_id=db_venda.id,
            produto_id=item.produto_id,
            quantidade=item.quantidade,
            preco_unitario_na_venda=db_produto.preco_venda
        )
        db.add(db_venda_item)
        
        valor_total_calculado += item.quantidade * db_produto.preco_venda

    # Atualiza a venda com o valor total e muda o status para 'concluida'
    db_venda.valor_total = valor_total_calculado
    db_venda.status = "concluida"
    db.commit()
    db.refresh(db_venda)
    
    return db_venda

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    return db.query(models.Venda).all()