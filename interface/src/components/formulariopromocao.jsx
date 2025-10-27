"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PromocaoForm({ open, onOpenChange, selectedProducts, onPromotionCreated }) {
  const [nome, setNome] = React.useState("")
  const [tipo, setTipo] = React.useState("percentual") // 'percentual' ou 'preco_fixo'
  const [valor, setValor] = React.useState("")
  const [dateRange, setDateRange] = React.useState({
    from: new Date(),
    to: undefined, // Sem data final por padrão
  })
  const [isLoading, setIsLoading] = React.useState(false)

  // Reseta o form quando o modal é fechado
  React.useEffect(() => {
    if (!open) {
      setNome("")
      setTipo("percentual")
      setValor("")
      setDateRange({ from: new Date(), to: undefined })
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const produto_ids = selectedProducts.map(p => p.id)
    
    const apiPromise = fetch('http://localhost:8000/api/promocoes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        tipo,
        valor: parseFloat(valor),
        data_inicio: dateRange.from.toISOString(), // Envia em formato universal
        data_fim: dateRange.to ? dateRange.to.toISOString() : null,
        produto_ids: produto_ids
      })
    })
    .then(async (response) => {
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || "Erro desconhecido no servidor")
      }
      return result
    })

    toast.promise(apiPromise, {
      loading: "Criando promoção...",
      success: (result) => {
        onPromotionCreated() // Recarrega a tabela na página
        onOpenChange(false)  // Fecha o modal
        return `Promoção "${result.nome}" criada com sucesso!`
      },
      error: (err) => err.message,
      finally: () => setIsLoading(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Promoção</DialogTitle>
          <DialogDescription>
            {`Esta promoção será aplicada a ${selectedProducts.length} produto(s) selecionado(s).`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="col-span-3" placeholder="Ex: Queima de Estoque" required />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tipo de desconto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Desconto Percentual (%)</SelectItem>
                  <SelectItem value="preco_fixo">Preço Fixo Final (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valor" className="text-right">Valor</Label>
              <Input id="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="col-span-3" placeholder={tipo === 'percentual' ? "Ex: 20 (para 20%)" : "Ex: 9.99 (para R$ 9,99)"} required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Período</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y", { locale: ptBR })
                        )
                      ) : (
                        <span>Escolha um período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Promoção
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}