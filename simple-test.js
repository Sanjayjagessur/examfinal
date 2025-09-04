const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  console.log('Window created, loading file...');
  
  // Load a simple HTML file
  mainWindow.loadFile('build/index.html');
  
  // Force show and focus
  mainWindow.show();
  mainWindow.focus();
  mainWindow.moveTop();
  
  console.log('Window should be visible now');
  
  // Open DevTools to see any errors
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  console.log('App is ready!');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
