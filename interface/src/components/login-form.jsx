// src/components/login-form.jsx
"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github } from "lucide-react"

// Adicionamos as props aqui na função
export function LoginForm({ 
  className, 
  email, 
  setEmail, 
  senha, 
  setSenha, 
  handleLogin, 
  loading, 
  erro,
  ...props 
}) {

  return (
    // O onSubmit agora chama a função que veio do Pai (LoginPage)
    <form onSubmit={handleLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Acesse sua Conta</h1>
        <p className="text-muted-foreground text-sm">
          Digite seu e-mail e senha para entrar no painel.
        </p>
      </div>

      {/* Exibição de Erro (Adicionei isso para você ver o erro visualmente) */}
      {erro && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
          {erro}
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        
        {/* Input de Email Controlado */}
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="nome@exemplo.com" 
            required 
            // Conexão com o estado do Pai:
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading} // Desabilita se estiver carregando
          />
        </div>

        {/* Input de Senha Controlado */}
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            <a href="#" className="ml-auto text-sm underline">
              Esqueceu a senha?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            // Conexão com o estado do Pai:
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Botão com estado de Loading */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <Button variant="outline" type="button" disabled={loading}>
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </form>
  )
}