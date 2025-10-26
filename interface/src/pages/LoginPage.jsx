// src/pages/LoginPage.jsx

"use client"

import Logo from "@/components/Logo"; // Componente de Logo
import { LoginForm } from "@/components/login-form"; // Formulário de login

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* --- Coluna da Esquerda (Formulário) --- */}
      <div className="flex flex-col gap-4 p-6 md:p-10 min-h-screen">
        {/* Logo */}
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo variant="icon" width="36px" height="33px"/>
        </div>

        {/* Formulário centralizado verticalmente */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* --- Coluna da Direita (Imagem de fundo) --- */}
      <div className="relative hidden lg:block min-h-screen">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
          alt="Imagem de um ambiente de trabalho"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
    </div>
  )
}
