"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
// ❌ Removemos todos os imports de Popover, Calendar, date-fns, CalendarIcon

const API_URL = "http://localhost:8000"; // Ou sua URL base

export function EditClientSheet({ open, onOpenChange, client, refetchData }) {
  
  // ✅ 1. Estado SIMPLIFICADO para o dia (string)
  const [formData, setFormData] = React.useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    dia_vencimento_fatura: '', // Armazena o dia (1-31) como string
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // ✅ 2. useEffect CORRIGIDO (Preenche TODOS os campos)
  React.useEffect(() => {
    if (client) {
      console.log("Preenchendo Sheet com dados do cliente:", client); // Log de depuração
      setFormData({
        nome: client.nome || '',
        cpf: client.cpf || '',
        telefone: client.telefone || '',       // <-- BUG CORRIGIDO
        email: client.email || '',           // <-- BUG CORRIGIDO
        // Converte o dia (número ou null) vindo da API para string
        dia_vencimento_fatura: client.dia_vencimento_fatura ? String(client.dia_vencimento_fatura) : '', 
      });
    } else {
      // Limpa todos os campos
      setFormData({ nome: '', cpf: '', telefone: '', email: '', dia_vencimento_fatura: '' });
    }
  }, [client, open]); // Re-popula ao abrir ou ao mudar o cliente

  // Handler genérico (funciona para type="number" também)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para salvar
  const handleSave = async (e) => {
    e.preventDefault(); 
    if (!client || isLoading) return;
    setIsLoading(true);

    const diaVencNum = formData.dia_vencimento_fatura ? parseInt(formData.dia_vencimento_fatura, 10) : null;
    if (diaVencNum !== null && (diaVencNum < 1 || diaVencNum > 31)) {
         toast.error("Dia de vencimento inválido. Use um número de 1 a 31.");
         setIsLoading(false);
         return;
    }
    
    // Objeto de dados limpos para enviar
    const dataToSend = {
        nome: formData.nome || null,
        cpf: formData.cpf || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        dia_vencimento_fatura: diaVencNum // Envia o número (ou null)
    };

    // Verifica se algo realmente mudou
    const hasChanges = (
        dataToSend.nome !== (client.nome || null) ||
        dataToSend.cpf !== (client.cpf || null) ||
        dataToSend.telefone !== (client.telefone || null) ||
        dataToSend.email !== (client.email || null) ||
        dataToSend.dia_vencimento_fatura !== (client.dia_vencimento_fatura || null)
    );

    if (!hasChanges) {
      toast.info("Nenhuma alteração detectada.");
      setIsLoading(false);
      onOpenChange(false);
      return;
    }

    // A API que edita dados pessoais é a /clientes/{id} (PUT)
    // Precisamos ter certeza que o schema ClienteUpdatePersonal aceita dia_vencimento_fatura
    const apiPromise = fetch(`${API_URL}/clientes/${client.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Lembre-se que esta rota usa o schema ClienteUpdatePersonal
        body: JSON.stringify(dataToSend) 
    })
    .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || "Erro ao salvar alterações.");
        }
        return result; 
    });

    toast.promise(apiPromise, {
        loading: `Salvando alterações...`,
        success: (updatedClient) => {
            if (typeof refetchData === 'function') {
                refetchData(); // refetchData deve fechar o sheet
            } else {
                 onOpenChange(false); 
            }
            return "Dados do cliente atualizados!";
        },
        error: (err) => err.message, 
        finally: () => setIsLoading(false) 
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="edit-cadastro-cliente sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Cliente: {client?.nome || '...'}</SheetTitle>
          <SheetDescription>
            Faça alterações nos dados cadastrais do cliente aqui.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSave}>
           <div className="grid gap-4 p-6">
              {/* Campos Nome, CPF, Telefone, Email */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="nome" className="text-right">Nome</Label>
                 <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="cpf" className="text-right">CPF</Label>
                 <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="telefone" className="text-right">Telefone</Label>
                 <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="email" className="text-right">Email</Label>
                 <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
              </div>
              
              {/* ✅ 3. CAMPO DE DATA SIMPLIFICADO */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="dia_vencimento_fatura" className="text-right">Dia Vencim.</Label>
                 <Input 
                    id="dia_vencimento_fatura" 
                    name="dia_vencimento_fatura"
                    type="number" 
                    min="1"
                    max="31"
                    placeholder="Ex: 10" 
                    value={formData.dia_vencimento_fatura} 
                    onChange={handleChange} 
                    className="col-span-3" 
                  />
              </div>
           </div> 

           <SheetFooter className="mt-4">
              <SheetClose asChild> 
                 <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
              </SheetClose>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Salvar Alterações
              </Button>
           </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}