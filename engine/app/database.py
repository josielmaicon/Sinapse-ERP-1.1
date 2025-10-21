from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Define o caminho para o nosso banco de dados.
# "sqlite:///./sinapse.db" cria um arquivo chamado 'sinapse.db' na raiz do projeto.
DATABASE_URL = "sqlite:///./sinapse.db"

engine = create_engine(
    DATABASE_URL, 
    # Esta configuração é necessária para o SQLite funcionar com o FastAPI
    connect_args={"check_same_thread": False} 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()