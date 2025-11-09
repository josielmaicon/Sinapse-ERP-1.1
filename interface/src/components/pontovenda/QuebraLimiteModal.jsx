"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ShieldAlert } from "lucide-react"

export function LimitOverrideModal({ open, onOpenChange, onConfirmOverride, message }) {
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (open) {
            setPassword("");
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleConfirm = async (e) => {
        e?.preventDefault();
        if (!password) return;
        
        setIsLoading(true);
        // Chama o callback passando a senha. O componente pai (PaymentModal)
        // vai refazer a requisição de venda com essa senha.
        await onConfirmOverride(password); 
        setIsLoading(false);
        // Não fechamos automaticamente aqui; o pai decidirá se fecha (sucesso) ou mostra erro.
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <div className="flex items-center justify-center text-amber-500 mb-2">
                        <ShieldAlert className="h-10 w-10" />
                    </div>
                    <DialogTitle className="text-center">Autorização Necessária</DialogTitle>
                    <DialogDescription className="text-center">
                        {message || "Limite de crédito excedido."}
                        <br/>Insira a senha de administrador para liberar esta venda.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleConfirm} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-pass-override" className="sr-only">Senha Admin</Label>
                        <Input
                            id="admin-pass-override"
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-center text-2xl tracking-widest"
                            placeholder="••••"
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !password}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Autorizar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
