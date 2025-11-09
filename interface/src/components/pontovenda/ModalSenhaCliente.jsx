"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, LockKeyhole } from "lucide-react"

const API_URL = "http://localhost:8000"; 

// Recebe: open, onOpenChange, clientToVerify (objeto cliente), onVerified (callback de sucesso)
export function ClientPinModal({ open, onOpenChange, clientToVerify, onVerified }) {
    const [pin, setPin] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");
    const pinInputRef = React.useRef(null);

    // Foco e reset ao abrir
    React.useEffect(() => {
        if (open) {
            setPin("");
            setErrorMessage("");
            setIsLoading(false);
            // Pequeno delay para garantir que o modal renderizou
            setTimeout(() => pinInputRef.current?.focus(), 100);
        }
    }, [open, clientToVerify]);

    const handleVerify = async (e) => {
        e?.preventDefault();
        if (!pin || isLoading || !clientToVerify) return;

        setIsLoading(true);
        setErrorMessage("");

        try {
            // ✅ Chama a nova rota de verificação
            const response = await fetch(`${API_URL}/clientes/${clientToVerify.id}/verificar-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin })
            });

            const result = await response.json();

            if (!response.ok) {
                // Se a senha estiver errada, o backend retorna 401 com a mensagem
                throw new Error(result.detail || "Senha incorreta.");
            }

            // SUCESSO! A senha está correta.
            toast.success("Senha verificada com sucesso!");
            onVerified(result); // Retorna o cliente completo (que veio da API)
            onOpenChange(false); // Fecha o modal de PIN

        } catch (error) {
            console.error("Erro na verificação de PIN:", error);
            setErrorMessage(error.message);
            setPin(""); // Limpa o PIN para tentar de novo
            // Foca novamente no input após o erro
            setTimeout(() => pinInputRef.current?.focus(), 100);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center justify-center text-primary mb-3">
                        <LockKeyhole className="h-10 w-10" />
                    </div>
                    <DialogTitle className="text-center">Senha do Cliente</DialogTitle>
                    <DialogDescription className="text-center">
                        Insira a senha de 4 a 6 dígitos de <b>{clientToVerify?.nome}</b> para continuar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="flex justify-center py-4">
                        <Input
                            ref={pinInputRef}
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            disabled={isLoading}
                            className="text-center text-3xl tracking-[1em] font-mono h-14 w-48" // Estilo "PIN"
                            placeholder="••••"
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-sm text-destructive text-center font-medium px-4">
                            {errorMessage}
                        </p>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || pin.length < 4} className="w-full sm:w-auto">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verificar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}