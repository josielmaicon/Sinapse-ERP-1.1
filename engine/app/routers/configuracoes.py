from fastapi import APIRouter, Depends, HTTPException, APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from datetime import datetime, timedelta # Para simular validade
from sqlalchemy.orm import Session,joinedload
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

@router.get("/hardware/impressoras", response_model=List[schemas.Impressora])
def list_impressoras(db: Session = Depends(get_db)):
    return db.query(models.Impressora).all()

@router.post("/hardware/impressoras", response_model=schemas.Impressora)
def create_impressora(impressora: schemas.ImpressoraCreate, db: Session = Depends(get_db)):
    db_imp = models.Impressora(**impressora.dict())
    db.add(db_imp)
    db.commit()
    db.refresh(db_imp)
    return db_imp

@router.delete("/hardware/impressoras/{id}", status_code=204)
def delete_impressora(id: int, db: Session = Depends(get_db)):
    # Verifica se está em uso
    uso = db.query(models.Pdv).filter(models.Pdv.impressora_id == id).first()
    if uso:
        raise HTTPException(status_code=400, detail=f"Impressora em uso no {uso.nome}")
    
    db.query(models.Impressora).filter(models.Impressora.id == id).delete()
    db.commit()

# --- PDVS (Gestão) ---
@router.get("/hardware/pdvs", response_model=List[schemas.Pdv])
def list_pdvs_config(db: Session = Depends(get_db)):
    # Retorna todos os PDVs com suas impressoras
    return db.query(models.Pdv).options(joinedload(models.Pdv.impressora)).all()

@router.post("/hardware/pdvs", response_model=schemas.Pdv)
def create_pdv_config(pdv: schemas.PdvCreate, db: Session = Depends(get_db)):
    db_pdv = models.Pdv(**pdv.dict(), status='fechado')
    db.add(db_pdv)
    db.commit()
    db.refresh(db_pdv)
    return db_pdv

@router.put("/hardware/pdvs/{id}", response_model=schemas.Pdv)
def update_pdv_config(id: int, pdv_update: schemas.PdvUpdate, db: Session = Depends(get_db)):
    db_pdv = db.query(models.Pdv).filter(models.Pdv.id == id).first()
    if not db_pdv: raise HTTPException(status_code=404)
    
    if pdv_update.nome: db_pdv.nome = pdv_update.nome
    if pdv_update.impressora_id is not None: 
        # Se enviou 0 ou -1, remove a impressora
        db_pdv.impressora_id = pdv_update.impressora_id if pdv_update.impressora_id > 0 else None
        
    db.commit()
    db.refresh(db_pdv)
    return db_pdv

@router.put("/fiscal/regras", response_model=schemas.EmpresaConfig)
def update_fiscal_rules(regras: dict, db: Session = Depends(get_db)):
    """Atualiza campos fiscais na tabela Empresa."""
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config: raise HTTPException(status_code=404)
    
    # Mapeamento dinâmico seguro
    campos_permitidos = [
        "regime_tributario", "inscricao_estadual", "inscricao_municipal",
        "csc_id", "csc_token", "padrao_ncm", "padrao_cfop_dentro",
        "padrao_cfop_fora", "padrao_csosn", "ambiente_sefaz", "tentativas_envio"
    ]
    
    for campo in campos_permitidos:
        if campo in regras:
            setattr(config, campo, regras[campo])
            
    db.commit()
    db.refresh(config)
    return config

# ✅ UPLOAD DE CERTIFICADO (SIMULADO)
@router.post("/fiscal/certificado", response_model=schemas.CertificadoInfo)
async def upload_certificado(
    file: UploadFile = File(...),
    senha: str = Form(...), # Recebe via Form-Data
    db: Session = Depends(get_db)
):
    """
    Recebe o arquivo .pfx, salva no banco e simula a leitura dos dados.
    (Futuro: Usar biblioteca 'cryptography' para ler validade real)
    """
    
    # 1. Ler o arquivo
    conteudo = await file.read()
    
    # 2. Simulação de Leitura (Mock)
    # Vamos fingir que lemos o certificado e ele vence em 1 ano
    validade_simulada = datetime.utcnow() + timedelta(days=365)
    titular_simulado = "MINHA EMPRESA LTDA (Simulado)"
    emissor_simulado = "Autoridade Certificadora Raiz"
    
    # 3. Salvar no Banco
    db_cert = models.CertificadoDigital(
        empresa_id=1,
        nome_arquivo=file.filename,
        senha_arquivo=senha, # Cuidado: Em prod, criptografar!
        arquivo_binario=conteudo,
        
        # Dados extraídos (Simulados)
        titular=titular_simulado,
        emissor=emissor_simulado,
        data_validade=validade_simulada,
        serial_number="12345678900",
        ativo=True
    )
    
    # Desativar outros certificados da mesma empresa? (Regra de negócio: só 1 ativo)
    # db.query(models.CertificadoDigital).update({"ativo": False})
    
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    
    return db_cert

@router.get("/fiscal/certificados", response_model=List[schemas.CertificadoInfo])
def list_certificados(db: Session = Depends(get_db)):
    return db.query(models.CertificadoDigital).filter(models.CertificadoDigital.empresa_id == 1).all()
    
@router.delete("/fiscal/certificados/{id}", status_code=204)
def delete_certificado(id: int, db: Session = Depends(get_db)):
    db.query(models.CertificadoDigital).filter(models.CertificadoDigital.id == id).delete()
    db.commit()

@router.put("/conexoes", response_model=schemas.EmpresaConfig)
def update_conexoes_config(regras: dict, db: Session = Depends(get_db)):
    """Atualiza as configurações de integrações externas."""
    config = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    if not config: raise HTTPException(status_code=404)
    
    campos_permitidos = [
        "api_produtos_ativo", "api_produtos_token",
        "ecommerce_ativo", "ecommerce_url", "ecommerce_key", "ecommerce_secret",
        "ifood_ativo", "ifood_merchant_id", "ifood_auto_aceitar",
        "whatsapp_ativo", "whatsapp_sessao",
        "contabilidade_email", "contabilidade_sistema", "contabilidade_auto_envio"
    ]
    
    for campo in campos_permitidos:
        if campo in regras:
            setattr(config, campo, regras[campo])
            
    db.commit()
    db.refresh(config)
    return config