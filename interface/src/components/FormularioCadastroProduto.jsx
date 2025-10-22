// src/components/products/FormularioCadastroProduto.jsx

"use client"
import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
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
import { CategoryCombobox } from "./categoriaProdutos"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar as CalendarIcon, Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Componente placeholder para o XML Dropzone
const XMLDropzone = () => (
  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center text-muted-foreground hover:border-primary transition-colors">
    <Upload className="mx-auto h-10 w-10 mb-2" />
    <p>Arraste e solte o XML da NFe aqui</p>
    <p className="text-xs">ou pressione <Kbd>CTRL</Kbd> + <Kbd>O</Kbd> para buscar</p>
  </div>
);

export function ProductForm({ open, onOpenChange, onProductCreated }) {
  const initialState = {
    codigo_barras: "", nome: "", categoria: "", quantidade_estoque: "",
    preco_custo: "", preco_venda: "", margem: "", vencimento: null, vencimento_texto: "",
    unidade_medida: "UN",
    ncm: "", cfop: "", cst: "",
  };
  const [formData, setFormData] = React.useState(initialState);
  const [priceMode, setPriceMode] = React.useState("valor");
  const [isExistingProduct, setIsExistingProduct] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  // Refs para a navegação com "Enter"
  const refs = {
    codigo_barras: React.useRef(null), nome: React.useRef(null),
    quantidade_estoque: React.useRef(null), preco_custo: React.useRef(null),
    preco_venda: React.useRef(null), margem: React.useRef(null), 
    vencimento: React.useRef(null), ncm: React.useRef(null),
    submit: React.useRef(null),
  };

  const handleKeyDown = (e, nextFieldRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextFieldRef?.current?.focus();
    }
  };

  const handleBarcodeBlur = async () => {
    if (!formData.codigo_barras) {
      setIsExistingProduct(false);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const response = await fetch(`http://localhost:8000/api/produtos/barcode/${formData.codigo_barras}`);
      if (response.ok) {
        const productData = await response.json();
        setFormData({
          ...formData, nome: productData.nome, categoria: productData.categoria,
          preco_custo: productData.preco_custo, preco_venda: productData.preco_venda,
          ncm: productData.ncm, cfop: productData.cfop, cst: productData.cst,
          quantidade_estoque: "",
        });
        setIsExistingProduct(true);
        setTimeout(() => refs.quantidade_estoque.current?.focus(), 0);
      } else {
        setIsExistingProduct(false);
        setFormData(prev => ({ ...initialState, codigo_barras: prev.codigo_barras }));
      }
    } catch (error) {
      console.error("Erro ao buscar código de barras:", error);
      setIsExistingProduct(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    let formattedValue = value;
    if (value.length > 4) {
      formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`;
    } else if (value.length > 2) {
      formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    const parsedDate = parse(formattedValue, 'dd/MM/yyyy', new Date());
    const finalDate = isValid(parsedDate) ? parsedDate : null;
    setFormData(prev => ({ ...prev, vencimento_texto: formattedValue, vencimento: finalDate }));
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const calculatedSalePrice = React.useMemo(() => {
    const custo = parseFloat(formData.preco_custo) || 0;
    const margem = parseFloat(formData.margem) || 0;
    if (custo > 0 && priceMode === 'percentual' && margem > 0) {
      const precoVenda = custo / (1 - (margem / 100));
      return precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return "R$ 0,00";
  }, [formData.preco_custo, formData.margem, priceMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = {};
    if (!formData.nome) newErrors.nome = true;
    if (!formData.quantidade_estoque) newErrors.quantidade_estoque = true;
    if (priceMode === 'valor' && !formData.preco_venda) newErrors.preco_venda = true;
    if (priceMode === 'percentual' && !formData.margem) newErrors.margem = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setErrors({});
    setIsLoading(true);

    const custo = parseFloat(formData.preco_custo) || 0;
    let precoVendaFinal = parseFloat(formData.preco_venda) || 0;

    if (priceMode === 'percentual') {
      const margem = parseFloat(formData.margem) || 0;
      if (custo > 0 && margem > 0) {
        precoVendaFinal = custo / (1 - (margem / 100));
      }
    }

    const submissionData = {
      nome: formData.nome,
      codigo_barras: formData.codigo_barras,
      categoria: formData.categoria,
      quantidade_estoque: parseInt(formData.quantidade_estoque, 10),
      preco_custo: custo,
      preco_venda: precoVendaFinal,
      unidade_medida: formData.unidade_medida,
      ncm: formData.ncm,
      cfop: formData.cfop,
      cst: formData.cst,
      vencimento: formData.vencimento ? format(formData.vencimento, 'yyyy-MM-dd') : null,
    };
    
    const isUpdate = isExistingProduct;
    const url = isUpdate ? `http://localhost:8000/api/produtos/entrada-estoque` : 'http://localhost:8000/api/produtos';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha na requisição');
      }
      const newProduct = await response.json();
      toast.success(`Sucesso!`, {
        description: `Produto "${newProduct.nome}" foi salvo.`,
        action: {
          label: "Desfazer",
          onClick: () => console.log("Ação Desfazer foi clicada!"),
        },
      });
      onOpenChange(false);
      onProductCreated();
    } catch (error) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setFormData(initialState);
      setIsExistingProduct(false);
      setPriceMode("valor");
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isExistingProduct ? "Registrar Entrada de Produto" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>{isExistingProduct ? `Produto: ${formData.nome}. Insira a quantidade.` : "Preencha os dados ou importe um XML."}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] -mx-6">
          <form id="product-form" onSubmit={handleSubmit} className="grid gap-6 px-6 py-4">
            <XMLDropzone />
            <Separator />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo_barras" className="text-right">Cód. Barras</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input id="codigo_barras" ref={refs.codigo_barras} value={formData.codigo_barras} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, refs.nome)} onBlur={handleBarcodeBlur} />
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
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Vendido por</Label>
                <RadioGroup defaultValue="UN" className="col-span-3 flex items-center gap-4" value={formData.unidade_medida} onValueChange={(value) => setFormData(prev => ({...prev, unidade_medida: value}))} disabled={isExistingProduct}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="UN" id="un" /><Label htmlFor="un">Unidade (UN)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="KG" id="kg" /><Label htmlFor="kg">Quilo (KG)</Label></div>
                </RadioGroup>
            </div>
            <Separator />
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
            {/* Adicione CFOP e CST da mesma forma se necessário */}
          </form>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" form="product-form" ref={refs.submit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExistingProduct ? "Registrar Entrada" : "Salvar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}