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

// Componente recebe props para controlar visibilidade, dados e atualização
export function EditClientSheet({ open, onOpenChange, client, refetchData }) {
  // Estado local para o formulário
  const [formData, setFormData] = React.useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    // data_vencimento_fatura: '', // Adicionar se for editável
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Preenche o formulário quando o 'client' (prop) mudar
  React.useEffect(() => {
    if (client) {
      setFormData({
        nome: client.nome || '',
        cpf: client.cpf || '',
        telefone: client.telefone || '',
        email: client.email || '',
        // data_vencimento_fatura: client.data_vencimento_fatura || '',
      });
    } else {
      // Limpa se não houver cliente (embora o sheet não deva abrir sem cliente)
      setFormData({ nome: '', cpf: '', telefone: '', email: '' });
    }
  }, [client]); // Roda sempre que o 'client' mudar

  // Handler para atualizar o estado do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para salvar as alterações
  const handleSave = async (e) => {
    e.preventDefault(); // Previne reload da página
    if (!client || isLoading) return;

    setIsLoading(true);

    // Encontra apenas os dados que foram realmente alterados
    const changedData = {};
    for (const key in formData) {
      // Compara com o valor original do cliente, tratando null/undefined como string vazia para comparação
      if (formData[key] !== (client[key] ?? '')) { 
        // Envia null se o campo ficou vazio, senão envia o valor
        changedData[key] = formData[key] === '' ? null : formData[key]; 
      }
    }

    if (Object.keys(changedData).length === 0) {
      toast.info("Nenhuma alteração detectada.");
      setIsLoading(false);
      onOpenChange(false); // Fecha o sheet
      return;
    }

    // Chama a API PUT /clientes/{id}
    const apiPromise = fetch(`/clientes/${client.id}`, { // Assume URL base ou relativa
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedData) // Envia apenas o que mudou
    })
    .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || "Erro ao salvar alterações.");
        }
        return result; 
    });

    toast.promise(apiPromise, {
        loading: `Salvando alterações para ${client.nome}...`,
        success: (updatedClient) => {
            if (typeof refetchData === 'function') {
                 // refetchData já fecha o sheet (conforme passamos na prop)
                refetchData(); 
            } else {
                 onOpenChange(false); // Fecha manualmente se refetchData não existir
            }
            return "Dados do cliente atualizados com sucesso!";
        },
        error: (err) => err.message, 
        finally: () => {
            setIsLoading(false); 
        }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar Cliente: {client?.nome || '...'}</SheetTitle>
          <SheetDescription>
            Faça alterações nos dados cadastrais do cliente aqui. Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        
        {/* Formulário de Edição */}
        <form onSubmit={handleSave}>
           <div className="grid gap-4 p-4">
              {/* Campo Nome */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="nome" className="text-right">Nome</Label>
                 <Input 
                    id="nome" 
                    name="nome" // IMPORTANTE: name deve corresponder à chave no formData
                    value={formData.nome} 
                    onChange={handleChange} 
                    className="col-span-3" 
                    required // Nome é obrigatório?
                 />
              </div>
              {/* Campo CPF */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="cpf" className="text-right">CPF</Label>
                 <Input 
                    id="cpf" 
                    name="cpf"
                    value={formData.cpf} 
                    onChange={handleChange} 
                    className="col-span-3" 
                    // Adicionar máscara de CPF aqui seria ideal
                  />
              </div>
              {/* Campo Telefone */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="telefone" className="text-right">Telefone</Label>
                 <Input 
                    id="telefone" 
                    name="telefone"
                    value={formData.telefone} 
                    onChange={handleChange} 
                    className="col-span-3" 
                    // Adicionar máscara de telefone aqui seria ideal
                  />
              </div>
              {/* Campo Email */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="email" className="text-right">Email</Label>
                 <Input 
                    id="email" 
                    name="email"
                    type="email" // Validação básica de email
                    value={formData.email} 
                    onChange={handleChange} 
                    className="col-span-3" 
                  />
              </div>
              {/* Adicionar outros campos aqui (ex: Data Vencimento Fatura, se editável) */}
           </div>

           <SheetFooter>
              {/* SheetClose é um botão que chama onOpenChange(false) */}
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