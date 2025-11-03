"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const API_URL = "http://localhost:8000"; 

export function AdminAuthModal({ open, onOpenChange, onAuthSuccess, actionLabel }) {
    const [email, setEmail] = React.useState("");
    const [senha, setSenha] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (!open) { // Limpa o estado quando fecha
            setEmail("");
            setSenha("");
            setError("");
        }
    }, [open]);

    const handleAuth = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            if (!email || !senha) {
                throw new Error("Preencha e-mail e senha do Administrador.");
            }
            await onAuthSuccess({ admin_email: email, admin_senha: senha });

            onOpenChange(false); // Fecha o modal
            
        } catch (e) {
            setError(e.detail || e.message || "Falha na autorização.");
            toast.error("Autorização Negada", { description: e.message || e.detail });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Autorização de Administrador</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {actionLabel}. Exige confirmação de um Administrador.
                    </p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="auth-email">E-mail (Admin)</Label>
                        <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="auth-senha">Senha</Label>
                        <Input id="auth-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
                    </div>
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                    <Button type="button" onClick={handleAuth} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Autorizar Ação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}