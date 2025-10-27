// src/components/fiscal/MetaEnvio.jsx

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Rocket, Target, Save } from "lucide-react"
import { toast } from "sonner"

// As props que o componente espera receber da página principal
export default function MetaEnvio({ totalPurchased, totalIssued }) {

  if (totalPurchased === undefined || totalIssued === undefined) {
      return <div>Carregando dados fiscais...</div>; // Ou um componente de Skeleton
    }

  const [strategy, setStrategy] = React.useState("coeficiente");
  const [goalValue, setGoalValue] = React.useState(2.1);
  const [isAutopilotOn, setIsAutopilotOn] = React.useState(false);

  const { calculatedGoal, progressPercentage } = React.useMemo(() => {
    let goal = 0;
    const numericGoalValue = parseFloat(goalValue) || 0;

    switch (strategy) {
      case "coeficiente":
        goal = totalPurchased * numericGoalValue;
        break;
      case "porcentagem":
        goal = totalPurchased * (1 + numericGoalValue / 100);
        break;
      case "valor_fixo":
        goal = numericGoalValue;
        break;
      default:
        goal = 0;
    }

    const percentage = goal > 0 ? (totalIssued / goal) * 100 : 0;
    return { calculatedGoal: goal, progressPercentage: Math.min(percentage, 100) };
  }, [strategy, goalValue, totalPurchased, totalIssued]);
  
  const handleUpdateGoal = async () => {
      // Aqui você faria a chamada de API para o backend
      // Ex: await fetch('/api/fiscal/meta', { method: 'POST', body: JSON.stringify({ strategy, goalValue }) });
      
      // Simulação de sucesso
      console.log("Salvando nova meta:", { strategy, goalValue });
      await new Promise(res => setTimeout(res, 500)); // Simula delay da rede
      
      toast.success("Estratégia de meta atualizada com sucesso!");
    };

  const goalUnit = {
    coeficiente: "x",
    porcentagem: "%",
    valor_fixo: "R$",
  }[strategy];

  return (
    <div className="h-full w-full flex flex-col justify-between gap-4">
      {/* SEÇÃO 1: VALOR COMPRADO (Sempre visível) */}
      <div>
        <p className="text-sm text-muted-foreground">Valor Comprado no Mês</p>
        <p className="text-4xl font-bold tracking-tighter text-primary">
          {totalPurchased.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>

      {/* ✅ 2. RENDERIZAÇÃO CONDICIONAL DA INTERFACE */}
      {isAutopilotOn ? (
        // --- MODO PILOTO AUTOMÁTICO LIGADO ---
        <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Piloto Automático Ativo</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            O sistema irá emitir automaticamente todas as vendas elegíveis do dia, todas as noites. Nenhuma meta será seguida.
          </p>
        </div>
      ) : (
        // --- MODO ESTRATÉGICO (MANUAL) ---
        <>
          {/* SEÇÃO DE DEFINIÇÃO DA META */}
          <div className="flex flex-col gap-2">
            <Label>Definir Meta de Emissão</Label>
            <Tabs value={strategy} onValueChange={setStrategy}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coeficiente">Coeficiente (x)</TabsTrigger>
                <TabsTrigger value="porcentagem">Porcentagem (%)</TabsTrigger>
                <TabsTrigger value="valor_fixo">Valor Fixo (R$)</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Input type="number" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} />
              <span className="font-semibold text-muted-foreground">{goalUnit}</span>
            </div>
          </div>

          {/* SEÇÃO DA BARRA DE PROGRESSO */}
          <div className="flex flex-col gap-2">
            <Progress value={progressPercentage} />
            <div className="flex justify-between text-sm">
              <p className="text-muted-foreground">
                Emitido: <span className="font-bold text-foreground">{totalIssued.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({progressPercentage.toFixed(1)}%)</span>
              </p>
              <p className="text-muted-foreground">
                Meta: <span className="font-bold text-foreground">{calculatedGoal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* SEÇÃO 4: AÇÕES (O rodapé) */}
      <div className="flex items-center justify-between mt-2">
        {/* Agrupamos os botões de ação na esquerda */}
        <div className="flex items-center gap-2">
          {!isAutopilotOn && (
            <>
              <Button onClick={handleUpdateGoal}>
                <Save className="h-4 w-4 mr-2" />
                Atualizar Meta
              </Button>
              <Button variant="secondary" disabled={progressPercentage >= 100}>
                <Target className="h-4 w-4 mr-2" />
                Atingir Meta Agora
              </Button>
            </>
          )}
        </div>
        
        {/* O Switch agora fica isolado na direita */}
        <div className="flex items-center space-x-2 ml-auto">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="autopilot-mode" 
                  checked={isAutopilotOn}
                  onCheckedChange={setIsAutopilotOn}
                />
                <Label htmlFor="autopilot-mode">Piloto Automático</Label>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <h4 className="font-semibold mb-2">Piloto Automático Fiscal</h4>
              <p className="text-sm">
                Quando ativado, o sistema <b>ignora qualquer meta</b> e emite automaticamente as notas fiscais para <b>todas as vendas elegíveis</b> do dia, periodicamente (ex: toda noite).
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  );
}