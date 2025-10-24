# app/routers/solicitacoes.py
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..websockets import manager # ✅ Importa nosso gerenciador de conexões

router = APIRouter(
    prefix="/api/solicitacoes",
    tags=["Solicitações"]
)

# Endpoint para o operador de caixa criar uma solicitação
@router.post("/", response_model=schemas.Solicitacao)
async def create_solicitacao(solicitacao: schemas.SolicitacaoCreate, db: Session = Depends(get_db)):
    db_solicitacao = models.Solicitacao(**solicitacao.dict())
    db.add(db_solicitacao)
    db.commit()
    db.refresh(db_solicitacao)

    # ✅ A NOTIFICAÇÃO EM TEMPO REAL!
    # Avisa a todos os gerentes conectados que há uma nova solicitação
    await manager.broadcast(json.dumps({
        "evento": "NOVA_SOLICITACAO",
        "pdv_id": db_solicitacao.pdv_id
    }))
    
    return db_solicitacao

# Endpoint para o gerente responder a uma solicitação
@router.put("/{solicitacao_id}", response_model=schemas.Solicitacao)
async def resolve_solicitacao(solicitacao_id: int, status: str, db: Session = Depends(get_db)):
    # ... (lógica para encontrar a solicitação, atualizar o status, etc.)
    # ... (depois de salvar no banco, notificar o PDV de volta)
    
    # Exemplo de notificação de volta para o PDV (requer lógica mais avançada de canais)
    # await manager.broadcast(json.dumps({
    #     "evento": "SOLICITACAO_RESOLVIDA",
    #     "solicitacao_id": solicitacao_id,
    #     "status": status
    # }))
    
    # Placeholder de retorno
    db_solicitacao = db.query(models.Solicitacao).filter(models.Solicitacao.id == solicitacao_id).first()
    if not db_solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    db_solicitacao.status = status
    db.commit()
    db.refresh(db_solicitacao)
    return db_solicitacao


# O "túnel" do WebSocket que os painéis de gerente vão "ouvir"
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Apenas mantém a conexão ativa
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)