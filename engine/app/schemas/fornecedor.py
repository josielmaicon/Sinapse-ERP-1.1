from pydantic import BaseModel
from typing import Optional

class FornecedorBase(BaseModel):
    id: int
    nome: str
    cnpj: Optional[str] = None

    class Config:
        from_attributes = True

class FornecedorCreate(FornecedorBase):
    pass

class Fornecedor(FornecedorBase):
    id: int
    class Config:
        from_attributes = True

