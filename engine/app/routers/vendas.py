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

@router.post("/", response_model=schemas.Venda)
def create_venda(venda: schemas.VendaCreate, db: Session = Depends(get_db)):
    
    valor_total_calculado = 0
    
    # Inicia a criação da venda com status 'em_andamento'
    db_venda = models.Venda(
        operador_id=venda.operador_id,
        cliente_id=venda.cliente_id,
        pdv_id=venda.pdv_id,
        status="em_andamento" 
    )
    db.add(db_venda)
    db.commit()

    for item in venda.itens:
        db_produto = db.query(models.Produto).filter(models.Produto.id == item.produto_id).first()
        if not db_produto:
            raise HTTPException(status_code=404, detail=f"Produto com ID {item.produto_id} não encontrado")

        # Lógica de negócio: deduzir do estoque
        db_produto.quantidade_estoque -= item.quantidade

        # Cria o item da venda, ligando ao ID da venda
        db_venda_item = models.VendaItem(
            venda_id=db_venda.id,
            produto_id=item.produto_id,
            quantidade=item.quantidade,
            preco_unitario_na_venda=db_produto.preco_venda
        )
        db.add(db_venda_item)
        
        valor_total_calculado += item.quantidade * db_produto.preco_venda

    # Atualiza a venda com o valor total e muda o status para 'concluida'
    db_venda.valor_total = valor_total_calculado
    db_venda.status = "concluida"
    db.commit()
    db.refresh(db_venda)
    
    return db_venda

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

@router.post("/finalizar", response_model=schemas.PdvVendaResponse)
def finalizar_venda_pdv(
    request: schemas.PdvVendaRequest,
    db: Session = Depends(get_db)
):
    """
    Processa e finaliza uma nova venda vinda do Ponto de Venda (PDV).
    Esta operação é ATÔMICA: ou tudo funciona, ou nada é salvo.
    """
    
    valor_total_pago = sum(p.valor for p in request.pagamentos)
    valor_troco = max(0, valor_total_pago - request.total_calculado)

    # Inicia a transação atômica
    try:
        with db.begin():
            # 1. Cria a Venda principal
            db_venda = models.Venda(
                valor_total=request.total_calculado,
                status="concluida",
                status_fiscal="pendente", # Default para o fiscal processar depois
                pdv_id=request.pdv_db_id,
                operador_id=request.operador_db_id,
                cliente_id=request.cliente_db_id,
                data_hora=datetime.utcnow() 
                # (Assumindo uma forma de pagamento por venda, ou salvar pagamentos em outra tabela)
                # Para simplificar, vamos pegar o tipo do primeiro pagamento:
                ,forma_pagamento=request.pagamentos[0].tipo if request.pagamentos else "dinheiro"
            )
            db.add(db_venda)
            db.flush() # Força a Venda a ter um 'db_venda.id'

            # 2. Processa Itens e Estoque
            for item in request.itens:
                # Cria o VendaItem
                db_item_venda = models.VendaItem(
                    venda_id=db_venda.id,
                    produto_id=item.db_id,
                    quantidade=item.quantity,
                    preco_unitario_na_venda=item.unitPrice
                )
                db.add(db_item_venda)
                
                # Atualiza o estoque (com lock para segurança)
                db_produto = db.query(models.Produto).filter(
                    models.Produto.id == item.db_id
                ).with_for_update().first() # "with_for_update()" trava a linha no DB
                
                if not db_produto:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Produto ID {item.db_id} não encontrado durante a transação.")
                
                if db_produto.quantidade_estoque < item.quantity:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Estoque insuficiente para '{db_produto.nome}'.")
                    
                db_produto.quantidade_estoque -= item.quantity
                db.add(db_produto)

            # 3. Processa Pagamentos (Crediário, Dinheiro)
            for pagamento in request.pagamentos:
                if pagamento.tipo == 'crediario':
                    if not request.cliente_db_id:
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cliente não identificado para venda em crediário.")
                    
                    db_cliente = db.query(models.Cliente).filter(
                        models.Cliente.id == request.cliente_db_id
                    ).with_for_update().first()
                    
                    if not db_cliente:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente do crediário não encontrado.")
                        
                    # Verifica limite (a menos que esteja em modo confiança)
                    limite_disponivel = (db_cliente.limite_credito - db_cliente.saldo_devedor)
                    if not db_cliente.trust_mode and pagamento.valor > limite_disponivel:
                         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Limite de crédito (R$ {limite_disponivel:.2f}) insuficiente para {db_cliente.nome}.")
                    
                    # Atualiza saldo do cliente
                    db_cliente.saldo_devedor += pagamento.valor
                    db.add(db_cliente)
                    
                    # Cria a transação no extrato
                    db_transacao = models.TransacaoCrediario(
                        cliente_id=request.cliente_db_id,
                        tipo='compra',
                        valor=pagamento.valor,
                        descricao=f"Referente à Venda #{db_venda.id}",
                        venda_id=db_venda.id
                    )
                    db.add(db_transacao)
                
                if pagamento.tipo == 'dinheiro':
                    # Registra a entrada de caixa
                    db_mov = models.MovimentacaoCaixa(
                        tipo='suprimento', # Ou um novo tipo 'venda_dinheiro'
                        valor=pagamento.valor, # O valor recebido
                        pdv_id=request.pdv_db_id,
                        operador_id=request.operador_db_id
                    )
                    db.add(db_mov)
                    
                    # (Se o troco foi dado em dinheiro, precisamos registrar uma 'sangria' do troco)
                    if valor_troco > 0:
                        db_troco_mov = models.MovimentacaoCaixa(
                            tipo='sangria', # Troco é uma saída
                            valor=valor_troco, # Valor positivo, 'sangria' define a direção
                            descricao=f"Troco Venda #{db_venda.id}",
                            pdv_id=request.pdv_db_id,
                            operador_id=request.operador_db_id
                        )
                        db.add(db_troco_mov)

            # 4. Fim da transação: db.begin() faz o COMMIT aqui se tudo deu certo
            
            return schemas.PdvVendaResponse(
                venda_id=db_venda.id,
                mensagem=f"Venda #{db_venda.id} finalizada com sucesso!",
                troco=valor_troco
            )
            
    except HTTPException as e:
        # Se um erro HTTP (estoque, limite) foi levantado, repassa
        raise e
    except Exception as e:
        # Se qualquer outro erro de DB (ex: constraint) ocorrer, o db.begin()
        # fará o ROLLBACK automaticamente
        print(f"ERRO DE TRANSAÇÃO: {e}") # Logar o erro
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar a venda: {e}"
        )