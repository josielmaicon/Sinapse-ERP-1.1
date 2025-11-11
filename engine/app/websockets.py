# app/websockets.py
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    def __init__(self):
        # Lista de todas as conexões ativas (PDVs e Painéis de Gerente)
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 Nova conexão WebSocket. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"🔌 Conexão fechada. Restam: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """
        Envia um dicionário como JSON para TODOS os conectados.
        O frontend decide se a mensagem é para ele ou não.
        """
        payload = json.dumps(message)
        # Itera sobre uma cópia da lista para evitar erros se uma conexão cair durante o loop
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(payload)
            except Exception as e:
                print(f"Erro ao enviar socket, removendo conexão morta: {e}")
                self.disconnect(connection)

# Instância global
manager = ConnectionManager()