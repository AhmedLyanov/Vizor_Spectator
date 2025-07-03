const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('GET_SOURCES'),
  getUsername: () => ipcRenderer.invoke('GET_USERNAME') 
});