from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

# ... (Seus outros schemas: UsuarioBase, Produto, Venda, etc.) ...

# ✅ NOVO SCHEMA: Configurações da Empresa (A Cidadela)
class EmpresaConfig(BaseModel):
    nome_fantasia: str
    cnpj: Optional[str] = None
    
    # Identidade Visual
    logo_data: Optional[str] = None # Pode ser URL, Base64 ou SVG
    tipo_logo: Optional[str] = "url" # 'url', 'base64', 'svg'
    
    # Aparência e Regional
    tema_preferido: str = "system"
    cor_primaria: str = "#000000"
    fuso_horario: str = "America/Sao_Paulo"

    class Config:
        from_attributes = True

# ... (Resto do arquivo) ...