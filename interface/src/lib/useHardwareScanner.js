import { useState, useEffect, useCallback } from "react";

// Configurações
const SCANNER_TIMEOUT = 150; // ms para considerar fim da leitura rapida
const MAX_WEIGHT_KG = 100;   // Limite de segurança para peso

export function useHardwareScanner({ onWeightDetected, onBarcodeDetected }) {
  const [buffer, setBuffer] = useState("");
  const [lastTime, setLastTime] = useState(0);

  const processBuffer = useCallback((text) => {
    if (!text) return;

    // 1. Limpeza: Remove letras (ex: "kg"), espaços e normaliza vírgula para ponto
    const cleanText = text.replace(/[a-zA-Z\s]/g, "").replace(",", ".");
    const numericValue = parseFloat(cleanText);

    // 2. Lógica de Detecção (A Heurística)
    
    // É PESO SE: Tem ponto/vírgula E é um número válido E é menor que 100kg
    // Ex: "0.500", "1.240"
    const isWeight = 
        (text.includes(".") || text.includes(",")) && 
        !isNaN(numericValue) && 
        numericValue > 0 && 
        numericValue < MAX_WEIGHT_KG;

    // É CÓDIGO SE: Não tem ponto/vírgula e parece um código (mesmo que seja "50" ou "789...")
    const isBarcode = !text.includes(".") && !text.includes(",");

    if (isWeight) {
      onWeightDetected(numericValue);
    } else if (isBarcode) {
      // Manda o texto original (com zeros a esquerda se tiver)
      onBarcodeDetected(text.trim()); 
    }

  }, [onWeightDetected, onBarcodeDetected]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // IGNORA se o usuário estiver digitando num input (ex: buscando cliente por nome)
      const target = e.target;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const char = e.key;
      const now = Date.now();

      // Se passou muito tempo desde o último caractere, reseta o buffer (evita lixo de digitação manual lenta)
      if (now - lastTime > SCANNER_TIMEOUT) {
        setBuffer("");
      }
      setLastTime(now);

      if (char === "Enter") {
        if (buffer.length > 0) {
            processBuffer(buffer);
            setBuffer(""); 
        }
      } else if (char.length === 1) {
        // Acumula caracteres
        setBuffer((prev) => prev + char);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buffer, lastTime, processBuffer]);
}