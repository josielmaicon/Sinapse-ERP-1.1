from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

class PerfilAberturaBase(BaseModel):
    nome: str
    horario_sugerido: Optional[str] = "08:00"
    valor_padrao: float = 0.0

class PerfilAberturaCreate(PerfilAberturaBase):
    """Usado para criar um novo perfil (POST)"""
    pass

class PerfilAbertura(PerfilAberturaBase):
    """Usado para ler um perfil existente (GET)"""
    id: int
    empresa_id: Optional[int] = None # Relacionamento com a empresa

    class Config:
        from_attributes = True

class CertificadoDigitalBase(BaseModel):
    nome_arquivo: str
    data_validade: datetime
    emissor: str
    ativo: bool

class CertificadoInfo(CertificadoDigitalBase):
    id: int
    # Não retornamos a senha nem o binário por segurança no GET normal

class EmpresaConfig(BaseModel):
    nome_fantasia: str
    cnpj: Optional[str] = None
    logo_data: Optional[str] = None
    tipo_logo: Optional[str] = "url"
    
    tema_preferido: str = "system"
    cor_destaque: str = "#3b82f6" # Renomeado de cor_primaria para evitar confusão
    fuso_horario: str = "America/Sao_Paulo"
    
    plano_atual: Optional[str] = "Plano Gratuito"
    status_assinatura: Optional[str] = "ativo"
    permitir_estoque_negativo: bool = False
    perfis_abertura: List[PerfilAbertura] = [] 

    pix_chave_padrao: Optional[str] = None
    pix_tipo_chave: Optional[str] = "cnpj"
    crediario_multa: float = 0.0
    crediario_juros_mensal: float = 0.0
    crediario_dias_carencia: int = 0

    regime_tributario: str = "simples"
    inscricao_estadual: Optional[str] = None
    inscricao_municipal: Optional[str] = None
    csc_id: Optional[str] = None
    # csc_token (Geralmente não retornamos por segurança, ou retornamos mascarado)
    
    padrao_ncm: Optional[str] = None
    padrao_cfop_dentro: str = "5.102"
    padrao_cfop_fora: str = "6.102"
    padrao_csosn: str = "102"
    
    ambiente_sefaz: str = "homologacao"
    tentativas_envio_automatico: bool = True
    intervalo_tentativas_minutos: int = 15
    
    certificados: List[CertificadoInfo] = []
    
    class Config:
        from_attributes = True

class FormaPagamentoBase(BaseModel):
    nome: str
    tipo: str
    taxa: float = 0.0
    ativo: bool = True
    hotkey: Optional[str] = None
    
class FormaPagamentoCreate(FormaPagamentoBase):
    pass

class FormaPagamento(FormaPagamentoBase):
    id: int
    sistema: bool
    class Config:
        from_attributes = True