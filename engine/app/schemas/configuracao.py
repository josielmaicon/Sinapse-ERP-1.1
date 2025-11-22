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

    class Config:
        from_attributes = True