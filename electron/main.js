const path = require('path');
const fs = require('fs');
const { app: electronApp, BrowserWindow } = require('electron');

const PORT = 3000;
let mainWindow = null;
let httpServer = null;

function setupEnv() {
  const userDataDir = electronApp.getPath('userData');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  process.env.TOKO_DB_PATH = path.join(userDataDir, 'toko.db');
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'toko-pos-desktop-secret';
}

async function startServer() {
  const { start } = require('../server');
  httpServer = await start(PORT);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

electronApp.whenReady().then(async () => {
  setupEnv();
  await startServer();
  createWindow();

  electronApp.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

electronApp.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  if (process.platform !== 'darwin') electronApp.quit();
});
