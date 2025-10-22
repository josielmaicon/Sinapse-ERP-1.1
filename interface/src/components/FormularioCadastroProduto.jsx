// src/components/products/ProductForm.jsx
"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area" // ✅ Para formulários longos

export function ProductForm({ open, onOpenChange, onProductCreated }) {
  // ✅ 1. ESTADO INICIAL ATUALIZADO com todos os campos
  const [formData, setFormData] = React.useState({
    nome: "",
    codigo_barras: "",
    categoria: "",
    quantidade_estoque: "",
    preco_custo: "",
    preco_venda: "",
    ncm: "",
    cfop: "",
    cst: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ✅ 2. CONVERSÃO DE DADOS ATUALIZADA para todos os campos numéricos
    const submissionData = {
      ...formData,
      preco_venda: parseFloat(formData.preco_venda) || 0,
      preco_custo: parseFloat(formData.preco_custo) || 0,
      quantidade_estoque: parseInt(formData.quantidade_estoque, 10) || 0,
    };

    try {
      const response = await fetch('http://localhost:8000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend:", errorData);
        throw new Error(`Falha ao criar o produto: ${errorData.detail}`);
      }

      const newProduct = await response.json();
      alert(`Produto "${newProduct.nome}" criado com sucesso!`);
      onOpenChange(false);
      onProductCreated();
    } catch (error) {
      console.error("Erro:", error);
      alert(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo item no estoque.
          </DialogDescription>
        </DialogHeader>
        {/* ✅ 3. FORMULÁRIO ATUALIZADO com todos os campos e ScrollArea */}
        <ScrollArea className="max-h-[70vh] pr-6">
            <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
                {/* --- Identificação --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">Nome</Label>
                    <Input id="nome" value={formData.nome} onChange={handleChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="codigo_barras" className="text-right">Cód. Barras</Label>
                    <Input id="codigo_barras" value={formData.codigo_barras} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">Categoria</Label>
                    <Input id="categoria" value={formData.categoria} onChange={handleChange} className="col-span-3" />
                </div>

                {/* --- Estoque e Preço --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantidade_estoque" className="text-right">Estoque</Label>
                    <Input id="quantidade_estoque" type="number" value={formData.quantidade_estoque} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="preco_custo" className="text-right">Preço Custo</Label>
                    <Input id="preco_custo" type="number" step="0.01" value={formData.preco_custo} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="preco_venda" className="text-right">Preço Venda</Label>
                    <Input id="preco_venda" type="number" step="0.01" value={formData.preco_venda} onChange={handleChange} className="col-span-3" required />
                </div>

                {/* --- Fiscal --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ncm" className="text-right">NCM</Label>
                    <Input id="ncm" value={formData.ncm} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cfop" className="text-right">CFOP</Label>
                    <Input id="cfop" value={formData.cfop} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cst" className="text-right">CST</Label>
                    <Input id="cst" value={formData.cst} onChange={handleChange} className="col-span-3" />
                </div>
            </form>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" form="product-form">Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}