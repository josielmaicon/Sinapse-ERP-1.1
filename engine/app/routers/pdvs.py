# app/routers/pdvs.py

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/pdvs", tags=["PDVs"])

@router.get("/", response_model=List[schemas.PdvStatus])
def get_all_pdvs(status: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Busca todos os PDVs. Pode ser filtrado por status.
    Ex: /api/pdvs?status=aberto
    """
    query = db.query(models.Pdv).options(joinedload(models.Pdv.operador_atual))

    if status and status != "todos":
        if status == "fechados":
            # Se o filtro for 'fechados', busca tudo que NÃO for 'aberto'
            query = query.filter(models.Pdv.status != "aberto")
        else:
            query = query.filter(models.Pdv.status == status)
    
    pdvs = query.all()
    return pdvs