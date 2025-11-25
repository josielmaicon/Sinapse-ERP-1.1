"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch" 
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Loader2, Upload, Trash2, FileKey, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Eye, EyeOff, Activity, CloudCog, Clock, WifiOff, Zap
} from "lucide-react"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import CardBodyT from "@/components/CardBodyT"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const API_URL = "http://localhost:8000";

export default function FiscalSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 
  const [isUploading, setIsUploading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // --- Estados de Dados ---
  const [dadosFiscais, setDadosFiscais] = React.useState({
      regime_tributario: "simples",
      inscricao_estadual: "",
      inscricao_municipal: "",
      csc_id: "",
      csc_token: "",
      ambiente_sefaz: "homologacao",
      // Estratégia
      modo_emissao: "automatico", 
      contingencia_automatica: true,
      timeout_sefaz: "8", 
      tempo_rejeicao: "5" 
  });

  const [padroes, setPadroes] = React.useState({
      padrao_ncm: "",
      padrao_cfop_dentro: "5.102",
      padrao_cfop_fora: "6.102",
      padrao_csosn: "102"
  });

  const [certificados, setCertificados] = React.useState([]);
  
  // Estado para o arquivo de upload
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [certPassword, setCertPassword] = React.useState("");

  // --- FETCH DATA (Busca dados reais do Backend) ---
  const fetchData = React.useCallback(async () => {
      try {
          // 1. Busca Configurações Gerais (Inclui dados fiscais na tabela Empresa)
          const resGeral = await fetch(`${API_URL}/configuracoes/geral`);
          if (resGeral.ok) {
              const data = await resGeral.json();
              setDadosFiscais({
                  regime_tributario: data.regime_tributario || "simples",
                  inscricao_estadual: data.inscricao_estadual || "",
                  inscricao_municipal: data.inscricao_municipal || "",
                  csc_id: data.csc_id || "",
                  csc_token: data.csc_token || "",
                  ambiente_sefaz: data.ambiente_sefaz || "homologacao",
                  
                  // Estratégia (com defaults seguros)
                  modo_emissao: data.modo_emissao || "automatico",
                  contingencia_automatica: data.contingencia_automatica ?? true,
                  timeout_sefaz: String(data.timeout_sefaz || "8"),
                  tempo_rejeicao: String(data.tempo_rejeicao || "5")
              });
              setPadroes({
                  padrao_ncm: data.padrao_ncm || "",
                  padrao_cfop_dentro: data.padrao_cfop_dentro || "5.102",
                  padrao_cfop_fora: data.padrao_cfop_fora || "6.102",
                  padrao_csosn: data.padrao_csosn || "102"
              });
          }

          // 2. Busca Lista de Certificados
          const resCert = await fetch(`${API_URL}/configuracoes/fiscal/certificados`);
          if (resCert.ok) {
              setCertificados(await resCert.json());
          }

      } catch (e) { 
          console.error(e); 
          toast.error("Erro ao carregar dados fiscais."); 
      }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // --- HEALTH CHECK (Validador Visual) ---
  const fiscalStatus = React.useMemo(() => {
      const checks = [
          { name: "Regime Definido", valid: !!dadosFiscais.regime_tributario },
          { name: "IE Preenchida", valid: !!dadosFiscais.inscricao_estadual && dadosFiscais.inscricao_estadual.length > 2 },
          { name: "Certificado Ativo", valid: certificados.some(c => c.ativo) },
          { name: "Token NFC-e (CSC)", valid: !!dadosFiscais.csc_id && !!dadosFiscais.csc_token },
      ];
      const passed = checks.filter(c => c.valid).length;
      const total = checks.length;
      const score = (passed / total) * 100;
      
      return { checks, score, allGood: score === 100 };
  }, [dadosFiscais, certificados]);


  // --- HANDLERS ---

  // Salvar Regras (Geral)
  const handleSaveGeneric = async (e, section, payload) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          await fetch(`${API_URL}/configuracoes/fiscal/regras`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          toast.success(`${section} salvas com sucesso!`);
      } catch (e) { toast.error("Erro ao salvar."); }
      finally { setIsLoading(false); }
  };

  // Upload de Certificado
  const handleUploadCert = async () => {
      if (!selectedFile || !certPassword) {
          return toast.warning("Selecione um arquivo e digite a senha.");
      }
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("senha", certPassword);

      try {
          const res = await fetch(`${API_URL}/configuracoes/fiscal/certificado`, {
              method: 'POST',
              body: formData // FormData configura o Content-Type automaticamente
          });
          
          if (!res.ok) throw new Error();
          
          toast.success("Certificado instalado com sucesso!");
          setCertPassword("");
          setSelectedFile(null);
          // Limpa o input file (gambiarra visual, mas funciona)
          document.getElementById("cert-file-input").value = ""; 
          
          fetchData(); // Recarrega a lista
      } catch (e) {
          toast.error("Erro ao processar certificado.");
      } finally {
          setIsUploading(false);
      }
  };
  
  const handleDeleteCert = async (id) => {
      if (!confirm("Remover este certificado? A emissão de notas irá parar.")) return;
      try {
          await fetch(`${API_URL}/configuracoes/fiscal/certificados/${id}`, { method: 'DELETE' });
          fetchData();
          toast.success("Certificado removido.");
      } catch (e) { toast.error("Erro ao remover."); }
  }

  const getDaysRemaining = (dateString) => {
      const diff = new Date(dateString) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-1 flex-col gap-6"> 
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/configuracoes">Configurações</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Fiscal</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* --- CARD 0: VALIDADOR --- */}
      <div className="rounded-xl border bg-card text-card-foreground p-6">
          <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                      {fiscalStatus.allGood ? (
                          <ShieldCheck className="h-6 w-6 text-green-600" />
                      ) : (
                          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
                      )}
                      Status do Emissor Fiscal
                  </h3>
                  <p className="text-sm text-muted-foreground">
                      {fiscalStatus.allGood 
                        ? "Ambiente configurado. Pronto para emitir NFC-e." 
                        : "Atenção: Configurações pendentes impedem a emissão de notas."}
                  </p>
              </div>
              <div className="text-right">
                  <span className={`text-3xl font-bold ${fiscalStatus.allGood ? 'text-green-600' : 'text-amber-600'}`}>
                      {Math.round(fiscalStatus.score)}%
                  </span>
                  <p className="text-xs text-muted-foreground">Prontidão</p>
              </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fiscalStatus.checks.map((check) => (
                  <div key={check.name} className="flex items-center gap-2 text-sm border p-2 rounded-lg bg-muted/20">
                      {check.valid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.name}</span>
                  </div>
              ))}
          </div>
          <Progress value={fiscalStatus.score} className="h-2 mt-4" indicatorClassName={fiscalStatus.allGood ? "bg-green-600" : "bg-amber-500"} />
      </div>

      
      {/* --- SEÇÃO 1: REGIME & AMBIENTE --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Dados Fiscais', dadosFiscais)}>
          <CardBodyT title="Regime & Identificação" subtitle="Definições legais e ambiente de envio.">
              <div className="flex flex-col gap-6 pt-6">
                  
                  {/* Linha 1: Regime e Ambiente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label>Regime Tributário</Label>
                          <Select 
                              value={dadosFiscais.regime_tributario} 
                              onValueChange={(val) => setDadosFiscais(p => ({...p, regime_tributario: val}))}
                          >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="simples">Simples Nacional</SelectItem>
                                  <SelectItem value="mei">MEI (Microempreendedor)</SelectItem>
                                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                                  <SelectItem value="real">Lucro Real</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Ambiente SEFAZ</Label>
                          <Select 
                              value={dadosFiscais.ambiente_sefaz} 
                              onValueChange={(val) => setDadosFiscais(p => ({...p, ambiente_sefaz: val}))}
                          >
                              <SelectTrigger>
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                                  <SelectItem value="producao">Produção (Valendo)</SelectItem>
                              </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground">Use 'Homologação' para testar sem valor fiscal.</p>
                      </div>
                  </div>

                  {/* Linha 2: Inscrições */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="ie">Inscrição Estadual (IE)</Label>
                          <Input 
                              id="ie" 
                              value={dadosFiscais.inscricao_estadual} 
                              onChange={(e) => setDadosFiscais(p => ({...p, inscricao_estadual: e.target.value}))}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="im">Inscrição Municipal (Opcional)</Label>
                          <Input 
                              id="im" 
                              value={dadosFiscais.inscricao_municipal} 
                              onChange={(e) => setDadosFiscais(p => ({...p, inscricao_municipal: e.target.value}))}
                          />
                      </div>
                  </div>

                  {/* Linha 3: CSC (Token) */}
                  <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
                      <Label className="text-base">Token NFC-e (CSC)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                              <Label className="text-xs">ID do Token (CSC ID)</Label>
                              <Input 
                                  placeholder="Ex: 000001" 
                                  value={dadosFiscais.csc_id}
                                  onChange={(e) => setDadosFiscais(p => ({...p, csc_id: e.target.value}))}
                              />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                              <Label className="text-xs">Código do Token (CSC)</Label>
                              <div className="relative">
                                  <Input 
                                      type={showPassword ? "text" : "password"}
                                      value={dadosFiscais.csc_token}
                                      onChange={(e) => setDadosFiscais(p => ({...p, csc_token: e.target.value}))}
                                      placeholder="Copie do site da SEFAZ"
                                      className="pr-10 font-mono"
                                  />
                                  <Button 
                                      type="button" variant="ghost" size="icon" 
                                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                      onClick={() => setShowPassword(!showPassword)}
                                  >
                                      {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Identificação"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* --- SEÇÃO 2: CERTIFICADO DIGITAL --- */}
      <CardBodyT title="Certificado Digital" subtitle="Gerencie os certificados A1 para assinatura de notas.">
          <div className="pt-6 space-y-6">
              
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center gap-4 hover:bg-muted/10 transition-colors bg-muted/5">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <FileKey className="h-6 w-6" />
                  </div>
                  <div className="text-center space-y-1">
                      <h4 className="font-semibold">Instalar Novo Certificado</h4>
                      <p className="text-xs text-muted-foreground">Selecione o arquivo .PFX ou .P12 (Modelo A1).</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md">
                      <Input 
                          id="cert-file-input"
                          type="file" 
                          accept=".pfx,.p12" 
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="flex-1"
                      />
                      <Input 
                          type="password" 
                          placeholder="Senha do PFX" 
                          value={certPassword}
                          onChange={(e) => setCertPassword(e.target.value)}
                          className="w-32"
                      />
                      <Button onClick={handleUploadCert} disabled={isUploading}>
                          {isUploading ? <Loader2 className="animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Instalar
                      </Button>
                  </div>
              </div>

              {/* Lista de Certificados */}
              <div className="rounded-md border overflow-hidden">
                  <Table>
                      <TableHeader className="bg-muted/50">
                          <TableRow>
                              <TableHead>Titular</TableHead>
                              <TableHead>Emissor</TableHead>
                              <TableHead>Validade</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {certificados.length === 0 && (
                              <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum certificado instalado.</TableCell></TableRow>
                          )}
                          {certificados.map((cert) => {
                              const daysLeft = getDaysRemaining(cert.data_validade);
                              const isExpired = daysLeft < 0;
                              const isWarning = daysLeft < 30 && !isExpired;

                              return (
                                  <TableRow key={cert.id} className={isExpired ? "opacity-60 bg-muted/20" : ""}>
                                      <TableCell className="font-medium">{cert.titular}</TableCell>
                                      <TableCell>{cert.emissor}</TableCell>
                                      <TableCell>
                                          <div className="flex flex-col">
                                              <span>{new Date(cert.data_validade).toLocaleDateString('pt-BR')}</span>
                                              <span className={cn(
                                                  "text-[10px] font-semibold",
                                                  isExpired ? "text-destructive" : isWarning ? "text-amber-600" : "text-green-600"
                                              )}>
                                                  {isExpired ? "Expirado" : `${daysLeft} dias restantes`}
                                              </span>
                                          </div>
                                      </TableCell>
                                      <TableCell>
                                          <Badge variant={isExpired ? "destructive" : "outline"} className={cn(!isExpired && "border-green-500 text-green-600")}>
                                              {isExpired ? "Inválido" : "Ativo"}
                                          </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCert(cert.id)}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              </div>
          </div>
      </CardBodyT>

      {/* --- SEÇÃO 3: ESTRATÉGIA DE TRANSMISSÃO --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Estratégia de Envio', dadosFiscais)}>
        <CardBodyT title="Estratégia de Transmissão" subtitle="Defina como e quando as notas fiscais são enviadas para a SEFAZ.">
             <div className="flex flex-col gap-6 pt-6">
                 
                 {/* Modo de Envio */}
                 <div className="space-y-3">
                     <Label className="text-base flex items-center gap-2">
                        <CloudCog className="h-4 w-4 text-blue-600"/> Modo de Envio Padrão
                     </Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div 
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${dadosFiscais.modo_emissao === 'automatico' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'hover:bg-muted/50'}`}
                            onClick={() => setDadosFiscais(p => ({...p, modo_emissao: 'automatico'}))}
                         >
                             <div className="flex items-center gap-2 mb-1">
                                 <Zap className="h-4 w-4 text-blue-500" />
                                 <p className="font-semibold">Smart (Automático)</p>
                             </div>
                             <p className="text-xs text-muted-foreground">
                                 Tenta emitir online. Se falhar, entra em Contingência Offline automaticamente.
                             </p>
                         </div>
                         <div 
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${dadosFiscais.modo_emissao === 'offline_forcado' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500' : 'hover:bg-muted/50'}`}
                            onClick={() => setDadosFiscais(p => ({...p, modo_emissao: 'offline_forcado'}))}
                         >
                             <div className="flex items-center gap-2 mb-1">
                                 <WifiOff className="h-4 w-4 text-amber-500" />
                                 <p className="font-semibold">Forçar Offline</p>
                             </div>
                             <p className="text-xs text-muted-foreground">
                                 Emite tudo em contingência imediatamente.
                             </p>
                         </div>
                     </div>
                 </div>

                 {dadosFiscais.modo_emissao === 'automatico' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                         <div className="space-y-2 p-4 border rounded-lg bg-muted/5">
                            <Label className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-orange-500"/> Timeout (Segundos)
                            </Label>
                            <Input 
                                type="number" 
                                value={dadosFiscais.timeout_sefaz} 
                                onChange={(e) => setDadosFiscais(p => ({...p, timeout_sefaz: e.target.value}))}
                                className="w-24"
                            />
                         </div>
                         <div className="space-y-2 p-4 border rounded-lg bg-muted/5">
                            <Label className="flex items-center gap-2 text-sm">
                                <CloudCog className="h-4 w-4 text-green-500"/> Reenvio (Minutos)
                            </Label>
                            <Input 
                                type="number" 
                                value={dadosFiscais.tempo_rejeicao} 
                                onChange={(e) => setDadosFiscais(p => ({...p, tempo_rejeicao: e.target.value}))}
                                className="w-24"
                            />
                         </div>
                     </div>
                 )}
             </div>
             <div className="pt-5 flex justify-end"><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Estratégia"}</Button></div>
        </CardBodyT>
      </form>

      {/* --- SEÇÃO 4: PADRÕES DE CADASTRO --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Padrões Fiscais', padroes)}>
          <CardBodyT title="Padrões de Cadastro" subtitle="Valores pré-definidos para acelerar o cadastro de novos produtos.">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
                  <div className="space-y-2"><Label>NCM Padrão</Label><Input value={padroes.padrao_ncm} onChange={(e) => setPadroes(p => ({...p, padrao_ncm: e.target.value}))} placeholder="0000.00.00" /></div>
                  <div className="space-y-2"><Label>CSOSN / CST</Label><Input value={padroes.padrao_csosn} onChange={(e) => setPadroes(p => ({...p, padrao_csosn: e.target.value}))} placeholder="Ex: 102" /></div>
                  <div className="space-y-2"><Label>CFOP (Estadual)</Label><Input value={padroes.padrao_cfop_dentro} onChange={(e) => setPadroes(p => ({...p, padrao_cfop_dentro: e.target.value}))} placeholder="Ex: 5.102" /></div>
                  <div className="space-y-2"><Label>CFOP (Interestadual)</Label><Input value={padroes.padrao_cfop_fora} onChange={(e) => setPadroes(p => ({...p, padrao_cfop_fora: e.target.value}))} placeholder="Ex: 6.102" /></div>
              </div>
              <div className="pt-5 flex justify-end"><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Padrões"}</Button></div>
          </CardBodyT>
      </form>

    </div>
  );
}