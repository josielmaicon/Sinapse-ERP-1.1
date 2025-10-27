from fastapi import APIRouter
from typing import List
from .. import schemas

router = APIRouter(
    prefix="/api/impressao",  # O prefixo da nossa rota
    tags=["Impressão"]
)

@router.post("/etiquetas")
async def imprimir_etiquetas_de_produto(
    etiquetas_para_imprimir: List[schemas.LabelPrintData]
):
    """
    Recebe uma lista de produtos e (no futuro) gera as etiquetas.
    
    Por enquanto, apenas simula o recebimento e loga no console.
    """
    
    print("===== 🚀 SOLICITAÇÃO DE IMPRESSÃO RECEBIDA =====")
    
    for etiqueta in etiquetas_para_imprimir:
        # Aqui você pode ver os dados que o frontend enviou
        print(f"  [ETIQUETA] ID: {etiqueta.id}")
        print(f"     Nome: {etiqueta.nome}")
        print(f"     Preço: R$ {etiqueta.preco_venda:.2f}")
        print("  --------------------")

    # --- TODO: LÓGICA DA IMPRESSORA ---
    # Aqui entraria o código real para falar com a impressora
    # (ex: gerar um ZPL, chamar uma API de impressão, etc.)
    # -----------------------------------

    print(f"Total de {len(etiquetas_para_imprimir)} etiquetas processadas.")
    print("=================================================")
    
    # Retorna uma mensagem de sucesso para o frontend
    return {
        "message": f"{len(etiquetas_para_imprimir)} etiqueta(s) enviada(s) para a fila de impressão."
    }