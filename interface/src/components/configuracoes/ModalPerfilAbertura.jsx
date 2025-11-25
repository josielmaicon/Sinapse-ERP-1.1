"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Clock, Banknote } from "lucide-react"
// ✅ Importa o seu componente de input monetário
import { CurrencyInput } from "../ui/input-monetario" 

const API_URL = "http://localhost:8000";

export function ProfileModal({ open, onOpenChange, onSuccess }) {
    const [nome, setNome] = React.useState("");
    const [horario, setHorario] = React.useState("08:00");
    const [valor, setValor] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset ao abrir
    React.useEffect(() => {
        if(open) {
            setNome(""); 
            setHorario("08:00"); 
            setValor(0);
        }
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!nome.trim()) {
             toast.warning("Dê um nome para este perfil.");
             return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/configuracoes/operacional/perfis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nome, 
                    horario_sugerido: horario, 
                    valor_padrao: valor 
                })
            });
            
            if (!res.ok) throw new Error();
            
            toast.success("Perfil de abertura criado!");
            onSuccess(); // Atualiza a tabela na página pai
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar perfil.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Novo Perfil de Abertura</DialogTitle>
                    <DialogDescription>
                        Padronize os valores iniciais do caixa para agilizar a operação.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="perfil-nome">Nome do Perfil</Label>
                        <Input 
                            id="perfil-nome"
                            value={nome} 
                            onChange={e => setNome(e.target.value)} 
                            placeholder="Ex: Manhã - Dia de Semana" 
                            autoFocus
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Horário */}
                        <div className="space-y-2">
                            <Label htmlFor="perfil-horario" className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> Horário Sugerido
                            </Label>
                            <Input 
                                id="perfil-horario"
                                type="time" 
                                value={horario} 
                                onChange={e => setHorario(e.target.value)} 
                            />
                        </div>
                        
                        {/* Valor (CurrencyInput) */}
                        <div className="space-y-2">
                            <Label htmlFor="perfil-valor" className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Banknote className="h-3 w-3" /> Fundo de Caixa
                            </Label>
                            <CurrencyInput 
                                id="perfil-valor"
                                value={valor} 
                                onChange={setValor} 
                                className="text-right font-mono" 
                                placeholder="R$ 0,00"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                            Salvar Perfil
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}