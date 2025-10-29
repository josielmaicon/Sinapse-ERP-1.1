"use client"

import * as React from "react"
import { format, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Edit, ShieldOff, Unlock, Loader2 } from "lucide-react" // Removido Phone não usado, Adicionado Loader2
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { EditClientSheet } from "./FormularioEdicaoCliente"
import { UpdateLimitDrawer } from "./GavetaLimite"

// MOCK de histórico (manter por enquanto, conectar à API depois)
const transactionHistory = [
  { id: "TRN-105", date: "2025-10-15", description: "Compra na loja", debit: 45.50, credit: 0 },
  { id: "TRN-104", date: "2025-10-12", description: "Pagamento da fatura", debit: 0, credit: 200.00 },
  { id: "TRN-103", date: "2025-10-10", description: "Compra na loja", debit: 120.00, credit: 0 },
  { id: "TRN-102", date: "2025-10-08", description: "Compra na loja", debit: 85.75, credit: 0 },
  { id: "TRN-101", date: "2025-10-01", description: "Pagamento da fatura", debit: 0, credit: 300.00 },
].sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar mock

// Mini Card de informações (sem mudanças)
const InfoBlock = ({ label, value, valueClassName = "" }) => (
  <div className="bg-muted p-3 rounded-lg text-center flex flex-col justify-center min-h-[70px]"> {/* Altura mínima */}
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-bold text-lg md:text-xl tracking-tight ${valueClassName}`}>{value}</p> {/* Ajuste leve no tamanho da fonte */}
  </div>
)

// Componente recebe 'client' (os dados) e 'refetchData' (a função para atualizar)
export default function ClientDetailPanel({ client, refetchData }) {
  const isLoading = !client; // Define loading baseado na existência do cliente

  // Deriva o estado bloqueado DIRETAMENTE da prop 'client'
  const isBlocked = client?.status_conta === "bloqueado";

  // Estado local apenas para o Modo Confiança (que terá sua própria API depois)
  const [isTrustMode, setIsTrustMode] = React.useState(client?.trust_mode || false);

  // Estados para o AlertDialog de confirmação de status
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [alertAction, setAlertAction] = React.useState(null); // 'block' ou 'unblock'
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false); // Loading do botão do AlertDialog

  // Sincroniza o Modo Confiança local se a prop 'client' mudar
  React.useEffect(() => {
    setIsTrustMode(client?.trust_mode || false);
  }, [client]);

  // Função para abrir o AlertDialog
  const triggerStatusChangeConfirmation = () => {
    if (isLoading) return;
    setAlertAction(isBlocked ? 'unblock' : 'block'); // Define qual ação será confirmada
    setIsAlertOpen(true);
  };

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Função chamada ao confirmar no AlertDialog
  const handleConfirmStatusChange = async () => {
    if (!client || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    const newStatus = alertAction === 'block' ? 'bloqueado' : 'ativo'; // Status para enviar à API
    const actionText = alertAction === 'block' ? 'Bloqueando' : 'Desbloqueando';

    // Chama a API PUT /clientes/{id}/status
    const apiPromise = fetch(`/clientes/${client.id}/status`, { // Assume URL base configurada ou relativa
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novo_status: newStatus })
    })
    .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Erro ao ${actionText.toLowerCase()} conta.`);
        }
        return result; // Espera-se que a API retorne o cliente atualizado
    });

    toast.promise(apiPromise, {
        loading: `${actionText} conta de ${client.nome}...`,
        success: (updatedClient) => {
            setIsAlertOpen(false); // Fecha o AlertDialog
            if (typeof refetchData === 'function') {
                refetchData(); // Chama a função da página pai para buscar dados atualizados
            } else {
                 console.warn("ClientDetailPanel: prop refetchData não encontrada ou não é função.");
            }
            // Usa o nome do cliente retornado pela API para garantir consistência
            return `Conta de ${updatedClient.nome} ${actionText.toLowerCase().replace('ando', 'ada')} com sucesso!`;
        },
        error: (err) => err.message, // Mostra o erro no toast
        finally: () => {
            setIsUpdatingStatus(false); // Libera o botão do AlertDialog
        }
    });
  };

  // --- Cálculos para exibição ---
  const name = client?.nome ?? "--";

  // Saldo em atraso (usa 'status_conta' e 'atrasado')
  const overdueBalance = client
    ? (client.status_conta === "atrasado" ? client.saldo_devedor : 0).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL",
      })
    : "--";

  // Próximo Vencimento (usa 'data_vencimento_fatura')
  const dueDate = client?.data_vencimento_fatura
    ? format(new Date(client.data_vencimento_fatura + 'T00:00:00Z'), "dd/MM/yyyy", { locale: ptBR }) // Adiciona Z para UTC
    : "--";

  // Verifica se está vencido (considera apenas a data, sem hora)
  const isOverdue = client?.data_vencimento_fatura && isPast(new Date(client.data_vencimento_fatura + 'T23:59:59Z')) && client.status_conta !== 'ativo';

  // Limite Disponível (usa o calculado pela API ou recalcula como fallback)
  // Certifique-se que sua API GET /clientes/{id} retorna 'limite_disponivel'
  const limiteDisponivel = client?.limite_disponivel ?? (client ? (client.limite_credito - client.saldo_devedor) : 0);

  // Limite Gasto
  const spentLimit = client
    // Se modo confiança, gasto é irrelevante vs limite infinito, mostramos saldo devedor? Ou 0?
    ? (isTrustMode ? client.saldo_devedor : (client.limite_credito - limiteDisponivel)).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL",
      })
    : "--";

  // Limite Total
  const totalLimit = client
    ? isTrustMode
      ? "Confiança"
      : client.limite_credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "--";

  // --- PLACEHOLDERS para próximas implementações ---
  const handleEditClick = () => {
    if(isLoading) return;
    // alert(`(WIP) Abrir Sheet de Edição para ${client.nome}`); // Remove alert
    setIsSheetOpen(true); // Abre o Sheet!
  }

  const handleLimiteClick = () => { 
      if(isLoading) return; 
      // alert(`(WIP) Abrir Modal/Sheet para Alterar Limite de ${client.nome}`); // Remove alert
      setIsDrawerOpen(true); // Abre o Drawer!
  }

  const handleTrustModeChange = (checked) => {
     if(isLoading) return;
     // ATENÇÃO: Apenas atualiza estado local. Precisa chamar API!
     setIsTrustMode(checked); 
     alert(`(WIP) Chamar API para ${checked ? 'ATIVAR' : 'DESATIVAR'} Modo Confiança para ${client.nome}`);
     // Aqui vamos implementar a chamada para PUT /clientes/{id}/limite
  }
  // --- Fim dos Placeholders ---


  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-card rounded-lg"> {/* Adicionado fundo e sombra */}
      {/* --- PAINEL SUPERIOR --- */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-start"> {/* items-start para alinhar título */}
          <div className="flex flex-col">
            <h3 className="text-xl font-semibold">{name}</h3>
            {/* Opcional: Mostrar CPF ou Telefone aqui */}
            {client?.cpf && <p className="text-sm text-muted-foreground">CPF: {client.cpf}</p>}
            {client?.telefone && <p className="text-sm text-muted-foreground">Tel: {client.telefone}</p>}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={handleEditClick} // Chama a função placeholder
          >
            <Edit className="h-3 w-3 mr-2" /> Editar
          </Button>
        </div>

        {/* BLOCO DE INFORMAÇÕES */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Saldo em Atraso" value={overdueBalance} valueClassName={client?.status_conta === "atrasado" ? "text-destructive" : ""} />
          <InfoBlock label="Próximo Vencimento" value={dueDate} valueClassName={isOverdue ? "text-destructive" : ""} />
          <InfoBlock label="Utilizado / Gasto" value={spentLimit} />
          <InfoBlock label="Limite Total" value={totalLimit} valueClassName={isTrustMode ? "text-primary" : ""} /> {/* Use primary para destaque */}
        </div>

        {/* AÇÕES */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" disabled={isLoading} onClick={handleLimiteClick}>
              Alterar Limite
            </Button>
            <Button
              variant={isBlocked ? "outline" : "destructive"}
              size="sm"
              disabled={isLoading}
              onClick={triggerStatusChangeConfirmation}
            >
              {isBlocked ? <Unlock className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              {isBlocked ? "Desbloquear" : "Bloquear Conta"}
            </Button>
          </div>

          <div className="flex items-center space-x-2 justify-end"> {/* Alinhado à direita */}
            <Switch 
               id="trust-mode" 
               checked={isTrustMode} 
               disabled={isLoading} 
               onCheckedChange={handleTrustModeChange} 
             />
            <Label htmlFor="trust-mode">Modo Confiança</Label>
          </div>
        </div>
      </div>

      <div className="flex-grow pt-4" /> {/* Espaço flexível */}

      {/* --- EXTRATO --- */}
      <div className="flex-shrink-0 flex flex-col min-h-0 h-2/5">
        <Separator className="mb-4" />
        <h4 className="font-semibold mb-2 flex-shrink-0">Extrato da Conta</h4>

        {/* Área rolável do extrato */}
        <div className="flex-grow overflow-y-auto rounded-md border">
          {isLoading ? ( // Mostra skeleton se o CLIENTE ainda está carregando
            <div className="p-4 flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => ( // Aumentei para 4 skeletons
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : (
            // AQUI VAI A LÓGICA PARA BUSCAR E MOSTRAR O EXTRATO REAL
            // Por enquanto, mostra o MOCK
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Data</TableHead> {/* Largura fixa */}
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-[120px]">Valor (R$)</TableHead> {/* Largura fixa */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionHistory.length > 0 ? transactionHistory.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{format(new Date(tx.date + 'T00:00:00Z'), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell className="text-xs">{tx.description}</TableCell>
                    <TableCell className={`text-right text-xs font-medium ${tx.credit > 0 ? "text-green-600" : "text-destructive"}`}>
                      {tx.credit > 0
                        ? `+${tx.credit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` // Simplificado
                        : (tx.debit > 0 ? `-${tx.debit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "0,00")}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* AlertDialog (sem mudanças na estrutura) */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Alteração de Status</AlertDialogTitle>
                  <AlertDialogDescription>
                      Você tem certeza que deseja {alertAction === 'block' ? 'BLOQUEAR' : 'DESBLOQUEAR'} a conta de {client?.nome}?
                      {alertAction === 'block' && " Isso impedirá novas compras no crediário."}
                      {alertAction === 'unblock' && " Isso permitirá novas compras no crediário."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isUpdatingStatus}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                      onClick={handleConfirmStatusChange} 
                      disabled={isUpdatingStatus}
                      className={alertAction === 'block' ? "bg-destructive hover:bg-destructive/90" : ""}
                  >
                      {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {alertAction === 'block' ? 'Sim, Bloquear' : 'Sim, Desbloquear'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <EditClientSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        client={client} 
        refetchData={() => {
            // Função wrapper para fechar E recarregar
            setIsSheetOpen(false); 
            if (typeof refetchData === 'function') refetchData(); 
        }}
      />

      <UpdateLimitDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        client={client}
        refetchData={() => {
            // Função wrapper para fechar E recarregar
            setIsDrawerOpen(false); 
            if (typeof refetchData === 'function') refetchData(); 
        }}
      />

    </div>
  )
}

