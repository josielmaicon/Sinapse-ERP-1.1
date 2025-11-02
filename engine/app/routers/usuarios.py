# app/routers/usuarios.py

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from datetime import datetime, date

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=List[schemas.Usuario])
def get_all_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()


def calcular_horas_trabalhadas(operador_id: int, db: Session) -> str:
    """
    Calcula o tempo total de operação do operador no dia de hoje,
    somando os períodos entre 'abertura' e 'fechamento'.
    """
    today = date.today()

    # Busca todas as movimentações do dia
    movs = (
        db.query(models.MovimentacaoCaixa)
        .filter(
            models.MovimentacaoCaixa.operador_id == operador_id,
            func.date(models.MovimentacaoCaixa.data_hora) == today
        )
        .order_by(models.MovimentacaoCaixa.data_hora)
        .all()
    )

    total_minutos = 0
    last_open = None

    for mov in movs:
        if mov.tipo == "abertura":
            last_open = mov.data_hora
        elif mov.tipo == "fechamento" and last_open:
            total_minutos += (mov.data_hora - last_open).total_seconds() / 60
            last_open = None

    # Se ainda houver abertura sem fechamento
    if last_open:
        total_minutos += (datetime.now() - last_open).total_seconds() / 60

    horas = int(total_minutos // 60)
    minutos = int(total_minutos % 60)
    return f"{horas}h {minutos}m"


@router.get("/performance", response_model=List[schemas.UsuarioPerformance])
def get_operador_performance(db: Session = Depends(get_db)):
    """
    Busca todos os usuários e calcula:
    - total de vendas
    - faturamento total
    - ticket médio
    - horas trabalhadas hoje
    """
    today = date.today()

    # --- Estatísticas de vendas do dia ---
    stats_query = (
        db.query(
            models.Venda.operador_id,
            func.count(models.Venda.id).label("total_vendas"),
            func.sum(models.Venda.valor_total).label("faturamento_total")
        )
        .filter(models.Venda.status == "concluida")
        .group_by(models.Venda.operador_id)
        .subquery()
    )

    usuarios_com_stats = (
        db.query(
            models.Usuario,
            stats_query.c.total_vendas,
            stats_query.c.faturamento_total
        )
        .outerjoin(stats_query, models.Usuario.id == stats_query.c.operador_id)
        .all()
    )

    resultados_performance = []

    for usuario, total_vendas, faturamento_total in usuarios_com_stats:
        faturamento = faturamento_total or 0
        vendas = total_vendas or 0
        ticket_medio = (faturamento / vendas) if vendas > 0 else 0

        # Calcula horas trabalhadas corretamente
        horas_trabalhadas_str = calcular_horas_trabalhadas(usuario.id, db)

        resultados_performance.append(
            schemas.UsuarioPerformance(
                id=usuario.id,
                nome=usuario.nome,
                funcao=usuario.funcao,
                status=usuario.status,
                total_vendas=vendas,
                faturamento_total=faturamento,
                ticket_medio=ticket_medio,
                horas_trabalhadas=horas_trabalhadas_str
            )
        )

    return resultados_performance
