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
        models.Cliente.status_conta == "atrasado"
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
@router.get("/clientes", response_model=List[schemas.ClienteCrediario]) # Usa seu schema ClienteCrediario
def get_crediario_clientes(db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).all()
    
    clientes_com_limite = []
    for cliente in clientes:
        # ✅ LÓGICA CORRIGIDA: Calcula o limite numérico. Não usa float('inf').
        limite_disponivel_calculado = (cliente.limite_credito or 0.0) - (cliente.saldo_devedor or 0.0)
        
        # Cria o objeto do schema para a resposta
        try:
            cliente_schema = schemas.ClienteCrediario(
                id=cliente.id,
                nome=cliente.nome,
                cpf=cliente.cpf,
                telefone=cliente.telefone, # Adicionado (herda de ClienteBase)
                email=cliente.email,       # Adicionado (herda de ClienteBase)
                limite_credito=cliente.limite_credito,
                saldo_devedor=cliente.saldo_devedor,
                status_conta=cliente.status_conta,
                
                dia_vencimento_fatura=cliente.dia_vencimento_fatura, 
                limite_disponivel=limite_disponivel_calculado,
                trust_mode=cliente.trust_mode 
            )
            clientes_com_limite.append(cliente_schema)
        except Exception as e:
            # Log de erro se o Pydantic falhar na validação
            print(f"Erro ao validar cliente ID {cliente.id} para schema ClienteCrediario: {e}")
            
    return clientes_com_limite