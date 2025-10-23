# app/routers/products.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db, engine

models.Base.metadata.create_all(bind=engine)
router = APIRouter(
    prefix="/api/produtos",
    tags=["Produtos"]
)

@router.post("/", response_model=schemas.Produto)
def create_product(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    # Usamos os nomes em português que definimos no models.py
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
    db.delete(db_produto)
    db.commit()
    return {"ok": True, "message": "Produto excluído com sucesso"}  

@router.get("/barcode/{barcode}", response_model=schemas.Produto)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    """
    Busca um único produto pelo seu código de barras.
    """
    # 1. A Busca no Banco de Dados
    # Ele procura na tabela 'Produto' por uma linha onde a coluna 'codigo_barras'
    # seja igual ao 'barcode' recebido da URL, e pega o primeiro resultado.
    db_product = db.query(models.Produto).filter(models.Produto.codigo_barras == barcode).first()

    # 2. O Tratamento de Erro Profissional (404)
    # Se a busca não retornar nada (db_product for None), nós levantamos uma exceção HTTP.
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # 3. O Retorno de Sucesso
    # Se o produto foi encontrado, nós o retornamos.
    return db_product

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