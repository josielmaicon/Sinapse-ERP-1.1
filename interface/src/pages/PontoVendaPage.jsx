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

const API_URL = "http://localhost:8000/api"; 

const PosLoadingSkeleton = () => (
   <div className="h-screen w-screen flex flex-col items-center justify-center p-12 gap-4">
      <Logo variant="full" size="200px" />
      <Skeleton className="h-10 w-64" />
      <p className="text-lg text-muted-foreground">Carregando sessão do Ponto de Venda...</p>
   </div>
);

export default function PontoVenda() {
  const [pdvSession, setPdvSession] = React.useState(null); 
  const [cartItems, setCartItems] = React.useState([]);
  const [saleStatus, setSaleStatus] = React.useState("loading"); 
  const [barcodeBuffer, setBarcodeBuffer] = React.useState(""); 
  const [isAddingItem, setIsAddingItem] = React.useState(false); 
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [operatorData, setOperatorData] = React.useState([]);
  const [isLoadingOperators, setIsLoadingOperators] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false); 

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
  
  }, [barcodeBuffer, isAddingItem, saleStatus, pdvSession, isModalOpen, isPaymentModalOpen, cartItems]); // Dependências completas

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
    try {
      const response = await fetch(`${API_URL}/produtos/barcode/${codigo}`); 
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Produto '${codigo}' não encontrado.`);
      }

      const produto = await response.json(); 
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === produto.codigo_barras);
        
        if (existingItem) {
          return prevItems.map(item =>
            item.id === produto.codigo_barras
              ? { 
                  ...item, 
                  quantity: item.quantity + 1, 
                  totalPrice: (item.quantity + 1) * item.unitPrice 
                }
              : item // Mantém os outros itens
          );
        } else {
          const newItem = {
            id: produto.codigo_barras, // Código de barras como ID
            name: produto.nome,
            quantity: 1,
            unitPrice: produto.preco_venda,
            totalPrice: produto.preco_venda,
            db_id: produto.id // Guarda o ID real do produto no banco para a finalização
          };
          return [newItem, ...prevItems]; 
        }
      });
      
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsAddingItem(false);
      setBarcodeBuffer(""); // Limpa o buffer
    }
  };

  React.useEffect(() => {
    if (isAddingItem) setSaleStatus("loading");
    else if (barcodeBuffer.length > 0) setSaleStatus("typing");
    else if (saleStatus === 'pagamento');
    else if (cartItems.length > 0) setSaleStatus("em_andamento");
    else if (pdvSession?.status) setSaleStatus(pdvSession.status);
    else setSaleStatus("loading");
  }, [cartItems, barcodeBuffer, isAddingItem, pdvSession, saleStatus]);

  const lastItem = cartItems.length > 0 ? cartItems[0] : null;

  if (!pdvSession) {
      return <PosLoadingSkeleton />;
  }

  const handleSaleSuccess = (vendaId, troco) => {
      toast.success(`Venda #${vendaId} finalizada!`, {
          description: troco > 0 ? `Troco: ${troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : "Pagamento concluído.",
          duration: 10000, 
      });
      setCartItems([]); 
      setIsPaymentModalOpen(false); 
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
          <div className={cn("h-full flex flex-col", pdvSession.status !== 'aberto' && "opacity-50 pointer-events-none")}>
            <SaleItemsList items={cartItems} />
          </div>
        }

        Resume={<SaleResume items={cartItems} />}
        Footer={<PosFooterStatus status={saleStatus} buffer={barcodeBuffer} />}
      />

      <OpenClosePdvModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        actionType={pdvSession.status === 'aberto' ? 'close' : 'open'} 
        pdv={pdvSession}
        refetchData={() => fetchPdvSession(false)} 
        operators={operatorData} 
      />
    </>
  );
}