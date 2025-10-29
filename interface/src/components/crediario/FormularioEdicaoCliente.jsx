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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format, parse } from "date-fns" 
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react" // <--- O ÍCONE ESTÁ AQUI
import { Calendar } from "@/components/ui/calendar"

const API_URL = "http://localhost:8000";

// Componente recebe props para controlar visibilidade, dados e atualização
export function EditClientSheet({ open, onOpenChange, client, refetchData }) {
  // Estado local para o formulário
  const [formData, setFormData] = React.useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    data_vencimento_obj: null, // O 'Date' object para o Calendar
    data_vencimento_texto: '', // A 'string' dd/MM/yyyy para o Input
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
        data_vencimento_fatura: client.data_vencimento_fatura || '',
      });
    } else {
      // Limpa se não houver cliente (embora o sheet não deva abrir sem cliente)
      setFormData({ nome: '', cpf: '', telefone: '', email: '' });
    }
  }, [client]); // Roda sempre que o 'client' mudar

  const handleCalendarSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      data_vencimento_obj: date,
      data_vencimento_texto: date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : ""
    }));
    // O Popover do shadcn/ui fecha sozinho no onSelect, o que é ótimo
  };

  const handleDateChange = (e) => {
    let value = e.target.value;
    // Máscara (simplificada): dd/MM/yyyy
    value = value.replace(/[^0-9]/g, ''); // Remove não-números
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
    
    let dateObj = null;
    // Tenta converter o texto de volta para um Date object
    if (value.length === 10) {
      try {
        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
        if (!isNaN(parsedDate)) {
          dateObj = parsedDate; // Sincroniza o calendário
        }
      } catch { /* data inválida, ignora */ }
    }
    
    setFormData(prev => ({
        ...prev,
        data_vencimento_texto: value, // Atualiza o texto
        data_vencimento_obj: dateObj  // Atualiza o Date (ou null se inválido)
    }));
  };
  
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
    const apiPromise = fetch(`${API_URL}/clientes/${client.id}`, { // <-- USA API_URL
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
      <SheetContent className="edit-cadastro-cliente">
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
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="data_vencimento_fatura" className="text-right">Vencimento</Label>
                 <div className="col-span-3 flex items-center gap-2">
                    <Input 
                      id="data_vencimento_fatura" 
                      name="data_vencimento_fatura" // O 'name' é só para referência, usamos 'handleDateChange'
                      placeholder="DD/MM/AAAA" 
                      value={formData.data_vencimento_texto} // Ligado ao estado de TEXTO
                      onChange={handleDateChange} // Usa o handler de máscara
                      maxLength={10}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                            <CalendarIcon className="h-4 w-4" /> 
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                           mode="single" 
                           selected={formData.data_vencimento_obj} 
                           onSelect={handleCalendarSelect} 
                           initialFocus 
                           locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
              </div>
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