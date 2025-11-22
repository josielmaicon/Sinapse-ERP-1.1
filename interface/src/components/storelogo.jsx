"use client"

import * as React from "react"
import { useSettings } from "@/ConfigContext"
import { Store } from "lucide-react" // Ícone de fallback

export function StoreLogo({ className, style }) {
    const { settings } = useSettings();

    // Se não houver configurações carregadas ou logo definida, retorna null ou um fallback discreto
    if (!settings?.logo_data) {
        return (
            <div className={`flex items-center gap-2 text-muted-foreground opacity-50 ${className}`} style={style}>
                <Store className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                    {settings?.nome_fantasia || "Sua Loja"}
                </span>
            </div>
        );
    }

    // Renderiza SVG Inline (para melhor qualidade e controle de cor se necessário)
    if (settings.tipo_logo === 'svg') {
        return (
            <div 
                className={`${className} [&>svg]:w-full [&>svg]:h-full`} 
                style={style} 
                dangerouslySetInnerHTML={{ __html: settings.logo_data }} 
            />
        );
    }

    // Renderiza Imagem (PNG, JPG, Base64)
    return (
        <img 
            src={settings.logo_data} 
            alt={settings.nome_fantasia || "Logo da Loja"} 
            className={`object-contain ${className}`} 
            style={style} 
        />
    );
}