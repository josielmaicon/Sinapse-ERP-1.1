"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command" // Certifique-se de ter instalado o componente Command do shadcn
import { Button } from "@/components/ui/button"
import { 
    Search, 
    CreditCard, 
    Settings, 
    HardHat, 
    FileText, 
    Users, 
    Zap 
} from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsCommandMenu() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  // Toggle com Ctrl+K ou Cmd+K
  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      {/* O Gatilho Visual (Botão que parece um Input) */}
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80 bg-background shadow-sm"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar configurações...</span>
        <span className="inline-flex lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Ctrl + K</span>
        </kbd>
      </Button>

      {/* O Dialog de Comando */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite o que você procura..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          <CommandGroup heading="Geral">
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/geral"))}>
                <Settings className="mr-2 h-4 w-4" />
                Identidade da Loja (Logo, Nome)
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/geral"))}>
                <Settings className="mr-2 h-4 w-4" />
                Aparência (Tema, Cores)
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Operacional">
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/operacional"))}>
                <HardHat className="mr-2 h-4 w-4" />
                Regras de Venda (Estoque Negativo)
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/operacional"))}>
                <HardHat className="mr-2 h-4 w-4" />
                Perfis de Abertura de Caixa
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/operacional"))}>
                <HardHat className="mr-2 h-4 w-4" />
                Gestão de Hardware (Impressoras)
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Financeiro">
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/financeiro"))}>
                <CreditCard className="mr-2 h-4 w-4" />
                Formas de Pagamento
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/financeiro"))}>
                <CreditCard className="mr-2 h-4 w-4" />
                Configuração PIX
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/financeiro"))}>
                <CreditCard className="mr-2 h-4 w-4" />
                Regras de Crediário (Juros/Multa)
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Fiscal">
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/fiscal"))}>
                <FileText className="mr-2 h-4 w-4" />
                Dados Fiscais (CNPJ/IE)
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/fiscal"))}>
                <FileText className="mr-2 h-4 w-4" />
                Certificado Digital (A1)
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/fiscal"))}>
                <FileText className="mr-2 h-4 w-4" />
                Estratégia de Envio (Contingência)
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Perfil & Segurança">
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/perfil"))}>
                <Users className="mr-2 h-4 w-4" />
                Gestão de Usuários
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/perfil"))}>
                <Users className="mr-2 h-4 w-4" />
                Logs de Auditoria
            </CommandItem>
          </CommandGroup>
          
          <CommandGroup heading="Conexões">
             <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes/conexoes"))}>
                <Zap className="mr-2 h-4 w-4" />
                Integrações (iFood, WhatsApp)
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                Voltar ao Dashboard
            </CommandItem>
          </CommandGroup>

        </CommandList>
      </CommandDialog>
    </>
  )
}