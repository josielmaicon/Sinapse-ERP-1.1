from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import products, clientes, configuracoes, usuarios, vendas, pdvs, fiscal, solicitacoes, historico, crediario, impressao, promocoes, auth, notas_entrada

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
app.include_router(pdvs.router)
app.include_router(fiscal.router)
app.include_router(solicitacoes.router)
app.include_router(historico.router)
app.include_router(crediario.router)
app.include_router(impressao.router)
app.include_router(promocoes.router)
app.include_router(auth.router)
app.include_router(notas_entrada.router)
app.include_router(clientes.router)
app.include_router(configuracoes.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Sinapse ERP!"}
