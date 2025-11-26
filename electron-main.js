
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', // Completely transparent
    hasShadow: false,
    alwaysOnTop: true, // Default
    resizable: false, // Fixed to screen size
    movable: false, // The window itself doesn't move, the content does
    skipTaskbar: true, // Don't clutter taskbar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false,
    },
    icon: path.join(__dirname, 'public/favicon.ico') 
  });

  // Start by ignoring mouse events (letting them pass through to desktop)
  // forward: true is essential for tracking mouse movement over the transparent window
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

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

// Allow React to control when the window ignores mouse events
// ignore: true = Click through to desktop
// ignore: false = Capture clicks (interact with widget)
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

ipcMain.on('set-always-on-top', (event, shouldBeOnTop) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setAlwaysOnTop(shouldBeOnTop);
  }
});
