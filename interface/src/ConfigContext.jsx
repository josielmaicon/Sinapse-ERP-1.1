"use client"

import * as React from "react";

const API_URL = "http://localhost:8000"; // Ajuste se necessário

const SettingsContext = React.createContext({
  settings: null,
  isLoading: true,
  refreshSettings: () => {},
  setTheme: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // ✅ Busca os dados reais do backend
      const response = await fetch(`${API_URL}/configuracoes/geral`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // 1. Aplica o Tema
        applyTheme(data.tema_preferido || 'system');

        // 2. Aplica a Cor Destaque (Injeção de CSS)
        if (data.cor_destaque) {
            // Cria uma variável CSS global que pode ser usada em todo o app
            document.documentElement.style.setProperty('--brand-color', data.cor_destaque);
        }
        
        // 3. Aplica o Nome na Aba do Navegador
        if (data.nome_fantasia) {
            document.title = `${data.nome_fantasia} - Sinapse ERP`;
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega ao iniciar a aplicação
  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Função para atualização otimista (preview instantâneo)
  const updateLocalTheme = (newTheme) => {
      applyTheme(newTheme);
      setSettings(prev => ({ ...prev, tema_preferido: newTheme }));
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
