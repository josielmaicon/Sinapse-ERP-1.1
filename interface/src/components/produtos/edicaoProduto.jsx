// src/components/products/ProductEditForm.jsx

"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

// Este é um formulário "controlado", que recebe os dados e as funções do seu pai.
export function ProductEditForm({ formData, setFormData, isMultiSelect, onSave }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // A função onSave será a chamada de API real
    try {
      await onSave(formData);
      toast.success("Produto atualizado com sucesso!");
    } catch (error) {
      toast.error("Falha ao salvar", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Layout flex-col para "grudar" o botão no chão
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <ScrollArea className="flex-grow p-4">
        <div className="grid gap-4">
          {/* Campo Nome: Desabilitado em multi-seleção */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">Nome</Label>
            <Input 
              id="nome" 
              value={formData.nome || ""} 
              onChange={handleChange} 
              disabled={isMultiSelect}
              className="col-span-3" 
            />
          </div>
          
          {/* Campo Categoria: Habilitado para edição em lote */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoria" className="text-right">Categoria</Label>
            <Input 
              id="categoria" 
              value={formData.categoria || ""} 
              onChange={handleChange}
              className="col-span-3"
              placeholder={isMultiSelect ? "Manter Múltiplo" : ""}
            />
          </div>
          
          {/* ... (Adicione outros campos aqui, ex: preco_venda, preco_custo) ... */}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preco_venda" className="text-right">Preço Venda</Label>
            <Input 
              id="preco_venda" 
              type="number"
              value={formData.preco_venda || ""} 
              onChange={handleChange} 
              className="col-span-3"
              placeholder={isMultiSelect ? "Manter Múltiplo" : ""}
            />
          </div>

        </div>
      </ScrollArea>
      
      {/* O "chão" com o botão Salvar */}
      <div className="flex-shrink-0 border-t p-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}