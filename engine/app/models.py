from sqlalchemy import (Column, Integer, String, Date, Float, DateTime, ForeignKey, Boolean, Enum)
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
    movimentacoes_caixa = relationship("MovimentacaoCaixa", back_populates="operador")

class Fornecedor(Base):
    __tablename__ = "fornecedores"
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    cnpj = Column(String(18), unique=True)
    
    # Relação
    produtos = relationship("Produto", back_populates="fornecedor")

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

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False, index=True)
    cpf = Column(String(14), unique=True, index=True)
    limite_credito = Column(Float, default=0.0)
    saldo_devedor = Column(Float, default=0.0)
    status_conta = Column(String(50), default="Em Dia")
    
    # Relação: Um cliente pode ter várias vendas
    vendas = relationship("Venda", back_populates="cliente")


class Pdv(Base):
    __tablename__ = "pdvs"
    id = Column(Integer, primary_key=True)
    nome = Column(String(50), unique=True, nullable=False) # Ex: "Caixa 01"
    status = Column(String(50), default="fechado") # Ex: "aberto", "fechado", "pausado"
    
    # Relação: Um PDV pode ter várias vendas e movimentações
    operador_atual_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    vendas = relationship("Venda", back_populates="pdv")
    movimentacoes_caixa = relationship("MovimentacaoCaixa", back_populates="pdv")
    operador_atual = relationship("Usuario", uselist=False) 
    vendas = relationship("Venda", back_populates="pdv")
    movimentacoes_caixa = relationship("MovimentacaoCaixa", back_populates="pdv")

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
    
    # Relações
    pdv = relationship("Pdv", back_populates="movimentacoes_caixa")
    operador = relationship("Usuario", back_populates="movimentacoes_caixa")
