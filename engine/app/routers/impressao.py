from fastapi import APIRouter
from typing import List
from .. import schemas
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, database
from ..services import printer_layout, printer_driver

router = APIRouter(
    prefix="/impressao",  # O prefixo da nossa rota
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



router = APIRouter(prefix="/impressao", tags=["Impressão"])

@router.post("/venda/{venda_id}")
def imprimir_cupom_venda(venda_id: int, db: Session = Depends(database.get_db)):
    """
    Gera e imprime o cupom de uma venda.
    """
    
    # 1. Busca a Venda com todos os detalhes
    venda = db.query(models.Venda).options(
        joinedload(models.Venda.itens).joinedload(models.VendaItem.produto),
        joinedload(models.Venda.cliente),
        joinedload(models.Venda.pdv).joinedload(models.Pdv.impressora) # Carrega config da impressora
    ).filter(models.Venda.id == venda_id).first()
    
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")
    
    # 2. Busca Configurações da Empresa (para cabeçalho/rodapé)
    empresa = db.query(models.Empresa).filter(models.Empresa.id == 1).first()
    
    # 3. Gera o Layout (Bytes)
    cupom_bytes = printer_layout.gerar_layout_cupom(venda, empresa)
    
    # 4. Envia para a Impressora do PDV
    # (Se o PDV não tiver impressora, tentamos achar uma padrão ou falhamos)
    impressora_alvo = venda.pdv.impressora
    
    if not impressora_alvo:
        # Fallback: Tenta achar uma impressora "caixa" genérica no banco?
        # Por enquanto, apenas avisa.
        return {"status": "erro", "mensagem": "Nenhuma impressora vinculada a este PDV."}
        
    sucesso = printer_driver.enviar_impressao(cupom_bytes, impressora_alvo)
    
    if sucesso:
        return {"status": "sucesso", "mensagem": "Enviado para impressão."}
    else:
        return {"status": "erro", "mensagem": "Falha no envio."}