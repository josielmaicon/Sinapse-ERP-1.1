"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const CurrencyInput = React.forwardRef(
  ({ className, value = 0, onChange, ...props }, ref) => {
    const [display, setDisplay] = React.useState("R$ 0,00")

    React.useEffect(() => {
      // Atualiza exibição se valor vier de fora
      if (typeof value === "number") {
        setDisplay(formatCurrency(value))
      }
    }, [value])

    function formatCurrency(numberValue) {
      return numberValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    function handleChange(e) {
      const digits = e.target.value.replace(/\D/g, "") // só números
      const numeric = parseInt(digits || "0", 10)
      const reais = numeric / 100

      setDisplay(formatCurrency(reais))
      if (onChange) onChange(reais)
    }

    // mantém o cursor sempre no fim ao focar
    function handleFocus(e) {
      setTimeout(() => {
        e.target.selectionStart = e.target.value.length
        e.target.selectionEnd = e.target.value.length
      }, 0)
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        className={cn(
          "text-right font-mono",
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
