"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom" 
import { toast } from "sonner"
import ComprasPageLayout from "@/layouts/PontoVendaLayout";
import SaleItemsList from "@/components/pontovenda/itensvenda";
import PosHeaderStatus from "@/components/pontovenda/Header2";
import SaleResume from "@/components/pontovenda/subtotal";
import PosSidePanel from "@/components/pontovenda/PainelLateral";
import PosFooterStatus from "@/components/pontovenda/rodape";
import Logo from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton"; 

const API_URL = "http://localhost:8000";

const PosLoadingSkeleton = () => (
   <div className="h-screen w-screen flex flex-col items-center justify-center p-12 gap-4">
      <Logo variant="full" size="200px" />
      <Skeleton className="h-10 w-64" />
      <p className="text-lg text-muted-foreground">Carregando sessão do Ponto de Venda...</p>
   </div>
)

export default function PontoVenda() {
  const [pdvSession, setPdvSession] = React.useState(null); 
  const [cartItems, setCartItems] = React.useState([]);
  const [saleStatus, setSaleStatus] = React.useState("loading"); 
  const [barcodeBuffer, setBarcodeBuffer] = React.useState(""); 
  const [isAddingItem, setIsAddingItem] = React.useState(false); 


  const navigate = useNavigate();

  React.useEffect(() => {
    const machineName = localStorage.getItem('ACTIVE_PDV_NAME');
    if (!machineName) {
       toast.error("Erro: Nenhuma sessão de PDV definida.", { description: "A interface de venda foi aberta incorretamente."});
       navigate("/");
       return;
    }
    const fetchPdvSession = async () => {
      try {
        console.log(`Carregando sessão para PDV com nome: ${machineName}`);
        const response = await fetch(`${API_URL}/api/pdvs/session-by-name/${machineName}`); 
        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.detail || "Caixa não está aberto ou não foi encontrado.");
        }
        
        setPdvSession({ ...data, isOnline: navigator.onLine }); 
        setSaleStatus("livre");
        toast.success(`Caixa ${data.nome} aberto. Operador: ${data.operador_atual.nome}.`);

      } catch (error) {
        toast.error("Falha ao iniciar sessão do PDV", { description: error.message });
        navigate("/"); 
      }
    };
    fetchPdvSession();
  }, [navigate]); 


  React.useEffect(() => {
    const handleKeyPress = (e) => {
        // Ignora digitação se um modal estiver aberto (pagamento, etc) ou buscando
        if (saleStatus !== 'livre' && saleStatus !== 'em_andamento' && saleStatus !== 'typing') return;
        if (isAddingItem) return; 

        // F1, F2, etc. (atalhos)
        if (e.key.startsWith('F')) {
            e.preventDefault();
            console.log(`Atalho ${e.key} pressionado (lógica a implementar).`);
            // Ex: if (e.key === 'F2') { ... lógica de pesquisar produto ... }
            return;
        }

        // Se apertar Enter: Submete o buffer
        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeBuffer.trim().length > 0) {
                handleBarcodeSubmit(barcodeBuffer.trim());
            }
            return;
        }
        
        // Se apertar Escape: Limpa o buffer
        if (e.key === 'Escape') {
            e.preventDefault();
            setBarcodeBuffer("");
            return;
        }

        // Se apertar Backspace: Remove o último caractere
        if (e.key === 'Backspace') {
            e.preventDefault();
            setBarcodeBuffer(prev => prev.slice(0, -1));
            return;
        }
        
        // Se for um caractere "normal" (letra, número, hífen)
        if (e.key.length === 1 && e.key.match(/^[a-zA-Z0-9-]$/)) {
            e.preventDefault();
            setBarcodeBuffer(prev => prev + e.key);
        }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
        document.removeEventListener('keydown', handleKeyPress);
    };
  }, [barcodeBuffer, isAddingItem, saleStatus]); 

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
              ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
              : item
          );
        } else {
          const newItem = {
            id: produto.codigo_barras,
            name: produto.nome,
            quantity: 1,
            unitPrice: produto.preco_venda,
            totalPrice: produto.preco_venda,
            db_id: produto.id // ID do produto no banco
          };
          return [newItem, ...prevItems]; // Adiciona no TOPO
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
    if (isAddingItem) {
        setSaleStatus("loading"); // "Buscando..."
    } else if (barcodeBuffer.length > 0) {
        setSaleStatus("typing"); // "Digitando..."
    } else if (cartItems.length > 0) {
        setSaleStatus("em_andamento");
    } else {
        setSaleStatus("livre");
    }
  }, [cartItems, barcodeBuffer, isAddingItem]);

  const lastItem = cartItems.length > 0 ? cartItems[0] : null;

  if (!pdvSession) { // Mostra loading ENQUANTO pdvSession for nulo
      return <PosLoadingSkeleton />;
  }

  return (
	<ComprasPageLayout
    Header1={<Logo variant="full" size="180px" />}
    Header2={<PosHeaderStatus session={pdvSession} />} 
    SidePanel={<PosSidePanel lastItem={lastItem} />}
    MainContent={<SaleItemsList items={cartItems} />} 
    Resume={<SaleResume items={cartItems} />}
    Footer={<PosFooterStatus status={saleStatus} buffer={barcodeBuffer} />}
 	/>
 );
}