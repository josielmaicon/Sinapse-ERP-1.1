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
    Edit,
    Percent,
    DollarSign
} from "lucide-react"
import { Separator } from "@/components/ui/separator" // Adicionei se quiser usar
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Kbd } from "@/components/ui/kbd"
import CardBodyT from "@/components/CardBodyT"
// Certifique-se que este arquivo existe com esse nome:
import { PaymentMethodModal } from "./ModalFormPag" 

const API_URL = "http://localhost:8000";

export default function FinanceiroSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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

  // --- FETCH DATA ---
  const fetchData = React.useCallback(async () => {
      try {
          // 1. Métodos
          const resMethods = await fetch(`${API_URL}/configuracoes/financeiro/metodos`);
          if (resMethods.ok) setPaymentMethods(await resMethods.json());

          // 2. Configurações Gerais
          const resConfig = await fetch(`${API_URL}/configuracoes/geral`);
          if (resConfig.ok) {
              const data = await resConfig.json();
              setPixSettings(prev => ({
                  ...prev,
                  chavePadrao: data.pix_chave_padrao || "",
                  tipoChave: data.pix_tipo_chave || "cnpj",
                  // Se o backend enviar overrides no futuro, mapeie aqui
                  pdvOverrides: [] 
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

  const handleToggleMethod = async (id, currentStatus, currentData) => {
      // Otimismo UI
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
          fetchData(); // Reverte
      }
  };

  // Salvar PIX (PUT /regras)
  const handleSavePix = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await fetch(`${API_URL}/configuracoes/financeiro/regras`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  pix_chave_padrao: pixSettings.chavePadrao,
                  pix_tipo_chave: pixSettings.tipoChave
              })
          });
          toast.success("Configuração PIX salva!");
      } catch (e) { toast.error("Erro ao salvar."); }
      finally { setIsLoading(false); }
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

  // Helper para ícones
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

  const handleSaveGeneric = async (e, section) => {
      e.preventDefault();
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 1000)); 
      toast.success(`${section} salvas com sucesso!`);
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
            <BreadcrumbPage>Financeiro</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* SEÇÃO 1: FORMAS DE PAGAMENTO */}
      <CardBodyT title="Formas de Pagamento" subtitle="Gerencie quais métodos são aceitos no PDV e suas taxas administrativas.">
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
                              <TableHead>Atalho</TableHead>
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
                                  <TableCell>
                                    {method.hotkey ? <Kbd>{method.hotkey}</Kbd> : <span className="text-muted-foreground text-xs">-</span>}
                                </TableCell>
                                  <TableCell className="capitalize text-muted-foreground">{method.tipo}</TableCell>
                                  <TableCell>{method.taxa > 0 ? `${method.taxa}%` : 'Isento'}</TableCell>
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
      <form onSubmit={handleSavePix}>
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

                  {/* Lado Direito: Overrides por PDV (RESTAURADO) */}
                  <div className="space-y-4 border-l pl-6 md:pl-8">
                      <div className="flex items-center justify-between">
                          <div className="space-y-1">
                              <h4 className="font-medium">Chaves Específicas por PDV</h4>
                              <p className="text-xs text-muted-foreground">Use se algum caixa precisar receber em outra conta.</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => toast.info("Em breve: Adicionar exceção")}>
                              <Plus className="h-3 w-3 mr-1"/> Adicionar
                          </Button>
                      </div>
                      
                      <div className="space-y-3">
                          {pixSettings.pdvOverrides.length === 0 && (
                              <div className="h-24 flex items-center justify-center border-2 border-dashed rounded-md">
                                  <p className="text-sm text-muted-foreground italic">Nenhuma exceção configurada.</p>
                              </div>
                          )}
                          {/* (Aqui viria o .map dos overrides se houvesse) */}
                      </div>
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Configurações PIX"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* SEÇÃO 3: REGRAS DE CREDIÁRIO */}
      <form onSubmit={handleSaveCrediario}>
          <CardBodyT title="Regras de Crediário" subtitle="Defina juros e multas automáticas para clientes em atraso.">
              <div className="flex flex-col gap-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Multa */}
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-amber-600" /> Multa por Atraso (R$)
                          </Label>
                          <Input 
                              type="number" 
                              step="0.01" 
                              value={crediarioRules.multaAtraso} 
                              onChange={e => setCrediarioRules({...crediarioRules, multaAtraso: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">Valor fixo cobrado uma única vez após o vencimento.</p>
                      </div>

                      {/* Juros */}
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-blue-600" /> Juros ao Mês (%)
                          </Label>
                          <Input 
                              type="number" 
                              step="0.1" 
                              value={crediarioRules.jurosMensais} 
                              onChange={e => setCrediarioRules({...crediarioRules, jurosMensais: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">Juros compostos calculados pro-rata dia.</p>
                      </div>

                      {/* Carência */}
                      <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-green-600" /> Dias de Carência
                          </Label>
                          <Input 
                              type="number" 
                              value={crediarioRules.diasCarencia} 
                              onChange={e => setCrediarioRules({...crediarioRules, diasCarencia: e.target.value})}
                          />
                          <p className="text-xs text-muted-foreground">Dias após o vencimento antes de aplicar juros/multa.</p>
                      </div>
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Regras Financeiras"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* Modal */}
      <PaymentMethodModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          onSuccess={fetchData} 
      />
    </div>
  );
}