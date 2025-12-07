from typing import Optional
from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    nome: str
    funcao: Optional[str] = "operador"
    status: str
    
    class Config:
            from_attributes = True

class UsuarioCreate(UsuarioBase):
    senha_hash: str

class Usuario(UsuarioBase):
    id: int
    class Config:
        from_attributes = True

class UsuarioPerformance(UsuarioBase):
    id: int
    status: str
    total_vendas: int
    faturamento_total: float
    ticket_medio: float
    horas_trabalhadas: str

    class Config:
        from_attributes = True
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

# Schema para resposta do Token
class Token(BaseModel):
    access_token: str
    token_type: str
    nome_usuario: str
    funcao: str