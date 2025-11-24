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
    DialogDescription // ✅ 1. Importado para corrigir o Warning
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const API_URL = "http://localhost:8000";

// Nota: Removemos 'pdvList' das props, pois ele vai buscar sozinho agora
export function PixOverrideModal({ open, onOpenChange, onSuccess }) {
    const [pdvId, setPdvId] = React.useState("");
    const [tipoChave, setTipoChave] = React.useState("cpf");
    const [chave, setChave] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    
    // ✅ 2. Estado local para a lista de PDVs
    const [localPdvList, setLocalPdvList] = React.useState([]); 

    // Reset e Carga ao abrir
    React.useEffect(() => {
        if (open) {
            // Reseta o formulário
            setPdvId(""); 
            setTipoChave("cpf"); 
            setChave("");
            
            // ✅ 3. Busca a lista de PDVs (Autonomia)
            const fetchPdvs = async () => {
                try {
                    const res = await fetch(`${API_URL}/configuracoes/hardware/pdvs`);
                    if (res.ok) {
                        const data = await res.json();
                        setLocalPdvList(data);
                    } else {
                        toast.error("Não foi possível carregar a lista de caixas.");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("Erro de conexão ao buscar PDVs.");
                }
            };
            fetchPdvs();
        }
    }, [open]);
    
    const handleSave = async (e) => {
        e.preventDefault();
        if (!pdvId) return toast.warning("Selecione um PDV.");
        if (!chave) return toast.warning("Informe a chave.");

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/configuracoes/financeiro/pix/overrides/${pdvId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pix_chave_especifica: chave,
                    pix_tipo_especifico: tipoChave
                })
            });
            if (!res.ok) throw new Error();
            
            toast.success("Exceção de PIX configurada!");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao salvar configuração.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Configurar PIX por PDV</DialogTitle>
                    
                    {/* ✅ 4. A Descrição que faltava (Corrige o Warning) */}
                    <DialogDescription>
                        Defina uma chave PIX específica para um terminal, ignorando a chave geral da loja.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-2">
                    
                    <div className="space-y-2">
                        <Label>Selecionar Terminal</Label>
                        <Select value={pdvId} onValueChange={setPdvId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolha o caixa..." />
                            </SelectTrigger>
                            <SelectContent>
                                {/* ✅ 5. Renderiza a lista que buscamos (localPdvList) */}
                                {localPdvList.map(pdv => (
                                    <SelectItem key={pdv.id} value={String(pdv.id)}>
                                        {pdv.nome}
                                    </SelectItem>
                                ))}
                                {localPdvList.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Nenhum PDV cadastrado.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Chave</Label>
                        <Select value={tipoChave} onValueChange={setTipoChave}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cpf">CPF</SelectItem>
                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                <SelectItem value="email">E-mail</SelectItem>
                                <SelectItem value="celular">Celular</SelectItem>
                                <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Chave Específica</Label>
                        <Input 
                            value={chave} 
                            onChange={e => setChave(e.target.value)} 
                            placeholder="Digite a chave..." 
                            required 
                        />
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