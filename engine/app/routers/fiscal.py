# app/routers/fiscal.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from datetime import datetime

router = APIRouter(
    prefix="/api/fiscal",
    tags=["Fiscal"]
)

@router.get("/summary")
def get_fiscal_summary(db: Session = Depends(get_db)):
    """
    Retorna os dados consolidados para os StatCards da página Fiscal.
    """
    # Lógica para "Valor Comprado no Mês"
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    total_comprado = db.query(func.sum(models.NotaFiscalEntrada.valor_total)).filter(
        models.NotaFiscalEntrada.data_emissao >= start_of_month
    ).scalar() or 0

    # Lógica para "Valor Emitido no Mês"
    total_emitido = db.query(func.sum(models.Venda.valor_total)).join(models.NotaFiscalSaida).filter(
        models.NotaFiscalSaida.status_sefaz == 'Autorizada',
        models.NotaFiscalSaida.data_hora_autorizacao >= start_of_month
    ).scalar() or 0

    return {
        "total_comprado_mes": total_comprado,
        "total_emitido_mes": total_emitido,
        # Aqui viriam outros cálculos, como o progresso da meta
    }