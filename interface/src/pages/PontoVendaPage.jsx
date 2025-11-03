"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom" 
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import ComprasPageLayout from "@/layouts/PontoVendaLayout";
import SaleItemsList from "@/components/pontovenda/itensvenda";
import PosHeaderStatus from "@/components/pontovenda/Header2";
import SaleResume from "@/components/pontovenda/subtotal";
import PosSidePanel from "@/components/pontovenda/PainelLateral";
import PosFooterStatus from "@/components/pontovenda/rodape";
import Logo from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton"; 
import { OpenClosePdvModal } from "@/components/pdvs/modalAberturaFechamento";
import { Power, Loader2 } from "lucide-react";
import { PaymentModal } from "@/components/pontovenda/modalVenda"
import { CancelItemModal } from "@/components/pontovenda/CancelItemModal"

const API_URL = "http://localhost:8000"; 

const PosLoadingSkeleton = () => (
   <div className="h-screen w-screen flex flex-col items-center justify-center p-12 gap-4">
      <Logo variant="full" size="200px" />
      <Skeleton className="h-10 w-64" />
      <p className="text-lg text-muted-foreground">Carregando sessão do Ponto de Venda...</p>
   </div>
);

export default function PontoVenda() {
  const [pdvSession, setPdvSession] = React.useState(null); 
  const [saleStatus, setSaleStatus] = React.useState("loading"); 
  const [barcodeBuffer, setBarcodeBuffer] = React.useState(""); 
  const [isAddingItem, setIsAddingItem] = React.useState(false); 
  const [activeSale, setActiveSale] = React.useState(null);
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [operatorData, setOperatorData] = React.useState([]);
  const [isLoadingOperators, setIsLoadingOperators] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false); 

  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isCancelItemModalOpen, setIsCancelItemModalOpen] = React.useState(false); 
  const [authActionContext, setAuthActionContext] = React.useState(null);
  
  const fetchPdvSession = async (isInitialLoad = false) => {

    const machineName = localStorage.getItem('ACTIVE_PDV_NAME'); 

    if (!machineName) {
       toast.error("Erro: Nenhuma sessão de PDV definida.", { description: "Abra a interface pelo painel de gerenciamento."});
       navigate("/"); 
       return;
    }

    if (isInitialLoad) {
        setSaleStatus("loading");
    }

    try {
      if (isInitialLoad) console.log(`Carregando sessão para PDV com nome: ${machineName}`);
      else console.log(`RE-carregando sessão para PDV: ${machineName}`);

      const response = await fetch(`${API_URL}/pdvs/session-by-name/${machineName}`); 
      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(data.detail || "PDV não encontrado ou erro desconhecido.");
      }
      
      setPdvSession({ ...data, isOnline: navigator.onLine }); 
      
      if (data.status === 'aberto') {
          await loadExistingActiveSale(data);
          setSaleStatus("livre"); 
          if (isInitialLoad) toast.success(`Caixa ${data.nome} aberto. Operador: ${data.operador_atual.nome}.`);
      } else {
          setSaleStatus(data.status);
          if (isInitialLoad) toast.info(`Caixa ${data.nome} está ${data.status}.`, { description: "Pressione F1 para abrir o caixa."});
      }

    } catch (error) {
      toast.error("Falha ao iniciar sessão do PDV", { description: error.message });
      navigate("/"); 
    }
  };


  const cartItems = React.useMemo(() => {
      if (!activeSale || !activeSale.itens) {
          return [];
      }
      
      // Transforma os dados do backend (VendaItem) para o formato do frontend
      return activeSale.itens.map(item => ({
          id: item.produto.codigo_barras, 
          name: item.produto.nome,
          quantity: item.quantidade,
          unitPrice: item.preco_unitario_na_venda,
          totalPrice: item.quantidade * item.preco_unitario_na_venda,
          db_id: item.produto.id, 
          item_db_id: item.id 
      })).sort((a, b) => b.item_db_id - a.item_db_id); // Mais novo primeiro
      
  }, [activeSale]);

  const loadExistingActiveSale = async (session) => {
      if (session.status !== 'aberto') {
          setActiveSale(null); 
          return;
      }
      
      console.log(`Verificando venda em aberto para PDV #${session.id}...`);
      try {
          // (Presume que você tem esta rota 'GET /vendas/pdvs/{id}/venda-ativa'
          // que fizemos na conversa anterior)
          const response = await fetch(`${API_URL}/vendas/pdvs/${session.id}/venda-ativa`);
          
          if (response.status === 404 || response.status === 204) {
             console.log("Nenhuma venda em aberto encontrada. Caixa livre.");
             setActiveSale(null);
             return;
          }

          const saleData = await response.json();
          if (!response.ok) throw new Error(saleData.detail || "Falha ao carregar venda");
          
          setActiveSale(saleData);
          toast.info(`Venda #${saleData.id} recuperada.`, {
              description: "Havia uma venda em andamento para este caixa."
          });
          
      } catch (error) {
         console.log("Nenhum erro, apenas sem venda ativa.");
         setActiveSale(null);
      }
  }

  React.useEffect(() => {
    fetchPdvSession(true);
  }, []);

  const handleOpenCloseModalToggle = async () => {
      if (!pdvSession) return;
      if (saleStatus === 'pagamento' || saleStatus === 'loading') return; 
      
      if (pdvSession.status === 'fechado' && operatorData.length === 0 && !isLoadingOperators) {
          setIsLoadingOperators(true);
          console.log("Carregando lista de operadores...");
          try {
              const res = await fetch(`${API_URL}/usuarios`);
              if (!res.ok) throw new Error("Falha ao buscar operadores");
              const ops = await res.json();
              setOperatorData(ops.filter(op => op.status === 'ativo'));
              console.log("Operadores carregados.");
              setIsModalOpen(true);
          } catch (error) {
              console.error("Erro ao buscar operadores:", error.message);
              toast.error("Erro ao buscar operadores", { description: error.message });
          } finally {
              setIsLoadingOperators(false);
          }
      } else if (!isLoadingOperators) {
          setIsModalOpen(true);
      }
  };


  React.useEffect(() => {
    const handleKeyPress = (e) => {
        // Ignora se o modal estiver aberto ou buscando
        if (isModalOpen || isPaymentModalOpen || isAddingItem) return;

        // F1 (Contextual) - Abrir/Finalizar
        if (e.key === 'F1') {
           e.preventDefault();
           // Lógica F1: Abrir Modal de Gestão da Sessão
           handleOpenCloseModalToggle();
           return;
        }

        if (e.key === 'F4') {
          e.preventDefault();
          handleCancelSale(); // Chama a função que abre a modal de autorização
          return;
        }
        
        // ✅ NOVO GATILHO: F2 para FINALIZAR VENDA
        if (e.key === 'F2') {
           e.preventDefault();
           // Verifica se o caixa está aberto e tem itens, senão informa o erro
           if (pdvSession?.status === 'aberto' && cartItems.length > 0) {
               console.log("F2 Pressionado - Iniciando Pagamento");
               handlePaymentStart(); // Chama a função que muda o status e abre o PaymentModal
           } else if (pdvSession?.status !== 'aberto') {
               toast.warning("Caixa Fechado", { description: "Use F1 para abrir o caixa antes de finalizar." });
           } else {
               toast.info("Carrinho Vazio", { description: "Adicione itens para finalizar a venda." });
           }
           return;
        }
        
        // --- A partir daqui, só funciona se o caixa estiver ABERTO ---
        if (pdvSession?.status !== 'aberto') {
            return; 
        }

        // Lógica de digitação (Enter, Escape, Backspace, caractere)
        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeBuffer.trim().length > 0) {
                handleBarcodeSubmit(barcodeBuffer.trim());
            }
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); setBarcodeBuffer(""); return; }
        if (e.key === 'Backspace') { e.preventDefault(); setBarcodeBuffer(prev => prev.slice(0, -1)); return; }
        if (e.key.length === 1 && e.key.match(/^[a-zA-Z0-9-]$/)) { e.preventDefault(); setBarcodeBuffer(prev => prev + e.key); }
    };

document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  
  }, [barcodeBuffer, isAddingItem, saleStatus, pdvSession, isModalOpen, isPaymentModalOpen, cartItems]); // 'cartItems' aqui agora é o derivado
  React.useEffect(() => {
      const handleOnline = () => setPdvSession(prev => (prev ? { ...prev, isOnline: true } : null));
      const handleOffline = () => setPdvSession(prev => (prev ? { ...prev, isOnline: false } : null));
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);
  
const handleBarcodeSubmit = async (codigo) => {
  setIsAddingItem(true);
  // Não precisamos de 'let currentSale' aqui

  try {
    // 1. VALIDAÇÃO DE SESSÃO (Ainda necessária)
    if (!pdvSession || !pdvSession.operador_atual || !pdvSession.operador_atual.id) {
      toast.error("Sessão Inválida", { description: "Operador não identificado. Tente reabrir o caixa (F1)." });
      throw new Error("Operador não encontrado na sessão.");
    }

    // 2. FAZ A CHAMADA ÚNICA PARA A ROTA "INTELIGENTE"
    const response = await fetch(`${API_URL}/vendas/adicionar-item-smart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_barras: codigo,
        pdv_id: pdvSession.id,
        operador_id: pdvSession.operador_atual.id,
        quantidade: 1 
      }),
    });

    const updatedSale = await response.json();

    if (!response.ok) {
      throw new Error(updatedSale.detail || "Erro ao adicionar item.");
    }
    setActiveSale(updatedSale);

  } catch (error) {
    console.error("Erro em handleBarcodeSubmit:", error);
    toast.error(error.message);
  } finally {
    setIsAddingItem(false);
    setBarcodeBuffer("");
  }
};

React.useEffect(() => {
  if (isAddingItem) {
    setSaleStatus("loading");
  } else if (isPaymentModalOpen) {
    setSaleStatus("pagamento");
  } else if (activeSale && cartItems.length > 0) {
    setSaleStatus("em_andamento");
  } else if (pdvSession?.status === 'aberto') {
    setSaleStatus("livre");
  } else if (pdvSession?.status) {
    setSaleStatus(pdvSession.status);
  }
}, [cartItems.length, activeSale, pdvSession, isAddingItem, isPaymentModalOpen]);

  const lastItem = cartItems.length > 0 ? cartItems[0] : null;

  if (!pdvSession) {
      return <PosLoadingSkeleton />;
  }

  const handleSaleSuccess = (vendaId, troco) => {
      toast.success(`Venda #${vendaId} finalizada!`, {
          description: troco > 0 ? `Troco: ${troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : "Pagamento concluído.",
          duration: 10000, 
      });
      setIsPaymentModalOpen(false); 
      setActiveSale(null);
  }

    const handlePaymentStart = () => {
      if (cartItems.length === 0) {
          toast.info("Carrinho vazio!", { description: "Adicione itens antes de finalizar a venda." });
          return;
      }
      if (pdvSession?.status !== 'aberto') {
          toast.error("Caixa não está aberto!", { description: "Abra o caixa (F1) para iniciar uma venda." });
          return;
      }
      console.log("Iniciando pagamento...");
      setSaleStatus("pagamento"); // Muda o status do rodapé (ex: 'Aguardando Pagamento')
      setIsPaymentModalOpen(true); // Abre o modal
  };

  const handleCancelSale = () => {
    if (!activeSale) {
        toast.info("Nenhuma venda em andamento para cancelar.");
        return;
    }
    // Seta o contexto e abre o modal de AUTORIZAÇÃO
    setAuthActionContext({ type: 'cancel_sale', saleId: activeSale.id });
    setIsAuthModalOpen(true);
};

// --- AÇÃO 2: INICIAR O CANCELAMENTO DE ITEM (abre o modal de seleção) ---
  const handleRemoveItem = () => {
    if (!activeSale || cartItems.length === 0) {
        toast.info("Nenhum item na venda para remover.");
        return;
    }
    setIsCancelItemModalOpen(true); // Abre o modal específico de itens
};

// --- AÇÃO 3: FUNÇÃO CENTRALIZADORA DE AUDITORIA (chama a API) ---
// Esta função é passada para o AdminAuthModal
const executeAuditedAction = async (authCredentials) => {
    if (!authActionContext) return;

    let apiEndpoint = '';
    let apiMethod = '';
    let successMessage = '';

    // 1. Ação de Cancelar Venda
    if (authActionContext.type === 'cancel_sale') {
        apiEndpoint = `${API_URL}/vendas/${authActionContext.saleId}/cancelar`;
        apiMethod = 'DELETE'; // Ou POST, dependendo da sua rota (usamos DELETE para o backend)
        successMessage = `Venda #${authActionContext.saleId} cancelada.`;
    } 
    // [Se você tivesse uma tela de cancelamento de item, a lógica estaria aqui]
    // if (authActionContext.type === 'remove_item_final') { ... }

    // O corpo da requisição será as credenciais do Admin
    const requestBody = JSON.stringify(authCredentials);

    try {
        const response = await fetch(apiEndpoint, {
            method: apiMethod,
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        });

        // O backend (no DELETE) vai retornar 204 se for sucesso.
        if (response.status === 204 || response.ok) { 
            toast.success(successMessage);
            setActiveSale(null); // Limpa o carrinho
            setAuthActionContext(null);
            return true; // Sucesso na auditoria/ação
        }

        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || 'Erro na autorização ou ação de auditoria.');

    } catch (error) {
        // Se a rota falhar, o AdminAuthModal irá capturar este erro.
        throw error; 
    }
};

  return (
    <>
      <ComprasPageLayout
        Header1={<Logo variant="full" size="180px" />}
        Header2={<PosHeaderStatus session={pdvSession} activeSale={activeSale} />}
        SidePanel={<PosSidePanel lastItem={lastItem} />}
        MainContent={
          <div
            className={cn(
              "h-full flex flex-col",
              pdvSession.status !== "aberto" && "opacity-50 pointer-events-none"
            )}
          >
            <SaleItemsList items={cartItems} />
          </div>
        }
        Resume={<SaleResume items={cartItems} />}
        Footer={<PosFooterStatus status={saleStatus} buffer={barcodeBuffer} />}
      />

      <OpenClosePdvModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        actionType={pdvSession.status === "aberto" ? "close" : "open"}
        pdv={pdvSession}
        refetchData={() => fetchPdvSession(false)}
        operators={operatorData}
      />

      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        cartItems={cartItems}
        activeSale={activeSale}
        pdvSession={pdvSession}
        onSaleSuccess={handleSaleSuccess}
      />

      <CancelItemModal
       open={isCancelItemModalOpen}
       onOpenChange={setIsCancelItemModalOpen}
       activeSale={activeSale}
       onStartAuth={(itemData) => {
          setIsCancelItemModalOpen(false); // Fecha a modal de seleção
          setAuthActionContext({ type: 'remove_item_selection', ...itemData }); // Contexto
          setIsAuthModalOpen(true); // Abre a modal de autorização
       }}
    />
    </>
  );
}
