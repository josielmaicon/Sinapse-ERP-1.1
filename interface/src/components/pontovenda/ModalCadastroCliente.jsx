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
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, UserPlus, Lock } from "lucide-react" // ✅ Adicionado ícone Lock

const API_URL = "http://localhost:8000"; 

export function ClientRegistrationModal({ open, onOpenChange, onClientCreated }) {
  
  const [formData, setFormData] = React.useState({
    nome: '',
    cpf: '',
    telefone: '',
    limite_credito_inicial: 0,
    // ✅ NOVOS CAMPOS DE SENHA
    senha: '',
    senha_confirmacao: ''
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const nameInputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
        // Reseta o form (incluindo senhas)
        setFormData({ nome: '', cpf: '', telefone: '', limite_credito_inicial: 0, senha: '', senha_confirmacao: '' });
        setIsLoading(false);
        setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // ✅ VALIDAÇÕES LOCAIS
    if (!formData.nome) { toast.warning("Nome obrigatório."); return; }
    if (formData.senha.length < 4 || formData.senha.length > 6) {
        toast.warning("A senha deve ter entre 4 e 6 dígitos."); return;
    }
    if (formData.senha !== formData.senha_confirmacao) {
        toast.error("As senhas não coincidem."); return;
    }
    
    setIsLoading(true);
    
    // Prepara os dados (o backend espera 'senha' e 'senha_confirmacao' no schema)
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
        
        toast.success(`Cliente "${newClient.nome}" cadastrado!`, { description: "Acesso liberado com a nova senha." });
        // O cliente retornado já está autenticado (acabou de ser criado),
        // então podemos passá-lo direto sem pedir senha novamente.
        onClientCreated(newClient); 
        onOpenChange(false); 

    } catch (error) {
        console.error(error);
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
            Preencha os dados e defina uma senha numérica (4-6 dígitos) para o cliente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleRegister}>
           <div className="grid gap-4 py-4">
              {/* ... (Campos Nome, CPF, Telefone, Limite - IGUAIS AO ANTERIOR) ... */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="nome-rapido" className="text-right">Nome</Label>
                 <Input id="nome-rapido" name="nome" value={formData.nome} onChange={handleChange} className="col-span-3" ref={nameInputRef} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="cpf-rapido" className="text-right">CPF</Label>
                 <Input id="cpf-rapido" name="cpf" value={formData.cpf} onChange={handleChange} className="col-span-3" />
              </div>
              {/* (Omiti Telefone e Limite para brevidade, mas mantenha-os!) */}

              {/* ✅ NOVOS CAMPOS DE SENHA */}
              <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-muted" />
                  <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Segurança
                  </span>
                  <div className="flex-grow border-t border-muted" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="senha-rapido" className="text-right font-semibold">Senha (PIN)</Label>
                 <Input 
                    id="senha-rapido" 
                    name="senha" 
                    type="password" // Esconde os caracteres
                    inputMode="numeric" // Teclado numérico no mobile
                    maxLength={6}
                    placeholder="4 a 6 dígitos"
                    value={formData.senha} 
                    onChange={handleChange} 
                    className="col-span-3 font-mono tracking-widest" // Estilo para senha
                    required 
                 />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="senha-conf-rapido" className="text-right">Confirmar</Label>
                 <Input 
                    id="senha-conf-rapido" 
                    name="senha_confirmacao" 
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Repita a senha"
                    value={formData.senha_confirmacao} 
                    onChange={handleChange} 
                    className="col-span-3 font-mono tracking-widest"
                    required 
                 />
              </div>

           </div>

           <DialogFooter>
              {/* ... (Botões Cancelar/Salvar - IGUAIS) ... */}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Cadastrar
              </Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}