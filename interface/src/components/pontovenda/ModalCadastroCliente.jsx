"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" // Usamos Dialog, não Sheet
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

const API_URL = "http://localhost:8000";

export function ClientRegistrationModal({ open, onOpenChange, onClientCreated }) {
  
  const [formData, setFormData] = React.useState({
    nome: '',
    cpf: '',
    telefone: '',
    limite_credito_inicial: 0, // Opcional
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Foco no primeiro campo ao abrir
  const nameInputRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
        // Reseta o form
        setFormData({ nome: '', cpf: '', telefone: '', limite_credito_inicial: 0 });
        setIsLoading(false);
        // Foca no campo "Nome"
        setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading || !formData.nome) {
      toast.warning("O nome do cliente é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    
    const dataToSend = {
        ...formData,
        limite_credito_inicial: parseFloat(formData.limite_credito_inicial) || 0
    };

    try {
        const response = await fetch(`${API_URL}/clientes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        
        const newClient = await response.json();
        
        if (!response.ok) {
            throw new Error(newClient.detail || "Falha ao cadastrar cliente.");
        }
        
        toast.success(`Cliente "${newClient.nome}" cadastrado com sucesso!`);
        onClientCreated(newClient);
        onOpenChange(false);

    } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        toast.error("Erro no Cadastro", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-center justify-center text-primary mb-2">
                <UserPlus className="h-8 w-8" />
            </div>
          <DialogTitle className="text-xl text-center">Cadastro Rápido de Cliente</DialogTitle>
          <DialogDescription className="text-center">
            Preencha os dados essenciais. O dia de vencimento será definido como hoje (Dia {new Date().getDate()}).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleRegister}>
           <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="nome-rapido" className="text-right">Nome</Label>
                 <Input 
                    id="nome-rapido" 
                    name="nome"
                    value={formData.nome} 
                    onChange={handleChange} 
                    className="col-span-3" 
                    ref={nameInputRef}
                    required 
                 />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="cpf-rapido" className="text-right">CPF</Label>
                 <Input id="cpf-rapido" name="cpf" value={formData.cpf} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="telefone-rapido" className="text-right">Telefone</Label>
                 <Input id="telefone-rapido" name="telefone" value={formData.telefone} onChange={handleChange} className="col-span-3" />
              </div>
               {/* Opcional: Definir limite inicial (ou deixar 0) */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="limite-rapido" className="text-right">Limite Inicial</Label>
                 <Input id="limite-rapido" name="limite_credito_inicial" type="number" value={formData.limite_credito_inicial} onChange={handleChange} className="col-span-3" />
              </div>
           </div>

           <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Cadastrar e Selecionar
              </Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}