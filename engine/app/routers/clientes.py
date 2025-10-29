from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload 
from typing import List
from .. import models, schemas
from ..database import get_db
from datetime import date

router = APIRouter(
    prefix="/clientes", # Mantendo seu prefixo
    tags=["Clientes / Crediário"]
)

# --- Função Auxiliar (para não repetir código) ---
def _build_cliente_response(db_cliente: models.Cliente) -> schemas.Cliente:
    """Calcula campos derivados e constrói o schema de resposta Cliente."""
    
    # Calcula o limite disponível
    limite_disp = float('inf') # Padrão para Modo Confiança
    if not db_cliente.trust_mode:
        limite_disp = (db_cliente.limite_credito or 0.0) - (db_cliente.saldo_devedor or 0.0)

    # Constrói o schema manualmente
    return schemas.Cliente(
        id=db_cliente.id,
        nome=db_cliente.nome,
        cpf=db_cliente.cpf,
        telefone=db_cliente.telefone,
        email=db_cliente.email,
        limite_credito=db_cliente.limite_credito,
        saldo_devedor=db_cliente.saldo_devedor,
        trust_mode=db_cliente.trust_mode,
        status_conta=db_cliente.status_conta,
        data_vencimento_fatura=db_cliente.data_vencimento_fatura,
        limite_disponivel=limite_disp # Passa o valor calculado AQUI
    )

# --- Rota GET para Listar Clientes ---
# (Assumindo que /clientes retorna List[schemas.Cliente], não ClienteCrediario)
@router.get("/", response_model=List[schemas.Cliente])
def get_all_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    
    # Usa a função auxiliar para construir a resposta para cada cliente
    return [_build_cliente_response(cliente) for cliente in clientes]

# --- Rota GET para Detalhes de UM Cliente ---
@router.get("/{cliente_id}", response_model=schemas.Cliente)
def get_cliente_details(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")
    
    # Usa a função auxiliar para construir a resposta
    return _build_cliente_response(cliente)

# --- Rota GET para EXTRATO ---
@router.get("/{cliente_id}/transacoes", response_model=schemas.ExtratoResponse)
def get_cliente_extrato(cliente_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Retorna o saldo atual e as últimas transações do crediário."""
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    transacoes = db.query(models.TransacaoCrediario)\
        .filter(models.TransacaoCrediario.cliente_id == cliente_id)\
        .order_by(models.TransacaoCrediario.data_hora.desc())\
        .limit(limit)\
        .all()
        
    return schemas.ExtratoResponse(
        saldo_atual=cliente.saldo_devedor,
        transacoes=transacoes
    )

# --- Rota PUT para EDITAR DADOS PESSOAIS ---
@router.put("/{cliente_id}", response_model=schemas.Cliente)
def update_cliente_details(
    cliente_id: int, 
    cliente_update: schemas.ClienteUpdatePersonal, 
    db: Session = Depends(get_db)
):
    """Atualiza APENAS os dados pessoais de um cliente."""
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    update_data = cliente_update.model_dump(exclude_unset=True) 
    for key, value in update_data.items():
        setattr(db_cliente, key, value) 

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    # Usa a função auxiliar para construir a resposta
    return _build_cliente_response(db_cliente)

# --- Rota PUT para ALTERAR LIMITE / MODO CONFIANÇA ---
@router.put("/{cliente_id}/limite", response_model=schemas.Cliente)
def update_cliente_limite(
    cliente_id: int,
    limite_update: schemas.LimiteUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Atualiza o limite de crédito e/ou o modo confiança de um cliente."""
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    db_cliente.trust_mode = limite_update.trust_mode
    if not limite_update.trust_mode and limite_update.novo_limite is not None:
         if limite_update.novo_limite < 0:
              raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limite de crédito não pode ser negativo.")
         db_cliente.limite_credito = limite_update.novo_limite
         
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    # Usa a função auxiliar para construir a resposta
    return _build_cliente_response(db_cliente)

# --- Rota PUT para BLOQUEAR/DESBLOQUEAR ---
@router.put("/{cliente_id}/status", response_model=schemas.Cliente)
def update_cliente_status(
    cliente_id: int,
    status_update: schemas.StatusUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Atualiza o status da conta de um cliente (ex: bloqueado, ativo)."""
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    allowed_statuses_update = ['ativo', 'bloqueado'] 
    if status_update.novo_status not in allowed_statuses_update:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status inválido. Permitidos: {', '.join(allowed_statuses_update)}")
         
    db_cliente.status_conta = status_update.novo_status
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    # Usa a função auxiliar para construir a resposta
    return _build_cliente_response(db_cliente)