"use client"

import * as React from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { 
    Settings, 
    HardHat, 
    Users, 
    CircleDollarSign, 
    FileText, 
    Zap,
    Home,
    Search // ✅ Importar o Ícone de Busca
} from "lucide-react"
import Logo from "@/components/Logo"
import { Input } from "@/components/ui/input" // ✅ Importar o Input
// ✅ Imports para o novo Breadcrumb (migalha de pão)
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// --- Componentes Internos do Layout (Sem mudanças) ---
const SidebarContext = React.createContext(null);
function SidebarProvider({ children, className }) {
    return (
        <SidebarContext.Provider value={{}}>
            <div className={cn("flex h-screen w-full", className)}>
                {children}
            </div>
        </SidebarContext.Provider>
    );
}
function Sidebar({ className, children }) {
    return (
        <aside
            className={cn(
                "w-2/9 flex-col border-r border-border/60 p-4 flex-shrink-0 overflow-y-auto bg-background", 
                className
            )}
        >
            {children}
        </aside>
    );
}
function SidebarInset({ className, children }) {
    // ✅ Alterado: O SidebarInset agora é um container flex-col
    return (
        <main className={cn("flex-1 flex flex-col h-screen overflow-y-auto", className)}>
            {children}
        </main>
    );
}
// --- Fim dos Componentes Internos ---


// --- A Navegação Específica da Sidebar ---
const configNavItems = [
  { href: "/configuracoes/geral", label: "Geral", icon: Settings },
  { href: "/configuracoes/operacional", label: "Operacional", icon: HardHat },
  { href: "/configuracoes/perfil", label: "Perfil & Segurança", icon: Users },
  { href: "/configuracoes/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/configuracoes/fiscal", label: "Fiscal", icon: FileText },
  { href: "/configuracoes/conexoes", label: "Conexões", icon: Zap },
];

function ConfigSidebarNav() {
  return (
    <nav className="flex flex-col space-y-1">
      {configNavItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.href}
          end={item.href === "/configuracoes/geral" || item.href === "/configuracoes"} 
          // ✅ Lógica 'end' corrigida para pegar o 'index'
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-base font-regular text-foreground transition-colors hover:bg-muted",
              isActive && "bg-muted" 
            )
          }
        >
          <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1">{item.label}</span>
        </NavLink>
      ))}
      
      <div className="pt-4 mt-4 border-t">
         <NavLink
          to="/" // Link para o Dashboard Principal
          className={
            "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          }
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">Voltar ao Dashboard</span>
        </NavLink>
      </div>
    </nav>
  );
}

// ✅ NOVO COMPONENTE: O Header com a Busca
function ConfigHeader() {
    const location = useLocation();
    
    // Encontra o 'label' do item atual baseado na URL
    const currentItem = [...configNavItems].reverse().find(item => 
        location.pathname.startsWith(item.href)
    );
    const pageTitle = currentItem ? currentItem.label : "Geral";

    return (
        <header className="flex h-20 shrink-0 items-center justify-end border-b bg-background px-6">
            {/* 1. Breadcrumb (Localização) 
            {/* <div className="flex items-center">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <NavLink to="/configuracoes/geral">Configurações</NavLink>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div> */}
            
            {/* 2. Busca Global (Seu "Ctrl+F") */}
            <div className="relative w-full max-w-sm ">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar em todas as configurações... (Ctrl+K)" 
                    className="pl-9" 
                    // No futuro, isso ativará um Command Palette (como o do VS Code)
                    // onFocus={() => setIsCommandPaletteOpen(true)}
                />
            </div>
        </header>
    );
}


// --- O LAYOUT PRINCIPAL DO "CASTELO" ---
export default function ConfiguracoesPage() {
  return (
    <SidebarProvider>
          <Sidebar>
              <NavLink 
                to="/" 
                className="flex justify-start" 
                title="Voltar ao Dashboard">
                <div className="flex h-17 shrink-0 items-start bg-background pl-5 pt-1 pb-25">
                  <Logo variant="full" size="140px" />
                </div>
              </NavLink>

              <ConfigSidebarNav />
          </Sidebar>
          
          {/* O Lado Direito (Conteúdo) */}
          <SidebarInset>
            {/* ✅ 1. O HEADER (renderizado no topo do conteúdo) */}
            <ConfigHeader />
            
            {/* ✅ 2. O CONTEÚDO (renderizado abaixo do header) */}
            {/* O Outlet agora está envolvido por um 'div' que dá o padding */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <Outlet />
            </div>
          </SidebarInset>
    </SidebarProvider>
  )
}