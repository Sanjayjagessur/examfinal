const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window with the working configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'Jagesaurus - Exam Timetable Manager',
    show: false, // Don't show until ready
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true
  });

  console.log('Window created, loading content...');

  // Load the app from built files
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading from:', indexPath);
  mainWindow.loadFile(indexPath);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show!');
    mainWindow.show();
    mainWindow.focus();
    console.log('Window should now be visible and focused');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
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

// App event handlers
app.whenReady().then(() => {
  console.log('Electron app is ready!');
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Node version:', process.version);
  
  try {
    createWindow();
    console.log('Window creation initiated');
  } catch (err) {
    console.error('Failed to create window:', err);
  }
}).catch(err => {
  console.error('Failed to initialize app:', err);
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  console.log('All windows closed, quitting app');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
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
