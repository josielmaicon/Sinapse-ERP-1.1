const { contextBridge, ipcRenderer } = require('electron');

// Expõe a API protegida para o Frontend (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {
  // Função para listar impressoras
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  
  // Função para testar (passando parâmetros)
  testPrinter: (tipo, caminho) => ipcRenderer.invoke('test-printer', { tipo, caminho })
});