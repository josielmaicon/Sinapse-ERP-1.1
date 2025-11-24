from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/configuracoes/financeiro", tags=["Configurações Financeiras"])

# --- FORMAS DE PAGAMENTO ---

@router.get("/metodos", response_model=List[schemas.FormaPagamento])
def list_payment_methods(db: Session = Depends(get_db)):
    return db.query(models.FormaPagamento).all()

@router.post("/metodos", response_model=schemas.FormaPagamento)
def create_payment_method(method: schemas.FormaPagamentoCreate, db: Session = Depends(get_db)):
    db_method = models.FormaPagamento(**method.dict(), sistema=False)
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method

@router.put("/metodos/{id}", response_model=schemas.FormaPagamento)
def update_payment_method(id: int, method_update: schemas.FormaPagamentoCreate, db: Session = Depends(get_db)):
    db_method = db.query(models.FormaPagamento).filter(models.FormaPagamento.id == id).first()
    if not db_method: raise HTTPException(status_code=404)
    
    db_method.nome = method_update.nome
    db_method.ativo = method_update.ativo
    db_method.taxa = method_update.taxa
    # Tipo e Sistema geralmente não mudam
    
    db.commit()
    db.refresh(db_method)
    return db_method

# --- CONFIGURAÇÕES GLOBAIS (PIX / JUROS) ---
# Usaremos a mesma tabela Empresa, então podemos atualizar via rota específica ou reutilizar o endpoint Geral.
# Vamos criar um endpoint específico para ser RESTful com a página.

@router.put("/regras", response_model=schemas.EmpresaConfig)
def update_financeiro_rules(data: dict, db: Session = Depends(get_db)):
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config: raise HTTPException(status_code=404)
    
    # Atualiza campos se vierem no JSON
    if "pix_chave_padrao" in data: config.pix_chave_padrao = data["pix_chave_padrao"]
    if "pix_tipo_chave" in data: config.pix_tipo_chave = data["pix_tipo_chave"]
    if "crediario_multa" in data: config.crediario_multa = data["crediario_multa"]
    if "crediario_juros_mensal" in data: config.crediario_juros_mensal = data["crediario_juros_mensal"]
    if "crediario_dias_carencia" in data: config.crediario_dias_carencia = data["crediario_dias_carencia"]
    
    db.commit()
    db.refresh(config)
    return config

@router.get("/pix/overrides", response_model=List[schemas.Pdv])
def list_pdv_pix_overrides(db: Session = Depends(get_db)):
    """Lista todos os PDVs (para preencher o select ou mostrar a lista de exceções)."""
    # Retorna todos, o front filtra ou mostra status
    return db.query(models.Pdv).all()

@router.put("/pix/overrides/{pdv_id}", response_model=schemas.Pdv)
def update_pdv_pix_override(
    pdv_id: int, 
    pix_data: schemas.PdvUpdatePix, 
    db: Session = Depends(get_db)
):
    """Define ou remove (se enviar null) a chave PIX específica de um PDV."""
    pdv = db.query(models.Pdv).filter(models.Pdv.id == pdv_id).first()
    if not pdv: raise HTTPException(status_code=404, detail="PDV não encontrado")
    
    pdv.pix_chave_especifica = pix_data.pix_chave_especifica
    pdv.pix_tipo_especifico = pix_data.pix_tipo_especifico
    
    db.commit()
    db.refresh(pdv)
    return pdv