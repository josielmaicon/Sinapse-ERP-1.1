import { useState, useEffect, useCallback, useRef } from "react";

const MAX_WEIGHT_KG = 100;

// Agora o hook aceita 'setBuffer' para atualizar a tela do PDV
export function useHardwareScanner({ onWeightDetected, onBarcodeDetected, setBuffer, buffer }) {
  const lastTimeRef = useRef(0);

  const processBuffer = useCallback((text) => {
    if (!text || text.trim().length === 0) return;

    // 1. Limpeza e Normalização
    const cleanText = text.replace(/[a-zA-Z\s]/g, "").replace(",", ".");
    const numericValue = parseFloat(cleanText);

    // 2. Heurística de Balança (Peso)
    // Geralmente balanças enviam ponto/vírgula. EANs não.
    const isWeight = 
        (text.includes(".") || text.includes(",")) && 
        !isNaN(numericValue) && 
        numericValue > 0 && 
        numericValue < MAX_WEIGHT_KG;

    if (isWeight) {
      onWeightDetected(numericValue);
    } else {
      // É código de barras (ou digitação manual de código)
      onBarcodeDetected(text.trim()); 
    }
  }, [onWeightDetected, onBarcodeDetected]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // IGNORA se o foco estiver em inputs de texto (ex: busca de cliente, modal de obs)
      // Mas PERMITE se for o body (tela de venda focada)
      const target = e.target;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // IGNORA teclas de controle (F1-F12, Alt, Ctrl, etc) - Deixa pro useEffect do Pai
      if (e.key.length > 1 && e.key !== "Enter" && e.key !== "Backspace") {
          return;
      }

      const now = Date.now();
      // (Opcional) Podemos usar lastTimeRef.current para detectar velocidade, 
      // mas para UX mista (humano/máquina), melhor tratar tudo igual.
      lastTimeRef.current = now;

      // --- TRATAMENTO DO ENTER (Disparo) ---
      if (e.key === "Enter") {
        e.preventDefault(); // Impede form submit padrão se houver
        if (buffer.length > 0) {
            processBuffer(buffer);
            setBuffer(""); // Limpa o buffer visual após processar
        }
        return;
      }

      // --- TRATAMENTO DO BACKSPACE (Correção) ---
      if (e.key === "Backspace") {
          e.preventDefault();
          setBuffer(prev => prev.slice(0, -1));
          return;
      }

      // --- TRATAMENTO DE CARACTERES (Acumulação) ---
      // Aceita números, letras e pontuação (para peso)
      if (e.key.length === 1) {
         // Regex permite alfanumérico + ponto + vírgula
         if (e.key.match(/^[a-zA-Z0-9.,-]$/)) {
             e.preventDefault();
             setBuffer(prev => prev + e.key);
         }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buffer, setBuffer, processBuffer]);
}