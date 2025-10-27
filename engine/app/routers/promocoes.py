from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/promocoes",
    tags=["Promoções"]
)

@router.post("/", response_model=schemas.Promocao)
def create_promocao(promocao: schemas.PromocaoCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova promoção e a associa com uma lista de produtos.
    """
    
    # 1. Buscar todos os produtos que o usuário selecionou
    db_produtos = db.query(models.Produto).filter(
        models.Produto.id.in_(promocao.produto_ids)
    ).all()
    
    if not db_produtos or len(db_produtos) != len(promocao.produto_ids):
        raise HTTPException(status_code=404, detail="Um ou mais produtos selecionados não foram encontrados.")
        
    # 2. Criar o objeto da Promoção
    # Usamos **promocao.model_dump() e excluímos 'produto_ids'
    # pois 'db_promocao' não tem um campo 'produto_ids'
    db_promocao = models.Promocao(
        **promocao.model_dump(exclude={"produto_ids"})
    )
    
    # 3. A Mágica do SQLAlchemy:
    # Apenas dizemos "estes são os produtos desta promoção".
    # O SQLAlchemy cuida da tabela de associação para nós.
    db_promocao.produtos = db_produtos
    
    # 4. Salvar no banco
    db.add(db_promocao)
    db.commit()
    db.refresh(db_promocao)
    
    return db_promocao