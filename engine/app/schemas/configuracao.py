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