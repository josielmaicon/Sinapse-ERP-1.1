from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload 
from typing import List
from .. import models, schemas
from ..database import get_db
from datetime import date

router = APIRouter(
    prefix="/clientes", 
    tags=["Clientes / Crediário"]
)

# --- Rota GET / (Listar Clientes - Ok) ---
@router.get("/", response_model=List[schemas.Cliente])
def get_all_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # ... (Seu código está ótimo)
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    clientes_com_limite = []
    for cliente in clientes:
        limite_disp = cliente.limite_credito - cliente.saldo_devedor if not cliente.trust_mode else float('inf') 
        cliente_schema = schemas.Cliente.model_validate(cliente) 
        cliente_schema.limite_disponivel = limite_disp
        clientes_com_limite.append(cliente_schema)
    return clientes_com_limite

# --- Rota GET /{cliente_id} (Detalhes - Ok) ---
@router.get("/{cliente_id}", response_model=schemas.Cliente)
def get_cliente_details(cliente_id: int, db: Session = Depends(get_db)):
    # ... (Seu código está ótimo)
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(...)
    limite_disp = cliente.limite_credito - cliente.saldo_devedor if not cliente.trust_mode else float('inf') 
    cliente_schema = schemas.Cliente.model_validate(cliente)
    cliente_schema.limite_disponivel = limite_disp
    return cliente_schema

# --- ✅ Rota GET para EXTRATO (CORRIGIDA) ---
@router.get("/{cliente_id}/transacoes", response_model=schemas.ExtratoResponse) # Muda o response_model
def get_cliente_extrato(cliente_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Retorna o saldo atual e as últimas transações do crediário."""
    
    # Busca o cliente para pegar o saldo atual e verificar se existe
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    # Busca as transações (como antes)
    transacoes = db.query(models.TransacaoCrediario)\
        .filter(models.TransacaoCrediario.cliente_id == cliente_id)\
        .order_by(models.TransacaoCrediario.data_hora.desc())\
        .limit(limit)\
        .all()
        
    # Retorna o schema ExtratoResponse preenchido
    return schemas.ExtratoResponse(
        saldo_atual=cliente.saldo_devedor, # Pega o saldo atual do cliente
        transacoes=transacoes
    )

# --- ✅ Rota PUT para EDITAR DADOS PESSOAIS (SCHEMA CORRIGIDO) ---
@router.put("/{cliente_id}", response_model=schemas.Cliente)
def update_cliente_details(
    cliente_id: int, 
    # Usa o schema específico para dados pessoais
    cliente_update: schemas.ClienteUpdatePersonal, 
    db: Session = Depends(get_db)
):
    """Atualiza APENAS os dados pessoais de um cliente."""
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente: raise HTTPException(...)

    update_data = cliente_update.model_dump(exclude_unset=True) 
    for key, value in update_data.items():
        setattr(db_cliente, key, value) 

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    # ... (Recalcula e retorna o schema Cliente)
    limite_disp = db_cliente.limite_credito - db_cliente.saldo_devedor if not db_cliente.trust_mode else float('inf') 
    cliente_schema = schemas.Cliente.model_validate(db_cliente)
    cliente_schema.limite_disponivel = limite_disp
    return cliente_schema

# --- Rota PUT para ALTERAR LIMITE / MODO CONFIANÇA (Ok) ---
@router.put("/{cliente_id}/limite", response_model=schemas.Cliente)
def update_cliente_limite(
    cliente_id: int,
    # Usa o schema específico LimiteUpdateRequest (restaurado)
    limite_update: schemas.LimiteUpdateRequest, 
    db: Session = Depends(get_db)
):
    # ... (Sua lógica está ótima aqui)
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente: raise HTTPException(...)
    db_cliente.trust_mode = limite_update.trust_mode
    if not limite_update.trust_mode and limite_update.novo_limite is not None:
         if limite_update.novo_limite < 0: raise HTTPException(...)
         db_cliente.limite_credito = limite_update.novo_limite
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    # ... (Recalcula e retorna o schema Cliente)
    limite_disp = db_cliente.limite_credito - db_cliente.saldo_devedor if not db_cliente.trust_mode else float('inf') 
    cliente_schema = schemas.Cliente.model_validate(db_cliente)
    cliente_schema.limite_disponivel = limite_disp
    return cliente_schema

# --- ✅ Rota PUT para BLOQUEAR/DESBLOQUEAR (VALIDAÇÃO CORRIGIDA) ---
@router.put("/{cliente_id}/status", response_model=schemas.Cliente)
def update_cliente_status(
    cliente_id: int,
    # Usa o schema específico StatusUpdateRequest (restaurado)
    status_update: schemas.StatusUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Atualiza o status da conta de um cliente (ex: bloqueado, ativo)."""
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente: raise HTTPException(...)

    # ✅ Validação usa os valores do Enum do MODELO
    allowed_statuses_update = ['ativo', 'bloqueado'] # Status que o usuário pode SETAR
    if status_update.novo_status not in allowed_statuses_update:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Status inválido. Permitidos para alteração: {', '.join(allowed_statuses_update)}")
         
    # Adicionar lógica extra aqui se necessário? 
    # Ex: Não permitir ativar se estiver 'atrasado'? Ou permitir?
    # if db_cliente.status_conta == 'atrasado' and status_update.novo_status == 'ativo':
    #    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível ativar conta com saldo atrasado.")

    db_cliente.status_conta = status_update.novo_status
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    # ... (Recalcula e retorna o schema Cliente)
    limite_disp = db_cliente.limite_credito - db_cliente.saldo_devedor if not db_cliente.trust_mode else float('inf') 
    cliente_schema = schemas.Cliente.model_validate(db_cliente)
    cliente_schema.limite_disponivel = limite_disp
    return cliente_schema