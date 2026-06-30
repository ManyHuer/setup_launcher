const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProfiles: () => ipcRenderer.invoke('db:getProfiles'),
  getProfileById: (id) => ipcRenderer.invoke('db:getProfileById', id),
  createProfile: (data) => ipcRenderer.invoke('db:createProfile', data),
  updateProfile: (id, data) => ipcRenderer.invoke('db:updateProfile', id, data),
  deleteProfile: (id) => ipcRenderer.invoke('db:deleteProfile', id),
  getApplicationsByProfile: (profileId) => ipcRenderer.invoke('db:getApplicationsByProfile', profileId),
  createApplication: (data) => ipcRenderer.invoke('db:createApplication', data),
  updateApplication: (id, data) => ipcRenderer.invoke('db:updateApplication', id, data),
  deleteApplication: (id) => ipcRenderer.invoke('db:deleteApplication', id),
  launchSetup: (profileId) => ipcRenderer.invoke('app:launchSetup', profileId),
  scanStartMenu: () => ipcRenderer.invoke('app:scanStartMenu'),
  refreshScan: () => ipcRenderer.invoke('app:refreshScan'),
  pickExecutable: () => ipcRenderer.invoke('app:pickExecutable'),
  pickFolder: () => ipcRenderer.invoke('app:pickFolder'),
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
  setAutoStart: (enable) => ipcRenderer.invoke('app:setAutoStart', enable),
});
