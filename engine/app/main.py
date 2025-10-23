from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import products, usuarios, vendas

app = FastAPI(title="Sinapse ERP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(usuarios.router)
app.include_router(vendas.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Sinapse ERP!"}
