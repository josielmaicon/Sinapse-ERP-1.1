"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Keyboard } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"

const API_URL = "http://localhost:8000";

// Teclas disponíveis para vincular (Evitar F1-F4 que são de sistema)
const AVAILABLE_HOTKEYS = ["F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];

export function PaymentMethodModal({ open, onOpenChange, onSuccess }) {
    const [nome, setNome] = React.useState("");
    const [tipo, setTipo] = React.useState("outros");
    const [taxa, setTaxa] = React.useState("0");
    const [hotkey, setHotkey] = React.useState("none"); // ✅ Estado da Hotkey
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if(open) { 
            setNome(""); 
            setTipo("outros"); 
            setTaxa("0"); 
            setHotkey("none"); // Reset
        }
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = { 
                nome, 
                tipo, 
                taxa: parseFloat(taxa) || 0,
                ativo: true,
                // Envia null se for "none"
                hotkey: hotkey === "none" ? null : hotkey 
            };

            const res = await fetch(`${API_URL}/configuracoes/financeiro/metodos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            
            toast.success("Forma de pagamento criada!");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao criar.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Nova Forma de Pagamento</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Nome de Exibição</Label>
                        <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vale Alimentação" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo (Ícone)</Label>
                            <Select value={tipo} onValueChange={setTipo}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="especie">Dinheiro (Espécie)</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                    <SelectItem value="debito">Débito</SelectItem>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="crediario">Crediário</SelectItem>
                                    <SelectItem value="outros">Outros / Voucher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Taxa (%)</Label>
                            <Input type="number" step="0.1" value={taxa} onChange={e => setTaxa(e.target.value)} />
                        </div>
                    </div>

                    {/* ✅ SELETOR DE HOTKEY */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Keyboard className="h-4 w-4 text-muted-foreground" /> Atalho no PDV (Opcional)
                        </Label>
                        <Select value={hotkey} onValueChange={setHotkey}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar tecla..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Nenhum --</SelectItem>
                                {AVAILABLE_HOTKEYS.map(key => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                            <Kbd>{key}</Kbd>
                                            <span className="text-muted-foreground text-xs">Tecla {key}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4"/>} Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}