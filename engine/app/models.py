from sqlalchemy import (Column, Integer, Date, String, Float, DateTime, ForeignKey, Boolean, Enum)
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

    # Relações (as "pontas" que se conectam ao modelo Produto)
    produtos_criados = relationship("Produto", foreign_keys="[Produto.criado_por_id]", back_populates="criador")
    produtos_atualizados = relationship("Produto", foreign_keys="[Produto.atualizado_por_id]", back_populates="atualizador")


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
    
    # --- Financeiro ---
    preco_custo = Column(Float)
    preco_venda = Column(Float, nullable=False)

    # --- Fiscal ---
    ncm = Column(String(20))
    cfop = Column(String(10))
    cst = Column(String(10))
    
    # --- Auditoria e Timestamps ---
    vencimento = Column(Date, nullable=True)
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