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
from sqlalchemy.exc import IntegrityError

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


@router.post("/nfe/preview/arquivo", response_model=dict)
async def preview_nfe_por_arquivo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Lê o arquivo XML físico, faz o parse e retorna os dados estruturados
    para revisão, cruzando com produtos existentes.
    """
    contents = await file.read()
    
    try:
        # Usa o serviço para transformar XML em Dicionário Python
        nfe_data = xml_service.parse_nfe_xml(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Erro no XML: {str(e)}")
        
    # Enriquece os dados (verifica se produtos já existem)
    nfe_data_enriched = _enriquecer_dados_nfe(nfe_data, db)
    
    return { "data": nfe_data_enriched, "aviso": None }


@router.post("/nfe/preview/chave", response_model=dict) # <--- Retorna um dicionário (header + itens)
def preview_nfe_por_chave(
    request: schemas.ImportarChaveRequest, # <--- Aponta para o arquivo schemas
    db: Session = Depends(get_db)
):
    """
    Simula o download do XML da SEFAZ via chave de acesso.
    Retorna os dados estruturados para revisão.
    """
    chave = request.chave_acesso.strip()
    if len(chave) != 44:
        raise HTTPException(status_code=400, detail="A chave deve ter 44 dígitos numéricos.")

    # 1. Verifica se a nota JÁ FOI IMPORTADA (Apenas avisa, não bloqueia o preview)
    nota_existe = db.query(models.NotaFiscalEntrada).filter(
        models.NotaFiscalEntrada.chave_acesso == chave
    ).first()
    
    aviso = None
    if nota_existe:
        aviso = f"Atenção: Esta nota (Nº {nota_existe.numero_nota}) já consta no sistema como importada em {nota_existe.data_emissao}."

    # 2. SIMULAÇÃO DA SEFAZ (Dados Fictícios baseados na chave)
    # (Em produção, aqui entraria a lib 'pynfe' com certificado A1)
    print(f"📡 [SIMULAÇÃO] Baixando XML da SEFAZ para chave: {chave}...")
    
    # Cria dados randômicos consistentes
    nfe_data_simulada = {
        "header": {
            "chave_acesso": chave,
            "numero_nota": int(chave[25:34]) if chave[25:34].isdigit() else 12345,
            "serie": str(int(chave[22:25])) if chave[22:25].isdigit() else "1",
            "data_emissao": datetime.utcnow().isoformat(),
            "emitente": {
                "cnpj": chave[6:20], 
                "nome": "DISTRIBUIDORA SEFAZ ONLINE LTDA (SIMULADO)",
                "ie": "ISENTO"
            },
            "valor_total_nota": 0.0 # Será calculado abaixo
        },
        "itens": [
            {
                "codigo_fornecedor": "101",
                "codigo_barras": "7894900011517", # Coca-Cola (Provavelmente existe no seu seed)
                "nome": "REFRIG COCA COLA 2L (ORIGINAL)",
                "ncm": "22021000",
                "cfop": "5405",
                "unidade": "UN",
                "quantidade": 60.0,
                "valor_unitario": 7.50,
                "valor_total": 450.00
            },
             {
                "codigo_fornecedor": "202",
                "codigo_barras": "7891000100999", # EAN Novo
                "nome": "PRODUTO NOVO DA SEFAZ (TESTE)",
                "ncm": "10063021",
                "cfop": "5102",
                "unidade": "PCT",
                "quantidade": 20.0,
                "valor_unitario": 15.00,
                "valor_total": 300.00
            }
        ]
    }
    
    # Atualiza totais
    total = sum(item['valor_total'] for item in nfe_data_simulada['itens'])
    nfe_data_simulada['header']['valor_total_nota'] = total

    # Enriquece (cruza com banco de dados)
    nfe_data_enriched = _enriquecer_dados_nfe(nfe_data_simulada, db)

    return { "data": nfe_data_enriched, "aviso": aviso }

@router.post("/nfe/confirmar", response_model=dict)
def confirmar_entrada_nfe(
    dados_confirmados: dict, 
    db: Session = Depends(get_db)
):
    """
    Recebe o JSON final (após revisão do usuário) e salva tudo atomicamente.
    """
    header = dados_confirmados['header']
    itens = dados_confirmados['itens']
    logs = []
    
    try:
        with db.begin():
            # A. Salva a Nota Fiscal de Entrada
            # Tenta converter data ISO
            try:
                data_emissao = datetime.fromisoformat(header['data_emissao'].split('+')[0]).date()
            except:
                data_emissao = datetime.utcnow().date()

            nova_nota = models.NotaFiscalEntrada(
                numero_nota=str(header['numero_nota']),
                serie=str(header['serie']),
                chave_acesso=header['chave_acesso'],
                data_emissao=data_emissao,
                valor_total=header['valor_total_nota'],
                xml_conteudo="Importação via Sistema"
            )
            db.add(nova_nota)

            # B. Processa cada produto (Atualiza ou Cria)
            for item in itens:
                ean = item['codigo_barras']
                
                # Tenta buscar pelo ID se o front mandou (mais seguro)
                produto = None
                if item.get('produto_existente_id'):
                    produto = db.query(models.Produto).get(item['produto_existente_id'])
                
                # Se não achou pelo ID, tenta pelo EAN (caso seja novo cadastro que coincide)
                if not produto and ean and ean != "SEM GTIN":
                    produto = db.query(models.Produto).filter(models.Produto.codigo_barras == ean).first()
                
                if produto:
                    # --- ATUALIZAR ---
                    qtd_antiga = produto.quantidade_estoque
                    produto.quantidade_estoque += item['quantidade']
                    produto.preco_custo = item['valor_unitario']
                    
                    # Opcional: Atualizar nome/preço venda se o usuário editou na tabela
                    if item.get('nome_sistema'):
                        produto.nome = item['nome_sistema']
                    if item.get('preco_venda_atual'):
                        produto.preco_venda = item['preco_venda_atual']
                        
                    db.add(produto)
                    logs.append(f"✅ Atualizado: {produto.nome} (Estoque: {qtd_antiga} -> {produto.quantidade_estoque})")
                else:
                    # --- CRIAR NOVO ---
                    novo_prod = models.Produto(
                        nome=item.get('nome_sistema', item['nome']), # Usa o nome editado ou original
                        codigo_barras=ean or "SEM GTIN",
                        quantidade_estoque=item['quantidade'],
                        preco_custo=item['valor_unitario'],
                        preco_venda=item.get('preco_venda_atual', item['valor_unitario'] * 1.5),
                        ncm=item['ncm'],
                        # Defina valores padrão para campos obrigatórios que não vêm na nota
                        categoria="Geral" 
                    )
                    db.add(novo_prod)
                    logs.append(f"🆕 Cadastrado: {novo_prod.nome}")

        return {
            "status": "sucesso",
            "mensagem": "Entrada de mercadoria processada com sucesso!",
            "logs": logs
        }

    except IntegrityError:
        print("Tentativa de duplicidade barrada pelo Banco de Dados.")
        raise HTTPException(
            status_code=400, 
            # Usamos a mesma frase chave "já foi importada" para o frontend ativar o toast amarelo
            detail=f"Erro de Integridade: Esta nota fiscal já foi importada e consta no banco de dados."
        )

    except Exception as e:
        print(f"Erro ao confirmar NFe: {e}")
        raise HTTPException(status_code=500, detail=f"Erro técnico ao salvar: {str(e)}")

def _enriquecer_dados_nfe(nfe_data: dict, db: Session):
    """
    Percorre os itens da nota e verifica se já existem no banco.
    Adiciona campos 'produto_existente_id', 'nome_sistema', etc.
    """
    for item in nfe_data['itens']:
        ean = item.get('codigo_barras')
        
        produto = None
        if ean and ean != "SEM GTIN":
             produto = db.query(models.Produto).filter(models.Produto.codigo_barras == ean).first()
        
        if produto:
            # Encontrou! Prepara para mesclar
            item['produto_existente_id'] = produto.id
            item['nome_sistema'] = produto.nome # Usa o nome do nosso sistema (geralmente mais limpo)
            item['estoque_atual'] = produto.quantidade_estoque
            item['preco_venda_atual'] = produto.preco_venda
            item['status_match'] = 'existente'
        else:
            # Não encontrou. Prepara para criar
            item['produto_existente_id'] = None
            item['nome_sistema'] = item['nome'] # Usa o nome da nota como sugestão
            item['estoque_atual'] = 0
            # Sugere preço de venda (Ex: Margem 80%)
            item['preco_venda_atual'] = round(item['valor_unitario'] * 1.8, 2)
            item['status_match'] = 'novo'
            
    return nfe_data