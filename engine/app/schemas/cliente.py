from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ClienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    
class ClienteCreate(ClienteBase):
    pass

class Cliente(BaseModel): 
    id: int
    nome: str
    cpf: str | None = None
    telefone: str | None = None
    email: str | None = None
    limite_credito: float
    saldo_devedor: float
    trust_mode: bool
    status_conta: str
    dia_vencimento_fatura: int | None = None
    limite_disponivel: float

    class Config:
        from_attributes = True

class ClienteCrediario(ClienteBase):
    id: int
    saldo_devedor: float
    status_conta: str
    dia_vencimento_fatura: int | None = None
    limite_credito: float
    limite_disponivel: float
    trust_mode: bool
    
    class Config:
        from_attributes = True

class ClienteUpdatePersonal(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    dia_vencimento_fatura: Optional[int] = None

class LimiteUpdateRequest(BaseModel):
    novo_limite: Optional[float] = None 
    trust_mode: bool 

class CrediarioSummary(BaseModel):
    total_a_receber: float
    total_inadimplente: float
    clientes_com_credito: int

class TransacaoCrediario(BaseModel):
    id: int
    tipo: str 
    valor: float
    descricao: str | None = None
    data_hora: datetime
    venda_id: int | None = None

    class Config:
        from_attributes = True

class ExtratoResponse(BaseModel):
    saldo_atual: float 
    transacoes: List[TransacaoCrediario] = []

class ClienteCreateRapido(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    limite_credito_inicial: float = 0.0
    
    senha: str = Field(min_length=4, max_length=6) # Exige 4-6 dígitos
    senha_confirmacao: str

class ClientePinRequest(BaseModel):
    pin: str

class RecebimentoCrediarioRequest(BaseModel):
    valor_pago: float = Field(gt=0, description="O valor positivo que o cliente está pagando.")
    forma_pagamento: str
    
    pdv_id: int
    operador_id: int