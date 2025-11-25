"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, UserCog, Lock, CheckCheck } from "lucide-react" // ✅ Importei CheckCheck
import { cn } from "@/lib/utils" // Importei cn para classes condicionais

const API_URL = "http://localhost:8000";

export function UserModal({ open, onOpenChange, onSuccess, userToEdit }) {
    // ✅ 1. Adicionei senha_confirmacao ao estado
    const [formData, setFormData] = React.useState({
        nome: "",
        email: "",
        funcao: "operador",
        senha: "",
        senha_confirmacao: "" 
    });
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset ao abrir o modal
    React.useEffect(() => {
        if(open) {
            if (userToEdit) {
                setFormData({
                    nome: userToEdit.nome,
                    email: userToEdit.email || "",
                    funcao: userToEdit.funcao,
                    senha: "",
                    senha_confirmacao: "" // Reseta na edição
                });
            } else {
                setFormData({ nome: "", email: "", funcao: "operador", senha: "", senha_confirmacao: "" });
            }
        }
    }, [open, userToEdit]);

    // Helper para inputs
    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validações básicas
        if (!formData.nome) return toast.warning("Nome obrigatório");
        
        // Lógica de Senha para Criação (Obrigatória)
        if (!userToEdit && !formData.senha) {
            return toast.warning("Senha obrigatória para novo usuário.");
        }
        
        // ✅ 2. Validação da Confirmação (Se houver senha digitada)
        if (formData.senha) {
            if (formData.senha.length < 4) {
                return toast.warning("A senha é muito curta (mínimo 4 caracteres).");
            }
            if (formData.senha !== formData.senha_confirmacao) {
                return toast.error("As senhas não coincidem.", { description: "Verifique a digitação nos dois campos." });
            }
        }

        setIsLoading(true);
        
        try {
            const url = userToEdit 
                ? `${API_URL}/usuarios/${userToEdit.id}` 
                : `${API_URL}/usuarios/`;
            
            const method = userToEdit ? 'PUT' : 'POST';
            
            // Prepara payload (Não enviamos a confirmação pro backend)
            const payload = { 
                nome: formData.nome,
                email: formData.email,
                funcao: formData.funcao
            };
            
            // Só anexa senha se foi preenchida
            if (formData.senha) {
                if (userToEdit) payload.nova_senha = formData.senha;
                else payload.senha = formData.senha;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Erro ao salvar.");
            }
            
            toast.success(`Usuário ${userToEdit ? 'atualizado' : 'criado'} com sucesso!`);
            onSuccess();
            onOpenChange(false);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" /> 
                        {userToEdit ? "Editar Usuário" : "Novo Usuário"}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSave} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input 
                            value={formData.nome} 
                            onChange={e => handleChange('nome', e.target.value)} 
                            placeholder="Ex: Ana Paula" 
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>E-mail (Login)</Label>
                        <Input 
                            type="email"
                            value={formData.email} 
                            onChange={e => handleChange('email', e.target.value)} 
                            placeholder="ana@loja.com" 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Função / Permissão</Label>
                        <Select 
                            value={formData.funcao} 
                            onValueChange={v => handleChange('funcao', v)}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operador">Operador (Vendas)</SelectItem>
                                <SelectItem value="gerente">Gerente (Autorizações)</SelectItem>
                                <SelectItem value="admin">Administrador (Total)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 pt-2 border-t mt-2">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground tracking-wider">
                                <Lock className="h-3 w-3" /> 
                                {userToEdit ? "Redefinir Senha (Opcional)" : "Definir Senha"}
                            </Label>
                            <Input 
                                type="password"
                                value={formData.senha} 
                                onChange={e => handleChange('senha', e.target.value)} 
                                placeholder={userToEdit ? "Deixe vazio para manter" : "******"} 
                                className="font-mono"
                            />
                        </div>

                        {/* ✅ 3. CAMPO DE CONFIRMAÇÃO (Inteligente) */}
                        {/* Só aparece se for cadastro novo OU se o usuário começou a digitar uma senha na edição */}
                        {(formData.senha || !userToEdit) && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label className="flex items-center gap-2 text-xs uppercase text-muted-foreground tracking-wider">
                                    <CheckCheck className="h-3 w-3" /> Confirmar Senha
                                </Label>
                                <Input 
                                    type="password"
                                    value={formData.senha_confirmacao} 
                                    onChange={e => handleChange('senha_confirmacao', e.target.value)} 
                                    placeholder="Repita a senha" 
                                    className={cn(
                                        "font-mono transition-colors",
                                        // Feedback visual: Verde se igual, Vermelho se diferente (e preenchido)
                                        formData.senha && formData.senha_confirmacao && formData.senha === formData.senha_confirmacao 
                                            ? "border-green-500 focus-visible:ring-green-500" 
                                            : (formData.senha_confirmacao && "border-destructive focus-visible:ring-destructive")
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                            {userToEdit ? "Salvar Alterações" : "Criar Usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}