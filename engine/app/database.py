from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import time
import sys

# Detecta se estamos rodando como executável (Futuro Windows) ou Script (Mac Dev)
IS_FROZEN = getattr(sys, 'frozen', False)

# --- CONFIGURAÇÃO DA STRING DE CONEXÃO ---
# Em Dev (Docker no Mac):
# postgresql://usuario:senha@localhost:5432/nome_do_banco
DEFAULT_DB_URL = "postgresql://admin:password123@localhost:5432/sinapse_db"

# Se estivermos no executável Windows (Produção), a porta ou host podem mudar
if IS_FROZEN:
    # No futuro, aqui apontaremos para a versão embarcada
    SQLALCHEMY_DATABASE_URL = DEFAULT_DB_URL 
else:
    # No Mac, usamos o Docker
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

def get_engine_robusto():
    """
    Tenta conectar ao banco. Se falhar (banco inicializando), 
    espera e tenta de novo (Retry Pattern).
    """
    max_retries = 10
    retry_interval = 2 # segundos

    for i in range(max_retries):
        try:
            # Configurações otimizadas para Postgres
            engine = create_engine(
                SQLALCHEMY_DATABASE_URL,
                pool_size=20,       # Aguenta 20 conexões simultâneas (vários caixas)
                max_overflow=10,    # Margem para picos
                pool_pre_ping=True  # Verifica se a conexão está viva antes de usar
            )
            
            # Teste real de conexão
            with engine.connect() as conn:
                print(f"✅ [Banco de Dados] Conectado com sucesso em {SQLALCHEMY_DATABASE_URL}")
                return engine
                
        except Exception as e:
            print(f"⏳ [Banco de Dados] Aguardando conexão... ({i+1}/{max_retries})")
            print(f"   Erro: {e}")
            time.sleep(retry_interval)
            
    raise Exception("❌ ERRO CRÍTICO: Não foi possível conectar ao Banco de Dados após várias tentativas.")

# Cria a engine usando a função robusta
engine = get_engine_robusto()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()