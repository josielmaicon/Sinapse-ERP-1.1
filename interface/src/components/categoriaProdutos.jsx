// src/components/products/CategoryCombobox.jsx
"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Lista de categorias pré-prontas
const categories = [
  { value: "laticinios", label: "Laticínios" },
  { value: "padaria", label: "Padaria" },
  { value: "acougue", label: "Açougue" },
  { value: "hortifruti", label: "Hortifruti" },
  { value: "mercearia", label: "Mercearia" },
  { value: "bebidas", label: "Bebidas" },
  { value: "limpeza", label: "Limpeza" },
  { value: "higiene", label: "Higiene Pessoal" },
];

export function CategoryCombobox({ value, onValueChange }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? categories.find((cat) => cat.value === value)?.label : "Selecione uma categoria..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.value}
                  value={cat.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === cat.value ? "opacity-100" : "opacity-0")} />
                  {cat.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}