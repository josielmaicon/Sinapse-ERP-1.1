# app/schemas.py
from pydantic import BaseModel

# --- Esquema para o Produto ---
class ProdutoBase(BaseModel):
    nome: str
    quantidade_estoque: int
    preco_venda: float
    # Adicione outros campos que virão do formulário
    codigo_barras: str | None = None
    preco_custo: float | None = None
    categoria: str | None = None

# Schema para a criação
class ProdutoCreate(ProdutoBase):
    pass

# Schema para a leitura (retorno da API)
class Produto(ProdutoBase):
    id: int
    # criado_em: datetime # Podemos adicionar depois
    
    class Config:
        orm_mode = True