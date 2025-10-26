// src/components/PainelDetalheProduto.jsx

"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { User, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit, History } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductEditForm } from "./edicaoProduto"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

// --- MAPA DE ÍCONES PARA O LOG ---
const logTypeDetails = {
  venda: { text: "Saída por venda", color: "text-blue-600", icon: ArrowDownCircle },
  entrada: { text: "Entrada em estoque", color: "text-green-600", icon: ArrowUpCircle },
  ajuste: { text: "Ajuste manual", color: "text-amber-500", icon: Edit },
  perda: { text: "Perda / avaria", color: "text-destructive", icon: AlertCircle },
};

// --- COMPONENTE DO HISTÓRICO ---
const MovementLog = ({ logData, isLoading }) => {
  return (
    <div className="flex-grow flex flex-col min-h-0">
      <Separator className="my-4" />
      <h4 className="font-semibold mb-2 flex-shrink-0">Histórico de Movimentações</h4>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="flex flex-col gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex flex-col gap-2 w-full"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
              </div>
            ))
          ) : logData.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">Nenhuma movimentação registrada.</p>
          ) : (
            logData.map((log) => {
              const details = logTypeDetails[log.tipo] || { icon: History, color: "text-gray-500", text: log.tipo };
              const Icon = details.icon;
              return (
                <div key={log.id} className="flex items-start gap-4">
                  <Icon className={`mt-1 h-5 w-5 flex-shrink-0 ${details.color}`} />
                  <div className="flex flex-col">
                    <p className="font-medium">
                      <strong>{log.quantidade > 0 ? `+${log.quantidade}` : log.quantidade} unidades</strong> ({details.text})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {log.usuario}
                    </p>
                    {log.nota && <p className="text-xs text-muted-foreground italic">Obs: {log.nota}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE AUXILIAR PARA LINHAS DE DETALHE ---
const DetailRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "--"}</span>
  </div>
);

// --- DOSSIÊ (ABA VISUALIZAR) ---
const ProductView = ({ product, movementLog, isLoadingLog }) => {
  const margin = (product.preco_venda && product.preco_custo)
    ? ((product.preco_venda - product.preco_custo) / product.preco_venda) * 100
    : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Detalhes (parte fixa) */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">{product.nome}</h3>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Financeiro</h4>
          <DetailRow label="Preço de Custo" value={product.preco_custo?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "--"} />
          <DetailRow label="Preço de Venda" value={product.preco_venda?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
          <DetailRow label="Margem" value={`${margin.toFixed(2)}%`} />
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Estoque</h4>
          <DetailRow label="Quantidade Atual" value={product.quantidade_estoque} />
          <DetailRow label="SKU" value={product.codigo_barras} />
          <DetailRow label="Categoria" value={product.categoria} />
        </div>
      </div>
      
      {/* Histórico (parte rolável) */}
      <MovementLog logData={movementLog} isLoading={isLoadingLog} />
    </div>
  );
};


// --- COMPONENTE PRINCIPAL (O CÉREBRO) ---
export default function ProductDetailPanel({ selectedProducts, refetchData }) {
  const [activeTab, setActiveTab] = React.useState("visualizar");
  const [formData, setFormData] = React.useState({});
  const [movementLog, setMovementLog] = React.useState([]);
  const [isLoadingLog, setIsLoadingLog] = React.useState(false);

  const isMultiSelect = selectedProducts.length > 1;
  const singleProduct = selectedProducts.length === 1 ? selectedProducts[0] : null;

  // Sincroniza o formulário E busca o histórico
  React.useEffect(() => {
    setMovementLog([]); // Sempre reseta o histórico

    if (selectedProducts.length === 1) {
      // --- CASO 1: SELEÇÃO ÚNICA ---
      const product = selectedProducts[0];
      setFormData(product);
      setActiveTab("visualizar"); // Fica na aba de visualização
      
      // Busca o histórico de movimentações
      const fetchHistory = async () => {
        setIsLoadingLog(true);
        try {
          const res = await fetch(`http://localhost:8000/api/produtos/${product.id}/historico`);
          if (!res.ok) throw new Error("Falha ao buscar histórico");
          const data = await res.json();
          setMovementLog(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingLog(false);
        }
      };
      fetchHistory();
      
    } else if (selectedProducts.length > 1) {
      // --- ✅ CASO 2: MULTI-SELEÇÃO (SUA NOVA LÓGICA) ---
      // Prepara o formulário para edição em lote
      setFormData({
        categoria: "",
        preco_venda: "",
        preco_custo: "",
      });
      // Pula direto para a aba de edição
      setActiveTab("editar"); 

    } else {
      // --- CASO 0: NADA SELECIONADO ---
      setFormData({});
      setActiveTab("visualizar"); // Reseta para a aba padrão
    }
  }, [selectedProducts]); // Este efeito roda sempre que a seleção de produtos mudar

  // Função que será chamada pelo formulário para salvar
  const handleSave = async (updatedData) => {
    try {
      if (isMultiSelect) {
        // --- LÓGICA DE MULTI-SELEÇÃO ---
        console.log("Salvando múltiplos produtos:", updatedData);
        toast.info("A atualização em lote ainda não foi implementada.");
        // TODO: Implementar API de batch-update
      } else {
        // --- LÓGICA DE SELEÇÃO ÚNICA ---
        const productId = singleProduct.id;
        const changedData = {};
        for (const key in updatedData) {
          if (updatedData[key] !== singleProduct[key]) {
            changedData[key] = updatedData[key];
          }
        }
        
        if (Object.keys(changedData).length === 0) {
            toast.info("Nenhuma alteração detectada.");
            return;
        }

        const response = await fetch(`http://localhost:8000/api/produtos/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changedData),
        });
        
        if (!response.ok) throw new Error("Falha ao salvar no servidor");
      }
      
      toast.success("Alterações salvas com sucesso!");
      refetchData();
      
    } catch (error) {
        toast.error("Erro ao salvar", { description: error.message });
    }
  };

  // Se nenhum produto estiver selecionado
  if (selectedProducts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <User className="h-12 w-12 mb-4" />
        <h3 className="font-semibold">Nenhum produto selecionado</h3>
        <p className="text-sm">Selecione um produto na tabela para ver seus detalhes.</p>
      </div>
    );
  }

  // Se um ou mais produtos estiverem selecionados
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
        <TabsTrigger value="editar">Editar</TabsTrigger>
      </TabsList>
      
      <TabsContent value="visualizar" className="flex-grow overflow-y-auto">
        {isMultiSelect ? (
          <div className="p-4">
            <h3 className="font-semibold">{selectedProducts.length} produtos selecionados</h3>
            <p className="text-sm text-muted-foreground">Mude para a aba "Editar" para alterar propriedades em comum.</p>
          </div>
        ) : (
          <ProductView 
            product={singleProduct} 
            movementLog={movementLog}
            isLoadingLog={isLoadingLog}
          />
        )}
      </TabsContent>
      
      <TabsContent value="editar" className="flex-grow">
        <ProductEditForm 
          formData={formData}
          setFormData={setFormData}
          isMultiSelect={isMultiSelect}
          onSave={handleSave}
        />
      </TabsContent>
    </Tabs>
  );
}