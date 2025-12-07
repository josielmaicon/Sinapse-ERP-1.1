// src/pages/LoginPage.jsx
"use client"

import Logo from "@/components/Logo";
import { LoginForm } from "@/components/login-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Assumindo react-router-dom

export default function LoginPage() {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // --- FUNÇÃO DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("http://localhost:8000/usuarios/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("sinapse_token", data.access_token);
        
        if (data.nome_usuario) {
            localStorage.setItem("sinapse_user_name", data.nome_usuario);
        }

        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        setErro(errorData.detail || "Falha na autenticação.");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Coluna Esquerda */}
      <div className="flex flex-col gap-4 p-6 md:p-10 min-h-screen">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo variant="icon" width="36px" height="33px"/>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            
            {/* AQUI ESTÁ A MÁGICA:
               Passamos tudo o que o componente filho precisa para funcionar.
            */}
            <LoginForm 
              email={email}
              setEmail={setEmail}
              senha={senha}
              setSenha={setSenha}
              handleLogin={handleLogin}
              loading={loading}
              erro={erro}
            />

          </div>
        </div>
      </div>

      {/* Coluna Direita */}
      <div className="relative hidden lg:block min-h-screen">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
          alt="Office"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
    </div>
  )
}