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
    Home 
} from "lucide-react"
import Logo from "@/components/Logo" // Importando seu Logo

// --- Componentes Internos do Layout ---

const SidebarContext = React.createContext(null);

// ✅ Provider agora é o container 100% (sem header)
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
                "w-2/7 flex-col border-none p-4 flex-shrink-0 overflow-y-auto bg-[var(--sidebar-primary-foreground)]", 
                className
            )}
        >
            {children}
        </aside>
    );
}

// ✅ SidebarInset (Conteúdo)
function SidebarInset({ className, children }) {
    return (
        <main className={cn("flex-1 overflow-y-auto bg-muted/30", className)}>
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
    <nav className="flex flex-col space-y-1 ">
      {configNavItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.href}
          // 'end' é crucial para "Geral" (index)
          end={item.href === "/configuracoes/geral"} 
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-base font-regular text-foreground transition-colors hover:bg-muted", // ✅ Fonte na cor normal (text-foreground)
              // ✅ Lógica de Mestre: Ativo = Estilo Hover
              isActive && "bg-muted" 
            )
          }
        >
          <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1">{item.label}</span>
        </NavLink>
      ))}
      
      {/* Botão de Voltar */}
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

// --- O LAYOUT PRINCIPAL DO "CASTELO" ---
export default function ConfiguracoesPage() {
  return (
    <SidebarProvider>
          <Sidebar>
              <NavLink 
                to="/" 
                className="mb-10 flex justify-start" 
                title="Voltar ao Dashboard">
                  <Logo variant="full" size="140px" />
              </NavLink>
              <ConfigSidebarNav />
          </Sidebar>
          <SidebarInset>
            <Outlet />
          </SidebarInset>
            
    </SidebarProvider>
  )
}