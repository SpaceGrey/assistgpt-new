const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  onAvailableApps: callback => ipcRenderer.on('apps', (_event, value) => callback(value)),

  sendQuery: query => ipcRenderer.send('query', query),

  setAutomatic:automatic=>ipcRenderer.send('automatic',automatic),

  onTaskEvent: callback => ipcRenderer.on('task', (_event, value) => callback(value)),
})