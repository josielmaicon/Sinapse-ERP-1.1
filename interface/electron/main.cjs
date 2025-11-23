const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Defina aqui a URL do seu Vite (geralmente 5173)
const DEV_URL = 'http://localhost:5173';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // Aponta para o preload.js que cria a ponte segura
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(DEV_URL).catch((e) => {
      console.log('Erro ao carregar URL (o Vite está rodando?):', e);
  });
}

app.whenReady().then(() => {
  
  // ✅ OUVINTE DE IMPRESSORAS (O Superpoder)
  // Quando o React pedir 'get-printers', o Electron responde
  ipcMain.handle('get-printers', async () => {
    // Esta função nativa retorna a lista real de impressoras do SO
    return await mainWindow.webContents.getPrintersAsync();
  });
  
  // ✅ OUVINTE DE TESTE DE IMPRESSÃO
  ipcMain.handle('test-printer', async (event, { tipo, caminho }) => {
      console.log(`Electron: Testando impressão [${tipo}] em ${caminho}`);
      // Aqui entra a lógica real de envio de bytes (futuro)
      // Por enquanto, retornamos sucesso para validar a ponte
      return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Guardar referência global para evitar Garbage Collection
let mainWindow;