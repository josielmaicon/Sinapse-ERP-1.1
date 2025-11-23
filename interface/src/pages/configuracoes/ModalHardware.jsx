"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Printer, Monitor } from "lucide-react"

const API_URL = "http://localhost:8000";

// --- MODAL 1: Nova Impressora ---
export function PrinterModal({ open, onOpenChange, onSuccess }) {
    const [formData, setFormData] = React.useState({ nome: "", tipo: "rede", caminho: "" });
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if(open) setFormData({ nome: "", tipo: "rede", caminho: "" });
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/configuracoes/hardware/impressoras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if(!res.ok) throw new Error();
            toast.success("Impressora cadastrada!");
            onSuccess();
            onOpenChange(false);
        } catch (e) { toast.error("Erro ao salvar."); }
        finally { setIsLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Nova Impressora</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Apelido</Label>
                        <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Epson Cozinha" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Conexão</Label>
                        <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rede">Rede (IP)</SelectItem>
                                <SelectItem value="usb">USB / Serial</SelectItem>
                                <SelectItem value="windows">Spooler Windows</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>{formData.tipo === 'rede' ? 'Endereço IP' : 'Caminho / Nome da Fila'}</Label>
                        <Input value={formData.caminho} onChange={e => setFormData({...formData, caminho: e.target.value})} placeholder={formData.tipo === 'rede' ? "192.168.1.200" : "COM1 ou Nome_Impressora"} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin"/> : "Salvar"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- MODAL 2: Configurar PDV (Novo ou Edição) ---
export function PdvConfigModal({ open, onOpenChange, onSuccess, printers, pdvToEdit }) {
    const [nome, setNome] = React.useState("");
    const [printerId, setPrinterId] = React.useState("0"); // "0" = Nenhuma
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if(open) {
            setNome(pdvToEdit ? pdvToEdit.nome : "");
            // Se tiver impressora vinculada, pega o ID, senão 0
            setPrinterId(pdvToEdit?.impressora?.id ? String(pdvToEdit.impressora.id) : "0");
        }
    }, [open, pdvToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = { nome, impressora_id: parseInt(printerId) };
        const method = pdvToEdit ? 'PUT' : 'POST';
        const url = pdvToEdit 
            ? `${API_URL}/configuracoes/hardware/pdvs/${pdvToEdit.id}` 
            : `${API_URL}/configuracoes/hardware/pdvs`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(!res.ok) throw new Error();
            toast.success(`Terminal ${pdvToEdit ? 'atualizado' : 'criado'}!`);
            onSuccess();
            onOpenChange(false);
        } catch (e) { toast.error("Erro ao salvar PDV."); }
        finally { setIsLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{pdvToEdit ? "Editar Terminal" : "Novo Terminal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Nome do Terminal (Hostname)</Label>
                        <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Caixa 01" required />
                        <p className="text-[10px] text-muted-foreground">Deve corresponder ao nome da máquina ou identificador.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Impressora Padrão</Label>
                        <Select value={printerId} onValueChange={setPrinterId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">-- Nenhuma --</SelectItem>
                                {printers.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.nome} ({p.tipo})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin"/> : "Salvar"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}