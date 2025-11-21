from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])

@router.get("/geral", response_model=schemas.EmpresaConfig)
def get_configuracoes_geral(db: Session = Depends(get_db)):
    # Busca a configuração ID 1
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    
    # Se não existir (primeira vez), cria uma padrão
    if not config:
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
        # Fallback de segurança
        config = models.Empresa(id=1)
        db.add(config)

    # Atualiza campos
    config.nome_fantasia = settings.nome_fantasia
    config.cnpj = settings.cnpj
    config.logo_data = settings.logo_data
    config.tipo_logo = settings.tipo_logo
    config.tema_preferido = settings.tema_preferido
    config.cor_primaria = settings.cor_primaria
    config.fuso_horario = settings.fuso_horario
    
    db.commit()
    db.refresh(config)
    return config