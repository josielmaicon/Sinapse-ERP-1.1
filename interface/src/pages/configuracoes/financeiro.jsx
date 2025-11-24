"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { 
    Loader2, 
    Plus, 
    Trash2, 
    CreditCard, 
    QrCode, 
    Banknote, 
    Wallet, 
    Badge,
    RefreshCcw,
    Edit,
    Percent,
    DollarSign
} from "lucide-react"
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
import { PaymentMethodModal } from "./ModalFormPag"
import { PixOverrideModal } from "./ModalSubsPix"

const API_URL = "http://localhost:8000";

export default function FinanceiroSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = React.useState(false); // Estado do modal PIX
  const [isProcessingJuros, setIsProcessingJuros] = React.useState(false);

  // Estados REAIS
  const [paymentMethods, setPaymentMethods] = React.useState([]);
  
  const [pixSettings, setPixSettings] = React.useState({
      chavePadrao: "",
      tipoChave: "cnpj",
      pdvOverrides: [] 
  });

  const [crediarioRules, setCrediarioRules] = React.useState({
      multaAtraso: "0", 
      jurosMensais: "0", 
      diasCarencia: "0"
  });

const handleProcessarJuros = async () => {
    if(!confirm("ATENÇÃO: Isso irá calcular e aplicar juros...")) return;
    
    setIsProcessingJuros(true);
    try {
        // ✅ Adicione o /api se o seu backend usar prefixo global
        // (Baseado nos seus logs anteriores, parece que você removeu o /api global, então use /rotinas)
        const res = await fetch(`${API_URL}/rotinas/processar-juros`, { method: 'POST' });
        
        // Tenta ler o JSON mesmo se der erro
        const data = await res.json().catch(() => ({ detail: "Erro desconhecido (JSON inválido)" }));
        
        if (res.ok) {
            toast.success("Rotina finalizada!", {
                description: `${data.cobrancas_geradas} clientes cobrados.`
            });
        } else {
            console.error("Erro API Juros:", data); // Olha no console (F12)
            throw new Error(data.detail || `Erro HTTP: ${res.status}`);
        }
    } catch (e) {
        console.error(e);
        toast.error("Erro ao processar juros", { description: e.message });
    } finally {
        setIsProcessingJuros(false);
    }
  };


  // --- FETCH DATA ---
  const fetchData = React.useCallback(async () => {
      try {
          // 1. Métodos
          const resMethods = await fetch(`${API_URL}/configuracoes/financeiro/metodos`);
          if (resMethods.ok) setPaymentMethods(await resMethods.json());

          // 2. Configurações Gerais (Onde fica o PIX e Crediário global)
          const resConfig = await fetch(`${API_URL}/configuracoes/geral`);
          
          // 3. Overrides de PIX (Lista de PDVs)
          const resOverrides = await fetch(`${API_URL}/configuracoes/financeiro/pix/overrides`);
          let overridesData = [];
          
          if (resOverrides.ok) {
              const allPdvs = await resOverrides.json();
              // Filtra apenas os que têm override configurado
              overridesData = allPdvs.filter(p => p.pix_chave_especifica);
          }

          if (resConfig.ok) {
              const data = await resConfig.json();
              
              console.log("Dados carregados do Banco:", data); // DEBUG

              setPixSettings(prev => ({
                  ...prev,
                  chavePadrao: data.pix_chave_padrao || "",
                  tipoChave: data.pix_tipo_chave || "cnpj",
                  pdvOverrides: overridesData // ✅ Usa os overrides reais
              }));
              setCrediarioRules({
                  multaAtraso: String(data.crediario_multa || 0),
                  jurosMensais: String(data.crediario_juros_mensal || 0),
                  diasCarencia: String(data.crediario_dias_carencia || 0)
              });
          }
      } catch (e) { console.error(e); toast.error("Erro ao carregar dados."); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // --- HANDLERS ---

  const handleToggleMethod = async (id, currentStatus, currentData) => {
      setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ativo: !currentStatus } : m));
      try {
          await fetch(`${API_URL}/configuracoes/financeiro/metodos/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...currentData, ativo: !currentStatus })
          });
          toast.success("Status atualizado.");
      } catch (e) {
          toast.error("Erro ao salvar.");
          fetchData(); 
      }
  };

  // Handler para remover override de PIX
  const handleDeleteOverride = async (pdvId) => {
      try {
          await fetch(`${API_URL}/configuracoes/financeiro/pix/overrides/${pdvId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pix_chave_especifica: null, pix_tipo_especifico: null })
          });
          toast.success("Exceção removida.");
          fetchData();
      } catch (e) { toast.error("Erro ao remover."); }
  };

  // ✅ Salvar PIX (PUT /regras) - CORRIGIDO COM DEBUG
  const handleSavePix = async (e) => {
      e.preventDefault();
      console.log("Botão Salvar PIX clicado!"); // DEBUG: Se não aparecer, o botão não está ligado

      setIsLoading(true);
      try {
          const payload = { 
              pix_chave_padrao: pixSettings.chavePadrao,
              pix_tipo_chave: pixSettings.tipoChave
          };
          console.log("Enviando payload PIX:", payload);

          const res = await fetch(`${API_URL}/configuracoes/financeiro/regras`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error("Falha na API");

          toast.success("Configuração PIX salva!");
      } catch (e) { 
          console.error(e);
          toast.error("Erro ao salvar."); 
      } finally { 
          setIsLoading(false); 
      }
  };

  // Salvar Crediário (PUT /regras)
  const handleSaveCrediario = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await fetch(`${API_URL}/configuracoes/financeiro/regras`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  crediario_multa: parseFloat(crediarioRules.multaAtraso),
                  crediario_juros_mensal: parseFloat(crediarioRules.jurosMensais),
                  crediario_dias_carencia: parseInt(crediarioRules.diasCarencia)
              })
          });
          toast.success("Regras de crediário salvas!");
      } catch (e) { toast.error("Erro ao salvar."); }
      finally { setIsLoading(false); }
  };

  const getMethodIcon = (type) => {
      switch(type) {
          case 'especie': return <Banknote className="h-4 w-4 text-green-600" />;
          case 'pix': return <QrCode className="h-4 w-4 text-teal-600" />;
          case 'credito': 
          case 'debito': return <CreditCard className="h-4 w-4 text-blue-600" />;
          case 'crediario': return <Wallet className="h-4 w-4 text-orange-600" />;
          default: return <CreditCard className="h-4 w-4 text-muted-foreground" />;
      }
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
            <BreadcrumbPage>Financeiro</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* SEÇÃO 1: FORMAS DE PAGAMENTO */}
      <CardBodyT title="Formas de Pagamento" subtitle="Gerencie quais métodos são aceitos no PDV.">
          <div className="pt-6 space-y-4">
              <div className="flex justify-end">
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Nova Forma
                  </Button>
              </div>
              <div className="rounded-md border h-[320px] overflow-y-auto relative">
                  <Table>
                      <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                          <TableRow>
                              <TableHead>Método</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Taxa (%)</TableHead>
                              <TableHead>Ativo no PDV</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paymentMethods.map((method) => (
                              <TableRow key={method.id}>
                                  <TableCell className="font-medium flex items-center gap-3">
                                      <div className="p-2 bg-muted rounded-md">{getMethodIcon(method.tipo)}</div>
                                      {method.nome}
                                  </TableCell>
                                  <TableCell className="capitalize text-muted-foreground">{method.tipo}</TableCell>
                                  <TableCell>{method.taxa}%</TableCell>
                                  <TableCell>
                                      <Switch 
                                          checked={method.ativo}
                                          onCheckedChange={() => handleToggleMethod(method.id, method.ativo, method)}
                                      />
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </CardBodyT>

      {/* SEÇÃO 2: CONFIGURAÇÃO PIX */}
      {/* ✅ ID DO FORMULÁRIO ADICIONADO */}
      <form id="form-pix" onSubmit={handleSavePix}>
          <CardBodyT title="Configuração PIX" subtitle="Defina as chaves para geração de QR Code nos caixas.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  
                  {/* Lado Esquerdo: Chave Geral */}
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <h4 className="font-medium flex items-center gap-2"><QrCode className="h-4 w-4" /> Chave PIX Padrão</h4>
                          <p className="text-xs text-muted-foreground">Usada em todos os caixas que não tiverem configuração específica.</p>
                      </div>
                      <div className="grid gap-4">
                          <div className="space-y-2">
                              <Label>Tipo de Chave</Label>
                              <Select 
                                value={pixSettings.tipoChave} 
                                onValueChange={(v) => setPixSettings(p => ({...p, tipoChave: v}))}
                              >
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
                              <Label>Chave</Label>
                              <Input 
                                value={pixSettings.chavePadrao} 
                                onChange={(e) => setPixSettings(p => ({...p, chavePadrao: e.target.value}))}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Lado Direito: Overrides por PDV */}
                  <div className="space-y-4 border-l pl-6 md:pl-8">
                      <div className="flex items-center justify-between">
                          <div className="space-y-1">
                              <h4 className="font-medium">Chaves Específicas por PDV</h4>
                              <p className="text-xs text-muted-foreground">Use se algum caixa precisar receber em outra conta.</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setIsPixModalOpen(true)}>
                              <Plus className="h-3 w-3 mr-1"/> Adicionar
                          </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                          {pixSettings.pdvOverrides.length === 0 && (
                              <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-md">
                                  <p className="text-sm text-muted-foreground italic">Nenhuma exceção configurada.</p>
                              </div>
                          )}
                          
                          {pixSettings.pdvOverrides.map(pdv => (
                              <div key={pdv.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border group">
                                  <div className="flex-1">
                                      <p className="text-sm font-medium">{pdv.nome}</p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Badge variant="outline" className="text-[10px] h-5 px-1">{pdv.pix_tipo_especifico}</Badge>
                                          <span className="font-mono">{pdv.pix_chave_especifica}</span>
                                      </div>
                                  </div>
                                  <Button 
                                      type="button" variant="ghost" size="icon" 
                                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleDeleteOverride(pdv.id)}
                                  >
                                      <Trash2 className="h-3 w-3" />
                                  </Button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   {/* ✅ VÍNCULO EXPLÍCITO COM O FORMULÁRIO */}
                   <Button type="submit" form="form-pix" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Configurações PIX"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      <form id="form-crediario" onSubmit={handleSaveCrediario}>
          <CardBodyT title="Regras de Crediário" subtitle="Defina juros e multas automáticas para clientes em atraso.">
              <div className="flex flex-col gap-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-amber-600" /> Multa por Atraso (R$)</Label>
                          <Input type="number" step="0.01" value={crediarioRules.multaAtraso} onChange={e => setCrediarioRules({...crediarioRules, multaAtraso: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Percent className="h-4 w-4 text-blue-600" /> Juros ao Mês (%)</Label>
                          <Input type="number" step="0.1" value={crediarioRules.jurosMensais} onChange={e => setCrediarioRules({...crediarioRules, jurosMensais: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Wallet className="h-4 w-4 text-green-600" /> Dias de Carência</Label>
                          <Input type="number" value={crediarioRules.diasCarencia} onChange={e => setCrediarioRules({...crediarioRules, diasCarencia: e.target.value})} />
                      </div>
                  </div>
              </div>
              
            <div className="pt-5 flex justify-between items-center">
                {/* Botão de Teste (Lado Esquerdo) */}
                <Button 
                    type="button" 
                    variant="secondary" 
                    className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                    onClick={handleProcessarJuros}
                    disabled={isProcessingJuros}
                >
                    {isProcessingJuros ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <RefreshCcw className="mr-2 h-4 w-4"/>}
                    Rodar Processamento de Juros (Manual)
                </Button>

                {/* Botão Salvar (Lado Direito) */}
                <Button type="submit" form="form-crediario" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Regras Financeiras"}
                </Button>
            </div>

          </CardBodyT>
      </form>

      {/* Modais */}
      <PaymentMethodModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={fetchData} />
      <PixOverrideModal open={isPixModalOpen} onOpenChange={setIsPixModalOpen} onSuccess={fetchData} />

    </div>
  );
}