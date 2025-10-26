from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from .. import models, schemas
from ..database import get_db
from datetime import datetime, date, timedelta

router = APIRouter(prefix="/api/pdvs", tags=["PDVs"])

@router.get("/summary", response_model=schemas.PdvDashboardSummary)
def get_pdv_summary(db: Session = Depends(get_db)):
    """
    Calcula e retorna os KPIs (StatCards) para o dashboard de PDVs.
    """
    
    # 1. Calcula o Faturamento Total e o Total de Vendas (das vendas 'concluidas')
    query_vendas = db.query(
        func.sum(models.Venda.valor_total).label("total_faturado"),
        func.count(models.Venda.id).label("total_vendas")
    ).filter(models.Venda.status == "concluida").first() # Adicione filtro de data aqui no futuro

    faturamento_total = query_vendas.total_faturado or 0
    total_vendas = query_vendas.total_vendas or 0

    # 2. Calcula o Ticket Médio
    ticket_medio = (faturamento_total / total_vendas) if total_vendas > 0 else 0

    # 3. Conta os PDVs Operando
    pdvs_operando = db.query(func.count(models.Pdv.id)).filter(models.Pdv.status == "aberto").scalar()
    pdvs_totais = db.query(func.count(models.Pdv.id)).scalar()

    return {
        "faturamento_total": faturamento_total,
        "ticket_medio": ticket_medio,
        "pdvs_operando": pdvs_operando,
        "pdvs_totais": pdvs_totais
    }

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


@router.get("/{pdv_id}/revenue", response_model=List[schemas.ChartDataPoint])
def get_pdv_revenue_data(pdv_id: int, range: str = "today", db: Session = Depends(get_db)):
    """
    Calcula o faturamento para um PDV específico,
    agrupado por hora (para 'today'/'yesterday') ou por dia (para '7d').
        """
        
    query = db.query(models.Venda).filter(
        models.Venda.pdv_id == pdv_id,
        models.Venda.status == "concluida"
    )
    
    # 1. Filtra pelo intervalo de data
    end_date = datetime.utcnow()
    if range == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0)
        query = query.filter(models.Venda.data_hora >= start_date)
        
        # Agrupa por hora
        result = (
            query.with_entities(
                func.strftime('%H:00', models.Venda.data_hora).label("key"),
                func.sum(models.Venda.valor_total).label("revenue")
            )
            .group_by("key")
            .order_by("key")
            .all()
        )
        
    elif range == "yesterday":
        yesterday = end_date - timedelta(days=1)
        start_date = yesterday.replace(hour=0, minute=0, second=0)
        end_date = yesterday.replace(hour=23, minute=59, second=59)
        query = query.filter(models.Venda.data_hora.between(start_date, end_date))
        
        # Agrupa por hora
        result = (
            query.with_entities(
                func.strftime('%H:00', models.Venda.data_hora).label("key"),
                func.sum(models.Venda.valor_total).label("revenue")
            )
            .group_by("key")
            .order_by("key")
            .all()
        )

    elif range == "7d":
        start_date = end_date - timedelta(days=7)
        query = query.filter(models.Venda.data_hora >= start_date)
        
        # Agrupa por dia
        result = (
            query.with_entities(
                func.date(models.Venda.data_hora).label("key"),
                func.sum(models.Venda.valor_total).label("revenue")
            )
            .group_by("key")
            .order_by("key")
            .all()
        )
    else:
        raise HTTPException(status_code=400, detail="Intervalo de tempo inválido")
            
    # Formata para o schema (converte 'date' ou 'time' para string)
    return [schemas.ChartDataPoint(key=str(row.key), revenue=float(row.revenue or 0)) for row in result]

@router.get("/{pdv_id}/stats", response_model=schemas.PdvStats)
def get_pdv_stats(pdv_id: int, db: Session = Depends(get_db)):
    """
    Calcula o Ticket Médio e o Início do Turno para um PDV específico HOJE.
    """
    today = date.today()

    # 1. Calcula o Ticket Médio para este PDV hoje
    stats_vendas = db.query(
        func.sum(models.Venda.valor_total).label("total_faturado"),
        func.count(models.Venda.id).label("total_vendas")
    ).filter(
        models.Venda.pdv_id == pdv_id,
        models.Venda.status == "concluida",
        func.date(models.Venda.data_hora) == today
    ).first()

    faturamento = stats_vendas.total_faturado or 0
    vendas = stats_vendas.total_vendas or 0
    ticket_medio = (faturamento / vendas) if vendas > 0 else 0

    # 2. Busca a primeira "abertura" deste PDV hoje
    inicio_turno = db.query(
        func.min(models.MovimentacaoCaixa.data_hora)
    ).filter(
        models.MovimentacaoCaixa.pdv_id == pdv_id,
        models.MovimentacaoCaixa.tipo == 'abertura',
        func.date(models.MovimentacaoCaixa.data_hora) == today
    ).scalar() # .scalar() pega o primeiro valor da primeira linha

    return {
        "pdv_id": pdv_id,
        "ticket_medio": ticket_medio,
        "inicio_turno": inicio_turno 
    }

@router.get("/{pdv_id}/history", response_model=List[schemas.PdvHistoryLogEntry])
def get_pdv_history(pdv_id: int, db: Session = Depends(get_db)):
    """
    Retorna um histórico unificado e ordenado de vendas e movimentações de caixa
    para um PDV específico.
    """
    
    # 1. Busca as Vendas (já com o nome do operador)
    vendas = (
        db.query(
            models.Venda,
            models.Usuario.nome.label("operador_nome")
        )
        .join(models.Usuario, models.Venda.operador_id == models.Usuario.id)
        .filter(models.Venda.pdv_id == pdv_id, models.Venda.status == "concluida")
        .all()
    )

    # 2. Busca as Movimentações (já com o nome do operador)
    movimentacoes = (
        db.query(
            models.MovimentacaoCaixa,
            models.Usuario.nome.label("operador_nome")
        )
        .join(models.Usuario, models.MovimentacaoCaixa.operador_id == models.Usuario.id)
        .filter(models.MovimentacaoCaixa.pdv_id == pdv_id)
        .all()
    )

    # 3. Formata e Combina as listas
    combined_log = []

    for venda, operador_nome in vendas:
        combined_log.append({
            "id": f"venda-{venda.id}",
            "type": "venda", # O frontend já tem um 'eventDetail' para "venda"
            "date": venda.data_hora,
            "value": -venda.valor_total, # Vendas são sempre uma saída do caixa
            "user": operador_nome,
            "details": f"Venda ID: {venda.id}"
        })

    for mov, operador_nome in movimentacoes:
        combined_log.append({
            "id": f"mov-{mov.id}",
            "type": mov.tipo, # "abertura", "sangria", "suprimento", etc.
            "date": mov.data_hora,
            "value": mov.valor, # Sangria já é negativa, abertura/suprimento são positivos
            "user": operador_nome,
            "details": f"Movimentação de caixa: {mov.tipo}"
        })

    # 4. Ordena a lista final pela data, do mais recente para o mais antigo
    combined_log.sort(key=lambda x: x["date"], reverse=True)
    
    return combined_log