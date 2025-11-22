from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field


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

    class Config:
        from_attributes = True