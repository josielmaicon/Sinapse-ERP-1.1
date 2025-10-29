"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { toast } from "sonner"
import { Loader2, Minus, Plus } from "lucide-react" // ✅ Adicionar Minus e Plus (opcional)
import { cn } from "@/lib/utils" // ✅ Importar cn para mesclar classes

export function UpdateLimitDrawer({ open, onOpenChange, client, refetchData }) {
  const [limiteCreditoStr, setLimiteCreditoStr] = React.useState(''); // Guarda como string para o input
  const [trustMode, setTrustMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const API_URL = "http://localhost:8000";

  React.useEffect(() => {
    if (client) {
      // Formata o número para string com ponto decimal, ou vazio se for 0/null
      setLimiteCreditoStr(client.limite_credito ? String(client.limite_credito) : '');
      setTrustMode(client.trust_mode || false);
    } else {
      setLimiteCreditoStr('');
      setTrustMode(false);
    }
  }, [client, open]);

const handleSave = async (e) => {
    e.preventDefault();
    if (!client || isLoading) return;
    const novoLimiteNum = parseFloat(limiteCreditoStr); 
    if (!trustMode && (isNaN(novoLimiteNum) || novoLimiteNum < 0)) {
        toast.error("Valor do limite inválido."); return;
    }
    setIsLoading(true);
    const updateData = { novo_limite: trustMode ? 0 : novoLimiteNum, trust_mode: trustMode };
    
    // Log para depuração ANTES do fetch
    console.log(`Enviando para ${API_URL}/clientes/${client.id}/limite:`, updateData);

    // ✅ CORREÇÃO: Usar a URL COMPLETA
    const apiPromise = fetch(`${API_URL}/clientes/${client.id}/limite`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(async (response) => {
        // Log da resposta crua
        console.log(`Resposta da API ${response.url}: Status ${response.status}`);
        const result = await response.json().catch(async (err) => {
            // Se falhar o JSON.parse, tenta ler como texto
            const text = await response.text();
            console.error("Falha ao parsear JSON. Resposta Texto:", text);
            throw new Error(`Resposta inválida do servidor (Status ${response.status})`);
        });
        if (!response.ok) {
            console.error("Erro da API:", result); // Loga o erro vindo do backend
            throw new Error(result.detail || "Erro ao atualizar limite/confiança.");
        }
        console.log("Sucesso da API:", result); // Loga o sucesso
        return result; 
    });

    toast.promise(apiPromise, {
        loading: `Atualizando crédito para ${client.nome}...`,
        success: (updatedClient) => {
            onOpenChange(false); 
            if (typeof refetchData === 'function') refetchData(); 
            return "Crédito atualizado com sucesso!"; // Mensagem mais genérica
        },
        error: (err) => {
            console.error("Erro pego pelo Toast:", err); // Log extra no erro do toast
            return err.message; // Mostra a mensagem detalhada do erro
        },
        finally: () => {
            console.log("Finally do Toast executado."); // Log para confirmar finally
            setIsLoading(false); 
        }
    });
  };

  // ✅ Função para ajustar o valor (similar ao exemplo, opcional)
  //    Pode ser útil se quiser botões +/-
  const adjustLimit = (amount) => {
      const currentVal = parseFloat(limiteCreditoStr) || 0;
      const newVal = Math.max(0, currentVal + amount); // Garante que não seja negativo
      setLimiteCreditoStr(String(newVal));
  }


  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-2/5 edit-limite-cliente">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Alterar Limite / Modo Confiança</DrawerTitle>
            <DrawerDescription>Cliente: {client?.nome || '...'}</DrawerDescription>
          </DrawerHeader>

          {/* ✅ Área Central Reestilizada */}
          <div className="p-4 pb-0">
            {/* Div principal para centralizar e adicionar botões +/- (opcional) */}
            <div className="flex items-center justify-center space-x-2">
              {/* Botão Menos (Opcional) */}
              <Button
                  variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => adjustLimit(-50)} // Ajusta de 50 em 50, por exemplo
                  disabled={trustMode || isLoading || (parseFloat(limiteCreditoStr) || 0) <= 0}
              >
                  <Minus className="h-4 w-4" /> <span className="sr-only">Diminuir</span>
              </Button>

              {/* Área do Input Grande e Transparente */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span
                    className={cn(
                      "text-6xl font-bold tracking-tighter text-muted-foreground",
                      trustMode && "opacity-50"
                    )}
                  >
                    R$
                  </span>
                  <input
                    id="limite-credito-drawer"
                    type="number"
                    step="1"
                    min="0"
                    value={limiteCreditoStr}
                    onChange={(e) => setLimiteCreditoStr(e.target.value)}
                    disabled={trustMode || isLoading}
                    placeholder={trustMode ? "∞" : "0"}
                    className={cn(
                      "bg-transparent border-none text-center text-6xl font-bold tracking-tighter outline-none",
                      "focus:ring-0 focus:outline-none w-[160px]",
                      "appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      trustMode && "opacity-50 cursor-not-allowed"
                    )}
                  />
                </div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">
                  {trustMode ? "Modo Confiança" : "Limite de Crédito"}
                </div>
              </div>


               {/* Botão Mais (Opcional) */}
               <Button
                  variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => adjustLimit(50)}
                  disabled={trustMode || isLoading} // Sem limite máximo definido aqui
              >
                  <Plus className="h-4 w-4" /><span className="sr-only">Aumentar</span>
              </Button>
            </div>
          </div> {/* Fim da área central reestilizada */}

          {/* Switch Modo Confiança (movido para mais perto do input visualmente) */}
           <div className="flex items-center space-x-2 justify-center pt-4 px-4">
               <Switch
                 id="drawer-trust-mode"
                 checked={trustMode}
                 onCheckedChange={setTrustMode}
                 disabled={isLoading}
               />
               <Label htmlFor="drawer-trust-mode">Modo Confiança Ativado</Label>
           </div>

          <DrawerFooter className="pt-4"> {/* Adiciona padding top */}
            <Button type="button" onClick={handleSave} disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Salvar Alterações
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isLoading}>Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}