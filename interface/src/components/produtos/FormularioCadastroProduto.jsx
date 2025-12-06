"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarIcon, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Importe seu componente de Categoria se ele estiver em outro arquivo
import { CategoryCombobox } from "./categoriaProdutos"

const API_URL = "http://localhost:8000";

const XMLDropzone = React.forwardRef(({ onFileSelect, disabled }, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const internalInputRef = React.useRef(null);

  // Combina a ref externa (do atalho) com a interna
  React.useImperativeHandle(ref, () => ({
    open: () => internalInputRef.current?.click()
  }));

  // Handler de quando o usuário solta o arquivo
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/xml" || file.name.endsWith(".xml")) {
        onFileSelect(file);
      } else {
        toast.warning("Apenas arquivos XML são permitidos.");
      }
    }
  };

  // Handlers visuais de arrastar
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handler do Input (Clique normal)
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // Limpa o value para permitir selecionar o mesmo arquivo novamente se der erro
    e.target.value = ""; 
  };

  return (
    <div
      onClick={() => !disabled && internalInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer relative",
        isDragging ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50 hover:bg-muted/5",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Input Invisível */}
      <input
        type="file"
        accept=".xml"
        ref={internalInputRef}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <Upload className={cn("mx-auto h-10 w-10 mb-2 transition-opacity", isDragging ? "text-primary" : "text-muted-foreground opacity-50")} />
      <p className="font-medium">
        {isDragging ? "Solte o arquivo aqui" : "Clique ou arraste o XML da NFe"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        ou pressione <Kbd>Alt</Kbd> + <Kbd>O</Kbd> para buscar
      </p>
    </div>
  );
});
XMLDropzone.displayName = "XMLDropzone";

// --- SUB-COMPONENTE 2: LOADING (Feedback) ---
const XMLLoading = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
        </div>
        <div className="text-center space-y-2">
            <h3 className="font-semibold text-xl tracking-tight">Conectando à SEFAZ...</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Estamos baixando os dados da nota fiscal e verificando duplicidade no estoque.
            </p>
        </div>
    </div>
);

// --- SUB-COMPONENTE 3: TABELA DE REVISÃO (O Gestor) ---
const XMLReviewTable = ({ nfeData, onConfirm, onCancel, isLoading }) => {
    // Estado local para editar os itens ANTES de salvar
    const [items, setItems] = React.useState(nfeData.itens);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleFinalize = () => {
        // Envia o objeto completo com os itens modificados
        onConfirm({ ...nfeData, itens: items });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Cabeçalho da Nota */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-base">{nfeData.header.emitente.nome}</p>
                        <p className="text-muted-foreground">CNPJ: {nfeData.header.emitente.cnpj}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono font-medium">NFe {nfeData.header.numero_nota}</p>
                        <p className="text-muted-foreground">{new Date(nfeData.header.data_emissao).toLocaleDateString()}</p>
                    </div>
                </div>
                {nfeData.aviso && (
                    <div className="mt-2 p-2 bg-amber-100 text-amber-800 rounded flex items-center gap-2 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" /> {nfeData.aviso}
                    </div>
                )}
            </div>

            {/* Tabela Editável */}
            <div className="rounded-md border h-[400px] overflow-y-auto relative bg-card">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[350px]">Produto (Nome no Sistema)</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead className="text-right">Custo (Un)</TableHead>
                            <TableHead className="text-right">Venda (Sugestão)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/50">
                                <TableCell>
                                    <div className="space-y-1.5">
                                        <Input 
                                            value={item.nome_sistema} 
                                            onChange={(e) => handleItemChange(idx, 'nome_sistema', e.target.value)}
                                            className="h-8 text-sm font-medium"
                                        />
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <span className="bg-muted px-1 rounded border">Original:</span> 
                                            {item.nome}
                                        </div>
                                        {item.produto_existente_id && (
                                            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Já cadastrado (Atualizará Estoque)
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-mono">
                                    {item.quantidade}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {item.valor_unitario.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            value={item.preco_venda_atual} 
                                            onChange={(e) => handleItemChange(idx, 'preco_venda_atual', e.target.value)}
                                            className="h-8 w-28 text-right font-mono"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar Importação</Button>
                <Button onClick={handleFinalize} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                    Confirmar Entrada no Estoque
                </Button>
            </DialogFooter>
        </div>
    )
}


// --- COMPONENTE PRINCIPAL ---
export function ProductForm({ open, onOpenChange, onProductCreated }) {
  
  // --- ESTADOS DO MODO MANUAL ---
  const initialState = {
    codigo_barras: "", nome: "", categoria: "", quantidade_estoque: "",
    preco_custo: "", preco_venda: "", margem: "", vencimento: null, vencimento_texto: "",
    unidade_medida: "UN",
    ncm: "", cfop: "", cst: "",
  };
  const [formData, setFormData] = React.useState(initialState);
  const [priceMode, setPriceMode] = React.useState("valor");
  const [isExistingProduct, setIsExistingProduct] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [showAdvancedFiscal, setShowAdvancedFiscal] = React.useState(false);
  const dropzoneRef = React.useRef(null);
  
  // --- ESTADOS DO MODO XML (A Mágica) ---
  const [mode, setMode] = React.useState('manual'); // 'manual', 'xml_loading', 'xml_review'
  const [xmlData, setXmlData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false); // Loading global

  // Refs
  const refs = {
    codigo_barras: React.useRef(null), nome: React.useRef(null),
    quantidade_estoque: React.useRef(null), preco_custo: React.useRef(null),
    preco_venda: React.useRef(null), margem: React.useRef(null), 
    vencimento: React.useRef(null), ncm: React.useRef(null),
    submit: React.useRef(null),
  };

  // --- RESET AO ABRIR ---
  React.useEffect(() => {
    if (open) {
        // Reseta para o modo manual limpo sempre que abrir
        setMode('manual');
        setXmlData(null);
        setFormData(initialState);
        setIsExistingProduct(false);
        setPriceMode("valor");
        setErrors({});
        setIsLoading(false);
        
        // Foco inicial
        setTimeout(() => refs.codigo_barras.current?.focus(), 100);
    }
  }, [open]);

  // --- LÓGICA 1: DETECÇÃO INTELIGENTE NO BLUR ---
  const handleBarcodeBlur = async () => {
    const code = formData.codigo_barras.trim();
    if (!code) {
      setIsExistingProduct(false);
      return;
    }
    
    // ✅ A BIFURCAÇÃO: É uma chave de NFe (44 dígitos)?
    if (code.length === 44 && /^\d+$/.test(code)) {
        setMode('xml_loading'); // Muda a UI para loading
        
        try {
            const res = await fetch(`${API_URL}/produtos/nfe/preview/chave`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ chave_acesso: code })
            });
            
            if (!res.ok) throw new Error("Erro ao buscar dados da NFe.");
            
            const data = await res.json();
            
            // Simula um pequeno delay para transição suave
            setTimeout(() => {
                setXmlData(data.data); // Guarda os dados processados
                setMode('xml_review'); // Muda a UI para a tabela
            }, 1200);

        } catch (e) {
            toast.error("Falha ao processar chave.", { description: "Verifique se a chave é válida ou se há conexão com a SEFAZ." });
            setMode('manual'); // Volta pro manual se falhar
            refs.codigo_barras.current?.select();
        }
        return; // Encerra aqui, não busca produto normal
    }

    // ✅ CAMINHO PADRÃO: Busca produto normal por EAN
    setIsLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${API_URL}/produtos/barcode/${code}`);
      if (response.ok) {
        const productData = await response.json();
        setFormData({
          ...formData, nome: productData.nome, categoria: productData.categoria,
          preco_custo: productData.preco_custo, preco_venda: productData.preco_venda,
          ncm: productData.ncm, cfop: productData.cfop, cst: productData.cst,
          quantidade_estoque: "", // Limpa estoque para forçar entrada da nova qtd
        });
        setIsExistingProduct(true);
        setTimeout(() => refs.quantidade_estoque.current?.focus(), 0);
      } else {
        setIsExistingProduct(false);
        // Mantém o código de barras, limpa o resto
        setFormData(prev => ({ ...initialState, codigo_barras: prev.codigo_barras }));
      }
    } catch (error) {
      console.error("Erro ao buscar código:", error);
      setIsExistingProduct(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmXML = async (finalData) => {
      setIsLoading(true);
      try {
          const res = await fetch(`http://localhost:8000/produtos/nfe/confirmar`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(finalData)
          });

          // Tenta ler o JSON da resposta (seja sucesso ou erro)
          const result = await res.json().catch(() => ({}));

          if (!res.ok) {
              // ✅ AQUI ESTÁ A CORREÇÃO
              // Se o backend mandou um detalhe (ex: "Nota já importada"), usamos ele.
              // Se não, usamos uma mensagem genérica.
              throw new Error(result.detail || "Falha desconhecida ao salvar nota.");
          }
          
          // Sucesso (200 OK)
          toast.success("Entrada de nota realizada!", {
              description: `${result.logs.length} produtos processados com sucesso.`
          });
          onProductCreated(); 
          onOpenChange(false); 

      } catch (e) {
          console.error("Erro no XML:", e);
          
          // Verifica se a mensagem parece ser de duplicidade para dar um ícone/cor específica
          const isDuplicate = e.message.includes("já foi importada");
          
          if (isDuplicate) {
              // Toast específico para duplicidade (Amarelo/Alerta)
              toast.warning("Nota Duplicada", { 
                  description: e.message, // "A Nota Fiscal 1234 já foi importada..."
                  duration: 6000
              });
          } else {
              // Erro genérico (Vermelho)
              toast.error("Erro na Importação", { 
                  description: e.message 
              });
          }
      } finally {
          setIsLoading(false);
      }
  };

  // --- LÓGICA 3: SUBMIT MANUAL (O Original) ---
  const handleSubmitManual = async (event) => {
    event.preventDefault();
    // ... (Validações) ...
    const newErrors = {};
    if (!formData.nome) newErrors.nome = true;
    if (!formData.quantidade_estoque) newErrors.quantidade_estoque = true;
    if (priceMode === 'valor' && !formData.preco_venda) newErrors.preco_venda = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    
    // Cálculos de preço
    const custo = parseFloat(formData.preco_custo) || 0;
    let precoVendaFinal = parseFloat(formData.preco_venda) || 0;
    if (priceMode === 'percentual') {
      const margem = parseFloat(formData.margem) || 0;
      if (custo > 0 && margem > 0) precoVendaFinal = custo / (1 - (margem / 100));
    }

    const submissionData = {
      ...formData,
      quantidade_estoque: parseInt(formData.quantidade_estoque, 10),
      preco_custo: custo,
      preco_venda: precoVendaFinal,
      vencimento: formData.vencimento ? format(formData.vencimento, 'yyyy-MM-dd') : null,
    };
    
    const url = isExistingProduct ? `${API_URL}/produtos/entrada-estoque` : `${API_URL}/produtos`;
    const method = isExistingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
      if (!response.ok) throw new Error('Falha na requisição');
      
      const newProduct = await response.json();
      toast.success(isExistingProduct ? "Estoque atualizado!" : "Produto cadastrado!");
      onOpenChange(false);
      onProductCreated();
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const handleGlobalHotkeys = (e) => {
      // Só funciona se o modal estiver aberto e no modo manual
      if (!open || mode !== 'manual') return;

      // Atalho Alt + O
      if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        console.log("Atalho Alt+O detectado: Abrindo seletor de arquivos...");
        // Aciona o clique no input escondido dentro do componente filho
        dropzoneRef.current?.open();
      }
    };

    // Adiciona o ouvinte na janela inteira
    window.addEventListener('keydown', handleGlobalHotkeys);
    
    // Limpa ao fechar o modal
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [open, mode]);

  // Handlers de Input Manual
  const handleChange = (e) => { const { id, value } = e.target; setFormData(prev => ({ ...prev, [id]: value })); };
  const handleKeyDown = (e, nextFieldRef) => { if (e.key === 'Enter') { e.preventDefault(); nextFieldRef?.current?.focus(); } };
  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    let formattedValue = value;
    if (value.length > 4) formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`;
    else if (value.length > 2) formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    const parsedDate = parse(formattedValue, 'dd/MM/yyyy', new Date());
    const finalDate = isValid(parsedDate) ? parsedDate : null;
    setFormData(prev => ({ ...prev, vencimento_texto: formattedValue, vencimento: finalDate }));
  };
  
  const handleFileProcess = async (file) => {
        if (!file) return;
        
        // Muda para loading imediatamente
        setMode('xml_loading');
        
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        try {
            // Chama a rota de PREVIEW POR ARQUIVO que criamos no backend
            const res = await fetch(`http://localhost:8000/produtos/nfe/preview/arquivo`, {
                method: 'POST',
                body: formDataUpload // FormData não precisa de header Content-Type manual
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Erro ao ler XML.");
            }

            const data = await res.json();
            
            // Sucesso! Mostra a tabela de revisão
            // Pequeno delay para transição suave
            setTimeout(() => {
                setXmlData(data.data); 
                setMode('xml_review'); 
            }, 800);

        } catch (e) {
            console.error(e);
            toast.error("Falha na importação", { description: e.message });
            setMode('manual'); // Volta se der erro
        }
    };

  const calculatedSalePrice = React.useMemo(() => {
    const custo = parseFloat(formData.preco_custo) || 0;
    const margem = parseFloat(formData.margem) || 0;
    if (custo > 0 && priceMode === 'percentual' && margem > 0) {
      return (custo / (1 - (margem / 100))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return "R$ 0,00";
  }, [formData.preco_custo, formData.margem, priceMode]);


  // ✅ RENDERIZAÇÃO CONDICIONAL (O Core da Mudança)
  let dialogContent = null;
  let dialogWidthClass = "sm:max-w-xl"; // Largura padrão para manual

  if (mode === 'xml_loading') {
      // 1. TELA DE CARREGAMENTO
      dialogContent = <XMLLoading />;
  } 
  else if (mode === 'xml_review' && xmlData) {
      // 2. TELA DE REVISÃO (Tabela Larga)
      dialogWidthClass = "sm:max-w-5xl"; // Mais largo para a tabela
      dialogContent = (
        <XMLReviewTable 
            nfeData={xmlData} 
            onConfirm={handleConfirmXML} 
            onCancel={() => setMode('manual')} // Volta para o input manual
            isLoading={isLoading}
        />
      );
  } 
  else {
      // 3. TELA MANUAL (O Formulário Original)
      dialogContent = (
         <>
            <ScrollArea className="max-h-[70vh] -mx-6">
            <form id="product-form" onSubmit={handleSubmitManual} className="grid gap-6 px-6 py-4">
                
                {/* Dropzone: Agora visualmente integrado */}
                <XMLDropzone 
                    ref={dropzoneRef} 
                    onFileSelect={handleFileProcess} 
                    disabled={isLoading} 
                />
                <Separator />
                
                {/* Inputs Manuais */}
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codigo_barras" className="text-right">Cód. Barras</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Input 
                        id="codigo_barras" 
                        ref={refs.codigo_barras} 
                        value={formData.codigo_barras} 
                        onChange={handleChange} 
                        onKeyDown={(e) => handleKeyDown(e, refs.nome)} 
                        onBlur={handleBarcodeBlur} // <-- AQUI DISPARA A MÁGICA
                        placeholder="Bipe aqui..."
                        autoFocus
                    />
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">Nome*</Label>
                    <Input id="nome" ref={refs.nome} value={formData.nome} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.categoria)} disabled={isExistingProduct} className={cn("col-span-3", errors.nome && "border-destructive")} required />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Categoria</Label>
                    <div className="col-span-3"><CategoryCombobox value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))} disabled={isExistingProduct} /></div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantidade_estoque" className="text-right">{isExistingProduct ? "Qtd. Entrada*" : "Estoque Inicial*"}</Label>
                    <Input id="quantidade_estoque" ref={refs.quantidade_estoque} type="number" value={formData.quantidade_estoque} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.preco_custo)} className={cn("col-span-3", errors.quantidade_estoque && "border-destructive")} required />
                </div>

                {/* ... (Inputs de Preço, Vencimento, Fiscal) ... */}
                {/* Mantenha a estrutura original aqui */}
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="preco_custo" className="text-right">Preço Custo</Label>
                    <Input id="preco_custo" ref={refs.preco_custo} type="number" step="0.01" value={formData.preco_custo} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.preco_venda)} disabled={isExistingProduct} className="col-span-3" />
                </div>
                
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Preço Venda*</Label>
                    <div className="col-span-3 flex flex-col gap-2">
                    <ToggleGroup type="single" value={priceMode} onValueChange={(value) => { if (value) setPriceMode(value) }} disabled={isExistingProduct} className="w-full grid grid-cols-2">
                        <ToggleGroupItem value="valor">Valor Final (R$)</ToggleGroupItem>
                        <ToggleGroupItem value="percentual">Margem (%)</ToggleGroupItem>
                    </ToggleGroup>
                    {priceMode === 'valor' ? (
                        <Input id="preco_venda" ref={refs.preco_venda} type="number" step="0.01" value={formData.preco_venda} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.vencimento)} disabled={isExistingProduct} placeholder="Ex: 15,99" required={priceMode === 'valor'} className={cn(errors.preco_venda && "border-destructive")} />
                    ) : (
                        <div>
                        <Input id="margem" ref={refs.margem} type="number" step="0.01" value={formData.margem} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.vencimento)} disabled={isExistingProduct} placeholder="Ex: 40" required={priceMode === 'percentual'} className={cn(errors.margem && "border-destructive")} />
                        {calculatedSalePrice && <p className="text-xs text-muted-foreground mt-1">Preço de venda calculado: <span className="font-bold">{calculatedSalePrice}</span></p>}
                        </div>
                    )}
                    </div>
                </div>
                
                {/* Vencimento e Avançado Fiscal */}
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Vencimento</Label>
                    <div className="col-span-3 flex items-center gap-2">
                    <Input id="vencimento_texto" ref={refs.vencimento} placeholder="DD/MM/AAAA" value={formData.vencimento_texto || ""} onChange={handleDateChange} onKeyDown={(e) => handleKeyDown(e, refs.ncm)} disabled={isExistingProduct} maxLength={10} />
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isExistingProduct}><CalendarIcon className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={formData.vencimento} onSelect={(date) => setFormData(prev => ({ ...prev, vencimento: date, vencimento_texto: date ? format(date, "dd/MM/yyyy") : "" }))} initialFocus />
                        </PopoverContent>
                    </Popover>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ncm" className="text-right">NCM</Label>
                    <Input id="ncm" ref={refs.ncm} value={formData.ncm} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.submit)} disabled={isExistingProduct} className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="advanced-fiscal" className="text-right">Avançado</Label>
                    <div className="col-span-3 flex items-center space-x-2">
                        <Switch id="advanced-fiscal" checked={showAdvancedFiscal} onCheckedChange={setShowAdvancedFiscal} disabled={isExistingProduct} />
                        <Label htmlFor="advanced-fiscal" className="font-normal text-muted-foreground">Exibir campos fiscais (CFOP, CST)</Label>
                    </div>
                </div>

                {showAdvancedFiscal && (
                    <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cfop" className="text-right">CFOP</Label>
                        <Input id="cfop" value={formData.cfop} onChange={handleChange} disabled={isExistingProduct} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cst" className="text-right">CST</Label>
                        <Input id="cst" value={formData.cst} onChange={handleChange} disabled={isExistingProduct} className="col-span-3" />
                    </div>
                    </>
                )}

            </form>
            </ScrollArea>
            <DialogFooter>
            <Button type="submit" form="product-form" ref={refs.submit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExistingProduct ? "Registrar Entrada" : "Salvar Produto"}
            </Button>
            </DialogFooter>
         </>
      );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogWidthClass}>
        <DialogHeader>
          <DialogTitle>
              {mode === 'manual' ? (isExistingProduct ? "Registrar Entrada de Produto" : "Adicionar Novo Produto") : 
               mode === 'xml_loading' ? "Processando Entrada" : "Conferência de Entrada (NFe)"}
          </DialogTitle>
          {mode === 'manual' && <DialogDescription>{isExistingProduct ? `Produto: ${formData.nome}. Insira a quantidade.` : "Preencha os dados ou bipe a chave da NFe."}</DialogDescription>}
        </DialogHeader>
        
        {dialogContent}

      </DialogContent>
    </Dialog>
  );
}