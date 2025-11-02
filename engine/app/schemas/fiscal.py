from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from .fornecedor import FornecedorBase

class NotaFiscalEntradaBase(BaseModel):
    numero_nota: Optional[str] = None
    chave_acesso: Optional[str] = None
    data_emissao: date
    valor_total: float

class NotaFiscalEntrada(NotaFiscalEntradaBase):
    id: int
    fornecedor: Optional[FornecedorBase] = None

    class Config:
        from_attributes = True

class NotaFiscalSaida(BaseModel):
    id: int
    chave_acesso: Optional[str] = None
    status_sefaz: Optional[str] = None
    data_hora_autorizacao: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotaFiscalEntrada(BaseModel):
    id: int
    numero_nota: str
    data_emissao: date
    valor_total: float
    
    class Config:
        from_attributes = True

class FiscalConfigResponse(BaseModel):
    strategy: str = 'coeficiente'
    goal_value: float = 2.1
    autopilot_enabled: bool = False

class FiscalConfigUpdateRequest(BaseModel):
    strategy: str
    goal_value: float
    autopilot_enabled: bool

class FiscalSummary(BaseModel):
    total_comprado: float
    total_emitido: float
    notas_entrada: List[NotaFiscalEntrada] = []

    class Config:
        from_attributes = True

class EmitirLoteRequest(BaseModel):
    venda_ids: List[int]