"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
    Loader2, 
    Upload, 
    Trash2, 
    FileKey, 
    CheckCircle2, 
    AlertTriangle, 
    XCircle,
    ShieldCheck,
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
import CardBodyT from "@/components/CardBodyT" // Seu componente padrão
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress" // Para mostrar validade do certificado

export default function FiscalSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false); 
  const [showPassword, setShowPassword] = React.useState(false);

  // --- Estados (Mock) ---
  const [dadosFiscais, setDadosFiscais] = React.useState({
      regime: "simples",
      ie: "123.456.789.111", // Inscrição Estadual
      im: "", // Inscrição Municipal
      csc_id: "000001", // Token NFC-e
      csc_token: "SEU-TOKEN-CSC-AQUI-..."
  });

  const [padroes, setPadroes] = React.useState({
      ncm: "0000.00.00",
      cfop_dentro: "5.102",
      cfop_fora: "6.102",
      csosn: "102" // Ou CST
  });

  const [certificados, setCertificados] = React.useState([
      { id: 1, nome: "EMPRESA TESTE LTDA", emissor: "Certisign", validade: "2025-12-31", status: "valido" },
      { id: 2, nome: "EMPRESA TESTE (ANTIGO)", emissor: "Serasa", validade: "2023-01-01", status: "expirado" },
  ]);

  // --- Lógica do Validador (O "Health Check") ---
  const fiscalStatus = React.useMemo(() => {
      const checks = [
          { name: "Regime Tributário", valid: !!dadosFiscais.regime },
          { name: "Inscrição Estadual", valid: !!dadosFiscais.ie && dadosFiscais.ie.length > 5 },
          { name: "Certificado Digital", valid: certificados.some(c => c.status === 'valido') },
          { name: "Token CSC (NFC-e)", valid: !!dadosFiscais.csc_id && !!dadosFiscais.csc_token },
      ];
      const passed = checks.filter(c => c.valid).length;
      const total = checks.length;
      const score = (passed / total) * 100;
      
      return { checks, score, allGood: score === 100 };
  }, [dadosFiscais, certificados]);


  // --- Handlers ---
  const handleFiscalChange = (e) => {
      setDadosFiscais(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handlePadraoChange = (e) => {
      setPadroes(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveGeneric = async (e, section) => {
      e.preventDefault();
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 1000)); 
      toast.success(`${section} atualizados com sucesso!`);
      setIsLoading(false);
  };

  const handleUploadCert = () => {
      toast.info("Simulando upload e instalação do certificado .PFX...");
      // Lógica real: Ler arquivo, pedir senha, validar e salvar no banco/cofre
  };

  // Helper para dias restantes
  const getDaysRemaining = (dateString) => {
      const diff = new Date(dateString) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
            <BreadcrumbPage>Fiscal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* --- CARD 0: VALIDADOR DE CONFORMIDADE (Seu Diferencial) --- */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-start justify-between">
              <div className="space-y-1">w
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                      {fiscalStatus.allGood ? (
                          <ShieldCheck className="h-6 w-6 text-green-600" />
                      ) : (
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                      )}
                      Status do Ambiente Fiscal
                  </h3>
                  <p className="text-sm text-muted-foreground">
                      {fiscalStatus.allGood 
                        ? "Seu sistema está pronto para emitir notas fiscais." 
                        : "Atenção: Existem pendências impedindo a emissão de notas."}
                  </p>
              </div>
              <div className="text-right">
                  <span className="text-2xl font-bold">{Math.round(fiscalStatus.score)}%</span>
                  <p className="text-xs text-muted-foreground">Prontidão</p>
              </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {fiscalStatus.checks.map((check) => (
                  <div key={check.name} className="flex items-center gap-2 text-sm border p-2 rounded bg-muted/20">
                      {check.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.name}</span>
                  </div>
              ))}
          </div>
          <Progress value={fiscalStatus.score} className="h-2 mt-4" />
      </div>

      
      {/* --- SEÇÃO 1: REGIME & IDENTIFICAÇÃO --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Dados Fiscais')}>
          <CardBodyT title="Regime & Identificação" subtitle="Defina o enquadramento legal da sua empresa.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                      <Label>Regime Tributário</Label>
                      <Select 
                          value={dadosFiscais.regime} 
                          onValueChange={(val) => setDadosFiscais(p => ({...p, regime: val}))}
                          disabled={isLoading}
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
                      <Label htmlFor="ie">Inscrição Estadual (IE)</Label>
                      <Input 
                          id="ie" 
                          name="ie" 
                          value={dadosFiscais.ie} 
                          onChange={handleFiscalChange}
                          disabled={isLoading}
                      />
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="csc_id">ID do CSC (Token NFC-e)</Label>
                      <Input 
                          id="csc_id" 
                          name="csc_id" 
                          value={dadosFiscais.csc_id} 
                          onChange={handleFiscalChange}
                          placeholder="Ex: 000001"
                          disabled={isLoading}
                      />
                      <p className="text-[10px] text-muted-foreground">Identificador numérico do token na SEFAZ.</p>
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="csc_token">Código do CSC (Token)</Label>
                      <div className="relative">
                          <Input 
                              id="csc_token" 
                              name="csc_token" 
                              type={showPassword ? "text" : "password"}
                              value={dadosFiscais.csc_token} 
                              onChange={handleFiscalChange}
                              placeholder="Código alfanumérico longo..."
                              disabled={isLoading}
                              className="pr-10"
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
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Identificação"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

      {/* --- SEÇÃO 2: CERTIFICADO DIGITAL --- */}
      <CardBodyT title="Certificado Digital" subtitle="Gerencie os certificados A1/A3 para assinatura de notas.">
          <div className="pt-6 space-y-6">
              
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:bg-muted/10 transition-colors bg-muted/5">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                      <FileKey className="h-6 w-6" />
                  </div>
                  <div className="text-center space-y-1">
                      <h4 className="font-semibold">Instalar Novo Certificado</h4>
                      <p className="text-xs text-muted-foreground">Suporta arquivos .PFX ou .P12 (Modelo A1).</p>
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                      <Input type="file" className="w-64" accept=".pfx,.p12" />
                      <Input type="password" placeholder="Senha do PFX" className="w-32" />
                      <Button onClick={handleUploadCert} size="sm">
                          <Upload className="mr-2 h-4 w-4" /> Instalar
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
                          {certificados.map((cert) => {
                              const daysLeft = getDaysRemaining(cert.validade);
                              const isExpired = daysLeft < 0;
                              const isWarning = daysLeft < 30 && !isExpired;

                              return (
                                  <TableRow key={cert.id} className={isExpired ? "opacity-60 bg-muted/20" : ""}>
                                      <TableCell className="font-medium">{cert.nome}</TableCell>
                                      <TableCell>{cert.emissor}</TableCell>
                                      <TableCell>
                                          <div className="flex flex-col">
                                              <span>{new Date(cert.validade).toLocaleDateString('pt-BR')}</span>
                                              <span className={cn(
                                                  "text-[10px]",
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
                                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => toast.error("Excluir certificado?")}>
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

      {/* --- SEÇÃO 3: PADRÕES DE CADASTRO --- */}
      <form onSubmit={(e) => handleSaveGeneric(e, 'Padrões Fiscais')}>
          <CardBodyT title="Padrões de Cadastro" subtitle="Valores pré-definidos para acelerar o cadastro de novos produtos.">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
                  <div className="space-y-2">
                      <Label>NCM Padrão</Label>
                      <Input 
                          value={padroes.ncm} 
                          onChange={handlePadraoChange} 
                          name="ncm"
                          placeholder="0000.00.00" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>CSOSN / CST Padrão</Label>
                      <Input 
                          value={padroes.csosn} 
                          onChange={handlePadraoChange} 
                          name="csosn"
                          placeholder="Ex: 102" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>CFOP (Estadual)</Label>
                      <Input 
                          value={padroes.cfop_dentro} 
                          onChange={handlePadraoChange} 
                          name="cfop_dentro"
                          placeholder="Ex: 5.102" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>CFOP (Interestadual)</Label>
                      <Input 
                          value={padroes.cfop_fora} 
                          onChange={handlePadraoChange} 
                          name="cfop_fora"
                          placeholder="Ex: 6.102" 
                      />
                  </div>
              </div>
              
              <div className="pt-5 flex justify-end">
                   <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Salvar Padrões"}
                   </Button>
              </div>
          </CardBodyT>
      </form>

    </div>
  );
}