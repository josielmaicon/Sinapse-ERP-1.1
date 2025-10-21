"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github } from "lucide-react"

export function LoginForm({ className, ...props }) {
  // Por enquanto, o envio do formulário só vai dar um 'alert'
  const handleSubmit = (event) => {
    event.preventDefault(); // Impede o recarregamento da página
    alert("Lógica de login a ser implementada!");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Acesse sua Conta</h1>
        <p className="text-muted-foreground text-sm">
          Digite seu e-mail e senha para entrar no painel.
        </p>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="nome@exemplo.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            <a href="#" className="ml-auto text-sm underline">
              Esqueceu a senha?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">Entrar</Button>
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

      <Button variant="outline" type="button">
        <Github className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </form>
  )
}