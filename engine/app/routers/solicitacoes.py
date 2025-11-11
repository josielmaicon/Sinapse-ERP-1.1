# app/routers/solicitacoes.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from ..websockets import manager
from datetime import datetime

router = APIRouter(
    prefix="/solicitacoes",
    tags=["Solicitações (Socket)"]
)

# --- 1. O CANAL ÚNICO (WebSocket) ---
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Canal global. Tanto PDVs quanto Gerentes se conectam aqui.
    Eles apenas 'escutam'. As ações são feitas via rotas HTTP abaixo.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Mantém a conexão viva e escuta mensagens (ping/pong)
            # Se quiser que o front mande algo pelo socket, processaria aqui.
            # Por enquanto, é apenas one-way (Server -> Client)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Erro no socket: {e}")
        manager.disconnect(websocket)


@router.post("/", response_model=schemas.Solicitacao)
async def create_solicitacao(
    solicitacao: schemas.SolicitacaoCreate, 
    db: Session = Depends(get_db)
):
    """
    PDV cria uma solicitação. Salva e avisa os gerentes.
    """
    db_solicitacao = models.Solicitacao(**solicitacao.dict())
    db_solicitacao.status = "pendente" 
    db_solicitacao.data_hora_criacao = datetime.now()
    
    db.add(db_solicitacao)
    db.commit()
    db.refresh(db_solicitacao)

    # Carrega dados extras (como antes)
    detailed_solicitacao = db.query(models.Solicitacao).options(
        joinedload(models.Solicitacao.pdv),
        joinedload(models.Solicitacao.operador)
    ).filter(models.Solicitacao.id == db_solicitacao.id).first()

    pdv_nome = detailed_solicitacao.pdv.nome if detailed_solicitacao.pdv else "Desconhecido"
    operador_nome = detailed_solicitacao.operador.nome if detailed_solicitacao.operador else "Desconhecido"

    # 🔔 NOTIFICAÇÃO (CORRIGIDA)
    await manager.broadcast({
        "type": "NOVA_SOLICITACAO",
        "payload": {
            "id": db_solicitacao.id,
            "tipo": db_solicitacao.tipo, 
            "pdv_id": db_solicitacao.pdv_id,
            "pdv_nome": pdv_nome,
            "operador_nome": operador_nome,
            
            # ✅ A CORREÇÃO: Envia os detalhes (que contêm os valores/itens)
            "detalhes": db_solicitacao.detalhes, 
            
            "mensagem": "Aprovação necessária"
        }
    })
    
    return db_solicitacao


# --- 3. A RESPOSTA (Lado do Gerente) ---
@router.put("/{solicitacao_id}", response_model=schemas.Solicitacao)
async def resolve_solicitacao(
    solicitacao_id: int, 
    status_update: schemas.SolicitacaoUpdate, # Schema deve ter campo 'status' e opcional 'autorizado_por_id'
    db: Session = Depends(get_db)
):
    """
    Gerente aprova ou rejeita.
    Atualiza o banco e avisa o PDV específico via broadcast global.
    """
    db_solicitacao = db.query(models.Solicitacao).filter(models.Solicitacao.id == solicitacao_id).first()
    if not db_solicitacao:
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")

    # Atualiza no Banco
    if status_update.status not in ['aprovado', 'rejeitado']:
         raise HTTPException(status_code=400, detail="Status inválido")

    db_solicitacao.status = status_update.status
    db_solicitacao.data_hora_resolucao = datetime.now()
    
    if status_update.autorizado_por_id:
        db_solicitacao.autorizado_por_id = status_update.autorizado_por_id

    db.commit()
    db.refresh(db_solicitacao)

    # 🔔 NOTIFICAÇÃO LEVE (Broadcast)
    # "Ei PDVs, a solicitação ID X foi resolvida. Se for sua, atualize-se."
    await manager.broadcast({
        "type": "SOLICITACAO_CONCLUIDA",
        "payload": {
            "id": db_solicitacao.id,
            "pdv_id": db_solicitacao.pdv_id, # O PDV usa isso pra saber se é pra ele
            "status": db_solicitacao.status, # 'aprovado' ou 'rejeitado'
            "tipo": db_solicitacao.tipo
        }
    })

    return db_solicitacao