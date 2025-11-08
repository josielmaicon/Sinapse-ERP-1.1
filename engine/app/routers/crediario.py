# app/routers/crediario.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

router = APIRouter(prefix="/crediario", tags=["Crediário"])

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

@router.post("/", response_model=schemas.Cliente)
def create_cliente_rapido(
    request: schemas.ClienteCreateRapido, 
    db: Session = Depends(get_db)
):
    """
    Cria um novo cliente a partir do modal de cadastro rápido do PDV.
    Aplica a REGRA DE NEGÓCIO: Dia de Vencimento = Dia Atual.
    """
    
    # 1. Verifica duplicidade (ex: CPF, se fornecido)
    if request.cpf:
        existing_cliente = db.query(models.Cliente).filter(models.Cliente.cpf == request.cpf).first()
        if existing_cliente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CPF {request.cpf} já cadastrado para: {existing_cliente.nome}"
            )
            
    # ✅ 2. A SUA REGRA DE MESTRE: O dia de vencimento é o dia de hoje
    hoje = datetime.utcnow()
    dia_do_cadastro = hoje.day # Pega o dia (ex: 8)

    # 3. Cria o novo cliente no banco
    db_cliente = models.Cliente(
        nome=request.nome,
        cpf=request.cpf,
        telefone=request.telefone,
        limite_credito=request.limite_credito_inicial,
        status_conta='ativo', # Novo cliente já começa ativo
        dia_vencimento_fatura=dia_do_cadastro, # <-- A REGRA APLICADA
        saldo_devedor=0.0,
        trust_mode=False
    )
    
    try:
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        
        # Usa a função auxiliar (se você a criou) para formatar a resposta
        # return _build_cliente_response(db_cliente)
        
        # Ou constrói manualmente (se a função não existir)
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
            dia_vencimento_fatura=db_cliente.dia_vencimento_fatura,
            limite_disponivel=db_cliente.limite_credito # Limite disponível é o limite total
        )

    except Exception as e:
        db.rollback()
        print(f"ERRO AO CRIAR CLIENTE: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao salvar novo cliente.")