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

export default function FinanceiroSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 

  // --- Mock: Formas de Pagamento ---
  const [paymentMethods, setPaymentMethods] = React.useState([
      { id: 1, nome: "Dinheiro", tipo: "especie", ativo: true, taxa: 0 },
      { id: 2, nome: "PIX", tipo: "pix", ativo: true, taxa: 0 },
      { id: 3, nome: "Cartão de Crédito", tipo: "credito", ativo: true, taxa: 3.5 },
      { id: 4, nome: "Cartão de Débito", tipo: "debito", ativo: true, taxa: 1.5 },
      { id: 5, nome: "Crediário (Fiado)", tipo: "crediario", ativo: true, taxa: 0 },
      { id: 6, nome: "Voucher / Alimentação", tipo: "outros", ativo: false, taxa: 4.0 },
  ]);

  // --- Mock: Configurações PIX ---
  const [pixSettings, setPixSettings] = React.useState({
      chavePadrao: "12.345.678/0001-99",
      tipoChave: "cnpj",
      pdvOverrides: [
          { id: 1, pdv_nome: "Caixa 02 (Bar)", chave: "celular-do-gerente" },
      ]
  });

  // --- Mock: Regras Crediário ---
  const [crediarioRules, setCrediarioRules] = React.useState({
      multaAtraso: "2.00", // Valor fixo ou %
      jurosMensais: "1.5", // %
      diasCarencia: "5"
  });

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

  // --- Handlers ---
  const handleToggleMethod = (id) => {
      setPaymentMethods(prev => prev.map(m => 
          m.id === id ? { ...m, ativo: !m.ativo } : m
      ));
      toast.success("Status do método de pagamento alterado.");
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
      
      {/* --- SEÇÃO 1: FORMAS DE PAGAMENTO --- */}
      <CardBodyT 
        title="Formas de Pagamento" 
        subtitle="Gerencie quais métodos são aceitos no PDV e suas taxas administrativas."
      >
          <div className="pt-6 space-y-4">
              <div className="flex justify-end">
                  <Button size="sm" onClick={() => toast.info("Modal: Nova Forma de Pagamento")}>
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
                              <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {paymentMethods.map((method) => (
                              <TableRow key={method.id}>
                                  <TableCell className="font-medium flex items-center gap-3">
                                      <div className="p-2 bg-muted rounded-md">
                                          {getMethodIcon(method.tipo)}
                                      </div>
                                      {method.nome}
                                  </TableCell>
                                  <TableCell className="capitalize text-muted-foreground">{method.tipo}</TableCell>
                                  <TableCell>{method.taxa > 0 ? `${method.taxa}%` : 'Isento'}</TableCell>
                                  <TableCell>
                                      <Switch 
                                          checked={method.ativo}
                                          onCheckedChange={() => handleToggleMethod(method.id)}
                                      />
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" onClick={() => toast.info(`Editar ${method.nome}`)}>
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </CardBodyT>

      {/* --- SEÇÃO 2: CONFIGURAÇÃO PIX --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Chaves PIX')}>
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
                              <Select defaultValue={pixSettings.tipoChave}>
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
                              <Input defaultValue={pixSettings.chavePadrao} />
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
                          <Button type="button" variant="ghost" size="sm" className="h-8"><Plus className="h-3 w-3 mr-1"/> Adicionar</Button>
                      </div>
                      
                      <div className="space-y-3">
                          {pixSettings.pdvOverrides.map(override => (
                              <div key={override.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border">
                                  <div className="flex-1">
                                      <p className="text-sm font-medium">{override.pdv_nome}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{override.chave}</p>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                  </Button>
                              </div>
                          ))}
                          {pixSettings.pdvOverrides.length === 0 && (
                              <p className="text-sm text-muted-foreground italic">Nenhuma exceção configurada.</p>
                          )}
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

      {/* --- SEÇÃO 3: REGRAS DE CREDIÁRIO --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Regras de Crediário')}>
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

    </div>
  );
}