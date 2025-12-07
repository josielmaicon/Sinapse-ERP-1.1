// src/components/login-form.jsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // Para redirecionar

export function LoginForm() {
  const router = useRouter()
  
  // Estados para guardar o que o usuário digita
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          senha: senha // O backend espera "senha" conforme definimos no schema Pydantic
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 1. Salva o Token
        localStorage.setItem("sinapse_token", data.access_token);
        
        // 2. (Opcional) Salva dados do usuário para mostrar na UI
        localStorage.setItem("sinapse_user", JSON.stringify({
            nome: data.nome_usuario,
            funcao: data.funcao
        }));

        // 3. Redireciona
        router.push("/dashboard");
      } else {
        // Tratamento de erro (ex: 401 Unauthorized)
        const errorData = await response.json();
        setErro(errorData.detail || "Falha no login");
      }
    } catch (error) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Login</h1>
        <p className="text-sm text-gray-500">Entre com suas credenciais do Sinapse ERP</p>
      </div>

      {erro && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          {erro}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email" 
          required
          className="w-full p-2 border rounded"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password">Senha</label>
        <input 
          id="password" 
          type="password" 
          required
          className="w-full p-2 border rounded"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Acessar Sistema"}
      </button>
    </form>
  )
}