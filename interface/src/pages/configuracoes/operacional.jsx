"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Loader2, 
    Trash2, 
    Plus, 
    Printer, 
    RefreshCcw, 
    Monitor, 
    Upload, 
    Download, 
    Edit,
    Receipt,    // Para Cupom
    MessageCircle, // Para Mensagens
    Gift,        // Para Aniversário
    AlertTriangle,
    Clock
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import CardBodyT from "@/components/CardBodyT" // Seu componente padrão
import { Separator } from "@/components/ui/separator"

export default function OperacionalSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 

  // --- Estados ---

  const [permitirEstoqueNegativo, setPermitirEstoqueNegativo] = React.useState(false);

  // ✅ Estado: Perfis de Abertura (Lista para a Tabela)
  const [perfisAbertura, setPerfisAbertura] = React.useState([
      { id: 1, nome: "Padrão Manhã", valor: "100.00", horario: "08:00" },
      { id: 2, nome: "Padrão Tarde", valor: "150.00", horario: "14:00" },
      { id: 3, nome: "Fim de Semana", valor: "300.00", horario: "09:00" },
  ]);

  // ✅ Estado: Mensagens (Expandido)
  const [mensagens, setMensagens] = React.useState({
      // Impressos
      cupomHeader: "Promoções toda sexta!",
      cupomFooter: "Obrigado pela preferência. Volte sempre!",
      politicaTroca: "Trocas em até 7 dias com a etiqueta afixada.",
      
      // Digital / CRM
      boasVindas: "Olá [NOME], seja bem-vindo ao [LOJA]! Seu cadastro foi realizado com sucesso.",
      aniversario: "Parabéns [NOME]! Venha nos visitar hoje e ganhe um brinde especial.",
      posVenda: "Olá [NOME], o que achou da sua compra? Avalie-nos no Google!",
      
      // Cobrança
      cobrancaPreventiva: "Olá [NOME], seu vencimento é amanhã. Aproveite para pagar com desconto.",
      cobranca30: "Olá [NOME], consta um débito pendente há 30 dias. Entre em contato para regularizar.",
      cobranca60: "Prezado [NOME], seu débito completou 60 dias. Evite restrições de crédito."
  });

  // Mock Hardware
  const [pdvs] = React.useState([
      { id: 1, nome: "Caixa 01 (Principal)", status: "ativo", impressora: "EPSON T20" },
      { id: 2, nome: "Caixa 02", status: "inativo", impressora: null },
      { id: 3, nome: "Retaguarda", status: "ativo", impressora: "PDF" },
  ]);

  const [impressoras] = React.useState([
      { id: 1, nome: "EPSON T20", ip: "192.168.0.100", status: "online" },
      { id: 2, nome: "Bematech Cozinha", ip: "192.168.0.101", status: "erro" },
  ]);

  // --- Handlers ---
  const handleMensagensChange = (e) => {
      setMensagens(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveGeneric = async (e, section) => {
      e.preventDefault();
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 1000)); 
      toast.success(`${section} atualizado com sucesso!`);
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
            <BreadcrumbPage>Operacional</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* --- SEÇÃO 1: REGRAS E PADRÕES --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Regras Operacionais')}>
          <CardBodyT title="Regras de Venda e Abertura" subtitle="Defina o comportamento do PDV e perfis de turno.">
              <div className="flex flex-col gap-8 pt-6">
                  
                  {/* 1.1 Regra de Bloqueio (Visual Limpo) */}
                  <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/10">
                      <div className="space-y-0.5">
                          <Label htmlFor="permitirEstoqueNegativo" className="text-base">Venda sem Estoque</Label>
                          <p className="text-sm text-muted-foreground">Permitir que o caixa registre vendas mesmo se o saldo do produto for zero ou negativo.</p>
                      </div>
                      <Switch 
                          id="permitirEstoqueNegativo"
                          checked={permitirEstoqueNegativo}
                          onCheckedChange={setPermitirEstoqueNegativo}
                          disabled={isLoading}
                      />
                  </div>

                  <Separator />

                  {/* 1.2 Tabela de Perfis de Abertura (Sua solicitação) */}
                  <div className="space-y-4">
                       <div className="flex items-center justify-between">
                           <div className="space-y-1">
                               <Label className="text-base flex items-center gap-2">
                                   <Clock className="h-4 w-4" /> Perfis de Abertura de Caixa
                               </Label>
                               <p className="text-sm text-muted-foreground">Valores pré-definidos para agilizar a abertura do dia.</p>
                           </div>
                           <Button size="sm" variant="outline" type="button" onClick={() => toast.info("Modal: Novo Perfil")}>
                               <Plus className="mr-2 h-4 w-4" /> Novo Perfil
                           </Button>
                       </div>

                       <div className="rounded-md border h-[200px] overflow-y-auto relative">
                          <Table>
                              <TableHeader className="sticky top-0 bg-card z-10">
                                  <TableRow>
                                      <TableHead>Nome do Perfil</TableHead>
                                      <TableHead>Horário Sugerido</TableHead>
                                      <TableHead>Fundo de Caixa</TableHead>
                                      <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {perfisAbertura.map((perfil) => (
                                      <TableRow key={perfil.id}>
                                          <TableCell className="font-medium">{perfil.nome}</TableCell>
                                          <TableCell>{perfil.horario}</TableCell>
                                          <TableCell>R$ {perfil.valor}</TableCell>
                                          <TableCell className="text-right space-x-1">
                                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Regras"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* --- SEÇÃO 2: GESTÃO DE HARDWARE --- */}
      <CardBodyT title="Gestão de Hardware" subtitle="Gerencie terminais de venda e impressoras da rede.">
          <div className="pt-6">
              <Tabs defaultValue="pdvs" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                      <TabsList>
                          <TabsTrigger value="pdvs">Pontos de Venda</TabsTrigger>
                          <TabsTrigger value="impressoras">Impressoras</TabsTrigger>
                      </TabsList>
                      <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toast.info("Modal Nova Impressora")}>
                              <Plus className="mr-2 h-4 w-4" /> Impressora
                          </Button>
                          <Button size="sm" onClick={() => toast.info("Modal Novo PDV")}>
                              <Plus className="mr-2 h-4 w-4" /> PDV
                          </Button>
                      </div>
                  </div>
                  
                  <TabsContent value="pdvs">
                      <div className="rounded-md border h-[250px] overflow-y-auto relative">
                          <Table>
                              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                  <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Impressora</TableHead>
                                      <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {pdvs.map((pdv) => (
                                      <TableRow key={pdv.id}>
                                          <TableCell className="font-medium flex items-center gap-2">
                                              <Monitor className="h-4 w-4 text-muted-foreground" /> {pdv.nome}
                                          </TableCell>
                                          <TableCell>
                                              <Badge variant={pdv.status === 'ativo' ? 'default' : 'secondary'}>{pdv.status}</Badge>
                                          </TableCell>
                                          <TableCell className="text-xs font-mono">{pdv.impressora || "-"}</TableCell>
                                          <TableCell className="text-right space-x-1">
                                              <Button variant="ghost" size="sm" onClick={() => toast.info("Editar PDV")}>Configurar</Button>
                                              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>

                  <TabsContent value="impressoras">
                      <div className="rounded-md border h-[250px] overflow-y-auto relative">
                          <Table>
                              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                  <TableRow>
                                      <TableHead>Dispositivo</TableHead>
                                      <TableHead>IP / Porta</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Diagnóstico</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {impressoras.map((imp) => (
                                      <TableRow key={imp.id}>
                                          <TableCell className="font-medium flex items-center gap-2">
                                              <Printer className="h-4 w-4 text-muted-foreground" /> {imp.nome}
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">{imp.ip}</TableCell>
                                          <TableCell>
                                            {imp.status === 'online' 
                                                ? <Badge variant="outline" className="border-green-500 text-green-600">Online</Badge>
                                                : <Badge variant="destructive">Erro</Badge>
                                            }
                                          </TableCell>
                                          <TableCell className="text-right space-x-2">
                                              <Button variant="ghost" size="sm" onClick={() => toast.promise(new Promise(r => setTimeout(r, 1000)), { loading: 'Reiniciando...', success: 'Reiniciada' })}>
                                                  <RefreshCcw className="h-4 w-4 mr-2" /> Reiniciar
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </div>
                  </TabsContent>
              </Tabs>
          </div>
      </CardBodyT>

      {/* --- SEÇÃO 3: COMUNICAÇÃO E POLÍTICAS (Expandida) --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Comunicação')}>
          <CardBodyT title="Comunicação Visual & CRM" subtitle="Personalize a experiência do cliente no cupom e no contato digital.">
             
             {/* Usando Tabs para organizar as categorias de mensagem */}
             <div className="pt-6">
                 <Tabs defaultValue="impresso" className="w-full">
                     <TabsList className="grid w-full grid-cols-3 mb-6">
                         <TabsTrigger value="impresso">
                             <Receipt className="h-4 w-4 mr-2" /> Recibos & Impressos
                         </TabsTrigger>
                         <TabsTrigger value="cobranca">
                             <AlertTriangle className="h-4 w-4 mr-2" /> Régua de Cobrança
                         </TabsTrigger>
                         <TabsTrigger value="crm">
                             <MessageCircle className="h-4 w-4 mr-2" /> Relacionamento (CRM)
                         </TabsTrigger>
                     </TabsList>

                     <TabsContent value="impresso" className="space-y-6">
                         {/* ✅ Removido grid-cols-2, agora é uma lista vertical (stack) */}
                         <div className="flex flex-col gap-6">
                             <div className="space-y-2">
                                 <Label>Cabeçalho do Cupom</Label>
                                 <Input 
                                    value={mensagens.cupomHeader} 
                                    onChange={handleMensagensChange} 
                                    name="cupomHeader"
                                    placeholder="Ex: Promoções toda terça!" 
                                 />
                                 <p className="text-xs text-muted-foreground">Aparece logo abaixo do nome da loja.</p>
                             </div>
                             
                             <div className="space-y-2">
                                 <Label>Rodapé do Cupom</Label>
                                 <Textarea 
                                    className="min-h-[80px]" 
                                    value={mensagens.cupomFooter} 
                                    onChange={handleMensagensChange} 
                                    name="cupomFooter"
                                    rows={3} // Sugere altura visual
                                 />
                             </div>
                             
                             <div className="space-y-2">
                                 <Label>Política de Troca (Verso/Rodapé)</Label>
                                 <Textarea 
                                    className="min-h-[120px]"
                                    value={mensagens.politicaTroca} 
                                    onChange={handleMensagensChange}
                                    name="politicaTroca"
                                    rows={5}
                                 />
                             </div>
                         </div>
                     </TabsContent>

                     {/* 3.2 Cobrança - AGORA EMPILHADO */}
                     <TabsContent value="cobranca" className="space-y-6">
                         <div className="flex flex-col gap-6">
                             <div className="space-y-2">
                                 <div className="flex justify-between">
                                    <Label>Atraso Preventivo (Dia do Vencimento)</Label>
                                    <span className="text-xs text-blue-600 cursor-pointer">Enviar teste</span>
                                 </div>
                                 <Textarea 
                                    className="min-h-[100px]"
                                    value={mensagens.cobrancaPreventiva} 
                                    onChange={handleMensagensChange}
                                    name="cobrancaPreventiva"
                                    placeholder="Lembrete enviado no dia do vencimento."
                                    rows={4}
                                />
                             </div>
                             
                             <div className="space-y-2">
                                 <Label>Atraso Leve (30 dias)</Label>
                                 <Textarea 
                                    className="min-h-[100px]" 
                                    value={mensagens.cobranca30} 
                                    onChange={handleMensagensChange}
                                    name="cobranca30"
                                    rows={4}
                                />
                             </div>
                             
                             <div className="space-y-2">
                                 <Label className="text-destructive">Atraso Grave (60+ dias)</Label>
                                 <Textarea 
                                    className="min-h-[100px] border-destructive/30 focus-visible:ring-destructive/30" 
                                    value={mensagens.cobranca60} 
                                    onChange={handleMensagensChange}
                                    name="cobranca60"
                                    rows={4}
                                />
                             </div>
                         </div>
                     </TabsContent>

                     {/* 3.3 CRM - AGORA EMPILHADO */}
                     <TabsContent value="crm" className="space-y-6">
                         <div className="flex flex-col gap-6">
                             <div className="space-y-2">
                                 <Label className="flex items-center gap-2"><Gift className="h-4 w-4 text-pink-500"/> Mensagem de Aniversário</Label>
                                 <Textarea 
                                    className="min-h-[100px]"
                                    value={mensagens.aniversario} 
                                    onChange={handleMensagensChange}
                                    name="aniversario"
                                    placeholder="Enviado automaticamente no dia do aniversário."
                                    rows={4}
                                />
                             </div>
                             
                             <div className="space-y-2">
                                 <Label>Boas-vindas (Novo Cadastro)</Label>
                                 <Textarea 
                                    className="min-h-[100px]" 
                                    value={mensagens.boasVindas} 
                                    onChange={handleMensagensChange}
                                    name="boasVindas"
                                    placeholder="Enviado ao cadastrar no crediário/fidelidade."
                                    rows={4}
                                />
                             </div>
                             
                             <div className="space-y-2">
                                 <Label>Pós-Venda (Feedback)</Label>
                                 <Textarea 
                                    className="min-h-[100px]" 
                                    value={mensagens.posVenda} 
                                    onChange={handleMensagensChange}
                                    name="posVenda"
                                    placeholder="Enviado X dias após uma compra de alto valor."
                                    rows={4}
                                />
                             </div>
                         </div>
                     </TabsContent>
                 </Tabs>
             </div>
             
             <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Textos e Políticas"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* --- SEÇÃO 4: MIGRAÇÃO DE DADOS --- */}
      <CardBodyT title="Migração de Dados" subtitle="Importe ou exporte dados do sistema.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Importar */}
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => toast.info("Selecionar arquivo...")}>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                      <h4 className="font-semibold">Importar Dados</h4>
                      <p className="text-sm text-muted-foreground">CSV ou Excel de produtos/clientes.</p>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2">Selecionar Arquivo</Button>
              </div>
              
              {/* Exportar */}
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => toast.success("Backup iniciado.")}>
                  <Download className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                      <h4 className="font-semibold">Exportar Backup</h4>
                      <p className="text-sm text-muted-foreground">Backup completo ou contabilidade.</p>
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2">Gerar Arquivo</Button>
              </div>
          </div>
      </CardBodyT>

    </div>
  );
}