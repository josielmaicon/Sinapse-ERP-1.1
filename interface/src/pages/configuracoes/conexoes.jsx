"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Loader2, 
    Save, 
    Plug, 
    ShoppingCart, 
    MessageSquare, 
    Calculator, 
    Search, 
    CheckCircle2, 
    XCircle, 
    RefreshCw,
    Eye,
    EyeOff
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import CardBodyT from "@/components/CardBodyT"
import { Separator } from "@/components/ui/separator"
import { Download } from "lucide-react"

// --- Componentes Auxiliares ---

const IntegrationStatus = ({ connected }) => (
    <div className={`flex items-center gap-2 text-sm font-medium ${connected ? "text-green-600" : "text-muted-foreground"}`}>
        <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
        {connected ? "Conectado" : "Desconectado"}
    </div>
);

// Input de Senha com Toggle
const SecretInput = ({ value, onChange, placeholder, disabled }) => {
    const [show, setShow] = React.useState(false);
    return (
        <div className="relative">
            <Input 
                type={show ? "text" : "password"} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                disabled={disabled}
                className="pr-10 font-mono"
            />
            <Button 
                type="button" variant="ghost" size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground"
                onClick={() => setShow(!show)}
            >
                {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </Button>
        </div>
    )
}

export default function ConexoesSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 

  // --- Estados (Mock) ---
  const [produtoApi, setProdutoApi] = React.useState({
      ativo: true,
      provider: "Cosmos Bluesoft",
      token: "TOKEN-123-ABC",
      status: true
  });

  const [ecommerce, setEcommerce] = React.useState({
      ativo: false,
      plataforma: "woocommerce",
      url: "https://minhaloja.com.br",
      consumerKey: "",
      consumerSecret: "",
      status: false
  });

  const [ifood, setIfood] = React.useState({
      ativo: false,
      merchantId: "",
      clientId: "",
      clientSecret: "",
      status: false,
      autoAceitar: true // Regra de negócio extra
  });

  const [whatsapp, setWhatsapp] = React.useState({
      ativo: true,
      provider: "WPPConnect", // ou Twilio, Z-API
      sessao: "loja_principal",
      status: true,
      qrCode: null // (Futuro: base64 do QR)
  });

  const [contabilidade, setContabilidade] = React.useState({
      emailContador: "contabilidade@exemplo.com",
      sistema: "dominio", // Dominio, Contimatic, etc
      autoEnvioMensal: true
  });


  // --- Handlers ---

  const handleTestConnection = async (serviceName) => {
      toast.promise(new Promise(r => setTimeout(r, 2000)), {
          loading: `Testando conexão com ${serviceName}...`,
          success: `Conexão com ${serviceName} estabelecida com sucesso!`,
          error: `Falha ao conectar com ${serviceName}.`
      });
  };

  const handleSaveGeneric = async (e, section) => {
      e.preventDefault();
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 1000)); 
      toast.success(`Configurações de ${section} salvas!`);
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
                <BreadcrumbPage>Conexões</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

      {/* --- SEÇÃO 1: INTELIGÊNCIA DE PRODUTOS --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Consulta de Produtos')}>
          <CardBodyT 
            title="Catálogo Inteligente" 
            subtitle="Enriqueça o cadastro de produtos automaticamente buscando dados por código de barras (EAN)."
          >
              <div className="flex flex-col gap-6 pt-6">
                  <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/30">
                              <Search className="h-6 w-6" />
                          </div>
                          <div>
                              <Label className="text-base">Consulta Automática de Produtos</Label>
                              <p className="text-sm text-muted-foreground">Preenche nome, NCM e foto ao bipar um código novo.</p>
                          </div>
                      </div>
                      <Switch 
                          checked={produtoApi.ativo} 
                          onCheckedChange={(c) => setProdutoApi(p => ({...p, ativo: c}))} 
                      />
                  </div>

                  {produtoApi.ativo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-2">
                              <Label>Provedor de Dados</Label>
                              <Input value={produtoApi.provider} disabled className="bg-muted" />
                          </div>
                          <div className="space-y-2">
                              <Label>Token de API (Chave de Acesso)</Label>
                              <div className="flex gap-2">
                                  <div className="flex-1">
                                      <SecretInput 
                                          value={produtoApi.token} 
                                          onChange={(e) => setProdutoApi(p => ({...p, token: e.target.value}))}
                                          placeholder="Cole seu token aqui"
                                          disabled={isLoading}
                                      />
                                  </div>
                                  <Button type="button" variant="outline" onClick={() => handleTestConnection('Bluesoft')}>Testar</Button>
                              </div>
                              <p className="text-xs text-muted-foreground">Status atual: <span className="text-green-600 font-medium">Operacional</span></p>
                          </div>
                      </div>
                  )}
                  
                  <div className="flex justify-end border-t pt-4">
                       <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Configuração"}
                       </Button>
                  </div>
              </div>
          </CardBodyT>
      </form>

      <Separator />

      {/* --- SEÇÃO 2: CANAIS DE VENDA (ECOMMERCE / IFOOD) --- */}
      <div className="space-y-6">
          <div className="px-1">
             <h3 className="text-lg font-semibold tracking-tight">Canais de Venda</h3>
             <p className="text-sm text-muted-foreground">Unifique suas vendas online e delivery no PDV.</p>
          </div>

          {/* E-COMMERCE */}
          <form onSubmit={(e) => handleSaveGeneric(e, 'E-commerce')}>
              <CardBodyT title="Loja Virtual (E-commerce)" subtitle="Sincronize estoque e preços com sua loja online.">
                  <div className="flex flex-col gap-6 pt-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg dark:bg-purple-900/30">
                                  <ShoppingCart className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5">
                                  <Label className="text-base">Integração Ativa</Label>
                                  <IntegrationStatus connected={ecommerce.status} />
                              </div>
                          </div>
                          <Switch checked={ecommerce.ativo} onCheckedChange={(c) => setEcommerce(p => ({...p, ativo: c}))} />
                      </div>

                      {ecommerce.ativo && (
                          <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                              <div className="space-y-2">
                                  <Label>URL da Loja</Label>
                                  <Input 
                                      value={ecommerce.url} 
                                      onChange={(e) => setEcommerce(p => ({...p, url: e.target.value}))}
                                      placeholder="https://..." 
                                  />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label>Consumer Key</Label>
                                      <Input value={ecommerce.consumerKey} onChange={(e) => setEcommerce(p => ({...p, consumerKey: e.target.value}))} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Consumer Secret</Label>
                                      <SecretInput value={ecommerce.consumerSecret} onChange={(e) => setEcommerce(p => ({...p, consumerSecret: e.target.value}))} />
                                  </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                  <Button type="button" variant="outline" onClick={() => handleTestConnection('WooCommerce')}>Testar Conexão</Button>
                                  <Button type="submit">Salvar Integração</Button>
                              </div>
                          </div>
                      )}
                  </div>
              </CardBodyT>
          </form>

          {/* IFOOD */}
          <form onSubmit={(e) => handleSaveGeneric(e, 'iFood')}>
              <CardBodyT title="Delivery (iFood)" subtitle="Receba pedidos do iFood diretamente no caixa.">
                  <div className="flex flex-col gap-6 pt-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30">
                                  <Plug className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5">
                                  <Label className="text-base">Integração iFood</Label>
                                  <IntegrationStatus connected={ifood.status} />
                              </div>
                          </div>
                          <Switch checked={ifood.ativo} onCheckedChange={(c) => setIfood(p => ({...p, ativo: c}))} />
                      </div>

                      {ifood.ativo && (
                          <div className="space-y-4 animate-in fade-in">
                              <div className="flex items-center justify-between border p-3 rounded-md">
                                  <Label className="cursor-pointer" htmlFor="auto-aceitar">Aceitar pedidos automaticamente?</Label>
                                  <Switch id="auto-aceitar" checked={ifood.autoAceitar} onCheckedChange={(c) => setIfood(p => ({...p, autoAceitar: c}))} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2 md:col-span-2">
                                      <Label>Merchant ID (UUID)</Label>
                                      <Input value={ifood.merchantId} onChange={(e) => setIfood(p => ({...p, merchantId: e.target.value}))} className="font-mono" />
                                  </div>
                                  {/* Client ID/Secret geralmente são fixos do app, mas deixamos aqui se for app próprio */}
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                  <Button type="button" variant="outline" onClick={() => handleTestConnection('iFood')}>Validar Token</Button>
                                  <Button type="submit">Salvar Integração</Button>
                              </div>
                          </div>
                      )}
                  </div>
              </CardBodyT>
          </form>
      </div>

      <Separator />

      {/* --- SEÇÃO 3: COMUNICAÇÃO (WHATSAPP) --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'WhatsApp')}>
          <CardBodyT title="Notificações (WhatsApp)" subtitle="Conecte seu número para envio automático de recibos e cobranças.">
              <div className="flex flex-col gap-6 pt-6">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/30">
                              <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5">
                              <Label className="text-base">Disparo de Mensagens</Label>
                              <p className="text-xs text-muted-foreground">Utiliza a API do WPPConnect ou Gateway.</p>
                          </div>
                      </div>
                      <Switch checked={whatsapp.ativo} onCheckedChange={(c) => setWhatsapp(p => ({...p, ativo: c}))} />
                  </div>

                  {whatsapp.ativo && (
                      <div className="flex flex-col md:flex-row gap-6 items-start animate-in fade-in">
                          {/* Área do QR Code (Simulação) */}
                          <div className="w-full md:w-1/3 aspect-square bg-white p-4 rounded-lg border flex flex-col items-center justify-center text-center">
                              {whatsapp.status ? (
                                  <>
                                      <CheckCircle2 className="h-16 w-16 text-green-500 mb-2" />
                                      <p className="font-semibold text-green-700">Conectado!</p>
                                      <p className="text-xs text-muted-foreground">Sessão: {whatsapp.sessao}</p>
                                  </>
                              ) : (
                                  <>
                                      <div className="h-32 w-32 bg-slate-200 animate-pulse rounded mb-2" />
                                      <p className="text-xs text-muted-foreground">Escaneie o QR Code no WhatsApp</p>
                                  </>
                              )}
                              <Button variant="ghost" size="sm" className="mt-4 w-full">
                                  <RefreshCw className="h-3 w-3 mr-2" /> Gerar Novo QR
                              </Button>
                          </div>

                          <div className="flex-1 space-y-4 w-full">
                              <div className="space-y-2">
                                  <Label>Nome da Sessão</Label>
                                  <Input value={whatsapp.sessao} onChange={(e) => setWhatsapp(p => ({...p, sessao: e.target.value}))} />
                              </div>
                              <div className="space-y-2">
                                  <Label>Webhook (Opcional)</Label>
                                  <Input placeholder="https://..." />
                                  <p className="text-[10px] text-muted-foreground">Para receber respostas dos clientes.</p>
                              </div>
                              <div className="pt-4 flex justify-end">
                                  <Button type="submit">Salvar Configuração</Button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </CardBodyT>
      </form>

      <Separator />

      {/* --- SEÇÃO 4: CONTABILIDADE --- */}
      <CardBodyT title="Contabilidade" subtitle="Exportação e integração com o contador.">
          <div className="flex flex-col gap-6 pt-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg dark:bg-amber-900/30">
                      <Calculator className="h-5 w-5" />
                  </div>
                  <Label className="text-base">Integração Contábil</Label>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                       <Label>Email do Contador</Label>
                       <Input 
                          value={contabilidade.emailContador} 
                          onChange={(e) => setContabilidade(p => ({...p, emailContador: e.target.value}))} 
                          placeholder="contador@exemplo.com"
                       />
                   </div>
                   <div className="space-y-2">
                       <Label>Sistema Contábil (Formato)</Label>
                        <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={contabilidade.sistema}
                            onChange={(e) => setContabilidade(p => ({...p, sistema: e.target.value}))}
                        >
                            <option value="dominio">Domínio Sistemas</option>
                            <option value="contimatic">Contimatic</option>
                            <option value="alterdata">Alterdata</option>
                            <option value="padrao">Padrão SPED/Sintegra</option>
                        </select>
                   </div>
               </div>
               
               <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                        <Label>Envio Automático Mensal</Label>
                        <p className="text-xs text-muted-foreground">Envia o XML de todas as notas no dia 05 de cada mês.</p>
                    </div>
                    <Switch checked={contabilidade.autoEnvioMensal} onCheckedChange={(c) => setContabilidade(p => ({...p, autoEnvioMensal: c}))} />
               </div>

               <div className="flex justify-end gap-2 pt-2">
                   <Button variant="secondary" onClick={() => toast.info("Gerando pacote fiscal...")}>
                       <Download className="mr-2 h-4 w-4" /> Baixar XMLs do Mês
                   </Button>
                   <Button onClick={(e) => handleSaveGeneric(e, 'Contabilidade')}>
                       Salvar Preferências
                   </Button>
               </div>
          </div>
      </CardBodyT>

    </div>
  );
}