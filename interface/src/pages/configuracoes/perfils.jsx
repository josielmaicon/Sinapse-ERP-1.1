"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
    Loader2, 
    Plus, 
    MoreHorizontal, 
    Shield, 
    KeyRound, 
    History, 
    UserCog,
    LogOut,
    Search,
    UserX
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import CardBodyT from "@/components/CardBodyT"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserModal } from "./ModalCriacaoUser"

const API_URL = "http://localhost:8000";

export default function PerfilSettingsPage() {
  const [isDataLoading, setIsDataLoading] = React.useState(true); 
  
  const [users, setUsers] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  
  // Estados do Modal
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState(null);
  const [userToDelete, setUserToDelete] = React.useState(null); // Guarda o objeto usuário a ser deletado

  // --- FETCH DATA ---
  const fetchData = React.useCallback(async () => {
      setIsDataLoading(true);
      try {
          const [resUsers, resLogs] = await Promise.all([
              fetch(`${API_URL}/usuarios/`),
              fetch(`${API_URL}/usuarios/logs/auditoria`)
          ]);
          
          if (resUsers.ok) setUsers(await resUsers.json());
          if (resLogs.ok) setLogs(await resLogs.json());

      } catch (error) {
          console.error("Erro ao carregar perfil:", error);
      } finally {
          setIsDataLoading(false);
      }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // --- Handlers ---
  
  const handleStatusToggle = async (userId, currentStatus) => {
      const newStatus = currentStatus === 'ativo' ? 'bloqueado' : 'ativo';
      // Otimismo na UI
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      
      try {
          await fetch(`${API_URL}/usuarios/${userId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
          });
          toast.success(`Usuário ${newStatus}!`);
      } catch (e) {
          toast.error("Erro ao alterar status.");
          fetchData(); // Reverte
      }
  };

  const handleEditUser = (user) => {
      setUserToEdit(user);
      setIsUserModalOpen(true);
  };
  
  const handleNewUser = () => {
      setUserToEdit(null);
      setIsUserModalOpen(true);
  };
  
  const handleDeleteUser = async (user) => {
      if (!confirm(`Tem certeza que deseja excluir ${user.nome}?`)) return;
      try {
          const res = await fetch(`${API_URL}/usuarios/${user.id}`, { method: 'DELETE' });
          if(!res.ok) throw new Error();
          toast.success("Usuário excluído.");
          fetchData();
      } catch (e) {
          toast.error("Erro ao excluir (Admin principal não pode ser removido).");
      }
  }

    // ✅ 3. GATILHO DO MODAL (Apenas seleciona o usuário)
  const handleDeleteClick = (user) => {
      setUserToDelete(user);
  }

  // ✅ 4. AÇÃO REAL DE EXCLUSÃO (Chamada pelo AlertDialog)
  const confirmDeleteUser = async () => {
      if (!userToDelete) return;
      
      try {
          const res = await fetch(`${API_URL}/usuarios/${userToDelete.id}`, { method: 'DELETE' });
          
          if(!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.detail || "Erro ao excluir.");
          }
          
          toast.success(`Usuário ${userToDelete.nome} excluído.`);
          fetchData();
      } catch (e) {
          toast.error(e.message || "Erro ao excluir usuário.");
      } finally {
          setUserToDelete(null); // Fecha o modal
      }
  }

  return (
    <div className="flex flex-1 flex-col gap-3"> 
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/configuracoes">Configurações</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Perfil & Segurança</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <CardBodyT 
        title="Equipe e Acesso" 
        subtitle="Gerencie quem tem acesso ao sistema e suas permissões."
      >
          <div className="pt-6 space-y-4">
              
              {/* Barra de Ações */}
              <div className="flex items-center justify-between">
                  <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar usuário..." className="pl-8" />
                  </div>
                  <Button onClick={handleNewUser} disabled={isDataLoading}>
                      <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                  </Button>
              </div>

              {/* Tabela de Usuários */}
              <div className="rounded-md border overflow-hidden h-[300px] overflow-y-auto relative">
                  <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                          <TableRow>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Função (Role)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {users.map((user) => (
                              <TableRow key={user.id}>
                                  <TableCell className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9">
                                          <AvatarImage src={`https://ui-avatars.com/api/?name=${user.nome}&background=random`} />
                                          <AvatarFallback>{user.nome.substring(0,2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                          <span className="font-medium">{user.nome}</span>
                                          <span className="text-xs text-muted-foreground">{user.email || "Sem e-mail"}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className="capitalize flex w-fit items-center gap-1">
                                          {user.funcao === 'admin' && <Shield className="h-3 w-3 text-primary" />}
                                          {user.funcao}
                                      </Badge>
                                  </TableCell>
                                  <TableCell>
                                      <Switch 
                                          checked={user.status === 'ativo'}
                                          onCheckedChange={() => handleStatusToggle(user.id, user.status)}
                                      />
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                  <span className="sr-only">Abrir menu</span>
                                                  <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                  <UserCog className="mr-2 h-4 w-4" /> Editar Dados
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}>
                                                  <UserX className="mr-2 h-4 w-4" /> Excluir Usuário
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </CardBodyT>

      <CardBodyT title="Registro de Auditoria" subtitle="Histórico de ações sensíveis (Logs do sistema).">
          <div className="pt-6">
              <div className="rounded-md border h-[300px] overflow-y-auto relative">
                  <Table>
                      <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                          <TableRow>
                              <TableHead className="w-[180px]">Data / Hora</TableHead>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Detalhe</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {logs.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum registro recente.</TableCell></TableRow>
                          ) : (
                              logs.map((log) => (
                                  <TableRow key={log.id} className="hover:bg-muted/50">
                                      <TableCell className="font-mono text-xs text-muted-foreground">
                                          {new Date(log.data_hora).toLocaleString('pt-BR')}
                                      </TableCell>
                                      <TableCell className="font-medium">{log.usuario_nome || "Sistema"}</TableCell>
                                      <TableCell>
                                          <Badge variant="secondary" className="font-normal text-[10px]">
                                              {log.acao}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm truncate max-w-xs" title={log.detalhe}>
                                          {log.detalhe}
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </CardBodyT>

      <UserModal 
          open={isUserModalOpen} 
          onOpenChange={setIsUserModalOpen} 
          userToEdit={userToEdit} 
          onSuccess={fetchData} 
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <b>{userToDelete?.nome}</b>? <br/>
              Essa ação não pode ser desfeita e o histórico será mantido apenas nos logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}