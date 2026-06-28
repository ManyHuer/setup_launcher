import { ipcMain, shell, dialog } from 'electron';
import { exec } from 'child_process';
import { getDB, getProfiles, getProfileById, createProfile, updateProfile, deleteProfile, getApplicationsByProfile, createApplication, updateApplication, deleteApplication, saveChanges } from '../database/queries.js';
import { scanAll } from './startMenuScanner.js';

let cachedApps = null;
let dialogWindow = null;

export function setDialogWindow(win) {
  dialogWindow = win;
}

export async function registerIpcHandlers(splashWindow) {
  const { db, dbPath } = await getDB();

  dialogWindow = splashWindow;
  cachedApps = await scanAll();

  ipcMain.handle('db:getProfiles', () => getProfiles(db));

  ipcMain.handle('db:getProfileById', (_, id) => getProfileById(db, id));

  ipcMain.handle('db:createProfile', (_, data) => {
    const id = createProfile(db, data);
    saveChanges(db, dbPath);
    return id;
  });

  ipcMain.handle('db:updateProfile', (_, id, data) => {
    updateProfile(db, id, data);
    saveChanges(db, dbPath);
  });

  ipcMain.handle('db:deleteProfile', (_, id) => {
    deleteProfile(db, id);
    saveChanges(db, dbPath);
  });

  ipcMain.handle('db:getApplicationsByProfile', (_, profileId) => {
    return getApplicationsByProfile(db, profileId);
  });

  ipcMain.handle('db:createApplication', (_, data) => {
    const id = createApplication(db, data);
    saveChanges(db, dbPath);
    return id;
  });

  ipcMain.handle('db:updateApplication', (_, id, data) => {
    updateApplication(db, id, data);
    saveChanges(db, dbPath);
  });

  ipcMain.handle('db:deleteApplication', (_, id) => {
    deleteApplication(db, id);
    saveChanges(db, dbPath);
  });

  ipcMain.handle('app:scanStartMenu', () => {
    return cachedApps;
  });

  ipcMain.handle('app:refreshScan', async () => {
    cachedApps = await scanAll();
    return cachedApps;
  });

  ipcMain.handle('app:pickExecutable', async () => {
    try {
      const result = await dialog.showOpenDialog(dialogWindow, {
        title: 'Seleccionar ejecutable',
        filters: [{ name: 'Ejecutables', extensions: ['exe'] }],
        properties: ['openFile'],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0];
    } catch (err) {
      console.error('Error picking executable:', err);
      return null;
    }
  });

  ipcMain.handle('app:pickFolder', async () => {
    try {
      const result = await dialog.showOpenDialog(dialogWindow, {
        title: 'Seleccionar carpeta',
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0];
    } catch (err) {
      console.error('Error picking folder:', err);
      return null;
    }
  });

  ipcMain.handle('app:launchSetup', async (_, profileId) => {
    const items = getApplicationsByProfile(db, profileId);
    const results = [];

    const apps = items.filter((i) => i.type === 'app' || !i.type);
    const folders = items.filter((i) => i.type === 'folder');

    for (const item of apps) {
      if (item.path) {
        try {
          if (item.path.startsWith('uwp://')) {
            const appId = item.path.replace('uwp://', '');
            exec(`explorer.exe shell:AppsFolder\\${appId}`, (err) => {
              if (err) console.error('Error launching UWP app:', err.message);
            });
          } else {
            await shell.openPath(item.path);
          }
          results.push({ name: item.name, type: item.type, success: true });
        } catch (err) {
          results.push({ name: item.name, type: item.type, success: false, error: err.message });
        }
      }
    }

    const groups = {};
    for (const f of folders) {
      const g = f.tab_group || '';
      if (!groups[g]) groups[g] = [];
      groups[g].push(f);
    }

    for (const [groupName, groupFolders] of Object.entries(groups)) {
      for (let i = 0; i < groupFolders.length; i++) {
        const item = groupFolders[i];
        if (item.path) {
          try {
            await shell.openPath(item.path);
            results.push({ name: item.name, type: item.type, success: true });
            if (groupName && i < groupFolders.length - 1) {
              await new Promise((r) => setTimeout(r, 800));
            }
          } catch (err) {
            results.push({ name: item.name, type: item.type, success: false, error: err.message });
          }
        }
      }
    }

    return results;
  });
}
