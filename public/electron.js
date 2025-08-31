const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico'), // You can add an icon file
    title: 'Jagesaurus - Exam Timetable Manager',
    show: false, // Don't show until ready
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// IPC handlers for file operations
ipcMain.handle('save-timetable', async (event, data) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Timetable',
      defaultPath: path.join(app.getPath('documents'), 'jagesaurus-timetable.json'),
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled) {
      return { success: false, message: 'Save cancelled' };
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-timetable', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Timetable',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Load cancelled' };
    }

    const filePath = filePaths[0];
    const data = fs.readFileSync(filePath, 'utf8');
    const timetable = JSON.parse(data);
    
    return { success: true, data: timetable, filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auto-save', async (event, data) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'timetable-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('auto-load', async (event) => {
  try {
    const dataPath = path.join(app.getPath('userData'), 'timetable-data.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: false, message: 'No saved data found' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
