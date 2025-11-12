from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from .produto import Produto
from .fiscal import NotaFiscalSaida

class VendaItemBase(BaseModel):
    produto_id: int
    quantidade: float


class VendaItemCreate(VendaItemBase):
    """Usado para adicionar itens a uma venda"""
    pass


class VendaItem(VendaItemBase):
    """Representação completa de um item já salvo"""
    id: int
    preco_unitario_na_venda: float
    produto: Optional[Produto]

    class Config:
        from_attributes = True

class VendaBase(BaseModel):
    cliente_id: Optional[int] = None
    operador_id: int
    pdv_id: int


class VendaCreate(VendaBase):
    """Usado quando a venda é criada diretamente (sem PDV)"""
    itens: List[VendaItemCreate]


class Venda(VendaBase):
    """Modelo completo retornado nas respostas"""
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
    """Rota /vendas/iniciar"""
    pdv_id: int
    operador_id: int


class AdicionarItemRequest(BaseModel):
    """Rota /vendas/{venda_id}/adicionar-item"""
    produto_id: int
    quantidade: float


class FinalizarVendaRequest(BaseModel):
    """Rota /vendas/{venda_id}/finalizar"""
    forma_pagamento: str

class AdicionarItemSmartRequest(BaseModel):
    """
    Schema para a rota inteligente que faz tudo de uma vez:
    busca produto, inicia venda (se necessário) e adiciona o item.
    """
    codigo_barras: str
    pdv_id: int
    operador_id: int
    quantidade: float = 1.0

class AdminAuthRequest(BaseModel):
    """Schema para autenticar o Administrador que autoriza a ação."""
    admin_senha: Optional[str] = None

class RemoverItemRequest(BaseModel):
    """Body para a rota de remoção de item auditada."""
    auth: Optional[AdminAuthRequest] = None
    quantidade: float     