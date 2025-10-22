// src/components/products/ProductForm.jsx
"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

export function ProductForm({ open, onOpenChange, onProductCreated }) {
  const [formData, setFormData] = React.useState({
    nome: "",
    preco_venda: "",
    quantidade_estoque: "",
    // adicione outros campos aqui
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Converte os valores para os tipos corretos antes de enviar
    const submissionData = {
        ...formData,
        preco_venda: parseFloat(formData.preco_venda),
        quantidade_estoque: parseInt(formData.quantidade_estoque, 10),
    };

    try {
      const response = await fetch('http://localhost:8000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar o produto');
      }

      const newProduct = await response.json();
      alert(`Produto "${newProduct.nome}" criado com sucesso!`);
      onOpenChange(false); // Fecha o modal
      onProductCreated(); // Avisa a tabela para recarregar os dados
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível salvar o produto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo item no estoque.
          </DialogDescription>
        </DialogHeader>
        <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">Nome</Label>
            <Input id="nome" value={formData.nome} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preco_venda" className="text-right">Preço (R$)</Label>
            <Input id="preco_venda" type="number" value={formData.preco_venda} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantidade_estoque" className="text-right">Estoque</Label>
            <Input id="quantidade_estoque" type="number" value={formData.quantidade_estoque} onChange={handleChange} className="col-span-3" />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="product-form">Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}