"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, UserPlus, Search } from "lucide-react"
import { ClientRegistrationModal } from "./ModalCadastroCliente"
import { Kbd } from "../ui/kbd"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ClientPinModal } from "./ModalSenhaCliente"

const API_URL = "http://localhost:8000"; // (Ou sua URL base)

// Componente recebe 'open', 'onOpenChange' e o callback 'onClientSelect'
export function ClientSelectionModal({ open, onOpenChange, onClientSelect }) {
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [clientList, setClientList] = React.useState([]);
  const [selectedClientId, setSelectedClientId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [clientToVerify, setClientToVerify] = React.useState(null); // Guarda quem está sendo verificado

  // Estado para o modal de cadastro Rápido
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);

  const searchInputRef = React.useRef(null);

  // ✅ Efeito: Foca no input de busca ao abrir
  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      // Reseta o modal
      setSearchQuery("");
      setClientList([]);
      setSelectedClientId(null);
      setErrorMessage("");
      // Busca inicial (opcional, pode ser melhor buscar só no 'handleSearch')
      handleSearch(""); 
    }
  }, [open]);
  
  // --- Funções ---

  // Busca os clientes no backend (com filtro de nome/cpf)
  const handleSearch = async (query = searchQuery) => {
      setIsLoading(true);
      setErrorMessage("");
      try {
          // ✅ Chama a rota de listagem de clientes (com query de busca)
          // (Assumindo que sua rota GET /clientes aceita ?search=...)
          // (Se não, precisamos criar a rota 'GET /clientes/search?q=...')
          // Por enquanto, usaremos a rota que lista TODOS
          const response = await fetch(`${API_URL}/clientes/`); 
          
          const clients = await response.json();
          if (!response.ok) throw new Error(clients.detail || "Falha ao buscar clientes.");
          
          // Filtra no frontend (simulação, o ideal é o backend fazer isso)
          const lowerQuery = query.toLowerCase();
          const filteredClients = clients.filter(c => 
              c.nome.toLowerCase().includes(lowerQuery) ||
              c.cpf?.includes(lowerQuery)
          );

          setClientList(filteredClients);
          if(filteredClients.length > 0) {
              setSelectedClientId(filteredClients[0].id); // Seleciona o primeiro
          }

      } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          setErrorMessage(error.message);
      } finally {
          setIsLoading(false);
      }
  };

const handleConfirmSelection = () => {
      const selectedClient = clientList.find(c => c.id === selectedClientId);
      if (selectedClient) {
          setClientToVerify(selectedClient); 
          setIsPinModalOpen(true);
      } else {
          toast.warning("Nenhum cliente selecionado.");
      }
  };

  const handlePinVerified = (verifiedClient) => {
      onClientSelect(verifiedClient);
      onOpenChange(false);
  };

  const handleClientCreated = (newClient) => {
      onClientSelect(newClient);
      onOpenChange(false);
  };
  
  // --- Atalhos de Teclado (Específicos deste Modal) ---
  React.useEffect(() => {
      const handleKeyDown = (e) => {
          if (!open || isRegisterOpen || isPinModalOpen) return; // Só funciona se este modal estiver ativo

          if (e.key === 'ArrowDown') {
              e.preventDefault();
              const currentIndex = clientList.findIndex(c => c.id === selectedClientId);
              const nextIndex = Math.min(currentIndex + 1, clientList.length - 1);
              setSelectedClientId(clientList[nextIndex].id);
          }
          if (e.key === 'ArrowUp') {
              e.preventDefault();
              const currentIndex = clientList.findIndex(c => c.id === selectedClientId);
              const nextIndex = Math.max(currentIndex - 1, 0);
              setSelectedClientId(clientList[nextIndex].id);
          }
          if (e.key === 'F1') {
              e.preventDefault();
              handleConfirmSelection();
          }
           if (e.key === 'F2') { // F2 para Novo Cadastro
              e.preventDefault();
              setIsRegisterOpen(true);
          }
          if (e.key === 'Escape') {
              e.preventDefault();
              onOpenChange(false);
          }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isRegisterOpen, clientList, isPinModalOpen, selectedClientId, handleConfirmSelection]);


  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Selecionar Cliente (Crediário)</DialogTitle>
          <DialogDescription>
            Busque pelo nome ou CPF. Use <Kbd>&uarr;</Kbd> <Kbd>&darr;</Kbd> para navegar, <Kbd>F1</Kbd> para confirmar.
          </DialogDescription>
        </DialogHeader>
        
        {/* Barra de Busca e Botão Novo */}
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={searchInputRef}
                    placeholder="Buscar por Nome ou CPF..."
                    className="pl-8" // Padding para o ícone
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDownCapture={(e) => { if (e.key === 'Enter') handleSearch(); }}
                />
            </div>
            <Button variant="outline" onClick={() => handleSearch()}>Buscar</Button>
            <Button onClick={() => setIsRegisterOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Novo <Kbd className="ml-2">F2</Kbd>
            </Button>
        </div>

        {/* Lista de Clientes */}
        <div className="flex-grow overflow-y-auto border rounded-md">
            {isLoading && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando...
                </div>
            )}
            {!isLoading && errorMessage && (
                <div className="flex items-center justify-center h-full text-destructive p-4">
                   {errorMessage}
                </div>
            )}
            {!isLoading && !errorMessage && clientList.length === 0 && (
                 <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                   Nenhum cliente encontrado.
                </div>
            )}
            {!isLoading && !errorMessage && clientList.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead className="text-right">Saldo Devedor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientList.map((client) => (
                            <TableRow 
                                key={client.id}
                                data-state={client.id === selectedClientId && "selected"}
                                onDoubleClick={handleConfirmSelection}
                                onClick={() => setSelectedClientId(client.id)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-medium">{client.nome}</TableCell>
                                <TableCell>{client.cpf || "---"}</TableCell>
                                <TableCell className={cn(
                                    "text-right",
                                    client.status_conta === 'atrasado' && "text-destructive"
                                )}>
                                    {client.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar <Kbd className="ml-2">Esc</Kbd>
          </Button>
          <Button onClick={handleConfirmSelection} disabled={!selectedClientId}>
            Confirmar Seleção <Kbd className="ml-2">F1</Kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <ClientRegistrationModal 
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onClientCreated={handleClientCreated}
    />

    <ClientPinModal
        open={isPinModalOpen}
        onOpenChange={setIsPinModalOpen}
        clientToVerify={clientToVerify}
        onVerified={handlePinVerified}
    />
    </>
  )
}