const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350, 
    height: 300,
    minWidth: 200, // Prevent window from becoming too small and "disappearing"
    minHeight: 150,
    center: true, // Force center on startup to avoid off-screen positioning
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', // Start transparent, React adds the 1% hit-layer
    hasShadow: false,
    alwaysOnTop: true, 
    resizable: false, 
    skipTaskbar: true, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false,
    },
    icon: path.join(__dirname, 'public/favicon.ico') 
  });

  mainWindow.loadURL(
    `file://${path.join(__dirname, 'dist/index.html')}`
  );

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- IPC HANDLERS ---

ipcMain.on('close-app', () => {
  app.quit();
});

ipcMain.on('app-relaunch', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('resize-window', (event, { width, height }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    // Ensure we don't resize smaller than min dimensions
    const finalWidth = Math.max(width, 200);
    const finalHeight = Math.max(height, 150);
    win.setSize(finalWidth, finalHeight);
  }
});

ipcMain.on('set-always-on-top', (event, shouldBeOnTop) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setAlwaysOnTop(shouldBeOnTop);
  }
});