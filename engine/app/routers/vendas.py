# app/routers/vendas.py
from typing import List, Dict
from datetime import date
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from datetime import datetime

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    return db.query(models.Venda).all()

@router.get("/resumo-diario-dinamico", response_model=List[schemas.ResumoDiario])
def get_resumo_diario_dinamico(db: Session = Depends(get_db)):
    """
    Retorna o faturamento agrupado por dia e por PDV.
    Esta é uma rota flexível que funciona com qualquer número de PDVs.
    """
    # 1. A consulta no banco de dados agora é mais simples:
    # Agrupamos por data E por pdv.
    resultado_query = (
        db.query(
            func.date(models.Venda.data_hora).label("sale_date"),
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("daily_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(models.Venda.status == "concluida")
        .group_by("sale_date", "pdv_id", "pdv_name")
        .order_by("sale_date")
        .all()
    )

    # 2. A lógica de transformação em Python:
    # Agrupamos os resultados por data em um dicionário.
    dados_agrupados: Dict[date, schemas.ResumoDiario] = {}
    for row in resultado_query:
        if row.sale_date not in dados_agrupados:
            dados_agrupados[row.sale_date] = schemas.ResumoDiario(
                date=row.sale_date,
                faturamento_total_dia=0,
                faturamento_por_pdv=[]
            )
        
        # Adiciona o faturamento do PDV específico
        dados_agrupados[row.sale_date].faturamento_por_pdv.append(
            schemas.FaturamentoPorPdv(pdv_id=row.pdv_id, pdv_nome=row.pdv_name, total=row.daily_total)
        )
        # Soma para o total do dia
        dados_agrupados[row.sale_date].faturamento_total_dia += row.daily_total
            
    # 3. Retorna a lista de valores do dicionário.
    return list(dados_agrupados.values())

@router.get("/top-produtos", response_model=List[schemas.ProdutoMaisVendido])
def get_top_produtos(limit: int = 5, db: Session = Depends(get_db)):
    """
    Calcula e retorna os produtos mais vendidos por valor total.
    """
    # Esta consulta agrupa os itens de venda por produto,
    # soma o valor total de cada um, ordena do maior para o menor
    # e pega os 'limit' primeiros.
    top_produtos = (
        db.query(
            models.Produto.nome.label("name"),
            func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda).label("totalSales")
        )
        .join(models.Produto, models.VendaItem.produto_id == models.Produto.id)
        .group_by(models.Produto.id)
        .order_by(func.sum(models.VendaItem.quantidade * models.VendaItem.preco_unitario_na_venda).desc())
        .limit(limit)
        .all()
    )
    
    if not top_produtos:
        return []
        
    return top_produtos

@router.get("/resumo-hoje-por-hora", response_model=List[schemas.ResumoPorHora])
def get_resumo_hoje_por_hora(db: Session = Depends(get_db)):
    """
    Retorna o faturamento de HOJE, agrupado por hora e por PDV.
    Usa a função 'strftime' do SQLite para extrair a hora da data/hora.
    """
    today = date.today()
    
    # 1. A consulta agrupa por hora E por pdv_id
    resultado_query = (
        db.query(
            func.strftime('%H:00', models.Venda.data_hora).label("sale_hour"),
            models.Pdv.id.label("pdv_id"),
            models.Pdv.nome.label("pdv_name"),
            func.sum(models.Venda.valor_total).label("hourly_total"),
        )
        .join(models.Pdv, models.Venda.pdv_id == models.Pdv.id)
        .filter(
            models.Venda.status == "concluida",
            func.date(models.Venda.data_hora) == today # Filtra apenas por HOJE
        )
        .group_by("sale_hour", "pdv_id", "pdv_name")
        .order_by("sale_hour")
        .all()
    )

    # 2. A lógica de transformação em Python (pivotação)
    dados_agrupados: Dict[str, schemas.ResumoPorHora] = {}
    for row in resultado_query:
        if row.sale_hour not in dados_agrupados:
            dados_agrupados[row.sale_hour] = schemas.ResumoPorHora(
                hour=row.sale_hour,
                faturamento_total_hora=0,
                faturamento_por_pdv=[]
            )
        
        dados_agrupados[row.sale_hour].faturamento_por_pdv.append(
            schemas.FaturamentoPorPdvHora(pdv_id=row.pdv_id, pdv_nome=row.pdv_name, total=row.hourly_total)
        )
        dados_agrupados[row.sale_hour].faturamento_total_hora += row.hourly_total
            
    return list(dados_agrupados.values())

@router.get("/", response_model=List[schemas.Venda])
def get_all_vendas(db: Session = Depends(get_db)):
    vendas = db.query(models.Venda).options(
        joinedload(models.Venda.nota_fiscal_saida)
    ).order_by(models.Venda.data_hora.desc()).all()
    
    # Debug: imprime no terminal
    for venda in vendas:
        print("Venda ID:", venda.id, "Nota:", venda.nota_fiscal_saida)
    
    return vendas

@router.post("/iniciar", response_model=schemas.Venda)
def iniciar_venda(request: schemas.IniciarVendaRequest, db: Session = Depends(get_db)):
    pdv = db.query(models.PDV).filter(models.PDV.id == request.pdv_id).first()
    if not pdv:
        raise HTTPException(status_code=404, detail="PDV não encontrado")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    codigo_venda = f"VENDA_{timestamp}_{pdv.nome.upper()}"

    venda = models.Venda(
        pdv_id=request.pdv_id,
        operador_id=request.operador_id,
        status="em_andamento",
        codigo_venda=codigo_venda
    )
    db.add(venda)
    db.commit()
    db.refresh(venda)
    return venda


@router.post("/{venda_id}/adicionar-item", response_model=schemas.Venda)
def adicionar_item_venda(venda_id: int, item: schemas.VendaItemCreate, db: Session = Depends(get_db)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda or venda.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Venda não encontrada ou já finalizada.")
    
    produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    
    # Cria o item
    venda_item = models.VendaItem(
        venda_id=venda.id,
        produto_id=item.produto_id,
        quantidade=item.quantidade,
        preco_unitario_na_venda=produto.preco_venda
    )
    db.add(venda_item)

    # Atualiza o total acumulado
    venda.valor_total += item.quantidade * produto.preco_venda
    db.commit()
    db.refresh(venda)
    return venda

@router.post("/{venda_id}/finalizar", response_model=schemas.Venda)
def finalizar_venda_existente(venda_id: int, pagamento: schemas.FinalizarVendaRequest, db: Session = Depends(get_db)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda or venda.status != "em_andamento":
        raise HTTPException(status_code=400, detail="Venda não encontrada ou já concluída.")

    venda.status = "concluida"
    venda.forma_pagamento = pagamento.forma_pagamento
    db.commit()
    db.refresh(venda)
    return venda
