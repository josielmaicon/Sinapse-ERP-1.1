// src/pages/LoginPage.jsx

"use client"

import Logo from "@/components/Logo"; // ✅ Importe o seu componente de Logo
import { LoginForm } from "@/components/login-form"; // Vamos colocar o formulário aqui

export default function LoginPage() {
  return (
    <div className="h-full w-full grid min-h-screen lg:grid-cols-2">
      {/* --- Coluna da Esquerda (Formulário) --- */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
            {/* ✅ Usando seu componente de Logo */}
            <Logo variant="icon" width="36px" height="33px"/>            
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* --- Coluna da Direita (Imagem) --- */}
      <div className="bg-muted relative hidden lg:block">
        {/* Você pode trocar esta imagem por uma foto do seu negócio ou um fundo mais elaborado */}
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
          alt="Imagem de um ambiente de trabalho"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
    </div>
  )
}