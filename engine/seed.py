import bcrypt # Mantenha a importação se ainda usar para o hash inicial
from datetime import date, datetime, timedelta
from random import choice, randint, uniform
from app.database import SessionLocal, engine
# Garanta que todos os modelos necessários estão importados
from app.models import (
    Base, Usuario, NotaFiscalEntrada, Fornecedor, Produto, Cliente, Pdv, 
    Venda, VendaItem, MovimentacaoCaixa, NotaFiscalSaida, TransacaoCrediario, # Inclui TransacaoCrediario
    ResumoDiarioEstoque, Configuracao # Inclui Configuracao se existir
) 
from app.utils.security import get_password_hash, verify_password

# --- 0. ÂNCORA DE DATA DINÂMICA ---
# Todas as datas serão baseadas no dia de HOJE
HOJE = date.today()
print(f"--- Usando {HOJE} como data de referência para o seed ---")


# --- 1. APAGA E RECRIA O BANCO DE DADOS ---
print("Recriando o banco de dados...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("Populando o banco de dados com dados de teste...")

    senha_hash_string = get_password_hash("1234")
    print("Hash gerado:", senha_hash_string)
    print("Verificação:", verify_password("1234", senha_hash_string))

    user_admin = Usuario(
        nome="Josiel Maicon", email="admin@empresa.com", funcao="admin", 
        senha_hash=senha_hash_string, status='ativo'
    )
    user_operador = Usuario(
        nome="Ana Paula", email="ana@empresa.com", funcao="operador", 
        senha_hash=senha_hash_string, status='ativo'
    )
    db.add_all([user_admin, user_operador])
    db.commit() 
    print("-> Usuários criados.")

    fornecedor_laticinios = Fornecedor(nome="Distribuidora Friobom", cnpj="11.222.333/0001-44")
    fornecedor_hortifruti = Fornecedor(nome="Fazenda Frescor", cnpj="44.555.666/0001-77")
    fornecedor_bebidas = Fornecedor(nome="Global Bebidas", cnpj="77.888.999/0001-00")
    db.add_all([fornecedor_laticinios, fornecedor_hortifruti, fornecedor_bebidas])
    db.commit()
    print("-> Fornecedores criados.")

    cliente1 = Cliente(
        nome="José da Silva", cpf="123.456.789-00", limite_credito=500.0, 
        saldo_devedor=350.50, status_conta="ativo", 
        dia_vencimento_fatura=10,
        senha_hash=senha_hash_string
    )
    cliente2 = Cliente(
        nome="Maria Oliveira", cpf="987.654.321-00", limite_credito=1000.0, 
        saldo_devedor=120.00, status_conta="ativo", 
        dia_vencimento_fatura=20,
        senha_hash=senha_hash_string 
    )
    db.add_all([cliente1, cliente2])
    db.commit()
    print("-> Clientes criados (com senha padrão '1234').")

    pdv1 = Pdv(nome="Caixa 01", status="aberto", operador_atual_id=user_operador.id) 
    pdv2 = Pdv(nome="Caixa 02", status="fechado")
    db.add_all([pdv1, pdv2])
    db.commit()
    print("-> PDVs criados.")

    produtos = [
        Produto(nome="Leite Integral 1L", codigo_barras="789001", quantidade_estoque=150, preco_custo=3.50, preco_venda=5.99, categoria="Laticínios", fornecedor_id=fornecedor_laticinios.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=HOJE + timedelta(days=30)),
        Produto(nome="Queijo Minas 500g", codigo_barras="789002", quantidade_estoque=40, preco_custo=18.50, preco_venda=25.99, categoria="Laticínios", fornecedor_id=fornecedor_laticinios.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=HOJE + timedelta(days=15)),
        Produto(nome="Tomate Kg", codigo_barras="789003", quantidade_estoque=50, preco_custo=4.50, preco_venda=7.99, categoria="Hortifruti", unidade_medida="KG", fornecedor_id=fornecedor_hortifruti.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id, vencimento=HOJE + timedelta(days=3)), # Vencimento próximo
        Produto(nome="Coca-Cola 2L", codigo_barras="789004", quantidade_estoque=200, preco_custo=7.00, preco_venda=9.50, categoria="Bebidas", fornecedor_id=fornecedor_bebidas.id, criado_por_id=user_admin.id, atualizado_por_id=user_admin.id),
    ]
    db.add_all(produtos)
    db.commit() 
    print("-> Produtos criados (com vencimentos dinâmicos).")

    print(f"-> Criando vendas para {HOJE - timedelta(days=2)}, {HOJE - timedelta(days=1)} e {HOJE}...")

    vendas_info = [
        (HOJE - timedelta(days=2), pdv1, cliente2, [(0, 1, 5.99), (3, 1, 9.50)], 'cartao_debito'),
        (HOJE - timedelta(days=2), pdv2, cliente1, [(1, 2, 25.99)], 'dinheiro'),
        (HOJE - timedelta(days=2), pdv1, cliente2, [(2, 3, 7.99)], 'pix'),
        (HOJE - timedelta(days=2), pdv2, cliente1, [(0, 1, 5.99), (2, 2, 7.99)], 'dinheiro'),
        (HOJE - timedelta(days=2), pdv1, cliente2, [(3, 1, 9.50)], 'cartao_credito'),

        (HOJE - timedelta(days=1), pdv2, cliente1, [(0, 1, 5.99)], 'dinheiro'),
        (HOJE - timedelta(days=1), pdv1, cliente2, [(1, 1, 25.99), (3, 2, 9.50)], 'pix'),
        (HOJE - timedelta(days=1), pdv2, cliente1, [(2, 2, 7.99)], 'dinheiro'),
        (HOJE - timedelta(days=1), pdv1, cliente2, [(0, 1, 5.99), (1, 1, 25.99)], 'cartao_debito'),
        (HOJE - timedelta(days=1), pdv2, cliente1, [(3, 1, 9.50)], 'dinheiro'),

        (HOJE, pdv1, cliente2, [(2, 1, 7.99), (3, 1, 9.50)], 'pix'),
        (HOJE, pdv2, cliente1, [(0, 2, 5.99)], 'dinheiro'),
        (HOJE, pdv1, cliente2, [(1, 1, 25.99)], 'cartao_credito'),
        (HOJE, pdv2, cliente1, [(2, 3, 7.99)], 'dinheiro'),
        (HOJE, pdv1, cliente2, [(3, 1, 9.50)], 'cartao_debito'),
        (HOJE, pdv2, cliente1, [(0, 1, 5.99), (1, 1, 25.99)], 'dinheiro'),
        (HOJE, pdv1, cliente2, [(2, 2, 7.99)], 'pix'),
        (HOJE, pdv2, cliente1, [(3, 1, 9.50)], 'dinheiro'),
        (HOJE, pdv1, cliente2, [(0, 1, 5.99), (2, 1, 7.99)], 'cartao_credito'),
        (HOJE, pdv2, cliente1, [(1, 1, 25.99)], 'dinheiro')
    ]

    status_fiscais_possiveis = ["Autorizada", "Rejeitada", "Pendente"] # Para NotaFiscalSaida.status_sefaz

    vendas_criadas = [] # Guarda as vendas para referência
    for dia_venda, pdv, cliente, itens, forma_pgto in vendas_info:
        # Usa o ID do operador correto
        operador_venda_id = user_operador.id if pdv.operador_atual_id == user_operador.id else user_admin.id 

        # Cria uma data/hora aleatória dentro do dia da venda
        hora_aleatoria = datetime.min.time().replace(hour=randint(10, 18), minute=randint(0, 59), second=randint(0, 59))
        data_hora_venda = datetime.combine(dia_venda, hora_aleatoria)
        
        # ✅ ADICIONA O CODIGO_VENDA (NOVO)
        timestamp_str = data_hora_venda.strftime("%Y%m%d%H%M%S")
        codigo_venda_str = f"VENDA_{timestamp_str}_{pdv.nome.upper().replace(' ', '')}"

        venda = Venda(
            codigo_venda=codigo_venda_str, # ✅ ADICIONADO
            valor_total=sum(q * p for p_idx, q, p in itens),
            status="concluida",
            status_fiscal="pendente",
            forma_pagamento=forma_pgto,
            pdv_id=pdv.id,
            operador_id=operador_venda_id,
            cliente_id=cliente.id,
            data_hora=data_hora_venda # ✅ USA A DATA/HORA DINÂMICA
        )
        db.add(venda)
        db.flush() # Garante que venda.id está disponível
        vendas_criadas.append(venda)

        # Itens da venda
        for produto_idx, quantidade, preco in itens:
            db.add(VendaItem(
                venda_id=venda.id,
                produto_id=produtos[produto_idx].id,
                quantidade=quantidade,
                preco_unitario_na_venda=preco
            ))
        
        # --- Adiciona a nota fiscal de saída ---
        status_sefaz = choice(status_fiscais_possiveis)
        
        if status_sefaz != "Pendente":
             if status_sefaz in ["Autorizada", "Rejeitada"]:
                 venda.status_fiscal = status_sefaz.lower() 
                 db.add(venda)

             nota_fiscal = NotaFiscalSaida(
                 venda_id=venda.id,
                 status_sefaz=status_sefaz,
                 data_emissao=venda.data_hora,
                 data_hora_autorizacao=venda.data_hora + timedelta(minutes=randint(5, 60)) if status_sefaz == "Autorizada" else None, 
                 chave_acesso=f"NFe{randint(10**43, (10**44)-1)}",
                 protocolo=f"Proto{randint(100000, 999999)}" if status_sefaz == "Autorizada" else None
             )
             db.add(nota_fiscal)

    # Commit VENDAS, ITENS e NOTAS FISCAIS DE SAÍDA
    db.commit() 
    print(f"-> {len(vendas_criadas)} Vendas (dinâmicas), Itens e NF-Saída criadas.")

    # Notas Fiscais de Entrada - Datas agora são dinâmicas (últimos 15 dias)
    notas_entrada_criadas = 0
    for fornecedor in [fornecedor_laticinios, fornecedor_hortifruti, fornecedor_bebidas]:
        for dias_atras in range(15): # Gera notas para os últimos 15 dias
            num_notas_dia = randint(0, 2)
            for _ in range(num_notas_dia):
                 numero_aleatorio = randint(1000, 9999)
                 chave_aleatoria = f"{randint(10**43, (10**44)-1)}"
                 data_emissao_nota = HOJE - timedelta(days=dias_atras) # ✅ DATA DINÂMICA

                 nota = NotaFiscalEntrada(
                     fornecedor_id=fornecedor.id,
                     numero_nota=f"{numero_aleatorio}-{dias_atras}",
                     chave_acesso=chave_aleatoria,
                     data_emissao=data_emissao_nota, # ✅ USA DATA DINÂMICA
                     valor_total=round(uniform(50.0, 500.0), 2)
                 )
                 db.add(nota)
                 notas_entrada_criadas += 1
    # Commit NOTAS FISCAIS DE ENTRADA
    db.commit()
    print(f"-> {notas_entrada_criadas} Notas Fiscais de Entrada (dinâmicas) criadas.")

    # Movimentações de Caixa (sem datas fixas, está OK)
    mov1 = MovimentacaoCaixa(tipo="abertura", valor=200.0, pdv_id=pdv1.id, operador_id=user_operador.id, autorizado_por_id=user_admin.id)
    mov2 = MovimentacaoCaixa(tipo="sangria", valor=500.0, pdv_id=pdv1.id, operador_id=user_operador.id, autorizado_por_id=user_admin.id)
    mov3 = MovimentacaoCaixa(tipo="suprimento", valor=100.0, pdv_id=pdv1.id, operador_id=user_admin.id, autorizado_por_id=user_admin.id)
    # Commit MOVIMENTAÇÕES
    db.commit()
    print("-> Movimentações de caixa criadas.")
    
    # Transações de Crediário (referencia vendas_criadas, então já está dinâmico)
    transacao1 = TransacaoCrediario(cliente_id=cliente1.id, tipo='compra', valor=vendas_criadas[1].valor_total, descricao="Ref Venda #2", venda_id=vendas_criadas[1].id)
    transacao2 = TransacaoCrediario(cliente_id=cliente1.id, tipo='pagamento', valor=100.0, descricao="Pagamento Parcial")
    transacao3 = TransacaoCrediario(cliente_id=cliente2.id, tipo='compra', valor=vendas_criadas[0].valor_total, descricao="Ref Venda #1", venda_id=vendas_criadas[0].id)
    db.add_all([transacao1, transacao2, transacao3])
    # Commit TRANSAÇÕES CREDIÁRIO
    db.commit()
    print("-> Transações de crediário criadas.")

    print("\nBanco de dados populado com sucesso!")

except Exception as e:
    print("\nERRO ao popular o banco de dados:")
    print(e)
    import traceback
    traceback.print_exc() # Imprime o traceback completo
    db.rollback() # Desfaz alterações parciais

finally:
    db.close()

# --- 4. SNAPSHOTS DE ESTOQUE (Já estava dinâmico, mantido) ---
db = SessionLocal() # Reabre a sessão para snapshots
try:
    print("\nGerando snapshots de estoque para os gráficos...")
    # Verifica se já existem snapshots para não duplicar
    if not db.query(ResumoDiarioEstoque).first():
        for i in range(7): # Gera para a última semana
            dia_atual = HOJE - timedelta(days=i)
            snapshot = ResumoDiarioEstoque(
                data = dia_atual,
                valor_total_estoque = round(uniform(18000.0, 25000.0), 2), 
                itens_estoque_baixo = randint(30, 50),
                itens_vencimento_proximo = randint(5, 15),
                itens_sem_giro = randint(20, 40)
            )
            db.add(snapshot)
        db.commit()
        print("-> Snapshots criados.")
    else:
         print("Snapshots já existem. Pulando criação.")

finally:
    db.close()