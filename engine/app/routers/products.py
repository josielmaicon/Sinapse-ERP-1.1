# app/routers/products.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta, datetime
from .. import models, schemas
from sqlalchemy import and_
from ..database import get_db, engine
from ..services import xml_service
from ..models import NotaFiscalEntrada # Certifique-se de importar
from fastapi import UploadFile, File


models.Base.metadata.create_all(bind=engine)
router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)

@router.post("/", response_model=schemas.Produto)
def create_product(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    db_produto = models.Produto(**produto.dict())
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/", response_model=List[schemas.Produto])
def get_all_products(db: Session = Depends(get_db)):
    produtos = db.query(models.Produto).all()
    return produtos

@router.delete("/{produto_id}")
def delete_produto(produto_id: int, db: Session = Depends(get_db)):
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()

    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    item_vinculado = db.query(models.VendaItem).filter(models.VendaItem.produto_id == produto_id).first()
    if item_vinculado:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir este produto, pois ele já foi utilizado em uma venda."
        )

    db.delete(db_produto)
    db.commit()
    return {"ok": True, "message": "Produto excluído com sucesso"} 

@router.get("/barcode/{codigo_barras}", response_model=schemas.ProdutoComPromocao)
def get_produto_por_codigo_barras(codigo_barras: str, db: Session = Depends(get_db)):
    """
    Busca um produto, verifica promoções ativas e calcula o preço final.
    """
    now = datetime.utcnow()

    db_produto = db.query(models.Produto).options(
        joinedload(models.Produto.promocoes).contains_eager(models.Promocao)
    ).filter(
        models.Produto.codigo_barras == codigo_barras
    ).first()
    
    if not db_produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com código de barras '{codigo_barras}' não encontrado no estoque."
        )

    promocoes_validas = [
        p for p in db_produto.promocoes
        if p.data_inicio <= now and (p.data_fim is None or p.data_fim >= now)
    ]
    
    preco_final = db_produto.preco_venda
    melhor_promocao = None
    
    for promo in promocoes_validas:
        preco_promocional = db_produto.preco_venda
        
        if promo.tipo == 'percentual':
            preco_promocional = db_produto.preco_venda * (1 - promo.valor / 100.0)
        
        elif promo.tipo == 'preco_fixo':
            preco_promocional = promo.valor
            
        if preco_promocional < preco_final:
            preco_final = preco_promocional
            melhor_promocao = promo
            
    return schemas.ProdutoComPromocao(
        **db_produto.__dict__,
        preco_final=preco_final,
        promocao_ativa=melhor_promocao.nome if melhor_promocao else None
    )

@router.put("/{produto_id}", response_model=schemas.Produto)
def update_produto(produto_id: int, produto_update: schemas.ProdutoUpdate, db: Session = Depends(get_db)):
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if db_produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Pega os dados do update e converte para um dicionário
    update_data = produto_update.dict(exclude_unset=True)
    
    # Itera sobre os dados recebidos e atualiza o objeto do banco
    for key, value in update_data.items():
        setattr(db_produto, key, value)

    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/dashboard-stats/", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    seven_days_from_now = today + timedelta(days=7)

    low_stock_count = db.query(models.Produto).filter(
        models.Produto.quantidade_estoque <= models.Produto.estoque_minimo
    ).count()

    expired_count = db.query(models.Produto).filter(
        models.Produto.vencimento < today
    ).count()

    expiring_soon_count = db.query(models.Produto).filter(
        and_(
            models.Produto.vencimento >= today,
            models.Produto.vencimento <= seven_days_from_now
        )
    ).count()

    return schemas.DashboardStats(
        low_stock_count=low_stock_count,
        expired_count=expired_count,
        expiring_soon_count=expiring_soon_count
    )

@router.get("/stats-history", response_model=List[schemas.ResumoEstoqueDiario]) # Vamos criar esse schema
def get_stats_history(limit: int = 7, db: Session = Depends(get_db)):
    """
    Retorna o histórico de estatísticas do estoque dos últimos X dias.
    """
    history = (
        db.query(models.ResumoDiarioEstoque)
        .order_by(models.ResumoDiarioEstoque.data.desc())
        .limit(limit)
        .all()
    )
    # Retornamos a lista em ordem cronológica para o gráfico
    return list(reversed(history))

@router.get("/{produto_id}/historico", response_model=List[schemas.ProdutoMovimentacao])
def get_produto_historico(produto_id: int, db: Session = Depends(get_db)):
    """
    Retorna o histórico de movimentações (vendas) de um produto específico.
    """
    
    # Busca todos os itens de venda para este produto
    vendas_itens = (
        db.query(
            models.VendaItem,
            models.Usuario.nome.label("operador_nome"),
            models.Venda.id.label("venda_id_str")
        )
        .join(models.Venda, models.VendaItem.venda_id == models.Venda.id)
        .join(models.Usuario, models.Venda.operador_id == models.Usuario.id)
        .filter(models.VendaItem.produto_id == produto_id)
        .order_by(models.Venda.data_hora.desc())
        .all()
    )
    
    historico = []
    for item, operador, venda_id in vendas_itens:
        historico.append({
            "id": item.id,
            "data_hora": item.venda.data_hora,
            "tipo": "venda",
            "quantidade": -item.quantidade, # Venda é uma saída
            "usuario": operador,
            "nota": f"Venda #{venda_id}"
        })
    
    # No futuro, você pode adicionar 'entradas' e 'ajustes' aqui
    
    return historico

@router.get("/barcode/{codigo_barras}", response_model=schemas.Produto)
def get_produto_por_codigo_barras(codigo_barras: str, db: Session = Depends(get_db)):
    """
    Busca um único produto pelo seu 'codigo_barras'.
    Usado pelo Ponto de Venda (PDV) para adicionar itens ao carrinho.
    """
    db_produto = db.query(models.Produto).filter(
        models.Produto.codigo_barras == codigo_barras
    ).first()
    if not db_produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com código de barras '{codigo_barras}' não encontrado no estoque."
        )
    return db_produto


@router.post("/importar-xml", response_model=dict)
async def importar_xml_estoque(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Lê um XML, cadastra/atualiza produtos e registra a entrada fiscal.
    """
    contents = await file.read()
    
    # 1. Decodifica
    try:
        nfe_data = xml_service.parse_nfe_xml(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    header = nfe_data['header']
    itens = nfe_data['itens']
    
    # 2. Verifica se a nota já foi importada (pela chave de acesso)
    nota_existe = db.query(models.NotaFiscalEntrada).filter(
        models.NotaFiscalEntrada.chave_acesso == header['chave_acesso']
    ).first()
    
    if nota_existe:
        raise HTTPException(status_code=400, detail=f"Esta nota fiscal ({header['numero_nota']}) já foi importada anteriormente.")

    # 3. Processa Fornecedor (Busca ou Cria)
    # (Para simplificar, vamos focar nos produtos, mas num sistema real você cadastraria o fornecedor aqui também)
    # fornecedor = ...

    logs = []
    
    # 4. Inicia Transação
    try:
        with db.begin():
            # A. Registra a Nota de Entrada (Fiscal)
            # Precisamos converter a data ISO do XML para date/datetime Python
            # Exemplo simplificado:
            data_emissao_dt = datetime.fromisoformat(header['data_emissao'].split('+')[0]) # Remove fuso simples
            
            nova_nota = models.NotaFiscalEntrada(
                numero_nota=str(header['numero_nota']),
                serie=str(header['serie']),
                chave_acesso=header['chave_acesso'],
                data_emissao=data_emissao_dt.date(),
                valor_total=header['valor_total_nota'],
                # fornecedor_id=... (se tivermos a lógica de fornecedor)
            )
            db.add(nova_nota)

            # B. Processa Itens (Estoque)
            for item in itens:
                ean = item['codigo_barras']
                
                # Pula itens sem código de barras ou 'SEM GTIN' se quiser ser estrito
                if not ean or ean == "SEM GTIN":
                    logs.append(f"⚠️ Item '{item['nome']}' ignorado (Sem código de barras).")
                    continue

                # Busca produto existente
                produto = db.query(models.Produto).filter(models.Produto.codigo_barras == ean).first()
                
                if produto:
                    # --- ATUALIZAÇÃO ---
                    estoque_antigo = produto.quantidade_estoque
                    produto.quantidade_estoque += item['quantidade']
                    
                    # Atualiza preço de custo (Média ponderada ou último custo? Vamos de último custo)
                    produto.preco_custo = item['valor_unitario'] 
                    
                    db.add(produto)
                    logs.append(f"✅ Atualizado: {produto.nome} (+{item['quantidade']} un). Estoque: {estoque_antigo} -> {produto.quantidade_estoque}")
                else:
                    # --- CADASTRO NOVO ---
                    # Define um preço de venda sugerido (Ex: Margem de 100% sobre o custo)
                    preco_venda_sugerido = item['valor_unitario'] * 2.0 
                    
                    novo_produto = models.Produto(
                        nome=item['nome'][:100], # Limita caracteres
                        codigo_barras=ean,
                        quantidade_estoque=item['quantidade'],
                        preco_custo=item['valor_unitario'],
                        preco_venda=preco_venda_sugerido,
                        ncm=item['ncm'],
                        # unidade_medida=item['unidade'], (se tiver essa coluna)
                        # fornecedor_id=...
                    )
                    db.add(novo_produto)
                    logs.append(f"🆕 Cadastrado: {item['nome']} (Estoque: {item['quantidade']})")

        return {
            "status": "sucesso",
            "mensagem": "Importação concluída.",
            "nota": f"NFe {header['numero_nota']} - {header['emitente']['nome']}",
            "logs": logs
        }

    except Exception as e:
        print(f"Erro na transação de importação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados no banco: {str(e)}")
    
def _processar_entrada_nfe(nfe_data: dict, db: Session, origem: str):
    header = nfe_data['header']
    itens = nfe_data['itens']
    logs = []

    # 1. Verifica duplicidade
    nota_existe = db.query(models.NotaFiscalEntrada).filter(
        models.NotaFiscalEntrada.chave_acesso == header['chave_acesso']
    ).first()
    
    if nota_existe:
        raise HTTPException(status_code=400, detail=f"Nota {header['numero_nota']} já importada.")

    try:
        with db.begin():
            # A. Registra Nota
            # Tratamento de data seguro
            data_str = header['data_emissao']
            if isinstance(data_str, str):
                # Tenta formato ISO com fuso, senão data simples
                try:
                    dt = datetime.fromisoformat(data_str.split('+')[0])
                    data_emissao = dt.date()
                except:
                    data_emissao = datetime.utcnow().date()
            else:
                data_emissao = datetime.utcnow().date()

            nova_nota = models.NotaFiscalEntrada(
                numero_nota=str(header['numero_nota']),
                serie=str(header['serie']),
                chave_acesso=header['chave_acesso'],
                data_emissao=data_emissao,
                valor_total=header['valor_total_nota'],
                xml_conteudo=f"Importado via {origem}" # Log de origem
            )
            db.add(nova_nota)

            # B. Processa Itens
            for item in itens:
                ean = item['codigo_barras']
                
                if not ean or ean == "SEM GTIN":
                    logs.append(f"⚠️ '{item['nome']}' ignorado (Sem GTIN).")
                    continue

                produto = db.query(models.Produto).filter(models.Produto.codigo_barras == ean).first()
                
                if produto:
                    # Atualiza
                    qtd_antiga = produto.quantidade_estoque
                    produto.quantidade_estoque += item['quantidade']
                    produto.preco_custo = item['valor_unitario']
                    db.add(produto)
                    logs.append(f"✅ {produto.nome}: Estoque {qtd_antiga} -> {produto.quantidade_estoque}")
                else:
                    # Cadastra
                    novo_produto = models.Produto(
                        nome=item['nome'][:100],
                        codigo_barras=ean,
                        quantidade_estoque=item['quantidade'],
                        preco_custo=item['valor_unitario'],
                        preco_venda=item['valor_unitario'] * 1.8, # Margem padrão simulada
                        ncm=item['ncm'],
                        # fornecedor_id=...
                    )
                    db.add(novo_produto)
                    logs.append(f"🆕 Cadastrado: {item['nome']}")

        return {
            "status": "sucesso",
            "mensagem": f"Nota {header['numero_nota']} processada com sucesso via {origem}!",
            "logs": logs,
            "nota": f"NFe {header['numero_nota']} - {header['emitente']['nome']}"
        }

    except Exception as e:
        print(f"Erro processamento NFe: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados: {str(e)}")


# ✅ ROTA 1: IMPORTAR POR ARQUIVO (Mantida, mas limpa)
@router.post("/importar-xml", response_model=dict)
async def importar_xml_estoque(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    try:
        nfe_data = xml_service.parse_nfe_xml(contents)
        return _processar_entrada_nfe(nfe_data, db, "Upload Arquivo")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ✅ ROTA 2: IMPORTAR POR CHAVE (BIPAR) - A SUA IDÉIA
from pydantic import BaseModel
class ImportarChaveRequest(BaseModel):
    chave_acesso: str

@router.post("/importar-nfe-chave", response_model=dict)
def importar_nfe_por_chave(
    request: ImportarChaveRequest,
    db: Session = Depends(get_db)
):
    """
    Recebe a chave de 44 dígitos (bipada), baixa o XML da SEFAZ (Simulado)
    e dá entrada no estoque.
    """
    chave = request.chave_acesso.strip()
    
    if len(chave) != 44:
        raise HTTPException(status_code=400, detail="Chave de acesso inválida (deve ter 44 dígitos).")

    # --- SIMULAÇÃO DO DOWNLOAD DA SEFAZ ---
    # Na vida real, aqui usaríamos a lib 'pynfe' com o certificado A1 da empresa
    # para baixar o XML real. Como não temos certificado válido aqui,
    # vamos SIMULAR que a SEFAZ nos devolveu os dados da nota.
    
    print(f"📡 Conectando à SEFAZ para baixar chave: {chave}...")
    
    # Dados Simulados baseados na chave (para parecer real)
    # Uma chave tem o mês/ano e modelo. Vamos fingir dados.
    
    nfe_data_simulada = {
        "header": {
            "chave_acesso": chave,
            "numero_nota": int(chave[25:34]) if chave[25:34].isdigit() else 12345,
            "serie": "1",
            "data_emissao": datetime.utcnow().isoformat(),
            "emitente": {
                "cnpj": chave[6:20], # Pega o CNPJ da chave
                "nome": "FORNECEDOR DETECTADO PELA SEFAZ LTDA",
                "ie": "ISENTO"
            },
            "valor_total_nota": 1500.00
        },
        "itens": [
            # Simula 2 produtos que vieram nessa nota "baixada"
            {
                "codigo_fornecedor": "101",
                "codigo_barras": "7891000100103", # Exemplo de EAN
                "nome": "PRODUTO IMPORTADO DA SEFAZ A",
                "ncm": "10001000",
                "cfop": "5102",
                "unidade": "UN",
                "quantidade": 10.0,
                "valor_unitario": 50.00,
                "valor_total": 500.00
            },
             {
                "codigo_fornecedor": "102",
                "codigo_barras": "7891000100200", # Outro EAN
                "nome": "PRODUTO IMPORTADO DA SEFAZ B",
                "ncm": "20002000",
                "cfop": "5102",
                "unidade": "CX",
                "quantidade": 5.0,
                "valor_unitario": 200.00,
                "valor_total": 1000.00
            }
        ]
    }
    
    # Chama o mesmo motor de processamento
    return _processar_entrada_nfe(nfe_data_simulada, db, "Download SEFAZ")