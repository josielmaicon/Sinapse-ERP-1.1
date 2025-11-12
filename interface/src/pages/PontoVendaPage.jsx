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
import { CancelItemModal } from "@/components/pontovenda/CancelamentoModal"
import { RecoveryModal } from "@/components/pontovenda/ModalRecuperacaoV"
import { SetNextQuantityModal } from "@/components/pontovenda/AjusteQTD"
import { ManualItemModal } from "@/components/pontovenda/ModalDiverso"
import { RecebimentoModal } from "@/components/pontovenda/ModalRecebimento"

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
  const [isCancelItemModalOpen, setIsCancelItemModalOpen] = React.useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = React.useState(false);
  const [saleToRecover, setSaleToRecover] = React.useState(null);
  const [nextQuantity, setNextQuantity] = React.useState(1); 
  const [isQtyModalOpen, setIsQtyModalOpen] = React.useState(false);
  const [isManualItemModalOpen, setIsManualItemModalOpen] = React.useState(false);
  const [isRecebimentoModalOpen, setIsRecebimentoModalOpen] = React.useState(false);

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
      if (isInitialLoad) console.log(`Carregando sessão...`);
      else console.log(`RE-carregando sessão...`);

      const response = await fetch(`${API_URL}/pdvs/session-by-name/${machineName}`); 
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "PDV não encontrado.");
      
      setPdvSession({ ...data, isOnline: navigator.onLine }); 
      
      if (data.status === 'aberto') {
          const foundSale = await loadExistingActiveSale(data);
          if (!foundSale) {
              setSaleStatus("livre"); 
              if (isInitialLoad) toast.success(`Caixa ${data.nome} aberto. Operador: ${data.operador_atual.nome}.`);
          }
      } else {
          setSaleStatus(data.status); // 'fechado'
          if (isInitialLoad) toast.info(`Caixa ${data.nome} está ${data.status}.`, { description: "Pressione F1 para abrir o caixa."});
      }

    } catch (error) {
      toast.error("Falha ao iniciar sessão do PDV", { description: error.message });
      navigate("/"); 
    }
  };

  const handleCancelSale = () => {
      if (cartItems.length === 0) return; 
      setIsCancelSaleModalOpen(true);
  };
  
  const handleCancelItem = () => {
      if (cartItems.length === 0) {
          toast.info("Carrinho vazio. Nada para remover.", { description: "Use Enter para adicionar itens." });
          return;
      }
      setIsCancelItemModalOpen(true);
  };

const handleConfirmSaleCancel = async (adminCreds) => {
    if (!activeSale) {
      toast.error("Erro Interno", { description: "Nenhuma venda ativa para cancelar." });
      return;
    }
    setIsAddingItem(true);
    let errorToThrow = null;
    try {
      const response = await fetch(`${API_URL}/vendas/${activeSale.id}/cancelar`, { 
          method: "POST", // <-- MUDANÇA CRUCIAL
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminCreds) // O POST envia o body
      });
      
      if (response.status === 204) {
          setActiveSale(null);
          setIsCancelItemModalOpen(false); // (Assume que é o modal de item que chama)
          toast.info(`Venda #${activeSale.id} cancelada com sucesso.`);
      
      } else {
          let errorData;
          try {
              errorData = await response.json();
          } catch (parseError) {
              throw new Error(`Erro ${response.status}: ${response.statusText}`);
          }
          
          let detail = "Falha ao cancelar a venda.";
          if (response.status === 422 && Array.isArray(errorData.detail)) {
              detail = errorData.detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(", ");
          } else {
              detail = errorData.detail || "Falha ao cancelar a venda.";
          }

          if (response.status === 401) {
              toast.warning("Autorização Falhou", { description: detail });
          } else {
              toast.error("Erro ao Cancelar Venda", { description: detail });
          }
          throw new Error(detail);
      }
      
    } catch (error) {
        console.error("Falha grave em handleConfirmSaleCancel:", error);
        
        // ✅ CORREÇÃO 4: O bug do 'toast.isActive'
        // 'sonner' não usa 'isActive'. Apenas mostramos o erro.
        // Se quisermos evitar duplicatas, passamos o 'id'
        toast.error("Erro de Comunicação", { 
            id: `err-cancel-${activeSale.id}`, // Evita toasts duplicados
            description: "Não foi possível conectar ao servidor para cancelar a venda." 
        });
        
        errorToThrow = error;
    } finally {
        setIsAddingItem(false);
        if (errorToThrow) {
            throw errorToThrow;
        }
    }
  };

  const handleItemCancelApi = async ({ item_db_id, quantidade_a_remover }, adminCreds) => {
      setIsAddingItem(true);
      let errorToThrow = null;

      try {
          const requestBody = {
              auth: adminCreds ? adminCreds : {}, 
              quantidade: quantidade_a_remover
          };
          console.log(`Tentando remover item: ${item_db_id}, Qtd: ${quantidade_a_remover}, Venda: ${activeSale.id}`);

          const response = await fetch(`${API_URL}/vendas/${activeSale.id}/itens/${item_db_id}/remover`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
          });
          const responseData = await response.json();

          if (!response.ok) {
            if (response.status === 422 && Array.isArray(responseData.detail)) {
                const validationErrors = responseData.detail.map(err => {
                    const field = err.loc[err.loc.length - 1];
                    return `${field}: ${err.msg}`;
                }).join(" | ");
                throw new Error(`Erro de Validação: ${validationErrors}`);
              }

              const detail = responseData.detail || "Erro desconhecido ao remover item.";              
              if (response.status === 401) {
                  toast.warning("Autorização Falhou", { description: detail });
              } else if (response.status === 404) {
                  toast.error("Item não encontrado", { description: "O item pode já ter sido removido." });
              } else if (response.status === 400) {
                  toast.warning("Requisição inválida", { description: detail });
              } else {
                  toast.error("Erro ao Remover Item", { description: detail });
              }
              
              throw new Error(detail);
          }
          setActiveSale(responseData);
          
      } catch (error) {
          console.error("Falha grave em handleItemCancelApi:", error);
          errorToThrow = error;
          if (!toast.isActive(error.message)) {
              toast.error("Erro ao remover item", { id: error.message, description: error.message });
          }
      } finally {
          setIsAddingItem(false);
          if (errorToThrow) {
              throw errorToThrow;
          }
      }
  };


const cartItems = React.useMemo(() => {
    if (!activeSale || !activeSale.itens) {return [];}
    return activeSale.itens.map(item => {
        const isDiverse = !item.produto;
        return ({
            id: item.id,
            name: isDiverse 
                ? `PRODUTO DIVERSO` 
                : item.produto.nome,
            barcode: item.produto?.codigo_barras || 'DIVERSOS', 
            quantity: item.quantidade,
            unitPrice: item.preco_unitario_na_venda,
            totalPrice: item.quantidade * item.preco_unitario_na_venda,
            db_id: item.produto_id,
            item_db_id: item.id
        });
    }).sort((a, b) => b.item_db_id - a.item_db_id);
    
}, [activeSale]);

  const loadExistingActiveSale = async (session) => {
      if (session.status !== 'aberto') {
          setActiveSale(null); 
          return false;
      }
      
      console.log(`Verificando venda em aberto para PDV #${session.id}...`);
      try {
          const response = await fetch(`${API_URL}/vendas/pdvs/${session.id}/venda-ativa`);
          
          if (response.status === 404 || response.status === 204) {
             console.log("Nenhuma venda em aberto encontrada. Caixa livre.");
             setActiveSale(null);
             return false;
          }

          const saleData = await response.json();
          if (!response.ok) throw new Error(saleData.detail || "Falha ao carregar venda");
          
          setSaleToRecover(saleData);
          setIsRecoveryModalOpen(true);
          setSaleStatus("awaiting_recovery");
          return true;
          
      } catch (error) {
         console.log("Nenhum erro, apenas sem venda ativa.");
         setActiveSale(null);
         return false;
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
        if (isModalOpen || isPaymentModalOpen || isQtyModalOpen || saleToRecover || isAddingItem || isManualItemModalOpen || isCancelItemModalOpen || isRecebimentoModalOpen ) return;
        if (e.key === 'F1') {e.preventDefault(); handleOpenCloseModalToggle(); return;}
        if (e.key === 'F3') { e.preventDefault(); handleCancelItem(); return; }
        if (e.key === 'F4') {e.preventDefault(); if (pdvSession?.status === 'aberto') {setIsQtyModalOpen(true);
             } else {
                toast.warning("Caixa Fechado", { description: "Abra o caixa (F1) para definir quantidades." });
             }
             return;
        }   
        if (e.key === 'F5') { e.preventDefault(); handleManualItemLaunch(); return;}     
        if (e.key === 'F2') { e.preventDefault(); if (pdvSession?.status === 'aberto' && cartItems.length > 0) {
               console.log("F2 Pressionado - Iniciando Pagamento"); handlePaymentStart();
           } else if (pdvSession?.status !== 'aberto') {
               toast.warning("Caixa Fechado", { description: "Use F1 para abrir o caixa antes de finalizar." });
           } else {toast.info("Carrinho Vazio", { description: "Adicione itens para finalizar a venda." });}return;}
        if (pdvSession?.status !== 'aberto') {return; }
        if (e.key === 'Enter') {e.preventDefault();if (barcodeBuffer.trim().length > 0) {handleBarcodeSubmit(barcodeBuffer.trim());}return; }
        if (e.key === 'Escape') { e.preventDefault(); setBarcodeBuffer(""); return; }
        if (e.key === 'Backspace') { e.preventDefault(); setBarcodeBuffer(prev => prev.slice(0, -1)); return; }
        if (e.key.length === 1 && e.key.match(/^[a-zA-Z0-9-]$/)) { e.preventDefault(); setBarcodeBuffer(prev => prev + e.key); }
        if (e.key === 'F9') { e.preventDefault(); if (pdvSession?.status === 'aberto') {setIsRecebimentoModalOpen(true);
            } else { toast.warning("Caixa Fechado", { description: "Abra o caixa para realizar recebimentos." }); }
            return;
        }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  
  }, [barcodeBuffer, isAddingItem, saleToRecover, isQtyModalOpen, saleStatus, isManualItemModalOpen, pdvSession, isRecebimentoModalOpen, isModalOpen, isPaymentModalOpen, cartItems, handleCancelItem, handleCancelSale]);

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
    
    // Pega a quantidade do estado (Ex: 1, ou 15 do F4)
    const quantityToUse = nextQuantity; 

    try {
      if (!pdvSession || !pdvSession.operador_atual || !pdvSession.operador_atual.id) {
        toast.error("Sessão Inválida", { description: "Operador não identificado. Tente reabrir o caixa (F1)." });
        throw new Error("Operador não encontrado na sessão.");
      }

      const response = await fetch(`${API_URL}/vendas/adicionar-item-smart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_barras: codigo,
          pdv_id: pdvSession.id,
          operador_id: pdvSession.operador_atual.id,
          quantidade: quantityToUse,
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
      
      if (quantityToUse !== 1) {
          toast.info(`Quantidade ${quantityToUse} aplicada. Próxima Qtd. resetada para 1.`);
      }
      setNextQuantity(1); 
    }
  };

  React.useEffect(() => {
    if (isAddingItem) setSaleStatus("loading");
    else if (isPaymentModalOpen) setSaleStatus("pagamento");
    else if (saleStatus === "awaiting_recovery") { /* Mantém status de espera */ }
    else if (activeSale && cartItems.length > 0) setSaleStatus("em_andamento");
    else if (pdvSession?.status === 'aberto') setSaleStatus("livre");
    else if (pdvSession?.status) setSaleStatus(pdvSession.status);
  }, [cartItems.length, activeSale, pdvSession, isAddingItem, isPaymentModalOpen, saleStatus]);

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
      setSaleStatus("pagamento");
      setIsPaymentModalOpen(true);
  };

  const handleRecoverSale = () => {
      setActiveSale(saleToRecover); 
      setSaleToRecover(null);
      setIsRecoveryModalOpen(false);
      setSaleStatus("em_andamento");
      toast.success(`Venda #${saleToRecover.id} recuperada.`, { description: "Continue adicionando itens." });
  };
  
  const handleDiscardSale = () => {
      setActiveSale(null);
      setSaleToRecover(null);
      setIsRecoveryModalOpen(false);
      setSaleStatus("livre");
  };

  const handleManualItemLaunch = () => {
      if (pdvSession?.status !== 'aberto') {
           toast.warning("Caixa Fechado", { description: "Abra o caixa (F1) para lançar itens." });
           return;
      }
      setIsManualItemModalOpen(true);
  };
  
  const onManualItemAdded = (updatedSale) => {
      setActiveSale(updatedSale);
      setIsManualItemModalOpen(false);
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
        cartItems={cartItems} 
        onConfirmRemoval={handleItemCancelApi}
        onTotalSaleCancel={handleConfirmSaleCancel}
        pdvSession={pdvSession} 
        activeSale={activeSale}
      />
      <RecoveryModal
       open={isRecoveryModalOpen}
       onOpenChange={setIsRecoveryModalOpen}
       sale={saleToRecover}
       pdvSession={pdvSession}
       onRecover={handleRecoverSale}
       onDiscard={handleDiscardSale}
      />
      <SetNextQuantityModal 
        open={isQtyModalOpen}
        onOpenChange={setIsQtyModalOpen}
        currentNextQuantity={nextQuantity}
        onQuantitySet={(qty) => {
            setNextQuantity(qty);
            setIsQtyModalOpen(false);
            toast.info(`Próximo item será adicionado com Qtd: ${qty}`);
        }}
        />
    <ManualItemModal
        open={isManualItemModalOpen}
        onOpenChange={setIsManualItemModalOpen}
        pdvSession={pdvSession}
        onManualItemAdded={onManualItemAdded}
    />
    <RecebimentoModal
        open={isRecebimentoModalOpen}
        onOpenChange={setIsRecebimentoModalOpen}
        pdvSession={pdvSession}
    />
    </>
  );
}
