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
import { Power, Loader2 } from "lucide-react"; // Importar Loader2

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
        if (isModalOpen || isAddingItem) return;
        if (e.key === 'F1') {
           e.preventDefault();
           console.log("F1 Pressionado - Chamando Modal");
           handleOpenCloseModalToggle();
           return;
        }
        
        if (e.key.startsWith('F')) {
            e.preventDefault();
            console.log(`Atalho ${e.key} pressionado (lógica a implementar).`);
            return;
        }

        if (pdvSession?.status !== 'aberto') {
            return; 
        }
        
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
  
  }, [barcodeBuffer, isAddingItem, saleStatus, pdvSession, isModalOpen, operatorData, isLoadingOperators]); 

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
      setCartItems(prevItems => { /* ... (lógica do carrinho) ... */ });
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsAddingItem(false);
      setBarcodeBuffer(""); 
    }
  };

  React.useEffect(() => {
    if (isAddingItem) setSaleStatus("loading");
    else if (barcodeBuffer.length > 0) setSaleStatus("typing");
    else if (cartItems.length > 0) setSaleStatus("em_andamento");
    else if (pdvSession?.status === 'aberto') setSaleStatus("livre");
    else if (pdvSession?.status) setSaleStatus(pdvSession.status); // Ex: 'fechado'
  }, [cartItems, barcodeBuffer, isAddingItem, pdvSession]);

  const lastItem = cartItems.length > 0 ? cartItems[0] : null;

  if (!pdvSession) {
      return <PosLoadingSkeleton />;
  }
  

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