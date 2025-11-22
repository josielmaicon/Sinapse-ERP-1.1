from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])

@router.get("/geral", response_model=schemas.EmpresaConfig)
def get_configuracoes_geral(db: Session = Depends(get_db)):
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    
    if not config:
        # Cria o padrão se não existir
        config = models.Empresa(id=1, nome_fantasia="Minha Loja Nova")
        db.add(config)
        db.commit()
        db.refresh(config)
        
    return config

@router.put("/geral", response_model=schemas.EmpresaConfig)
def update_configuracoes_geral(
    settings: schemas.EmpresaConfig, 
    db: Session = Depends(get_db)
):
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config:
        config = models.Empresa(id=1)
        db.add(config)

    # --- Mapeamento Manual (Segurança e Controle) ---
    config.nome_fantasia = settings.nome_fantasia
    config.cnpj = settings.cnpj
    config.logo_data = settings.logo_data
    config.tipo_logo = settings.tipo_logo
    
    config.tema_preferido = settings.tema_preferido
    config.cor_destaque = settings.cor_destaque # ✅ Atualizando a cor
    config.fuso_horario = settings.fuso_horario
    
    # 🛡️ NOTA DE MESTRE:
    # Não atualizamos 'plano_atual' ou 'status_assinatura' aqui.
    # O usuário não pode mudar seu próprio plano editando o JSON desta rota.
    # Esses campos só seriam alterados por um webhook de pagamento ou painel de super-admin.
    
    db.commit()
    db.refresh(config)
    return config