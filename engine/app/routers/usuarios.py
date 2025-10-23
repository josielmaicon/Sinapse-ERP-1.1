# app/routers/usuarios.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db # Vamos mover get_db para database.py para reutilizar

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=List[schemas.Usuario])
def get_all_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()