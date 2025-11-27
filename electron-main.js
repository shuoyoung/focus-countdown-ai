const { app, BrowserWindow, screen, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350, 
    height: 300,
    minWidth: 200, 
    minHeight: 150,
    useContentSize: true, // Important: width/height refers to the web page, not window frame
    center: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', 
    hasShadow: false,
    alwaysOnTop: true, 
    resizable: false, 
    skipTaskbar: false, // Show in taskbar so users can find it
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

  // Create Tray Icon
  createTray();
}

function createTray() {
  if (tray) return;
  
  const iconPath = path.join(__dirname, 'public/favicon.ico');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Focus Countdown', enabled: false },
    { type: 'separator' },
    { 
      label: 'Reset App & Clear Cache', 
      click: () => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('localStorage.clear();');
            setTimeout(() => {
                app.relaunch();
                app.exit(0);
            }, 200);
        }
      } 
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('Focus Countdown');
  tray.setContextMenu(contextMenu);
  
  // Double click to bring to front/center
  tray.on('double-click', () => {
      if (mainWindow) {
          mainWindow.show();
          mainWindow.center();
      }
  });
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

ipcMain.on('app-reset', () => {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript('localStorage.clear();');
        setTimeout(() => {
            app.relaunch();
            app.exit(0);
        }, 200);
    }
});

ipcMain.on('resize-window', (event, { width, height }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const finalWidth = Math.max(width, 200);
    const finalHeight = Math.max(height, 150);
    // Use setContentSize to ensure the inner area matches exactly
    win.setContentSize(finalWidth, finalHeight);
  }
});

ipcMain.on('set-always-on-top', (event, shouldBeOnTop) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setAlwaysOnTop(shouldBeOnTop);
  }
});