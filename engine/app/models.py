from sqlalchemy import (Column, Integer, String, Date, Float, DateTime, ForeignKey, Boolean, Enum, Table) # ✅ Adicione 'Table'
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    funcao = Column(String(50), default="operador") # Antigo 'tipo'. Ex: "operador", "gerente", "admin"
    status = Column(Enum('ativo', 'inativo', name='status_usuario_enum'), nullable=False, default='ativo')
    
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    produtos_criados = relationship("Produto", foreign_keys="[Produto.criado_por_id]", back_populates="criador")
    produtos_atualizados = relationship("Produto", foreign_keys="[Produto.atualizado_por_id]", back_populates="atualizador")
    vendas = relationship("Venda", back_populates="operador")
    pdv_ativo = relationship("Pdv", back_populates="operador_atual", foreign_keys="[Pdv.operador_atual_id]")
    movimentacoes_realizadas = relationship(
        "MovimentacaoCaixa", 
        # Referencia a coluna na TABELA MovimentacaoCaixa
        foreign_keys="[MovimentacaoCaixa.operador_id]", 
        back_populates="operador" 
    )
    
    movimentacoes_autorizadas = relationship(
        "MovimentacaoCaixa", 
        # Referencia a coluna na TABELA MovimentacaoCaixa
        foreign_keys="[MovimentacaoCaixa.autorizado_por_id]", 
        back_populates="autorizador"
    )

class Fornecedor(Base):
    __tablename__ = "fornecedores"
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    cnpj = Column(String(18), unique=True)
    
    # Relação
    produtos = relationship("Produto", back_populates="fornecedor")

promocao_produtos_association = Table(
    'promocao_produtos', Base.metadata,
    Column('promocao_id', Integer, ForeignKey('promocoes.id'), primary_key=True),
    Column('produto_id', Integer, ForeignKey('produtos.id'), primary_key=True)
)

# ✅ 2. CRIE O MODELO DA PROMOÇÃO
class Promocao(Base):
    __tablename__ = "promocoes"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(Enum('percentual', 'preco_fixo', name='tipo_promocao_enum'), nullable=False, default='preco_fixo')
    
    valor = Column(Float, nullable=False)
    
    data_inicio = Column(DateTime, default=datetime.utcnow)
    data_fim = Column(DateTime, nullable=True) # Nulo = promoção sem data para acabar
    
    criado_em = Column(DateTime, default=datetime.utcnow)
    
    # A "mágica" da relação Many-to-Many:
    # "Esta promoção tem muitos produtos, ligados pela tabela 'promocao_produtos_association'"
    produtos = relationship(
        "Produto",
        secondary=promocao_produtos_association,
        back_populates="promocoes"
    )

class Produto(Base):
    __tablename__ = "produtos"

    # --- Identificação ---
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False, index=True)
    codigo_barras = Column(String(50), unique=True, index=True)
    
    # --- Estoque e Venda ---
    quantidade_estoque = Column(Integer, default=0)
    unidade_medida = Column(String(20), default="UN") # Ex: UN, KG, CX
    estoque_minimo = Column(Integer, default=5)
    vencimento = Column(Date, nullable=True)
    
    # --- Financeiro ---
    preco_custo = Column(Float)
    preco_venda = Column(Float, nullable=False)

    # --- Fiscal ---
    ncm = Column(String(20))
    cfop = Column(String(10))
    cst = Column(String(10))
    
    # --- Auditoria e Timestamps ---
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # --- Relacionamentos (Conexões) ---
    categoria = Column(String(100))
    
    # Chaves estrangeiras que ligam este produto a outras tabelas
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), nullable=True)
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"))
    atualizado_por_id = Column(Integer, ForeignKey("usuarios.id"))

    # Atalhos mágicos do SQLAlchemy para navegar entre os objetos
    fornecedor = relationship("Fornecedor", back_populates="produtos")
    criador = relationship("Usuario", foreign_keys=[criado_por_id], back_populates="produtos_criados")
    atualizador = relationship("Usuario", foreign_keys=[atualizado_por_id], back_populates="produtos_atualizados")
    itens_vendidos = relationship("VendaItem", back_populates="produto")
    promocoes = relationship( "Promocao", secondary=promocao_produtos_association, back_populates="produtos")

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False, index=True)
    cpf = Column(String(14), unique=True, index=True, nullable=True) # Permitir CPF nulo?
    telefone = Column(String(20), nullable=True) # Campo útil para edição
    email = Column(String(100), nullable=True) # Campo útil para edição
    limite_credito = Column(Float, default=0.0)
    saldo_devedor = Column(Float, default=0.0) # Saldo atual
    
    trust_mode = Column(Boolean, default=False, nullable=False) 
    vendas = relationship("Venda", back_populates="cliente")
    status_conta = Column(Enum('ativo', 'inativo', 'bloqueado', 'atrasado', name='status_conta_enum'), default='ativo', nullable=False) 
    
    data_vencimento_fatura = Column(Date, nullable=True) # Próximo vencimento
    transacoes_crediario = relationship("TransacaoCrediario", back_populates="cliente", cascade="all, delete-orphan")

class TransacaoCrediario(Base):
    __tablename__ = "transacoes_crediario"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    
    tipo = Column(Enum('compra', 'pagamento', name='tipo_transacao_crediario_enum'), nullable=False)
    
    valor = Column(Float, nullable=False) # Sempre positivo, o 'tipo' define a operação
    descricao = Column(String(255), nullable=True) # Ex: "Compra na loja", "Pagamento ref. Out/25"
    data_hora = Column(DateTime, default=datetime.utcnow)
    
    venda_id = Column(Integer, ForeignKey("vendas.id"), nullable=True) 
    
    # Relações
    cliente = relationship("Cliente", back_populates="transacoes_crediario")
    venda_original = relationship("Venda") # Relação simples com a Venda (se aplicável)

class Pdv(Base):
    __tablename__ = "pdvs"
    id = Column(Integer, primary_key=True)
    nome = Column(String(50), unique=True, nullable=False) # Ex: "Caixa 01"
    status = Column(String(50), default="fechado") # Ex: "aberto", "fechado", "pausado"
    
    # Relação: Um PDV pode ter várias vendas e movimentações
    operador_atual_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    vendas = relationship("Venda", back_populates="pdv")
    movimentacoes_caixa = relationship("MovimentacaoCaixa", back_populates="pdv")
    operador_atual = relationship("Usuario", back_populates="pdv_ativo", foreign_keys=[operador_atual_id])
    vendas = relationship("Venda", back_populates="pdv")
    movimentacoes_caixa = relationship("MovimentacaoCaixa", back_populates="pdv")
    solicitacoes = relationship("Solicitacao", back_populates="pdv")

class Venda(Base):
    __tablename__ = "vendas"
    id = Column(Integer, primary_key=True, index=True)
    valor_total = Column(Float, nullable=False, default=0.0)
    data_hora = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="em_andamento", nullable=False) # em_andamento, concluida, cancelada
    status_fiscal = Column(String(50), default="pendente") # pendente, emitida, nao_declarar
    
    # Chaves Estrangeiras para conectar com o resto do sistema
    pdv_id = Column(Integer, ForeignKey("pdvs.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    operador_id = Column(Integer, ForeignKey("usuarios.id"))

    # Relacionamentos (Atalhos do SQLAlchemy)
    pdv = relationship("Pdv", back_populates="vendas")
    cliente = relationship("Cliente", back_populates="vendas")
    operador = relationship("Usuario", back_populates="vendas")
    
    # Uma venda tem muitos itens. 'cascade' garante que se uma venda for deletada, seus itens também sejam.
    itens = relationship("VendaItem", back_populates="venda", cascade="all, delete-orphan")
    nota_fiscal_saida = relationship("NotaFiscalSaida", back_populates="venda", uselist=False)
    forma_pagamento = Column(String(50), nullable=True, default="dinheiro")

class VendaItem(Base):
    __tablename__ = "venda_itens"
    id = Column(Integer, primary_key=True)
    quantidade = Column(Float, nullable=False)
    preco_unitario_na_venda = Column(Float, nullable=False)
    
    # Chaves Estrangeiras, a "ponte" entre Vendas e Produtos
    venda_id = Column(Integer, ForeignKey("vendas.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)

    # Relacionamentos
    venda = relationship("Venda", back_populates="itens")
    produto = relationship("Produto", back_populates="itens_vendidos")

class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id = Column(Integer, primary_key=True)
    # Usando 'Enum' para garantir que o tipo seja sempre um dos valores permitidos
    tipo = Column(Enum('abertura', 'suprimento', 'sangria', 'fechamento', name='tipo_mov_caixa_enum'), nullable=False)
    valor = Column(Float, nullable=False)
    data_hora = Column(DateTime, default=datetime.utcnow)
    
    # Conexões
    pdv_id = Column(Integer, ForeignKey("pdvs.id"), nullable=False)
    operador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    autorizado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relações
    pdv = relationship("Pdv", back_populates="movimentacoes_caixa")
    operador = relationship("Usuario", foreign_keys=[operador_id], back_populates="movimentacoes_realizadas") 
    autorizador = relationship("Usuario", foreign_keys=[autorizado_por_id], back_populates="movimentacoes_autorizadas")
    
class NotaFiscalEntrada(Base):
    __tablename__ = "notas_fiscais_entrada"
    id = Column(Integer, primary_key=True)
    numero_nota = Column(String(50), index=True, nullable=False)
    chave_acesso = Column(String(44), unique=True, nullable=False)
    data_emissao = Column(Date, nullable=False)
    valor_total = Column(Float, nullable=False)
    
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"))
    fornecedor = relationship("Fornecedor") # Relação simples

class NotaFiscalSaida(Base):
    __tablename__ = "notas_fiscais_saida"
    id = Column(Integer, primary_key=True)
    chave_acesso = Column(String(44), unique=True)
    protocolo = Column(String(50))
    status_sefaz = Column(String(50), default="Em Processamento") # Ex: "Autorizada", "Cancelada", "Rejeitada"
    data_emissao = Column(DateTime, nullable=False)
    data_hora_autorizacao = Column(DateTime)
    
    # A conexão com a venda original
    venda_id = Column(Integer, ForeignKey("vendas.id"), unique=True)
    venda = relationship("Venda", back_populates="nota_fiscal_saida")

class Configuracao(Base):
    __tablename__ = "configuracoes"
    id = Column(Integer, primary_key=True)
    chave = Column(String(50), unique=True, nullable=False) # Ex: "meta_fiscal_tipo", "meta_fiscal_valor"
    valor = Column(String(255), nullable=False)

class Solicitacao(Base):
    __tablename__ = "solicitacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)
    detalhes = Column(String(255))
    status = Column(String(50), default="pendente", nullable=False)
    data_hora_criacao = Column(DateTime, default=datetime.utcnow)
    data_hora_resolucao = Column(DateTime, nullable=True)

    # Conexões
    pdv_id = Column(Integer, ForeignKey("pdvs.id"), nullable=False)
    operador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    gerente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Quem resolveu

    # Relações
    pdv = relationship("Pdv", back_populates="solicitacoes")
    operador = relationship("Usuario", foreign_keys=[operador_id])
    gerente = relationship("Usuario", foreign_keys=[gerente_id])

class ResumoDiarioEstoque(Base):
    __tablename__ = "resumo_diario_estoque"

    id = Column(Integer, primary_key=True)
    # Precisamos importar 'date' da biblioteca 'datetime'
    data = Column(Date, unique=True, nullable=False, default=datetime.date) 
    
    # Os 4 KPIs que você queria
    valor_total_estoque = Column(Float, default=0.0)
    itens_estoque_baixo = Column(Integer, default=0)
    itens_vencimento_proximo = Column(Integer, default=0)
    itens_sem_giro = Column(Integer, default=0)

