from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload 
from typing import List
from .. import models, schemas
from ..database import get_db
from datetime import date, datetime
from ..utils.security import get_password_hash, verify_password

router = APIRouter(
    prefix="/clientes", # Mantendo seu prefixo
    tags=["Clientes / Crediário"]
)

# --- Função Auxiliar (para não repetir código) ---
def _build_cliente_response(db_cliente: models.Cliente) -> schemas.Cliente:
    """
    Calcula campos derivados (sem 'inf') e constrói o schema de resposta Cliente.
    """

    limite_disp = (db_cliente.limite_credito or 0.0) - (db_cliente.saldo_devedor or 0.0)

    return schemas.Cliente(
        id=db_cliente.id,
        nome=db_cliente.nome,
        cpf=db_cliente.cpf,
        telefone=db_cliente.telefone,
        email=db_cliente.email,
        limite_credito=db_cliente.limite_credito,
        saldo_devedor=db_cliente.saldo_devedor,
        trust_mode=db_cliente.trust_mode, # <-- O frontend usa ESTE campo
        status_conta=db_cliente.status_conta,
        dia_vencimento_fatura=db_cliente.dia_vencimento_fatura,
        limite_disponivel=limite_disp # <-- Agora é sempre um número JSON-compatível
    )

@router.get("/", response_model=List[schemas.Cliente])
def get_all_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    
    # Usa a função auxiliar para construir a resposta para cada cliente
    return [_build_cliente_response(cliente) for cliente in clientes]

# --- Rota GET para Detalhes de UM Cliente ---
@router.put("/{cliente_id}", response_model=schemas.Cliente)
def update_cliente_details(
    cliente_id: int, 
    cliente_update: schemas.ClienteUpdatePersonal, # Schema já deve estar atualizado
    db: Session = Depends(get_db)
):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente: raise HTTPException(...)

    update_data = cliente_update.model_dump(exclude_unset=True) 
    
    # ✅ Validação para o novo campo
    if 'dia_vencimento_fatura' in update_data and update_data['dia_vencimento_fatura'] is not None:
        dia = update_data['dia_vencimento_fatura']
        if not (1 <= dia <= 31):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dia de vencimento deve ser entre 1 e 31.")
            
    for key, value in update_data.items():
        setattr(db_cliente, key, value) 

    db.add(db_cliente); db.commit(); db.refresh(db_cliente)
    
    return _build_cliente_response(db_cliente)

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

@router.post("/", response_model=schemas.Cliente)
def create_cliente_rapido(
    request: schemas.ClienteCreateRapido, 
    db: Session = Depends(get_db)
):
    """
    Cria um novo cliente a partir do modal de cadastro rápido do PDV.
    Valida e hasheia a senha.
    """
    
    # 1. Verifica duplicidade (CPF)
    if request.cpf:
        # ... (sua lógica de verificação de CPF)
        pass
            
    # 2. ✅ Validação de Senha (Sua lógica)
    if request.senha != request.senha_confirmacao:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="As senhas não coincidem."
        )
    
    if not request.senha.isdigit() or not (4 <= len(request.senha) <= 6):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="A senha deve ser numérica e ter entre 4 e 6 dígitos."
        )
        
    # 3. ✅ Hashing da Senha
    senha_hash_string = get_password_hash(request.senha)

    # 4. Regra de Negócio (Dia do Vencimento)
    hoje = datetime.utcnow()
    dia_do_cadastro = hoje.day 

    # 5. Cria o novo cliente no banco
    db_cliente = models.Cliente(
        nome=request.nome,
        cpf=request.cpf,
        telefone=request.telefone,
        limite_credito=request.limite_credito_inicial,
        status_conta='ativo',
        dia_vencimento_fatura=dia_do_cadastro,
        saldo_devedor=0.0,
        trust_mode=False,
        senha_hash=senha_hash_string # <-- Salva o HASH
    )
    
    try:
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        
        # Retorna o cliente formatado (sem a senha, claro)
        return _build_cliente_response(db_cliente)

    except Exception as e:
        db.rollback()
        print(f"ERRO AO CRIAR CLIENTE: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar novo cliente.")

# --- ✅ NOVA ROTA: O Porteiro (Verificação de PIN) ---
@router.post("/{cliente_id}/verificar-senha", response_model=schemas.Cliente)
def verificar_senha_cliente(
    cliente_id: int, 
    request: schemas.ClientePinRequest,
    db: Session = Depends(get_db)
):
    """
    Verifica o PIN de 4-6 dígitos de um cliente.
    Usado pelo PDV para autorizar a seleção no crediário.
    """
    
    # 1. Busca o cliente
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    
    # 2. Verifica se ele TEM uma senha
    if not db_cliente.senha_hash:
        # Se clientes antigos não têm senha, podemos permitir ou negar.
        # Vamos negar por segurança.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este cliente não possui uma senha de crediário cadastrada.")
    
    # 3. Verifica a senha
    if not verify_password(request.pin, db_cliente.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, # 401 Não Autorizado
            detail="Senha incorreta."
        )
    
    # 4. Sucesso! Retorna os dados completos do cliente
    return _build_cliente_response(db_cliente)