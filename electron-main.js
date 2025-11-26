const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Get primary display dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400, // Initial width
    height: 300, // Initial height
    x: width - 420, // Position top-right by default
    y: 20,
    frame: false, // No OS chrome (close buttons, title bar)
    transparent: true, // Allow transparency
    alwaysOnTop: true, // Keep on top of other windows
    resizable: true, // Allow resizing if needed
    hasShadow: false, // Clean look
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false, // Disable dev tools for production
    },
    icon: path.join(__dirname, 'public/favicon.ico') // Assuming you have an icon
  });

  // In production, load the built index.html from 'dist' (Vite default)
  // In development, you might load http://localhost:5173
  // For this standalone script, we assume a build exists.
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

// Example IPC to handle "Close App" from within React if needed
ipcMain.on('close-app', () => {
  app.quit();
});