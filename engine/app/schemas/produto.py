from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from .fornecedor import Fornecedor
from .usuario import Usuario

class ProdutoBase(BaseModel):
    nome: str
    preco_venda: float
    quantidade_estoque: Optional[float] = 0
    codigo_barras: Optional[str] = None
    categoria: Optional[str] = None
    preco_custo: Optional[float] = 0.0
    unidade_medida: Optional[str] = "UN"
    vencimento: Optional[date] = None

class PromocaoBase(BaseModel):
    nome: str
    tipo: str
    valor: float
    data_inicio: datetime
    data_fim: Optional[datetime] = None

class ProdutoCreate(ProdutoBase):
    pass

class Produto(ProdutoBase):
    id: int
    fornecedor: Optional[Fornecedor] = None
    criador: Optional[Usuario] = None

    class Config:
        from_attributes = True

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    quantidade_estoque: Optional[float] = None
    preco_venda: Optional[float] = None
    preco_custo: Optional[float] = None
    categoria: Optional[str] = None
    vencimento: Optional[date] = None

class ProdutoMovimentacao(BaseModel):
    id: int
    data_hora: datetime
    tipo: str
    quantidade: float
    usuario: str
    nota: Optional[str] = None

    class Config:
        from_attributes = True

class ProdutoSimples(BaseModel):
    id: int
    nome: str
    class Config:
        from_attributes = True

class PromocaoCreate(PromocaoBase):
    produto_ids: List[int]
    
class Promocao(PromocaoBase):
    id: int
    produtos: List[ProdutoSimples] = []
    
    class Config:
        from_attributes = True

class ResumoEstoqueDiario(BaseModel):
    data: date
    valor_total_estoque: float
    itens_estoque_baixo: int
    itens_vencimento_proximo: int
    itens_sem_giro: int

    class Config:
        from_attributes = True

class LabelPrintData(BaseModel):
    id: int
    nome: str
    preco_venda: float

class ProdutoComPromocao(Produto):
    preco_final: float
    promocao_ativa: Optional[str] = None # Nome da promoção aplicada (se houver)