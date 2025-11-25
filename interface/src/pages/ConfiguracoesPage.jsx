"use client"

import * as React from "react"
import { NavLink, Outlet, useLocation, Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { 
    Settings, 
    HardHat, 
    Users, 
    CircleDollarSign, 
    FileText, 
    Zap,
    Home,
    ArrowLeft,
} from "lucide-react"
import Logo from "@/components/Logo"
import { Input } from "@/components/ui/input" // ✅ Importar o Input
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { SettingsCommandMenu } from "@/components/configuracoes/buscageral"

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
    </nav>
  );
}

function ConfigHeader() {
    const location = useLocation();
    const navigate = useNavigate();
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
              <div className="max-w-sm flex items-center justify-end gap-5">
                  <SettingsCommandMenu />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/")} 
                    title="Voltar ao Dashboard"
                    className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <Home className="h-5 w-5" />
                </Button>
              </div>
              </header>
    );
}


// --- O LAYOUT PRINCIPAL DO "CASTELO" ---
export default function ConfiguracoesPage() {
  return (
    <SidebarProvider>
          <Sidebar>
              <div className="p-6 pb-8 flex justify-start">
                  <Link 
                    to="/" 
                    className="block hover:opacity-80 transition-opacity"
                    title="Ir para Início"
                  >
                    <Logo variant="full" size="140px" />
                  </Link>
              </div>
              <ConfigSidebarNav />
          </Sidebar>
          
          <SidebarInset>
            <ConfigHeader />
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <Outlet />
            </div>
          </SidebarInset>
    </SidebarProvider>
  )
}