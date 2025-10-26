# app/routers/crediario.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/crediario", tags=["Crediário"])

# --- Endpoint para os StatCards ---
@router.get("/summary", response_model=schemas.CrediarioSummary)
def get_crediario_summary(db: Session = Depends(get_db)):
    
    total_a_receber = db.query(func.sum(models.Cliente.saldo_devedor)).scalar() or 0
    
    total_inadimplente = db.query(func.sum(models.Cliente.saldo_devedor)).filter(
        models.Cliente.status_conta == "Atrasado"
    ).scalar() or 0
    
    clientes_com_credito = db.query(func.count(models.Cliente.id)).filter(
        models.Cliente.limite_credito > 0
    ).scalar() or 0
    
    return {
        "total_a_receber": total_a_receber,
        "total_inadimplente": total_inadimplente,
        "clientes_com_credito": clientes_com_credito
    }

# --- Endpoint para a Tabela de Clientes ---
@router.get("/clientes", response_model=List[schemas.ClienteCrediario])
def get_crediario_clientes(db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).all()
    
    # Python calcula os campos derivados
    clientes_com_limite = []
    for cliente in clientes:
        limite_disponivel = cliente.limite_credito - cliente.saldo_devedor
        
        # Cria um objeto do schema para a resposta
        cliente_schema = schemas.ClienteCrediario(
            id=cliente.id,
            nome=cliente.nome,
            cpf=cliente.cpf,
            limite_credito=cliente.limite_credito,
            saldo_devedor=cliente.saldo_devedor,
            status_conta=cliente.status_conta,
            data_vencimento=cliente.data_vencimento,
            limite_disponivel=limite_disponivel
        )
        clientes_com_limite.append(cliente_schema)
        
    return clientes_com_limite