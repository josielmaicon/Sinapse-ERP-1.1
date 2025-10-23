# app/schemas.py
from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- Esquema para o Produto ---
class ProdutoBase(BaseModel):
    nome: str
    quantidade_estoque: int
    preco_venda: float
    codigo_barras: str | None = None
    preco_custo: float | None = None
    categoria: str | None = None
    vencimento: date | None = None
    ncm: str | None = None
    cfop: str | None = None
    cst: str | None = None

# Schema para a criação
class ProdutoCreate(ProdutoBase):
    pass

# Schema para a leitura (retorno da API)
class Produto(ProdutoBase):
    id: int
    # criado_em: datetime # Podemos adicionar depois
    
    class Config:
        orm_mode = True 

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    quantidade_estoque: Optional[float] = None
    preco_venda: Optional[float] = None
    preco_custo: Optional[float] = None
    categoria: Optional[str] = None