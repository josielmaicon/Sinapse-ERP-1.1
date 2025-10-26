import bcrypt
from datetime import date, datetime, timedelta
from random import choice, randint, uniform
from app.database import SessionLocal, engine
from app.models import Base, Usuario, NotaFiscalEntrada, Fornecedor, Produto, Cliente, Pdv, Venda, VendaItem, MovimentacaoCaixa, NotaFiscalSaida
from app.models import ResumoDiarioEstoque

# --- 1. APAGA E RECRIA O BANCO DE DADOS ---
print("Recriando o banco de dados...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("Populando o banco de dados com dados de teste...")

    # --- 2. CRIANDO ENTIDADES INDEPENDENTES ---

    # Usuários
    senha_padrao = "1234".encode('utf-8')
    senha_hash_padrao = bcrypt.hashpw(senha_padrao, bcrypt.gensalt())
    
    user_admin = Usuario(nome="Josiel Maicon", email="admin@empresa.com", funcao="admin", senha_hash=senha_hash_padrao)
    user_operador = Usuario(nome="Ana Paula", email="ana@empresa.com", funcao="operador", senha_hash=senha_hash_padrao)
    db.add_all([user_admin, user_operador])
    db.commit()
    print("-> Usuários criados.")

    # Fornecedores
    fornecedor_laticinios = Fornecedor(nome="Distribuidora Friobom", cnpj="11.222.333/0001-44")
    fornecedor_hortifruti = Fornecedor(nome="Fazenda Frescor", cnpj="44.555.666/0001-77")
    fornecedor_bebidas = Fornecedor(nome="Global Bebidas", cnpj="77.888.999/0001-00")
    db.add_all([fornecedor_laticinios, fornecedor_hortifruti, fornecedor_bebidas])
    db.commit()
    print("-> Fornecedores criados.")

    # Clientes de Crediário
    cliente1 = Cliente(nome="José da Silva", cpf="123.456.789-00", limite_credito=500.0, saldo_devedor=350.50, status_conta="Atrasado")
    cliente2 = Cliente(nome="Maria Oliveira", cpf="987.654.321-00", limite_credito=1000.0, saldo_devedor=120.00, status_conta="Em Dia")
    db.add_all([cliente1, cliente2])
    db.commit()
    print("-> Clientes criados.")

    # PDVs (Caixas)
    pdv1 = Pdv(nome="Caixa 01", status="aberto", operador_atual_id=user_operador.id)
    pdv2 = Pdv(nome="Caixa 02", status="fechado")
    db.add_all([pdv1, pdv2])
    db.commit()
    print("-> PDVs criados.")

    # --- 3. CRIANDO ENTIDADES DEPENDENTES ---

    # Produtos
    produtos = [
        Produto(nome="Leite Integral 1L", codigo_barras="789001", quantidade_estoque=150, preco_custo=3.50, preco_venda=5.99, categoria="Laticínios", fornecedor_id=fornecedor_laticinios.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=date(2025, 11, 20)),
        Produto(nome="Queijo Minas 500g", codigo_barras="789002", quantidade_estoque=40, preco_custo=18.50, preco_venda=25.99, categoria="Laticínios", fornecedor_id=fornecedor_laticinios.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=date(2025, 11, 5)),
        Produto(nome="Tomate Kg", codigo_barras="789003", quantidade_estoque=50, preco_custo=4.50, preco_venda=7.99, categoria="Hortifruti", unidade_medida="KG", fornecedor_id=fornecedor_hortifruti.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=date(2025, 10, 28)),
        Produto(nome="Coca-Cola 2L", codigo_barras="789004", quantidade_estoque=200, preco_custo=7.00, preco_venda=9.50, categoria="Bebidas", fornecedor_id=fornecedor_bebidas.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id),
    ]
    db.add_all(produtos)
    db.commit()
    print("-> Produtos criados.")

    print("-> Criando vendas para 20, 21 e 22/10/2025...")

    vendas_info = [
        (20, pdv1, cliente2, [(produtos[0], 1, 5.99), (produtos[3], 1, 9.50)]),
        (20, pdv2, cliente1, [(produtos[1], 2, 25.99)]),
        (20, pdv1, cliente2, [(produtos[2], 3, 7.99)]),
        (20, pdv2, cliente1, [(produtos[0], 1, 5.99), (produtos[2], 2, 7.99)]),
        (20, pdv1, cliente2, [(produtos[3], 1, 9.50)]),

        (21, pdv2, cliente1, [(produtos[0], 1, 5.99)]),
        (21, pdv1, cliente2, [(produtos[1], 1, 25.99), (produtos[3], 2, 9.50)]),
        (21, pdv2, cliente1, [(produtos[2], 2, 7.99)]),
        (21, pdv1, cliente2, [(produtos[0], 1, 5.99), (produtos[1], 1, 25.99)]),
        (21, pdv2, cliente1, [(produtos[3], 1, 9.50)]),

        (22, pdv1, cliente2, [(produtos[2], 1, 7.99), (produtos[3], 1, 9.50)]),
        (22, pdv2, cliente1, [(produtos[0], 2, 5.99)]),
        (22, pdv1, cliente2, [(produtos[1], 1, 25.99)]),
        (22, pdv2, cliente1, [(produtos[2], 3, 7.99)]),
        (22, pdv1, cliente2, [(produtos[3], 1, 9.50)]),
        (22, pdv2, cliente1, [(produtos[0], 1, 5.99), (produtos[1], 1, 25.99)]),
        (22, pdv1, cliente2, [(produtos[2], 2, 7.99)]),
        (22, pdv2, cliente1, [(produtos[3], 1, 9.50)]),
        (22, pdv1, cliente2, [(produtos[0], 1, 5.99), (produtos[2], 1, 7.99)]),
        (22, pdv2, cliente1, [(produtos[1], 1, 25.99)])
    ]

    status_possiveis = ["Autorizada", "Rejeitada", "Pendente"]

    for dia, pdv, cliente, itens in vendas_info:
        venda = Venda(
            valor_total=sum(q * p for p_obj, q, p in itens),
            status="concluida",
            status_fiscal="pendente",
            pdv_id=pdv.id,
            operador_id=user_operador.id,
            cliente_id=cliente.id,
            data_hora=datetime(2025, 10, dia, 10, 0)
        )
        db.add(venda)
        db.commit()

        # Itens da venda
        for produto_obj, quantidade, preco in itens:
            db.add(VendaItem(
                venda_id=venda.id,
                produto_id=produto_obj.id,
                quantidade=quantidade,
                preco_unitario_na_venda=preco
            ))
        db.commit()

        # --- Adiciona a nota fiscal de saída ---
        status = choice(status_possiveis)
        nota_fiscal = NotaFiscalSaida(
            venda_id=venda.id,
            status_sefaz=status,
            data_emissao=venda.data_hora,
            data_hora_autorizacao=venda.data_hora + timedelta(minutes=randint(5, 120)),  # autorização até 2h depois da venda
            chave_acesso=f"NF{randint(100000,999999)}{venda.id}",
        )
        db.add(nota_fiscal)
        db.commit()

        for fornecedor in [fornecedor_laticinios, fornecedor_hortifruti, fornecedor_bebidas]:
            for dia in [20, 21, 22]:
                nota = NotaFiscalEntrada(
                    fornecedor_id=fornecedor.id,
                    data_emissao=datetime(2025, 10, dia),
                    valor_total=randint(50, 200)  # valor aleatório de compra
                )
                db.add(nota)
        db.commit()

    print("-> Vendas e notas fiscais criadas com sucesso.")

    # Movimentações de Caixa
    mov1 = MovimentacaoCaixa(tipo="abertura", valor=200.0, pdv_id=pdv1.id, operador_id=user_operador.id)
    mov2 = MovimentacaoCaixa(tipo="sangria", valor=-1000.0, pdv_id=pdv1.id, operador_id=user_admin.id)
    db.add_all([mov1, mov2])
    db.commit()
    print("-> Movimentações de caixa criadas.")

    print("\nBanco de dados populado com sucesso!")

finally:
    db.close()

try:
    print("Gerando snapshots de estoque para os gráficos...")
    
    # Cria dados de exemplo para os últimos 7 dias
    for i in range(7):
        dia_atual = date.today() - timedelta(days=i)
        snapshot = ResumoDiarioEstoque(
            data = dia_atual,
            valor_total_estoque = 21183.25 + (i * 1000) - (i*i*50), # Lógica de exemplo
            itens_estoque_baixo = 40 + i,
            itens_vencimento_proximo = 10 + i,
            itens_sem_giro = 30 - i
        )
        db.add(snapshot)
    
    db.commit()
    print("-> Snapshots criados.")

finally:
    db.close()