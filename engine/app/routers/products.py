from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import SessionLocal, engine

# Cria as tabelas no banco de dados se elas não existirem
models.Base.metadata.create_all(bind=engine)

router = APIRouter()

# Função auxiliar para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/products", response_model=List[schemas.Product])
def get_all_products(db: Session = Depends(get_db)):
    """
    Este endpoint busca todos os produtos no banco de dados.
    """
    products = db.query(models.Product).all()
    return products