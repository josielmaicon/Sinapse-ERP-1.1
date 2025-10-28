from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload # Import joinedload
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/notas-fiscais-entrada", # Mantendo sem /api, como você padronizou
    tags=["Notas Fiscais de Entrada"]
)

@router.get("/", response_model=List[schemas.NotaFiscalEntrada])
def get_all_notas_entrada(
    skip: int = 0, # Parâmetro opcional para paginação futura
    limit: int = 100, # Limite padrão para evitar sobrecarga
    db: Session = Depends(get_db)
):
    """
    Lista todas as Notas Fiscais de Entrada registradas,
    incluindo os dados básicos do fornecedor.
    """
    notas = db.query(models.NotaFiscalEntrada).options(
        joinedload(models.NotaFiscalEntrada.fornecedor) # Carrega o fornecedor junto
    ).order_by(
        models.NotaFiscalEntrada.data_emissao.desc() # Ordena pelas mais recentes
    ).offset(skip).limit(limit).all()
    
    return notas