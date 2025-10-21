from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import products

app = FastAPI(title="Sinapse ERP API")

# Permite que seu frontend React (rodando em http://localhost:5173) 
# converse com este backend. Essencial!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui todas as rotas definidas em 'products.py' na aplicação principal
app.include_router(products.router, prefix="/api", tags=["Products"])

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Sinapse ERP!"}