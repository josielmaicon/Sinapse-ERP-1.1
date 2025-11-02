from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from .pdv import FaturamentoPorPdv

class VerifyAdminPasswordRequest(BaseModel):
    password: str

class VerifyAdminPasswordResponse(BaseModel):
    admin_id: int
    admin_nome: str

class ResumoDiario(BaseModel):
    date: date
    faturamento_total_dia: float
    faturamento_por_pdv: List[FaturamentoPorPdv]

class ProdutoMaisVendido(BaseModel):
    name: str
    totalSales: float

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    expiring_soon_count: int
    expired_count: int
    low_stock_count: int

class ChartDataPoint(BaseModel):
    key: str
    revenue: float

class Configuracao(BaseModel):
    chave: str
    valor: str

    class Config:
        from_attributes = True