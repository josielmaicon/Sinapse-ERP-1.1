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
import { Skeleton } from "@/components/ui/skeleton";

// As props que o componente espera receber da página principal
export default function MetaEnvio({ totalPurchased, totalIssued, config, onConfigChange,onConfigSave,onEmitirMeta,isLoading}) {

  if (totalPurchased === undefined || totalIssued === undefined) {
      return <div>Carregando dados fiscais...</div>; // Ou um componente de Skeleton
    }

  const strategy = config?.strategy ?? 'coeficiente';
  const goalValue = config?.goal_value ?? 2.1;
  const isAutopilotOn = config?.autopilot_enabled ?? false;

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
  
  const handleStrategyChange = (newStrategy) => {
    onConfigChange({ ...config, strategy: newStrategy });
  };

  const handleGoalValueChange = (e) => {
    // Tenta converter para float, mas guarda como string temporariamente se falhar
    const rawValue = e.target.value;
    const floatValue = parseFloat(rawValue);
    onConfigChange({ ...config, goal_value: isNaN(floatValue) ? rawValue : floatValue });
  };

  const handleAutopilotChange = (checked) => {
    const newConfig = { ...config, autopilot_enabled: checked };
    onConfigChange(newConfig);
    onConfigSave(newConfig); // Salva automaticamente ao mudar o switch
  };

  const handleUpdateGoalClick = () => {
    // Garante que goalValue seja numérico antes de salvar
    const numericGoalValue = parseFloat(goalValue);
    if (isNaN(numericGoalValue)) {
        toast.error("Valor da meta inválido.");
        return;
    }
    const configToSave = { ...config, goal_value: numericGoalValue };
    onConfigChange(configToSave); // Atualiza o estado local caso a conversão tenha mudado algo
    onConfigSave(configToSave); 
  };

  const handleEmitirMetaClick = () => {
     onEmitirMeta();
  }

  if (isLoading) {
     return (
       <div className="h-full w-full flex flex-col justify-between gap-4 p-4 border rounded-lg">
          <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-32" />
              </div>
              <Skeleton className="h-6 w-32" />
          </div>
       </div>
     )
  }

  const goalUnit = {
    coeficiente: "x",
    porcentagem: "%",
    valor_fixo: "R$",
  }[strategy];


  return (
    <div className="h-full w-full flex flex-col justify-between gap-4">
      {/* SEÇÃO 1: VALOR COMPRADO (igual) */}
      <div>
        <p className="text-sm text-muted-foreground">Valor Comprado no Mês</p>
        <p className="text-4xl font-bold tracking-tighter text-primary">
          {totalPurchased.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL (agora usa isAutopilotOn da prop) */}
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
        <>
          {/* SEÇÃO DE DEFINIÇÃO DA META */}
          <div className="flex flex-col gap-2">
            <Label>Definir Meta de Emissão</Label>
            {/* ✅ Usa strategy da prop e chama handleStrategyChange */}
            <Tabs value={strategy} onValueChange={handleStrategyChange}> 
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coeficiente">Coeficiente (x)</TabsTrigger>
                <TabsTrigger value="porcentagem">Porcentagem (%)</TabsTrigger>
                <TabsTrigger value="valor_fixo">Valor Fixo (R$)</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {/* ✅ Usa goalValue da prop e chama handleGoalValueChange */}
              <Input 
                 type="number" 
                 // Mostra o valor da prop, converte para string vazia se for 0 para placeholder funcionar
                 value={goalValue === 0 ? '' : goalValue} 
                 onChange={handleGoalValueChange} 
                 placeholder={strategy === 'valor_fixo' ? 'Ex: 400000' : (strategy === 'porcentagem' ? 'Ex: 10' : 'Ex: 2.1')}
               />
              <span className="font-semibold text-muted-foreground">{goalUnit}</span>
            </div>
          </div>

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
      
      {/* SEÇÃO 4: AÇÕES */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {!isAutopilotOn && (
            <>
              {/* ✅ Chama handleUpdateGoalClick */}
              <Button onClick={handleUpdateGoalClick}> 
                <Save className="h-4 w-4 mr-2" />
                Atualizar Meta
              </Button>
              {/* ✅ Chama handleEmitirMetaClick */}
              <Button 
                variant="secondary" 
                disabled={progressPercentage >= 100} 
                onClick={handleEmitirMetaClick}
               >
                <Target className="h-4 w-4 mr-2" />
                Atingir Meta Agora
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-auto">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center space-x-2">
                {/* ✅ Usa isAutopilotOn da prop e chama handleAutopilotChange */}
                <Switch 
                  id="autopilot-mode" 
                  checked={isAutopilotOn}
                  onCheckedChange={handleAutopilotChange} 
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