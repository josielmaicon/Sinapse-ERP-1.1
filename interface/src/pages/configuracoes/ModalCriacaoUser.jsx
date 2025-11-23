"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, UserCog, Lock } from "lucide-react"

const API_URL = "http://localhost:8000";

export function UserModal({ open, onOpenChange, onSuccess, userToEdit }) {
    const [formData, setFormData] = React.useState({
        nome: "",
        email: "",
        funcao: "operador",
        senha: ""
    });
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if(open) {
            if (userToEdit) {
                setFormData({
                    nome: userToEdit.nome,
                    email: userToEdit.email || "",
                    funcao: userToEdit.funcao,
                    senha: "" // Senha vazia na edição (só preenche se quiser mudar)
                });
            } else {
                setFormData({ nome: "", email: "", funcao: "operador", senha: "" });
            }
        }
    }, [open, userToEdit]);

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validações básicas
        if (!formData.nome) return toast.warning("Nome obrigatório");
        if (!userToEdit && !formData.senha) return toast.warning("Senha obrigatória para novo usuário");

        setIsLoading(true);
        
        try {
            const url = userToEdit 
                ? `${API_URL}/usuarios/${userToEdit.id}` 
                : `${API_URL}/usuarios/`;
            
            const method = userToEdit ? 'PUT' : 'POST';
            
            const payload = { ...formData };
            if (userToEdit) {
                // Na edição, enviamos 'nova_senha' apenas se preenchido
                if (formData.senha) payload.nova_senha = formData.senha;
                delete payload.senha; // Remove campo antigo
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
                            onChange={e => setFormData({...formData, nome: e.target.value})} 
                            placeholder="Ex: Ana Paula" 
                            required 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>E-mail (Login)</Label>
                        <Input 
                            type="email"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            placeholder="ana@loja.com" 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Função / Permissão</Label>
                        <Select 
                            value={formData.funcao} 
                            onValueChange={v => setFormData({...formData, funcao: v})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operador">Operador (Vendas)</SelectItem>
                                <SelectItem value="gerente">Gerente (Autorizações)</SelectItem>
                                <SelectItem value="admin">Administrador (Total)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Lock className="h-3 w-3" /> 
                            {userToEdit ? "Redefinir Senha (Opcional)" : "Senha de Acesso"}
                        </Label>
                        <Input 
                            type="password"
                            value={formData.senha} 
                            onChange={e => setFormData({...formData, senha: e.target.value})} 
                            placeholder={userToEdit ? "Deixe vazio para manter" : "******"} 
                            className="font-mono"
                        />
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