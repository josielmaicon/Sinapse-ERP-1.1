from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from datetime import datetime

router = APIRouter(
    prefix="/history",
    tags=["Histórico"]
)

@router.get("/general", response_model=List[schemas.PdvHistoryLogEntry])
def get_general_history(limit: int = 50, db: Session = Depends(get_db)):
    """
    Retorna um histórico unificado e GERAL de vendas e movimentações.
    Limitado aos 50 eventos mais recentes por padrão.
    """
    
    # 1. Busca Vendas recentes (e seus PDVs/Operadores)
    vendas_query = (
        db.query(models.Venda, models.Usuario.nome.label("operador_nome"))
        .join(models.Usuario, models.Venda.operador_id == models.Usuario.id)
        .options(joinedload(models.Venda.pdv)) # Garante que os dados do PDV venham juntos
        .filter(models.Venda.status == "concluida")
        .order_by(models.Venda.data_hora.desc())
        .limit(limit)
        .all()
    )

    # 2. Busca Movimentações recentes (e seus PDVs/Operadores)
    movimentacoes_query = (
        db.query(models.MovimentacaoCaixa, models.Usuario.nome.label("operador_nome"))
        .join(models.Usuario, models.MovimentacaoCaixa.operador_id == models.Usuario.id)
        .options(joinedload(models.MovimentacaoCaixa.pdv)) # Garante que os dados do PDV venham juntos
        .order_by(models.MovimentacaoCaixa.data_hora.desc())
        .limit(limit)
        .all()
    )

    # 3. Formata e Combina as listas
    combined_log = []
    for venda, operador_nome in vendas_query:
        combined_log.append({
            "id": f"venda-{venda.id}",
            "type": "venda",
            "date": venda.data_hora,
            "value": -venda.valor_total,
            "user": operador_nome,
            "pdvName": venda.pdv.nome if venda.pdv else 'N/A', # Adiciona o nome do PDV
            "details": f"Venda ID: {venda.id}"
        })

    for mov, operador_nome in movimentacoes_query:
        combined_log.append({
            "id": f"mov-{mov.id}",
            "type": mov.tipo,
            "date": mov.data_hora,
            "value": mov.valor,
            "user": operador_nome,
            "pdvName": mov.pdv.nome if mov.pdv else 'N/A', # Adiciona o nome do PDV
            "details": f"Movimentação de caixa: {mov.tipo}"
        })

    # 4. Ordena a lista combinada e aplica o limite final
    combined_log.sort(key=lambda x: x["date"], reverse=True)
    
    return combined_log[:limit] # Retorna os 50 mais recentes