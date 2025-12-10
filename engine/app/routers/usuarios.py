# app/routers/usuarios.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from datetime import datetime, date, timedelta
from ..utils.security import get_password_hash, verify_password, criar_token_acesso, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=List[schemas.Usuario])
def get_all_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()


def calcular_horas_trabalhadas(operador_id: int, db: Session) -> str:
    """
    Calcula o tempo total de operação do operador no dia de hoje,
    somando os períodos entre 'abertura' e 'fechamento'.
    """
    today = date.today()

    # Busca todas as movimentações do dia
    movs = (
        db.query(models.MovimentacaoCaixa)
        .filter(
            models.MovimentacaoCaixa.operador_id == operador_id,
            func.date(models.MovimentacaoCaixa.data_hora) == today
        )
        .order_by(models.MovimentacaoCaixa.data_hora)
        .all()
    )

    total_minutos = 0
    last_open = None

    for mov in movs:
        if mov.tipo == "abertura":
            last_open = mov.data_hora
        elif mov.tipo == "fechamento" and last_open:
            total_minutos += (mov.data_hora - last_open).total_seconds() / 60
            last_open = None

    # Se ainda houver abertura sem fechamento
    if last_open:
        total_minutos += (datetime.now() - last_open).total_seconds() / 60

    horas = int(total_minutos // 60)
    minutos = int(total_minutos % 60)
    return f"{horas}h {minutos}m"


@router.get("/performance", response_model=List[schemas.UsuarioPerformance])
def get_operador_performance(db: Session = Depends(get_db)):
    """
    Busca todos os usuários e calcula:
    - total de vendas
    - faturamento total
    - ticket médio
    - horas trabalhadas hoje
    """
    today = date.today()

    # --- Estatísticas de vendas do dia ---
    stats_query = (
        db.query(
            models.Venda.operador_id,
            func.count(models.Venda.id).label("total_vendas"),
            func.sum(models.Venda.valor_total).label("faturamento_total")
        )
        .filter(models.Venda.status == "concluida")
        .group_by(models.Venda.operador_id)
        .subquery()
    )

    usuarios_com_stats = (
        db.query(
            models.Usuario,
            stats_query.c.total_vendas,
            stats_query.c.faturamento_total
        )
        .outerjoin(stats_query, models.Usuario.id == stats_query.c.operador_id)
        .all()
    )

    resultados_performance = []

    for usuario, total_vendas, faturamento_total in usuarios_com_stats:
        faturamento = faturamento_total or 0
        vendas = total_vendas or 0
        ticket_medio = (faturamento / vendas) if vendas > 0 else 0

        # Calcula horas trabalhadas corretamente
        horas_trabalhadas_str = calcular_horas_trabalhadas(usuario.id, db)

        resultados_performance.append(
            schemas.UsuarioPerformance(
                id=usuario.id,
                nome=usuario.nome,
                funcao=usuario.funcao,
                status=usuario.status,
                email=usuario.email,
                total_vendas=vendas,
                faturamento_total=faturamento,
                ticket_medio=ticket_medio,
                horas_trabalhadas=horas_trabalhadas_str
            )
        )

    return resultados_performance

@router.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Busca o usuário pelo email
    usuario = db.query(models.Usuario).filter(models.Usuario.email == login_data.email).first()

    # 2. Verifica se existe e se a senha bate
    if not usuario:
        # Padrão de segurança: Não dizer se o erro é email ou senha para evitar enumeration attacks
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    
    if not verify_password(login_data.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    # 3. Verifica se está ativo
    if usuario.status != 'ativo':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo.",
        )

    # 4. Gera o Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = criar_token_acesso(
        data={"sub": usuario.email, "funcao": usuario.funcao, "id": usuario.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "nome_usuario": usuario.nome,
        "funcao": usuario.funcao
    }

# ... (suas importações existentes) ...

# ✅ Rota para CRIAR usuário (POST /usuarios/)
@router.post("/", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED)
def create_usuario(user: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Verifica se email já existe
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == user.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    # 2. Cria hash da senha
    senha_hash = get_password_hash(user.senha)

    # 3. Cria objeto do modelo
    novo_usuario = models.Usuario(
        nome=user.nome,
        email=user.email,
        funcao=user.funcao,
        senha_hash=senha_hash,
        status="ativo" # Padrão ao criar
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


# ✅ Rota para EDITAR usuário (PUT /usuarios/{id})
@router.put("/{usuario_id}", response_model=schemas.Usuario)
def update_usuario(usuario_id: int, user_data: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    # 1. Busca o usuário no banco
    usuario_db = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # 2. Atualiza campos simples (se vierem no payload)
    if user_data.nome:
        usuario_db.nome = user_data.nome
    
    if user_data.email:
        # Verifica se o novo email já não pertence a OUTRO usuário
        email_existente = db.query(models.Usuario).filter(
            models.Usuario.email == user_data.email,
            models.Usuario.id != usuario_id # Importante: ignorar o próprio ID
        ).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="Este e-mail já está em uso por outro usuário.")
        usuario_db.email = user_data.email

    if user_data.funcao:
        usuario_db.funcao = user_data.funcao

    # 3. Atualiza senha (apenas se 'nova_senha' foi enviada)
    if user_data.nova_senha:
        usuario_db.senha_hash = get_password_hash(user_data.nova_senha)

    db.commit()
    db.refresh(usuario_db)
    return usuario_db