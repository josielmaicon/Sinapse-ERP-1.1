import * as React from "react";
import { toast } from "sonner";

// O URL do seu backend (ajuste a porta/caminho se necessário)
const WEBSOCKET_URL = "ws://localhost:8000/solicitacoes/ws";

// 1. Criamos o "Contrato" (Context)
const WebSocketContext = React.createContext({
  lastMessage: null, // A última mensagem recebida
  isConnected: false,  // O status da conexão
  // (No futuro, podemos adicionar 'sendMessage' aqui)
});

// 2. Criamos o "Abraço" (Provider)
// Este é o componente que vai segurar a conexão
export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastMessage, setLastMessage] = React.useState(null);
  
  // Usamos useRef para segurar a conexão e evitar re-renderizações
  const socket = React.useRef(null);

  // 3. O Efeito de Conexão (Roda UMA VEZ quando o App carrega)
  React.useEffect(() => {
    // Função para conectar (e reconectar, se necessário)
    const connect = () => {
      console.log("🔌 Socket: Tentando conectar...");
      const ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        console.log("🔌 Socket: Conectado ao canal global.");
        setIsConnected(true);
        toast.success("Conexão em tempo real estabelecida!");
      };

      ws.onmessage = (event) => {
        // Recebe o "sinal leve" (a notificação)
        try {
          const messageData = JSON.parse(event.data);
          console.log("📡 Socket: Mensagem recebida", messageData);
          setLastMessage(messageData); // Atualiza o contexto
        } catch (e) {
          console.error("Erro ao parsear mensagem do socket:", e);
        }
      };

      ws.onclose = (event) => {
        console.log("🔌 Socket: Desconectado. Tentando reconectar em 3s...");
        setIsConnected(false);
        // Tenta reconectar automaticamente após 3 segundos
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("🔌 Socket: Erro.", err);
        ws.close(); // Fecha para acionar o 'onclose' (que tentará reconectar)
      };
      
      socket.current = ws;
    };

    connect(); // Conecta na primeira vez

    // 4. A Limpeza
    return () => {
      console.log("🔌 Socket: Limpando conexão global.");
      socket.current?.close();
    };
  }, []); // O array vazio [] garante que isso rode SÓ UMA VEZ.

  // 5. Compartilha o status e a última mensagem com todos os "filhos"
  const value = {
    isConnected,
    lastMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// 6. O "Gancho" (Como as páginas vão "ouvir")
// Qualquer componente (PDV, Gerente) pode chamar isso
export function useWebSocket() {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket deve ser usado dentro de um WebSocketProvider");
  }
  return context;
}