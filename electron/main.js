import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerIpcHandlers, setDialogWindow } from './ipcHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

async function createSplash() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    center: true,
    resizable: false,
    show: true,
    backgroundColor: '#0f0f0f',
  });
  await splash.loadFile(path.join(__dirname, 'splash.html'));
  return splash;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    title: 'Setup Launcher',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  const splash = await createSplash();
  await registerIpcHandlers(splash);
  splash.close();
  createWindow();
  Menu.setApplicationMenu(null);
  setDialogWindow(mainWindow);
  mainWindow.show();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
