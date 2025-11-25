"use client"

import * as React from "react";

const API_URL = "http://localhost:8000"; 

const SettingsContext = React.createContext({
  settings: null,     // Agora conterá .geral, .fiscal, .operacional
  isLoading: true,
  refreshSettings: () => {},
  setTheme: () => {},
});

export function SettingsProvider({ children }) {
  // O estado agora será um objeto estruturado
  const [settings, setSettings] = React.useState({
      geral: null,
      fiscal: null,
      operacional: null
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Auxiliar de Tema (Mantido)
  const applyTheme = (themePreference) => {
      const root = document.documentElement;
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.remove("light", "dark");
      if (themePreference === "system") {
          root.classList.add(isSystemDark ? "dark" : "light");
      } else {
          root.classList.add(themePreference);
      }
  };

  // ✅ A GRANDE MUDANÇA: Fetch Paralelo de Tudo
  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscamos tudo em paralelo para ser rápido
      const [resGeral, resFiscal, resOperacional] = await Promise.all([
          fetch(`${API_URL}/configuracoes/geral`),
          // (Precisamos garantir que essas rotas de GET existem no backend, veja nota abaixo)
          fetch(`${API_URL}/configuracoes/fiscal/regras`), 
          fetch(`${API_URL}/configuracoes/operacional/regras`) 
      ]);

      const geral = resGeral.ok ? await resGeral.json() : {};
      const fiscal = resFiscal.ok ? await resFiscal.json() : {};
      const operacional = resOperacional.ok ? await resOperacional.json() : {};

      // Atualiza o estado global
      setSettings({
          geral,
          fiscal,
          operacional
      });
        
      // Aplicações Visuais (Geral)
      applyTheme(geral.tema_preferido || 'system');
      if (geral.cor_destaque) {
          document.documentElement.style.setProperty('--brand-color', geral.cor_destaque);
      }
      if (geral.nome_fantasia) {
          document.title = `${geral.nome_fantasia} - Sinapse ERP`;
      }

    } catch (error) {
      console.error("Erro ao carregar configurações globais:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateLocalTheme = (newTheme) => {
      applyTheme(newTheme);
      // Atualiza apenas a parte 'geral' do estado local
      setSettings(prev => ({ ...prev, geral: { ...prev.geral, tema_preferido: newTheme } }));
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings, setTheme: updateLocalTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return React.useContext(SettingsContext);
}