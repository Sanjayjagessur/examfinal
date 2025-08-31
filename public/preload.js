const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveTimetable: (data) => ipcRenderer.invoke('save-timetable', data),
  loadTimetable: () => ipcRenderer.invoke('load-timetable'),
  autoSave: (data) => ipcRenderer.invoke('auto-save', data),
  autoLoad: () => ipcRenderer.invoke('auto-load'),
});
