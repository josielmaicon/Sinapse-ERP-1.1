"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import CardBodyT from "@/components/CardBodyT"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = "http://localhost:8000"; // Ou sua URL base

export default function GeralSettingsPage() {
  
  // --- Estados (mesma lógica de antes) ---
  const [formData, setFormData] = React.useState({
      nome_loja: "",
      cnpj: "",
      logo_url: "",
      tema: "system",
      cor_base: "#000000",
      fuso_horario: "America/Sao_Paulo",
  });
  const [billingInfo, setBillingInfo] = React.useState({
      plano: "Plano Mestre",
      status: "ativo",
      proxima_cobranca: "2025-12-01"
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isBillingLoading, setIsBillingLoading] = React.useState(true); 

  // --- Carregamento de Dados (sem mudanças) ---
  React.useEffect(() => {
    const fetchSettings = async () => { 
        setIsLoading(true);
        await new Promise(res => setTimeout(res, 750));
        setFormData({
             nome_loja: "Mercado do Mestre (Simulado)",
             cnpj: "00.111.222/0001-99",
             logo_url: "https://url.da.sua.logo/logo.png",
             tema: "dark",
             cor_base: "#3b82f6",
             fuso_horario: "America/Sao_Paulo",
        });
        setIsLoading(false);
    };
    const fetchBilling = async () => { 
        setIsBillingLoading(true);
        await new Promise(res => setTimeout(res, 1200));
        setBillingInfo({
             plano: "Plano Mestre",
             status: "ativo",
             proxima_cobranca: "2025-12-01"
         });
         setIsBillingLoading(false);
    };
    fetchSettings();
    fetchBilling();
  }, []); 
  
  // --- Handlers (sem mudanças) ---
  const handleFormChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name, value) => {
     setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleThemeChange = (theme) => {
      handleSelectChange('tema', theme);
      console.log(`Aplicando tema: ${theme}`);
  };
  
  const handleSaveIdentidade = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      console.log("Salvando Identidade:", { nome: formData.nome_loja, cnpj: formData.cnpj, logo: formData.logo_url });
      await new Promise(res => setTimeout(res, 1000));
      toast.success("Identidade da loja salva!");
      setIsLoading(false);
  };
  
  const handleSaveAparencia = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      console.log("Salvando Aparência:", { tema: formData.tema, cor: formData.cor_base, fuso: formData.fuso_horario });
      await new Promise(res => setTimeout(res, 1000));
      toast.success("Aparência do sistema salva!");
      setIsLoading(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-3"> 
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/configuracoes">Configurações</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Geral</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <form onSubmit={handleSaveIdentidade}>
          <CardBodyT title="Identidade" subtitle="O nome, CNPJ e logo da sua empresa que aparecem nos impressos e recibos.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  {/* Coluna 1 */}
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="nome_loja">Nome da Loja</Label>
                          <Input 
                              id="nome_loja" 
                              name="nome_loja"
                              value={formData.nome_loja}
                              onChange={handleFormChange}
                              placeholder="O nome que aparece nos recibos"
                              disabled={isLoading}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ</Label>
                          <Input 
                              id="cnpj" 
                              name="cnpj"
                              value={formData.cnpj}
                              onChange={handleFormChange}
                              placeholder="00.000.000/0001-00"
                              disabled={isLoading}
                          />
                      </div>
                  </div>
                  {/* Coluna 2 */}
                  <div className="space-y-2">
                      <Label htmlFor="logo_url">URL da Logo</Label>
                      <Input 
                          id="logo_url" 
                          name="logo_url"
                          value={formData.logo_url}
                          onChange={handleFormChange}
                          placeholder="https://.../logo.png (para impressos)"
                          disabled={isLoading}
                      />
                  </div>
              </div>
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Identidade"}
                   </Button>
              </div>
          </CardBodyT>
      </form>
      
      <form onSubmit={handleSaveAparencia}>
          <CardBodyT title="Aparência & Regional" subtitle="Personalize a aparência do sistema e o fuso horário para os relatórios.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="tema">Tema (Aparência)</Label>
                      <Select 
                          value={formData.tema} 
                          onValueChange={handleThemeChange}
                          disabled={isLoading}
                      >
                          <SelectTrigger id="tema"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="system">Padrão do Sistema</SelectItem>
                              <SelectItem value="light">Claro (Light)</SelectItem>
                              <SelectItem value="dark">Escuro (Dark)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="cor_base">Cor Destaque (PDV)</Label>
                      <div className="flex items-center gap-2">
                           <Input 
                              id="cor_base" 
                              name="cor_base"
                              type="text" 
                              value={formData.cor_base}
                              onChange={handleFormChange}
                              className="w-24 font-mono"
                              disabled={isLoading}
                           />
                           <Input 
                              type="color" 
                              value={formData.cor_base}
                              onChange={handleFormChange}
                              name="cor_base"
                              className="w-12 h-10 p-1"
                              disabled={isLoading}
                           />
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="fuso_horario">Fuso Horário</Label>
                      <Select 
                          value={formData.fuso_horario} 
                          onValueChange={(val) => handleSelectChange('fuso_horario', val)}
                          disabled={isLoading}
                      >
                          <SelectTrigger id="fuso_horario"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="America/Sao_Paulo">(UTC-3) São Paulo</SelectItem>
                              <SelectItem value="America/Manaus">(UTC-4) Manaus</SelectItem>
                              <SelectItem value="America/Rio_Branco">(UTC-5) Acre</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Aparência"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

        <CardBodyT title="Assinatura & Plano" subtitle="Gerencie seu plano e o status da sua fatura.">
          <div className="space-y-4">
              {isBillingLoading ? (
                  <div className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                  </div>
              ) : (
                  <div className="space-y-1 ">
                      <Label>Plano Atual</Label>
                      <p className="text-xl font-semibold">{billingInfo.plano}</p>
                      <Label>Status</Label>
                      <p className={cn("font-semibold", billingInfo.status === 'ativo' ? 'text-green-600' : 'text-destructive')}>
                          {billingInfo.status === 'ativo' ? 'Ativo' : 'Pendente'}
                      </p>
                  </div>
              )}
          </div>
           <div className="flex justify-end">
              <Button variant="outline" asChild disabled={isBillingLoading}>
                  <a href="https://url.do.seu.portal.de.billing" target="_blank" rel="noopener noreferrer">
                      Gerenciar Assinatura <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
              </Button>
           </div>
      </CardBodyT>
      
    </div>
  );
}