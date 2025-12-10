import bcrypt
from datetime import date, datetime, timedelta
from random import choice, randint, uniform
import random
from app.database import SessionLocal, engine
# Garanta que todos os modelos necessários estão importados
from app.models import (
    Base, Usuario, NotaFiscalEntrada, Fornecedor, Produto, Cliente, Pdv, 
    Venda, VendaItem, MovimentacaoCaixa, Empresa, NotaFiscalSaida, TransacaoCrediario,
    ResumoDiarioEstoque, Configuracao 
) 
from app.utils.security import get_password_hash, verify_password

# --- 0. ÂNCORA DE DATA DINÂMICA ---
HOJE = date.today()
print(f"--- Usando {HOJE} como data de referência para o seed ---")


# --- 1. APAGA E RECRIA O BANCO DE DADOS ---
print("Recriando o banco de dados...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("Populando o banco de dados com dados de teste...")

    empresa = db.query(Empresa).filter(Empresa.id == 1).first()
    if not empresa:
        empresa = Empresa(
            id=1,
            nome_fantasia="Minha Loja Mestre",
            razao_social="Loja do Mestre LTDA",
            cnpj="12.345.678/0001-99",
            cor_destaque="#3b82f6",
            # Fiscal
            regime_tributario="simples",
            ambiente_sefaz="homologacao",
            # Operacional
            permitir_estoque_negativo=False,
            # Financeiro
            pix_chave_padrao="12.345.678/0001-99",
            pix_tipo_chave="cnpj"
        )
        db.add(empresa)
        db.commit() # <--- COMMIT OBRIGATÓRIO AQUI PARA O ID 1 EXISTIR
        print("-> Configurações da Empresa criadas (ID 1).")

    # --- SENHAS ---
    senha_padrao_hash = get_password_hash("1234") # Para usuários comuns
    senha_mestre_hash = get_password_hash("SinapseMaster") # Senha EXCLUSIVA do suporte

    print("Hash padrão gerado.")

    # --- CRIAÇÃO DOS USUÁRIOS ---
    user_admin = Usuario(
        nome="Josiel Maicon", email="admin@empresa.com", funcao="admin", 
        senha_hash=senha_padrao_hash, status='ativo'
    )
    user_operador = Usuario(
        nome="Ana Paula", email="ana@empresa.com", funcao="operador", 
        senha_hash=senha_padrao_hash, status='ativo'
    )
    
    # 👑 O USUÁRIO MESTRE (Oculto)
    user_mestre = Usuario(
        nome="Suporte Remoto Sinapse", 
        email="suporte@sinapse.interno", 
        funcao="suporte_mestre", # <--- A flag que o esconde nas listagens
        senha_hash=senha_mestre_hash, 
        status='ativo'
    )

    db.add_all([user_admin, user_operador, user_mestre])
    db.commit() 
    print("-> Usuários criados:")
    print("   1. Admin (admin@empresa.com / 1234)")
    print("   2. Operador (ana@empresa.com / 1234)")
    print("   3. Mestre (suporte@sinapse.interno / SinapseMaster) [OCULTO]")

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
        senha_hash=senha_padrao_hash
    )
    cliente2 = Cliente(
        nome="Maria Oliveira", cpf="987.654.321-00", limite_credito=1000.0, 
        saldo_devedor=120.00, status_conta="ativo", 
        dia_vencimento_fatura=20,
        senha_hash=senha_padrao_hash 
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

    status_fiscais_possiveis = ["Autorizada", "Rejeitada", "Pendente"] 

    print("-> Criando histórico de vendas e notas...")

    vendas_criadas = [] 
    
    # Opções de status para as notas que existem
    status_possiveis = ["Autorizada", "Autorizada", "Autorizada", "Rejeitada", "Pendente"]

    for dia_venda, pdv, cliente, itens, forma_pgto in vendas_info:
        operador_venda_id = user_operador.id if pdv.operador_atual_id == user_operador.id else user_admin.id 

        hora_aleatoria = datetime.min.time().replace(hour=randint(10, 18), minute=randint(0, 59), second=randint(0, 59))
        data_hora_venda = datetime.combine(dia_venda, hora_aleatoria)
        
        timestamp_str = data_hora_venda.strftime("%Y%m%d%H%M%S")
        codigo_venda_str = f"VENDA_{timestamp_str}_{pdv.id}_{randint(100,999)}"

        # 1. Cria a VENDA
        venda = Venda(
            codigo_venda=codigo_venda_str,
            valor_total=sum(q * p for p_idx, q, p in itens),
            status="concluida",
            forma_pagamento=forma_pgto,
            pdv_id=pdv.id,
            operador_id=operador_venda_id,
            cliente_id=cliente.id,
            data_hora=data_hora_venda 
        )
        db.add(venda)
        db.flush() 
        vendas_criadas.append(venda)

        # 2. Cria os ITENS
        for produto_idx, quantidade, preco in itens:
            db.add(VendaItem(
                venda_id=venda.id,
                produto_id=produtos[produto_idx].id,
                quantidade=quantidade,
                preco_unitario_na_venda=preco
            ))
        
        # 3. DECISÃO DE MESTRE: Esta venda terá nota?
        tem_nota = random.random() > 0.2 

        if tem_nota:
             status_sefaz = choice(status_possiveis)
             
             chave = f"35{randint(10,99)}00000000000000{randint(1000000000,9999999999)}"
             
             if status_sefaz == "Autorizada":
                 data_auto = venda.data_hora + timedelta(seconds=randint(5, 120))
                 protocolo = f"1352300{randint(100000, 999999)}"
                 xmotivo = "Autorizado o uso da NF-e"
                 cstat = "100"
             elif status_sefaz == "Rejeitada":
                 data_auto = None
                 protocolo = None
                 xmotivo = "Rejeição: Erro na validação dos dados do destinatário"
                 cstat = "703"
             else: # Pendente
                 data_auto = None
                 protocolo = None
                 xmotivo = "Nota gerada, aguardando transmissão"
                 cstat = None

             nota_fiscal = NotaFiscalSaida(
                 venda_id=venda.id,
                 empresa_id=1, 
                 numero=venda.id, 
                 serie=1,
                 status_sefaz=status_sefaz, 
                 data_emissao=venda.data_hora,
                 data_hora_autorizacao=data_auto,
                 chave_acesso=chave,
                 protocolo=protocolo,
                 xmotivo=xmotivo,
                 cstat=cstat
             )
             db.add(nota_fiscal)

    print("-> Criando Notas Fiscais de Entrada...")
    
    notas_entrada = []
    fornecedores = [fornecedor_laticinios, fornecedor_hortifruti, fornecedor_bebidas]
    
    # Gera compras nos últimos 30 dias
    for dias_atras in range(30): 
        data_nota = datetime.utcnow() - timedelta(days=dias_atras)
        num_compras = randint(1, 3)
        
        for _ in range(num_compras):
            fornecedor = choice(fornecedores)
            valor = round(uniform(150.0, 1500.0), 2)
            chave = f"{randint(10**43, (10**44)-1)}"
            numero = randint(1000, 99999)

            nota_entrada = NotaFiscalEntrada(
                fornecedor_id=fornecedor.id,
                numero_nota=str(numero),
                serie="1",
                chave_acesso=chave,
                data_emissao=data_nota.date(), 
                valor_total=valor,
                xml_conteudo=None 
            )
            db.add(nota_entrada)
            notas_entrada.append(nota_entrada)

    db.commit()
    print(f"-> {len(notas_entrada)} Notas de Entrada criadas.")

    print("\nBanco de dados populado com sucesso!")

    db.commit() 
    print(f"-> {len(vendas_criadas)} Vendas criadas.")
    
    mov1 = MovimentacaoCaixa(tipo="abertura", valor=200.0, pdv_id=pdv1.id, operador_id=user_operador.id, autorizado_por_id=user_admin.id)
    mov2 = MovimentacaoCaixa(tipo="sangria", valor=500.0, pdv_id=pdv1.id, operador_id=user_operador.id, autorizado_por_id=user_admin.id)
    mov3 = MovimentacaoCaixa(tipo="suprimento", valor=100.0, pdv_id=pdv1.id, operador_id=user_admin.id, autorizado_por_id=user_admin.id)
    
    db.commit()
    print("-> Movimentações de caixa criadas.")
    
    transacao1 = TransacaoCrediario(cliente_id=cliente1.id, tipo='compra', valor=vendas_criadas[1].valor_total, descricao="Ref Venda #2", venda_id=vendas_criadas[1].id)
    transacao2 = TransacaoCrediario(cliente_id=cliente1.id, tipo='pagamento', valor=100.0, descricao="Pagamento Parcial")
    transacao3 = TransacaoCrediario(cliente_id=cliente2.id, tipo='compra', valor=vendas_criadas[0].valor_total, descricao="Ref Venda #1", venda_id=vendas_criadas[0].id)
    db.add_all([transacao1, transacao2, transacao3])
    
    db.commit()
    print("-> Transações de crediário criadas.")

    print("\nBanco de dados populado com sucesso!")

except Exception as e:
    print("\nERRO ao popular o banco de dados:")
    print(e)
    import traceback
    traceback.print_exc() 
    db.rollback() 

finally:
    db.close()

# --- 4. SNAPSHOTS DE ESTOQUE ---
db = SessionLocal() 
try:
    print("\nGerando snapshots de estoque para os gráficos...")
    if not db.query(ResumoDiarioEstoque).first():
        for i in range(7): 
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
    db.close