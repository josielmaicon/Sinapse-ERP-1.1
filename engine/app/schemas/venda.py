from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .produto import Produto
from .fiscal import NotaFiscalSaida

class VendaItemBase(BaseModel):
    produto_id: int
    quantidade: float

class VendaItemCreate(VendaItemBase):
    pass

class VendaItem(VendaItemBase):
    id: int
    preco_unitario_na_venda: float
    produto: Produto

    class Config:
        from_attributes = True

class VendaBase(BaseModel):
    cliente_id: Optional[int] = None
    operador_id: int
    pdv_id: int

class VendaCreate(VendaBase):
    itens: List[VendaItemCreate]

class Venda(VendaBase):
    id: int
    valor_total: float
    data_hora: datetime
    status: str
    status_fiscal: str
    itens: List[VendaItem] = []
    nota_fiscal_saida: Optional[NotaFiscalSaida] = None 
    
    class Config:
        from_attributes = True

class IniciarVendaRequest(BaseModel):
    pdv_id: int
    operador_id: int

class VendaItemCreate(BaseModel):
    produto_id: int
    quantidade: float

class FinalizarVendaRequest(BaseModel):
    forma_pagamento: str
