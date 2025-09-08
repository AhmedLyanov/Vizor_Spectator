const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('GET_SOURCES'),
  getUsername: () => ipcRenderer.invoke('GET_USERNAME'),
  getHostname: () => ipcRenderer.invoke('GET_HOSTNAME'),
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (_, data) => callback(data)),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('window-is-maximized')
});