# app/routers/products.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/produtos", response_model=schemas.Produto)
def create_product(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    # Usamos os nomes em português que definimos no models.py
    db_produto = models.Produto(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/produtos", response_model=List[schemas.Produto])
def get_all_products(db: Session = Depends(get_db)):
    produtos = db.query(models.Produto).all()
    return produtos

@router.get("/produtos/barcode/{barcode}", response_model=schemas.Produto)
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