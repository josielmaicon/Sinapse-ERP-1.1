from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from .. import models, schemas
from ..database import get_db
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/api/fiscal",
    tags=["Fiscal"]
)

@router.get("/summary")
def get_fiscal_summary(db: Session = Depends(get_db)):
    """
    Retorna os dados consolidados para os painéis da página Fiscal.
    """
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # Lógica para "Valor Comprado no Mês" (continua a mesma)
    total_comprado = db.query(func.sum(models.NotaFiscalEntrada.valor_total)).filter(
        models.NotaFiscalEntrada.data_emissao >= start_of_month.date()
    ).scalar() or 0

    # Lógica para "Valor Emitido no Mês" (continua a mesma)
    total_emitido = db.query(func.sum(models.Venda.valor_total)).join(models.NotaFiscalSaida).filter(
        models.NotaFiscalSaida.status_sefaz == 'Autorizada',
        models.NotaFiscalSaida.data_hora_autorizacao >= start_of_month
    ).scalar() or 0
    
    # ✅ LÓGICA PARA O GRÁFICO
    daily_issuance_query = db.query(
        extract('day', models.NotaFiscalSaida.data_hora_autorizacao).label('day'),
        func.sum(models.Venda.valor_total).label('issuedValue')
    ).join(models.Venda).filter(
        models.NotaFiscalSaida.status_sefaz == 'Autorizada',
        extract('month', models.NotaFiscalSaida.data_hora_autorizacao) == start_of_month.month
    ).group_by('day').order_by('day').all()

    # ✅ LÓGICA PARA OS INDICADORES DE AUDITORIA
    rejected_count = db.query(func.count(models.NotaFiscalSaida.id)).filter(
        models.NotaFiscalSaida.status_sefaz == 'Rejeitada'
    ).scalar() or 0
    
    old_pending_count = db.query(func.count(models.Venda.id)).filter(
        models.Venda.status_fiscal == 'pendente',
        models.Venda.data_hora < seven_days_ago
    ).scalar() or 0

    return {
        "total_comprado_mes": total_comprado,
        "total_emitido_mes": total_emitido,
        "resumo_diario": [
            {"day": int(row.day), "issuedValue": float(row.issuedValue or 0)}
            for row in daily_issuance_query
        ],
        "notas_rejeitadas": rejected_count,
        "pendentes_antigas": old_pending_count
    }