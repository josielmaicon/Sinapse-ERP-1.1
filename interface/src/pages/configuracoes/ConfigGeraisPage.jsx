"use client"

import { cn } from "@/lib/utils"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Wand2, Image as ImageIcon, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import CardBodyT from "@/components/CardBodyT"
import { Skeleton } from "@/components/ui/skeleton"
// ✅ Importe o Hook do Contexto
import { useSettings } from "@/ConfigContext";

const API_URL = "http://localhost:8000"; 

export default function GeralSettingsPage() {
  // ✅ LINHA CRUCIAL: Trazendo 'settings' do contexto para o componente
  const { settings, refreshSettings, setTheme } = useSettings();
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isBillingLoading, setIsBillingLoading] = React.useState(true);
  
  const [billingInfo, setBillingInfo] = React.useState({
      plano: "Carregando...",
      status: "...",
      proxima_cobranca: "..."
  });

  // Estado do formulário
  const [formData, setFormData] = React.useState({
      nome_fantasia: "",
      cnpj: "",
      logo_data: "",     
      tipo_logo: "url",  
      tema_preferido: "system",
      cor_destaque: "#3b82f6", // Padrão azul
      fuso_horario: "America/Sao_Paulo",
  });

  // ✅ EFEITO 1: Sincronizar formulário com dados do Contexto (Banco)
  React.useEffect(() => {
      if (settings) { // <-- O erro acontecia aqui porque 'settings' não existia
          setFormData({
              nome_fantasia: settings.nome_fantasia || "",
              cnpj: settings.cnpj || "",
              logo_data: settings.logo_data || "",
              tipo_logo: settings.tipo_logo || "url",
              tema_preferido: settings.tema_preferido || "system",
              cor_destaque: settings.cor_destaque || "#3b82f6", 
              fuso_horario: settings.fuso_horario || "America/Sao_Paulo",
          });
      }
  }, [settings]);

  // ✅ EFEITO 2: Carregar dados de Billing
  React.useEffect(() => {
      if (settings) {
         setBillingInfo({
             plano: settings.plano_atual || "Plano Gratuito",
             status: settings.status_assinatura || "ativo",
             proxima_cobranca: "2025-12-01" 
         });
         setIsBillingLoading(false);
      }
  }, [settings]);

  // --- LÓGICA DE UPLOAD DE LOGO ---
  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isSvg = file.type === "image/svg+xml";
      const reader = new FileReader();

      reader.onload = (event) => {
          const content = event.target.result;
          
          setFormData(prev => ({
              ...prev,
              logo_data: content,
              tipo_logo: isSvg ? "svg" : "base64"
          }));
          
          toast.success("Logo carregada com sucesso!");
          if (isSvg) extractColorFromSvg(content);
      };

      if (isSvg) reader.readAsText(file); 
      else reader.readAsDataURL(file); 
  };

  // --- LÓGICA DE EXTRAÇÃO DE COR ---
  const extractColorFromSvg = (svgContent) => {
      const colorMatch = svgContent.match(/fill=["']?(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3})["']?/);
      if (colorMatch && colorMatch[1]) {
          setFormData(prev => ({ ...prev, cor_destaque: colorMatch[1] }));
          toast.info(`Cor ${colorMatch[1]} detectada na Logo!`);
      }
  };
  
  const extractColorFromImage = () => {
     if (formData.tipo_logo === 'svg') {
         extractColorFromSvg(formData.logo_data);
         return;
     }
     if (!formData.logo_data) return;

     const img = new Image();
     img.src = formData.logo_data;
     img.onload = () => {
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         canvas.width = 1;
         canvas.height = 1;
         ctx.drawImage(img, 0, 0, 1, 1);
         const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
         const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
         
         setFormData(prev => ({ ...prev, cor_destaque: hex }));
         toast.info("Cor extraída da imagem!");
     };
  };

  const handleSaveIdentidade = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const res = await fetch(`${API_URL}/configuracoes/geral`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(formData)
          });
          if (!res.ok) throw new Error();
          
          toast.success("Configurações salvas com sucesso!");
          refreshSettings(); // Atualiza o contexto
          
      } catch (e) {
          toast.error("Erro ao salvar configurações.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleSaveAparencia = async (e) => {
    e.preventDefault();
    handleSaveIdentidade(e);
  };

  const handleThemeChange = (theme) => {
      setFormData(prev => ({ ...prev, tema_preferido: theme }));
      setTheme(theme); 
  };
  
  const handleColorChange = (e) => {
      const newColor = e.target.value;
      setFormData(prev => ({ ...prev, cor_destaque: newColor }));
      document.documentElement.style.setProperty('--brand-color', newColor);
  };
  
  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));


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
           <CardBodyT title="Identidade" subtitle="Defina a marca da sua empresa.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="nome_loja">Nome da Loja</Label>
                          <Input 
                              id="nome_loja" 
                              name="nome_fantasia"
                              value={formData.nome_fantasia}
                              onChange={handleFormChange}
                              placeholder="Nome Fantasia"
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

                  <div className="space-y-3">
                      <Label>Logotipo da Empresa</Label>
                      <div className="flex items-start gap-4">
                          <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden relative shadow-sm">
                              {formData.logo_data ? (
                                  formData.tipo_logo === 'svg' ? (
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: formData.logo_data }} 
                                        className="w-full h-full p-2 [&>svg]:w-full [&>svg]:h-full" 
                                      />
                                  ) : (
                                      <img src={formData.logo_data} alt="Logo" className="w-full h-full object-contain" />
                                  )
                              ) : (
                                  <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                              )}
                          </div>

                          <div className="flex-1 space-y-2">
                              <Input 
                                  type="file" 
                                  accept="image/png, image/jpeg, image/svg+xml" 
                                  onChange={handleLogoUpload}
                                  className="text-sm"
                              />
                              <p className="text-[11px] text-muted-foreground">
                                  Suporta PNG, JPG e SVG.
                              </p>
                          </div>
                      </div>
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
           <CardBodyT title="Aparência" subtitle="Personalize as cores e o tema do sistema.">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                   <div className="space-y-2">
                       <Label>Tema Padrão</Label>
                       <Select value={formData.tema_preferido} onValueChange={handleThemeChange}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                               <SelectItem value="system">Automático</SelectItem>
                               <SelectItem value="light">Claro</SelectItem>
                               <SelectItem value="dark">Escuro</SelectItem>
                           </SelectContent>
                       </Select>
                   </div>

                   <div className="space-y-2">
                        <Label>Cor Destaque</Label>
                        <div className="flex gap-3">
                            <div className="relative h-10 w-full flex gap-2">
                                <div className="relative flex-1">
                                    <input type="color" value={formData.cor_destaque} onChange={handleColorChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                    <div 
                                        className="w-full h-full rounded-md border shadow-sm flex items-center justify-center text-xs font-mono font-medium" 
                                        style={{ backgroundColor: formData.cor_destaque, color: getContrastColor(formData.cor_destaque) }}
                                    >
                                        {(formData.cor_destaque || "#000000").toUpperCase()}
                                    </div>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={extractColorFromImage}
                                    title="Capturar cor da Logo"
                                    disabled={!formData.logo_data}
                                >
                                     <Wand2 className="h-4 w-4 mr-2" /> Usar da Logo
                                </Button>
                            </div>
                        </div>
                   </div>
               </div>
               <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Aparência"}
                   </Button>
              </div>
           </CardBodyT>
       </form>

       <CardBodyT title="Assinatura & Plano" subtitle="Gerencie seu plano e o status da sua fatura.">
          <div className="space-y-4 pt-6">
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
           <div className="flex justify-end pt-4">
              <Button variant="outline" asChild disabled={isBillingLoading}>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                      Gerenciar Assinatura <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
              </Button>
           </div>
      </CardBodyT>
    </div>
  );
}

// Helper
function getContrastColor(hexColor) {
    if (!hexColor) return 'black';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}