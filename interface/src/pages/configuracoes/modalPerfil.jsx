"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CurrencyInput } from "@/components/ui/input-monetario"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const API_URL = "http://localhost:8000";

export function ProfileModal({ open, onOpenChange, onSuccess }) {
    const [nome, setNome] = React.useState("");
    const [horario, setHorario] = React.useState("08:00");
    const [valor, setValor] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset ao abrir
    React.useEffect(() => {
        if(open) {
            setNome(""); setHorario("08:00"); setValor(0);
        }
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/configuracoes/operacional/perfis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, horario_sugerido: horario, valor_padrao: valor })
            });
            if (!res.ok) throw new Error();
            
            toast.success("Perfil criado!");
            onSuccess(); // Recarrega a lista
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao criar perfil.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Novo Perfil de Abertura</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome do Perfil</Label>
                        <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Manhã Padrão" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Horário</Label>
                            <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fundo (R$)</Label>
                            <CurrencyInput value={valor} onChange={setValor} className="text-right" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}