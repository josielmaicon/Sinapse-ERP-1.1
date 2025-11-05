"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowBigRight, Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function SetNextQuantityModal({
  open,
  onOpenChange,
  currentNextQuantity,
  onQuantitySet,
}) {
  const [inputValue, setInputValue] = React.useState(
    currentNextQuantity > 0 ? String(currentNextQuantity) : "1"
  )
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [open])

  const handleConfirm = (e) => {
    e.preventDefault()
    const quantity = parseInt(inputValue, 10)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("A quantidade deve ser um número inteiro e positivo.")
      return
    }
    onQuantitySet(quantity)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-fit max-w-[90vw] p-6 rounded-2xl",
          "flex flex-col items-center justify-center space-y-4"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-2">
          <div className="flex items-center justify-center text-primary mb-2">
            <Hash className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Definir Próxima Quantidade
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            O próximo item bipado será adicionado com esta quantidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="w-full flex flex-col items-center">
          <Label htmlFor="next-qty" className="sr-only">
            Quantidade
          </Label>

          {/* Input grande com “QTD” à esquerda */}
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-6xl font-bold tracking-tighter text-muted-foreground">
              QTD
            </span>
            <input
              ref={inputRef}
              id="next-qty"
              type="number"
              step="1"
              min="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={cn(
                "bg-transparent border-none text-center text-6xl font-bold tracking-tighter outline-none",
                "focus:ring-0 focus:outline-none w-[120px]",
                "appearance-none [-moz-appearance:textfield]",
                "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              )}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-6 w-full justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancelar (ESC)
            </Button>
            <Button type="submit">
              Aplicar Quantidade <ArrowBigRight className="ml-2 h-5 w-5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
