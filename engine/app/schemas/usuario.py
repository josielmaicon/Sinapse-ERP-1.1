from typing import Optional
from pydantic import BaseModel, EmailStr

# --- BASES ---
class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr # Adicionei Email aqui, pois é fundamental
    funcao: Optional[str] = "operador"
    status: Optional[str] = "ativo" # Opcional, default "ativo"
    
    class Config:
        from_attributes = True

# --- INPUT SCHEMAS (O que o Front envia) ---

# Usado no POST /usuarios/
class UsuarioCreate(UsuarioBase):
    senha: str 
    # MUDANÇA: O front envia "senha" (texto puro). 
    # O "senha_hash" é gerado pelo backend, não recebido.

# Usado no PUT /usuarios/{id}
class UsuarioUpdate(BaseModel):
    # Na edição, tudo é opcional. O usuário manda só o que quer mudar.
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    funcao: Optional[str] = None
    status: Optional[str] = None
    nova_senha: Optional[str] = None # Campo específico para troca de senha

# --- OUTPUT SCHEMAS (O que o Back devolve) ---

# Usado na listagem padrão e retorno de criação
class Usuario(UsuarioBase):
    id: int
    # Note que NÃO retornamos a senha_hash por segurança
    
    class Config:
        from_attributes = True

# Usado na rota de performance (Dashboard/Relatórios)
class UsuarioPerformance(UsuarioBase):
    id: int
    status: str
    total_vendas: int
    faturamento_total: float
    ticket_medio: float
    horas_trabalhadas: str

    class Config:
        from_attributes = True

# --- AUTENTICAÇÃO ---

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str
    nome_usuario: str
    funcao: str