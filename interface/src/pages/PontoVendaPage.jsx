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
  console.log("📦 pdvSession antes de iniciar venda:", pdvSession);

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


        // F3, F4, etc. (Outros Atalhos)
        if (e.key.startsWith('F')) {
            e.preventDefault();
            console.log(`Atalho ${e.key} pressionado (lógica a implementar).`);
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

  console.log("📦 pdvSession antes de iniciar venda:", pdvSession);

// --- HANDLE BARCODE SUBMIT ---
const handleBarcodeSubmit = async (codigo) => {
  setIsAddingItem(true);
  // 'currentSale' é 'activeSale' (pode ser null)
  let currentSale = activeSale; 

  try {
    // 1️⃣ Busca produto (igual)
    const response = await fetch(`${API_URL}/produtos/barcode/${codigo}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Produto '${codigo}' não encontrado.`);
    }
    const produto = await response.json();

    // 2️⃣ Cria venda (igual, mas usando 'currentSale')
    if (!currentSale) {
      const iniciarRes = await fetch(`${API_URL}/vendas/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdv_id: pdvSession.id,
          operador_id: pdvSession.operador_atual.id,
        }),
      });

      if (!iniciarRes.ok) {
        const err = await iniciarRes.json().catch(() => ({}));
        throw new Error(err.detail || "Erro ao iniciar venda.");
      }
      
      currentSale = await iniciarRes.json(); // Pega a nova venda
      // NÃO precisa 'setCurrentSaleId', 'currentSale' é uma var local
    }

    // 3️⃣ Adiciona o item à venda (igual)
    // (Presume que sua rota é /adicionar-item, como no seu código)
    const addItemRes = await fetch(`${API_URL}/vendas/${currentSale.id}/adicionar-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produto_id: produto.id,
        quantidade: 1,
      }),
    });

    if (!addItemRes.ok) {
      const err = await addItemRes.json().catch(() => ({}));
      throw new Error(err.detail || "Erro ao adicionar produto à venda.");
    }

    // 4️⃣ ATUALIZA O ESTADO COM A RESPOSTA DA API
    // (Presume que a rota '/adicionar-item' retorna a Venda completa e atualizada)
    const updatedSale = await addItemRes.json();
    setActiveSale(updatedSale); // Esta é a FONTE DA VERDADE

    // A lógica 'setCartItems((prevItems) => ...)' é REMOVIDA.
    // O 'useMemo' vai cuidar de atualizar 'cartItems' sozinho.

  } catch (error) {
    console.error(error);
    toast.error(error.message);
  } finally {
    setIsAddingItem(false);
    setBarcodeBuffer("");
  }
};

React.useEffect(() => {
  if (isAddingItem) return setSaleStatus("loading");
  if (saleStatus === "pagamento") return; // mantém durante o pagamento

  if (cartItems.length > 0 && activeSale) {
    setSaleStatus("em_andamento");
  } else if (pdvSession?.status === "aberto") {
    setSaleStatus("livre");
  } else {
    setSaleStatus(pdvSession?.status || "loading");
  }
}, [cartItems, activeSale, isAddingItem, pdvSession, saleStatus]);



  const lastItem = cartItems.length > 0 ? cartItems[0] : null;

  if (!pdvSession) {
      return <PosLoadingSkeleton />;
  }

const handleSaleSuccess = (vendaId, troco) => {
      toast.success(`Venda #${vendaId} finalizada!`, {
          description: troco > 0 ? `Troco: ${troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : "Pagamento concluído.",
          duration: 10000, 
      });
      
      // Limpa o estado local
      setIsPaymentModalOpen(false); 
      setActiveSale(null); // Limpa a venda, o 'useMemo' vai limpar 'cartItems'
      // O 'useEffect' de status vai mudar para 'livre'
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

  return (
    <>
      <ComprasPageLayout
        Header1={<Logo variant="full" size="180px" />}
        Header2={<PosHeaderStatus session={pdvSession} />} 
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
    </>
  );
}
