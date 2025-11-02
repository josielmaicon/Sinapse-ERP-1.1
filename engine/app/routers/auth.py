from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..utils.security import verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)

@router.post("/verify-admin", response_model=schemas.VerifyAdminPasswordResponse)
def verify_admin_password(
    request: schemas.VerifyAdminPasswordRequest, 
    db: Session = Depends(get_db)
):
    """
    Verifica se a senha fornecida pertence a um usuário com função 'admin' ou 'gerente'.
    Retorna o ID e nome do admin se a senha for válida.
    """
    # Busca usuários que são admin OU gerente
    admins = db.query(models.Usuario).filter(
        (models.Usuario.funcao == 'admin') | (models.Usuario.funcao == 'gerente'),
        models.Usuario.status == 'ativo' # Garante que o admin está ativo
    ).all()

    if not admins:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nenhum administrador encontrado no sistema."
        )

    # Tenta verificar a senha contra cada admin encontrado
    for admin in admins:
        if verify_password(request.password, admin.senha_hash):
            # Senha correta! Retorna os dados do admin.
            return schemas.VerifyAdminPasswordResponse(
                admin_id=admin.id, 
                admin_nome=admin.nome
            )

    # Se chegou aqui, nenhuma senha bateu
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Senha de administrador inválida."
    )

# Adicione outras rotas de auth (login, etc.) se precisar