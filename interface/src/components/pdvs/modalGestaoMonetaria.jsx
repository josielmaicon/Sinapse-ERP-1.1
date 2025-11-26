"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, ArrowUpCircle, ArrowDownCircle, LockKeyhole, Calculator } from "lucide-react"
import { CurrencyInput } from "../ui/input-monetario"
import { Kbd } from "@/components/ui/kbd" // ✅ Importar Kbd

const API_URL = "http://localhost:8000";

export function CashManagementModal({ open, onOpenChange, pdvSession, onSuccess }) {
    const [activeTab, setActiveTab] = React.useState("sangria");
    const [valor, setValor] = React.useState(0);
    const [observacao, setObservacao] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    
    // ✅ Ref para focar no input ao trocar de aba
    const inputRef = React.useRef(null);
    
    // Reset ao abrir
    React.useEffect(() => {
        if (open) {
            setValor(0);
            setObservacao("");
            setActiveTab("sangria"); // Padrão mais comum
            
            // Foco inicial
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    // ✅ Lógica de Foco Automático ao trocar de aba
    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select(); // Seleciona o texto para sobrescrever fácil
            }, 50);
        }
    }, [activeTab, open]);

    // ✅ Lógica de Hotkeys (F2, F3, F4)
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (!open || isLoading) return;

            if (e.key === 'F2') { e.preventDefault(); setActiveTab('suprimento'); }
            if (e.key === 'F3') { e.preventDefault(); setActiveTab('sangria'); }
            if (e.key === 'F4') { e.preventDefault(); setActiveTab('fechamento'); }
            
            // Enter para confirmar
            if (e.key === 'Enter') {
                // Se estiver no input de obs, ou se valor > 0, submete
                e.preventDefault();
                handleOperation();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, isLoading, activeTab, valor, observacao]); // Dependências para o closure do handleOperation

    const handleOperation = async () => {
        if (valor <= 0 && activeTab !== 'fechamento') {
             toast.warning("Informe um valor."); return;
        }
        
        setIsLoading(true);
        try {
            let url = "";
            let payload = {};

            if (activeTab === 'suprimento') {
                url = `${API_URL}/pdvs/${pdvSession.id}/suprimento`;
                payload = { valor, observacao };
            } else if (activeTab === 'sangria') {
                url = `${API_URL}/pdvs/${pdvSession.id}/sangria`;
                payload = { valor, observacao };
            } else if (activeTab === 'fechamento') {
                url = `${API_URL}/pdvs/${pdvSession.id}/fechar-caixa`;
                payload = { valor_informado_dinheiro: valor, observacao };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Erro na operação.");

            if (activeTab === 'fechamento') {
                if (Math.abs(data.diferenca) < 0.01) {
                    toast.success("Caixa fechado com sucesso! Valores batem perfeitamente.");
                } else if (data.diferenca > 0) {
                    toast.warning(`Caixa fechado com SOBRA de R$ ${data.diferenca.toFixed(2)}.`);
                } else {
                    toast.error(`Caixa fechado com QUEBRA (FALTA) de R$ ${Math.abs(data.diferenca).toFixed(2)}.`);
                }
            } else {
                toast.success(`${activeTab === 'sangria' ? 'Retirada' : 'Entrada'} registrada com sucesso.`);
            }
            
            onSuccess(); 
            onOpenChange(false);

        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gestão de Caixa</DialogTitle>
                    <DialogDescription>Registre movimentações ou encerre o dia.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        {/* ✅ Tabs com Kbd */}
                        <TabsTrigger value="suprimento" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                            <ArrowUpCircle className="h-4 w-4 mr-2" /> Suprimento <Kbd className="ml-2">F2</Kbd>
                        </TabsTrigger>
                        <TabsTrigger value="sangria" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800">
                            <ArrowDownCircle className="h-4 w-4 mr-2" /> Sangria <Kbd className="ml-2">F3</Kbd>
                        </TabsTrigger>
                        <TabsTrigger value="fechamento" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                            <LockKeyhole className="h-4 w-4 mr-2" /> Fechar <Kbd className="ml-2">F4</Kbd>
                        </TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-lg">
                                {activeTab === 'fechamento' ? 'Valor Contado na Gaveta (Dinheiro)' : 'Valor da Movimentação'}
                            </Label>
                            <CurrencyInput 
                                ref={inputRef} // ✅ Ref conectada
                                value={valor} 
                                onChange={setValor} 
                                className="text-4xl h-16 text-center font-mono" 
                                placeholder="R$ 0,00"
                                // Removemos autoFocus nativo pois controlamos via useEffect
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Observação / Motivo (Opcional)</Label>
                            <Input 
                                value={observacao} 
                                onChange={e => setObservacao(e.target.value)} 
                                placeholder={activeTab === 'sangria' ? "Ex: Pagamento Motoboy" : "..."}
                            />
                        </div>

                        {activeTab === 'fechamento' && (
                            <div className="bg-muted p-3 rounded-md flex items-center gap-3 text-sm text-muted-foreground">
                                <Calculator className="h-5 w-5" />
                                <p>O sistema comparará o valor contado com as vendas registradas para calcular quebras.</p>
                            </div>
                        )}
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar <Kbd className="ml-2">ESC</Kbd></Button>
                    <Button 
                        onClick={handleOperation} 
                        disabled={isLoading}
                        variant={activeTab === 'sangria' ? 'secondary' : (activeTab === 'fechamento' ? 'destructive' : 'default')}
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Confirmar"} <Kbd className="ml-2">Enter</Kbd>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}