from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload,selectinload
from sqlalchemy import func, extract, exists
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


@router.get("/", response_model=List[schemas.PdvStatusDetalhado]) 
def get_all_pdvs(status: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Busca todos os PDVs com status detalhado, incluindo cálculos de faturamento
    do dia (ou desde a abertura), contagem de vendas e alertas pendentes.
    Pode ser filtrado por status.
    """
    today = date.today() # Usaremos 'today' como fallback se não houver abertura

    # ✅ MUDANÇA 2: Query mais poderosa para buscar relacionamentos
    query = db.query(models.Pdv).options(
        joinedload(models.Pdv.operador_atual),
        selectinload(models.Pdv.solicitacoes),      # Carrega TODAS
        selectinload(models.Pdv.vendas),               # Carrega TODAS
        selectinload(models.Pdv.movimentacoes_caixa) # Carrega TODAS
    )

    # Lógica de filtro do PDV (continua igual)
    if status and status != "todos":
        if status == "fechados":
            query = query.filter(models.Pdv.status != "aberto")
        else:
            query = query.filter(models.Pdv.status == status)
    
    pdvs_from_db = query.all()

    # ✅ MUDANÇA 3: A LÓGICA DE CÁLCULO (como na explicação anterior)
    lista_pdvs_detalhada = []
    for pdv in pdvs_from_db:
        
        # Encontra a ÚLTIMA abertura de caixa para ESTE PDV
        ultima_abertura_mov = db.query(models.MovimentacaoCaixa)\
            .filter(models.MovimentacaoCaixa.pdv_id == pdv.id, models.MovimentacaoCaixa.tipo == 'abertura')\
            .order_by(models.MovimentacaoCaixa.data_hora.desc())\
            .first()

        valor_abertura = 0.0
        hora_abertura_dt = None # Guardamos como datetime
        movimentacoes_periodo = []
        vendas_periodo = []
        
        # Define o período relevante: desde a última abertura OU apenas hoje
        if ultima_abertura_mov:
            valor_abertura = ultima_abertura_mov.valor
            hora_abertura_dt = ultima_abertura_mov.data_hora
            periodo_inicio = hora_abertura_dt
        else:
            # Se não houve abertura, consideramos o início do dia atual como referência
            periodo_inicio = datetime.combine(today, datetime.min.time())

        # Filtra movimentações e vendas DENTRO DO PERÍODO relevante
        movimentacoes_periodo = [
            m for m in pdv.movimentacoes_caixa 
            if m.data_hora >= periodo_inicio
        ]
        vendas_periodo = [
            v for v in pdv.vendas 
            if v.data_hora >= periodo_inicio and v.status == 'concluida' 
        ]

        # Calcula totais DENTRO DO PERÍODO
        suprimentos = sum(m.valor for m in movimentacoes_periodo if m.tipo == 'suprimento')
        sangrias = sum(m.valor for m in movimentacoes_periodo if m.tipo == 'sangria')
        
        # ❗ ATENÇÃO: Assume que 'forma_pagamento' existe no modelo Venda!
        entradas_dinheiro_vendas = sum(
            v.valor_total for v in vendas_periodo 
            if getattr(v, 'forma_pagamento', 'dinheiro') == 'dinheiro' # Usamos getattr para segurança
        )
        
        # CÁLCULO FINAL
        valor_em_caixa_calculado = valor_abertura + entradas_dinheiro_vendas + suprimentos - sangrias
        
        # Contagem de vendas no período
        total_vendas_periodo = len(vendas_periodo) 
        
        # Acha o primeiro alerta PENDENTE (se houver)
        alerta = next((s for s in pdv.solicitacoes if s.status == 'pendente'), None)

        # Monta o objeto final usando o schema rico
        pdv_detalhado = schemas.PdvStatusDetalhado(
            id=pdv.id,
            nome=pdv.nome,
            status=pdv.status,
            operador_atual=pdv.operador_atual,
            alerta_pendente=alerta,
            # Mostra o valor calculado APENAS se o caixa estiver aberto
            valor_em_caixa=valor_em_caixa_calculado if pdv.status == 'aberto' else 0.0, 
            total_vendas_dia=total_vendas_periodo, # Renomear schema ou variável se confuso
            hora_abertura=hora_abertura_dt # Passa o datetime da abertura
        )
        lista_pdvs_detalhada.append(pdv_detalhado)
            
    return lista_pdvs_detalhada


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

# ✅ NOVA ROTA: Verificar Vendas Ativas
@router.get("/{pdv_id}/has-active-sales", response_model=schemas.HasActiveSalesResponse)
def check_active_sales_for_pdv(pdv_id: int, db: Session = Depends(get_db)):
    """Verifica se um PDV específico possui vendas com status 'em_andamento'."""
    has_active = db.query(
        exists().where(
            (models.Venda.pdv_id == pdv_id) &
            (models.Venda.status == 'em_andamento')
        )
    ).scalar()
    
    return schemas.HasActiveSalesResponse(has_active_sales=has_active)


# ✅ NOVA ROTA: Abrir Caixa
@router.post("/{pdv_id}/open", response_model=schemas.PdvStatusDetalhado) # Retorna o status detalhado atualizado
def open_pdv(
    pdv_id: int,
    request: schemas.OpenPdvRequest,
    db: Session = Depends(get_db)
):
    """Abre um PDV, registrando a movimentação e o operador."""
    
    # Usar transação para garantir atomicidade
    with db.begin(): 
        db_pdv = db.query(models.Pdv).filter(models.Pdv.id == pdv_id).first()
        if not db_pdv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDV não encontrado")
            
        if db_pdv.status == 'aberto':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este PDV já está aberto.")
            
        # Verifica se o operador e o admin existem e estão ativos
        operador = db.query(models.Usuario).filter(models.Usuario.id == request.operador_id, models.Usuario.status == 'ativo').first()
        if not operador:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operador não encontrado ou inativo.")
            
        admin = db.query(models.Usuario).filter(models.Usuario.id == request.admin_id, models.Usuario.status == 'ativo').first()
        if not admin or admin.funcao not in ['admin', 'gerente']:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário autorizador inválido ou sem permissão.")

        # Cria a movimentação de abertura
        movimentacao = models.MovimentacaoCaixa(
            tipo='abertura',
            valor=request.valor_abertura,
            pdv_id=db_pdv.id,
            operador_id=request.operador_id, # Quem está operando
            autorizado_por_id=request.admin_id # Quem autorizou
        )
        db.add(movimentacao)
        
        # Atualiza o status e operador do PDV
        db_pdv.status = 'aberto'
        db_pdv.operador_atual_id = request.operador_id
        
        # O db.begin() cuida do commit/rollback
        
    # Recarrega o PDV com os relacionamentos necessários para a resposta
    # Usamos uma subquery para carregar os relacionamentos após a transação
    updated_pdv = db.query(models.Pdv).options(
        joinedload(models.Pdv.operador_atual),
        selectinload(models.Pdv.solicitacoes),
        selectinload(models.Pdv.vendas),
        selectinload(models.Pdv.movimentacoes_caixa)
    ).filter(models.Pdv.id == pdv_id).one() # Usamos .one() pois sabemos que ele existe

    # Reconstruir a resposta detalhada (lógica similar ao GET /)
    # (Poderíamos refatorar isso para uma função auxiliar no futuro)
    # ... (código para calcular valor_em_caixa, etc. APÓS a abertura) ...
    # Por simplicidade agora, vamos apenas retornar o PDV mapeado
    # O frontend fará o refetchData de qualquer forma
    
    # Mapeia diretamente para o schema base PdvStatus, o frontend fará refetch para detalhes
    # Nota: Precisamos carregar 'operador_atual' para isso funcionar
    db.refresh(updated_pdv, ["operador_atual"]) 
    return updated_pdv # Pydantic V2 com from_attributes=True deve mapear isso


# ✅ NOVA ROTA: Fechar Caixa
@router.post("/{pdv_id}/close", response_model=schemas.PdvStatusDetalhado)
def close_pdv(
    pdv_id: int,
    request: schemas.ClosePdvRequest,
    db: Session = Depends(get_db)
):
    """Fecha um PDV, verificando vendas ativas e registrando a movimentação."""
    
    with db.begin():
        db_pdv = db.query(models.Pdv).options(
            # Pré-carrega o operador atual, pois precisaremos do ID dele
            joinedload(models.Pdv.operador_atual) 
        ).filter(models.Pdv.id == pdv_id).first()
        
        if not db_pdv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDV não encontrado")
            
        if db_pdv.status != 'aberto':
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este PDV não está aberto.")
             
        # Verificação CRUCIAL no backend: Há vendas ativas?
        has_active = db.query(
            exists().where(
                (models.Venda.pdv_id == pdv_id) &
                (models.Venda.status == 'em_andamento')
            )
        ).scalar()
        if has_active:
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST, 
                 detail="Não é possível fechar o caixa. Existem vendas em andamento neste PDV."
             )
             
        # Verifica se o admin existe e tem permissão
        admin = db.query(models.Usuario).filter(models.Usuario.id == request.admin_id, models.Usuario.status == 'ativo').first()
        if not admin or admin.funcao not in ['admin', 'gerente']:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário autorizador inválido ou sem permissão.")

        # Pega o ID do operador que ESTAVA no caixa
        current_operador_id = db_pdv.operador_atual_id
        if not current_operador_id:
             # Isso não deveria acontecer se o status é 'aberto', mas é uma segurança extra
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Inconsistência: PDV aberto sem operador atual.")

        # Cria a movimentação de fechamento
        movimentacao = models.MovimentacaoCaixa(
            tipo='fechamento',
            valor=request.valor_fechamento,
            pdv_id=db_pdv.id,
            operador_id=current_operador_id, # Quem estava operando
            autorizado_por_id=request.admin_id # Quem autorizou
        )
        db.add(movimentacao)
        
        # Atualiza o status e remove o operador do PDV
        db_pdv.status = 'fechado'
        db_pdv.operador_atual_id = None
        
        # db.begin() cuida do commit/rollback

    # Recarrega o PDV
    updated_pdv = db.query(models.Pdv).filter(models.Pdv.id == pdv_id).one()
    # Mapeia diretamente, frontend fará refetch
    return updated_pdv

@router.get("/{pdv_id}/session", response_model=schemas.PdvStatusDetalhado) 
def get_pdv_session_details(pdv_id: int, db: Session = Depends(get_db)):
    """
    Busca os detalhes da sessão atual de um PDV.
    Usado pela interface de Ponto de Venda para inicializar.
    """
    
    # Busca o PDV com o operador_atual pré-carregado
    pdv = db.query(models.Pdv).options(
        joinedload(models.Pdv.operador_atual)
    ).filter(models.Pdv.id == pdv_id).first()

    if not pdv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDV não encontrado."
        )
        
    if pdv.status != 'aberto' or not pdv.operador_atual:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, # 403 Proibido
            detail=f"Caixa {pdv.nome} não está aberto ou nenhum operador está logado."
        )

    # Reutiliza a lógica de cálculo de valor_em_caixa da sua rota GET /
    # (Ou, idealmente, refatore essa lógica para uma função auxiliar)
    
    # --- Início da Lógica de Cálculo (copiada/adaptada da sua GET /) ---
    ultima_abertura = db.query(models.MovimentacaoCaixa)\
        .filter(models.MovimentacaoCaixa.pdv_id == pdv.id, models.MovimentacaoCaixa.tipo == 'abertura')\
        .order_by(models.MovimentacaoCaixa.data_hora.desc())\
        .first()

    valor_abertura = 0.0
    hora_abertura_dt = None
    movimentacoes_periodo = []
    vendas_periodo = []
    
    periodo_inicio = datetime.combine(date.today(), datetime.min.time()) # Padrão
    
    if ultima_abertura:
        valor_abertura = ultima_abertura.valor
        hora_abertura_dt = ultima_abertura.data_hora
        periodo_inicio = hora_abertura_dt # O período começa na abertura

    # Filtra transações desde o início do período
    movimentacoes_periodo = [m for m in pdv.movimentacoes_caixa if m.data_hora >= periodo_inicio]
    vendas_periodo = [v for v in pdv.vendas if v.data_hora >= periodo_inicio and v.status == 'concluida']

    suprimentos = sum(m.valor for m in movimentacoes_periodo if m.tipo == 'suprimento')
    sangrias = sum(m.valor for m in movimentacoes_periodo if m.tipo == 'sangria')
    
    entradas_dinheiro_vendas = sum(
        v.valor_total for v in vendas_periodo 
        if getattr(v, 'forma_pagamento', 'dinheiro') == 'dinheiro'
    )
    
    valor_em_caixa_calculado = valor_abertura + entradas_dinheiro_vendas + suprimentos - sangrias
    total_vendas_dia = len(vendas_periodo) 
    alerta = next((s for s in pdv.solicitacoes if s.status == 'pendente'), None)
    # --- Fim da Lógica de Cálculo ---

    # Retorna o schema "rico" que o PdvStatusDetalhado espera
    return schemas.PdvStatusDetalhado(
        id=pdv.id,
        nome=pdv.nome,
        status=pdv.status,
        operador_atual=pdv.operador_atual, # Objeto UsuarioBase
        alerta_pendente=alerta,
        valor_em_caixa=valor_em_caixa_calculado,
        total_vendas_dia=total_vendas_dia,
        hora_abertura=hora_abertura_dt
    )