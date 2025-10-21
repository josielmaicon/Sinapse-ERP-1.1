from pydantic import BaseModel

# Este é o formato de um Produto que a API irá retornar
class Product(BaseModel):
    id: int
    name: str
    quantity: int
    sale_price: float

    class Config:
        orm_mode = True # Permite que o Pydantic leia dados do SQLAlchemy