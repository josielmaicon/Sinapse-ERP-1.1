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
    Loader2, 
    Plus, 
    MoreHorizontal, 
    Shield, 
    KeyRound, 
    History, 
    UserCog,
    LogOut,
    Search
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

export default function PerfilSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 

  // --- Mock: Lista de Usuários ---
  const [users, setUsers] = React.useState([
      { id: 1, nome: "Administrador", email: "admin@sinapse.com", funcao: "admin", status: "ativo", ultimo_acesso: "Agora" },
      { id: 2, nome: "Josiel Maicon", email: "josiel@loja.com", funcao: "gerente", status: "ativo", ultimo_acesso: "Hoje, 14:30" },
      { id: 3, nome: "Ana Paula", email: "ana@caixa.com", funcao: "operador", status: "ativo", ultimo_acesso: "Ontem, 18:00" },
      { id: 4, nome: "Carlos Silva", email: "carlos@estoque.com", funcao: "operador", status: "bloqueado", ultimo_acesso: "Há 5 dias" },
  ]);

  // --- Mock: Logs de Auditoria (O diferencial) ---
  const [logs] = React.useState([
      { id: 101, ator: "Josiel Maicon", acao: "Autorizou Cancelamento", alvo: "Venda #5402", data: "Hoje, 14:35" },
      { id: 102, ator: "Ana Paula", acao: "Abriu Caixa 01", alvo: "PDV 01", data: "Hoje, 08:00" },
      { id: 103, ator: "Administrador", acao: "Alterou Permissões", alvo: "Usuário Carlos Silva", data: "Ontem, 20:15" },
      { id: 104, ator: "Sistema", acao: "Backup Automático", alvo: "Banco de Dados", data: "Ontem, 23:00" },
  ]);

  // --- Handlers ---
  const handleStatusToggle = (userId) => {
      // Simula alteração de status
      setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: u.status === 'ativo' ? 'bloqueado' : 'ativo' } : u
      ));
      toast.success("Status do usuário atualizado.");
  };

  const handleResetPassword = (userId) => {
      toast.promise(new Promise(r => setTimeout(r, 1500)), {
          loading: "Enviando email de redefinição...",
          success: "Link de redefinição enviado para o email do usuário."
      });
  };

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
      
      {/* --- SEÇÃO 1: GESTÃO DE USUÁRIOS --- */}
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
                  <Button onClick={() => toast.info("Abrir Modal de Novo Usuário")}>
                      <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                  </Button>
              </div>

              {/* Tabela de Usuários */}
              <div className="rounded-md border overflow-hidden">
                  <Table>
                      <TableHeader className="bg-muted/50">
                          <TableRow>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Função (Role)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="hidden md:table-cell">Último Acesso</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {users.map((user) => (
                              <TableRow key={user.id}>
                                  <TableCell className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9">
                                          {/* Fallback para iniciais */}
                                          <AvatarImage src={`https://ui-avatars.com/api/?name=${user.nome}&background=random`} />
                                          <AvatarFallback>{user.nome.substring(0,2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                          <span className="font-medium">{user.nome}</span>
                                          <span className="text-xs text-muted-foreground">{user.email}</span>
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
                                          onCheckedChange={() => handleStatusToggle(user.id)}
                                      />
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                      {user.ultimo_acesso}
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
                                              <DropdownMenuItem onClick={() => toast.info(`Editar ${user.nome}`)}>
                                                  <UserCog className="mr-2 h-4 w-4" /> Editar Dados
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                                  <KeyRound className="mr-2 h-4 w-4" /> Redefinir Senha
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-destructive">
                                                  <LogOut className="mr-2 h-4 w-4" /> Derrubar Sessão
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

      {/* --- SEÇÃO 2: AUDITORIA E SEGURANÇA --- */}
      <CardBodyT 
        title="Registro de Auditoria" 
        subtitle="Histórico de ações sensíveis realizadas no sistema."
      >
          <div className="pt-6">
              <div className="rounded-md border h-[300px] overflow-y-auto relative">
                  <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                              <TableHead className="w-[180px]">Data / Hora</TableHead>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Alvo / Detalhe</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {logs.map((log) => (
                              <TableRow key={log.id} className="hover:bg-muted/50">
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                      {log.data}
                                  </TableCell>
                                  <TableCell className="font-medium">{log.ator}</TableCell>
                                  <TableCell>
                                      <Badge variant="secondary" className="font-normal">
                                          {log.acao}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-sm">
                                      {log.alvo}
                                  </TableCell>
                              </TableRow>
                          ))}
                          {/* Linhas vazias para preencher visualmente se tiver poucos logs */}
                          {logs.length < 5 && Array.from({ length: 5 - logs.length }).map((_, i) => (
                              <TableRow key={`empty-${i}`}><TableCell colSpan={4} className="h-12" /></TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              <div className="pt-4 flex justify-end">
                   <Button variant="outline" size="sm" onClick={() => toast.info("Exportar logs para CSV")}>
                       <History className="mr-2 h-4 w-4" /> Exportar Histórico Completo
                   </Button>
              </div>
          </div>
      </CardBodyT>

    </div>
  );
}