"use client"

import * as React from "react";

const SettingsContext = React.createContext({
  settings: null,
  isLoading: true,
  refreshSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/configuracoes/geral");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        if (data.cor_primaria) {
            document.documentElement.style.setProperty('--primary-2', data.cor_primaria_2);
        }
        
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

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return React.useContext(SettingsContext);
}