from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services import faturamento # ✅ Importa o arquivo criado no passo 2

router = APIRouter(prefix="/rotinas", tags=["Rotinas Automáticas"])

@router.post("/processar-juros")
def acionar_rotina_juros(db: Session = Depends(get_db)):
    resultado = faturamento.processar_juros_atraso(db)
    return resultado