"use client"

import * as React from "react"
// ✅ Imports do Router (assumindo que você usa react-router-dom)
import { useParams, useNavigate } from "react-router-dom" 
import { toast } from "sonner"
import ComprasPageLayout from "@/layouts/PontoVendaLayout";
import SaleItemsList from "@/components/pontovenda/itensvenda";
import PosHeaderStatus from "@/components/pontovenda/Header2";
import SaleResume from "@/components/pontovenda/subtotal";
import PosSidePanel from "@/components/pontovenda/PainelLateral";
import PosFooterStatus from "@/components/pontovenda/rodape";
import Logo from "@/components/Logo";
import { Skeleton } from "@/components/ui/skeleton"; // ✅ Para o loading

const API_URL = "http://localhost:8000"; // Ou sua URL base

const PosLoadingSkeleton = () => (
   <div className="h-screen w-screen flex flex-col items-center justify-center p-12 gap-4">
      <Logo variant="full" size="200px" />
      <Skeleton className="h-10 w-64" />
      <p className="text-lg text-muted-foreground">Carregando sessão do Ponto de Venda...</p>
   </div>
)

export default function PontoVenda() {
  const [pdvSession, setPdvSession] = React.useState(null); // Guarda a sessão vinda da API
  const [cartItems, setCartItems] = React.useState([]);
  const [saleStatus, setSaleStatus] = React.useState("loading"); // Começa 'loading'
  const [barcodeBuffer, setBarcodeBuffer] = React.useState(""); // Guarda o que foi digitado
  const [isAddingItem, setIsAddingItem] = React.useState(false); // Loading para o 'Enter'

  const { pdvId } = useParams(); // Pega o ID do caixa da URL (ex: /pontovenda/1)
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!pdvId) {
       toast.error("Erro: ID do PDV não fornecido.");
       navigate("/"); // Volta para a página principal
       return;
    }

    const fetchPdvSession = async () => {
      try {
        const response = await fetch(`${API_URL}/pdvs/${pdvId}/session`); // ✅ Chama a nova Rota de Sessão
        const data = await response.json();
        
        if (!response.ok) {
           throw new Error(data.detail || "Caixa não está aberto ou não foi encontrado.");
        }
        
        setPdvSession({ ...data, isOnline: navigator.onLine }); // Guarda dados da API + status online
        setSaleStatus("livre");
        toast.success(`Caixa ${data.nome} aberto. Operador: ${data.operador_atual.nome}.`);

      } catch (error) {
        toast.error("Falha ao iniciar sessão do PDV", { description: error.message });
        navigate("/"); // Falha ao buscar, volta para o início
      }
    };
    
    fetchPdvSession();
  }, [pdvId, navigate]);

  React.useEffect(() => {
    const handleKeyPress = (e) => {
        if (saleStatus !== 'livre' && saleStatus !== 'em_andamento' && saleStatus !== 'typing') return;
        if (isAddingItem) return; 

        if (e.key.startsWith('F')) {
            // handleHotKey(e.key);
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (barcodeBuffer.trim().length > 0) {
                handleBarcodeSubmit(barcodeBuffer.trim());
            }
            return;
        }
        
        if (e.key === 'Escape') {
            e.preventDefault();
            setBarcodeBuffer("");
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            setBarcodeBuffer(prev => prev.slice(0, -1));
            return;
        }
        
        if (e.key.length === 1 && /^[a-zA-Z0-9-]$/.test(e.key)) {
            e.preventDefault();
            setBarcodeBuffer(prev => prev + e.key);
        }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
        document.removeEventListener('keydown', handleKeyPress);
    };
  }, [barcodeBuffer, isAddingItem, saleStatus]); // Re-cria o listener se o estado mudar

  React.useEffect(() => {
      const handleOnline = () => setPdvSession(prev => ({ ...prev, isOnline: true }));
      const handleOffline = () => setPdvSession(prev => ({ ...prev, isOnline: false }));

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const handleBarcodeSubmit = async (codigo) => {
    setIsAddingItem(true);
    setSaleStatus("em_andamento"); // Garante que está em andamento

    try {
      const response = await fetch(`${API_URL}/produtos/barcode/${codigo}`); // ✅ Chama a nova Rota de Barcode
      
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
            db_id: produto.id 
          };
          return [newItem, ...prevItems]; // ✅ Adiciona no TOPO da lista
        }
      });
      
      
    } catch (error) {
      console.error(error);
      toast.error(error.message); // Ex: "Produto '123' não encontrado"
    } finally {
      setIsAddingItem(false);
      setBarcodeBuffer(""); // Limpa o buffer após a tentativa
    }
  };
  
  React.useEffect(() => {
    if (isAddingItem) {
        setSaleStatus("loading"); // Mostra um status de "buscando..."
    } else if (barcodeBuffer.length > 0) {
        setSaleStatus("typing"); // Mostra o que está sendo digitado
    } else if (cartItems.length > 0) {
        setSaleStatus("em_andamento");
    } else {
        setSaleStatus("livre");
    }
  }, [cartItems, barcodeBuffer, isAddingItem]);

  const lastItem = cartItems.length > 0 ? cartItems[0] : null; // ✅ Pega o item 0 (o último adicionado)

  if (saleStatus === 'loading' || !pdvSession) {
      return <PosLoadingSkeleton />;
  }

  return (
    <ComprasPageLayout
      Header1={<Logo variant="full" size="180px" />}
      Header2={<PosHeaderStatus session={pdvSession} />} // ✅ Passa a sessão REAL
 
      SidePanel={<PosSidePanel lastItem={lastItem} />} // ✅ Passa o último item REAL

      MainContent={<SaleItemsList items={cartItems} />} // ✅ Passa o carrinho REAL
      Resume={<SaleResume items={cartItems} />} // ✅ Passa o carrinho REAL

      Footer={<PosFooterStatus status={saleStatus} buffer={barcodeBuffer} />}
    />
  );
}