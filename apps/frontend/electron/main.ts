const electron = require('electron');
const { app, BrowserWindow, screen: electronScreen, globalShortcut, ipcMain } = electron;
const path = require('node:path');
const url = require('node:url');

// Safe logging helper to prevent EPIPE errors
function safeLog(...args: any[]) {
  try {
    safeLog(...args);
  } catch (e) {
    // Ignore EPIPE errors
  }
}

// --- STANDARD ELECTRON SETUP ---
let win: any = null; // Typing workaround for require usage
const args = process.argv.slice(1);
const serve = args.includes('--serve');

function createWindow(): Electron.BrowserWindow {
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  const start = Date.now();
  safeLog(`[PERF] Starting window creation at ${start}`);
  
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    frame: false,
    backgroundColor: '#000000',
    fullscreen: true,
    kiosk: true, // Lockdown mode
    webPreferences: {
      nodeIntegration: false,
      allowRunningInsecureContent: (serve),
      contextIsolation: true,
      webSecurity: true, // Re-enable for production hardening
      preload: path.join(__dirname, 'preload.js')
    } as any,
    icon: path.join(__dirname, '../../src/assets/icon.ico')
  });

  if (serve) {
    if (win) {
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    }
  } else if (win) {
    win.loadURL(url.format({
      pathname: path.join(__dirname, '../../dist/frontend/browser/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (win) {
    win.once('ready-to-show', () => {
    const duration = Date.now() - start;
    safeLog(`[PERF] Window ready to show in ${duration}ms`);
    win?.show();
  });
    win.on('closed', () => {
      win = null;
    });
  }

  return win!;
}

app.on('ready', () => {
    setTimeout(createWindow, 400);

    // Register Escape key to quit the app
    globalShortcut.register('Escape', () => {
        app.quit();
    });
    
    // Explicit Quit shortcut if Kiosk traps users
    globalShortcut.register('CommandOrControl+Q', () => {
        app.quit();
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// IPC Handlers for Secure Renderer Communication

ipcMain.on('app:close', () => {
    if (win) win.close();
});

ipcMain.on('app:minimize', () => {
    if (win) win.minimize();
});

ipcMain.on('app:maximize', () => {
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});
