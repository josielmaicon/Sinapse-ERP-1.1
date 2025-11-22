from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from typing import List

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
    config.cor_destaque = settings.cor_destaque
    config.fuso_horario = settings.fuso_horario
    
    db.commit()
    db.refresh(config)
    return config

@router.put("/operacional/regras", response_model=schemas.EmpresaConfig)
def update_regras_operacionais(
    regras: dict, # Recebe JSON simples { "permitir_estoque_negativo": true }
    db: Session = Depends(get_db)
):
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config: raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    if "permitir_estoque_negativo" in regras:
        config.permitir_estoque_negativo = regras["permitir_estoque_negativo"]
        
    db.commit()
    db.refresh(config)
    return config

@router.get("/operacional/perfis", response_model=List[schemas.PerfilAbertura])
def list_perfis_abertura(db: Session = Depends(get_db)):
    return db.query(models.PerfilAbertura).filter(models.PerfilAbertura.empresa_id == 1).all()

@router.post("/operacional/perfis", response_model=schemas.PerfilAbertura)
def create_perfil_abertura(perfil: schemas.PerfilAberturaCreate, db: Session = Depends(get_db)):
    db_perfil = models.PerfilAbertura(**perfil.dict(), empresa_id=1)
    db.add(db_perfil)
    db.commit()
    db.refresh(db_perfil)
    return db_perfil

@router.delete("/operacional/perfis/{id}", status_code=204)
def delete_perfil_abertura(id: int, db: Session = Depends(get_db)):
    db_perfil = db.query(models.PerfilAbertura).filter(models.PerfilAbertura.id == id).first()
    if not db_perfil: raise HTTPException(status_code=404)
    db.delete(db_perfil)
    db.commit()