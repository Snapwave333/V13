"use strict";
const electron = require('electron');
console.log('Electron module:', typeof electron, electron);
const { app, BrowserWindow, screen: electronScreen, globalShortcut, ipcMain } = electron;
console.log('App:', app);
const path = require('node:path');
const url = require('node:url');
// --- STANDARD ELECTRON SETUP ---
let win = null; // Typing workaround for require usage
const args = process.argv.slice(1);
const serve = args.includes('--serve');
function createWindow() {
    const size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    const start = Date.now();
    console.log(`[PERF] Starting window creation at ${start}`);
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
        },
        icon: path.join(__dirname, '../../src/assets/icon.ico')
    });
    if (serve) {
        if (win) {
            win.loadURL('http://localhost:4200');
            win.webContents.openDevTools();
        }
    }
    else if (win) {
        win.loadURL(url.format({
            pathname: path.join(__dirname, '../../dist/frontend/browser/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    if (win) {
        win.once('ready-to-show', () => {
            const duration = Date.now() - start;
            console.log(`[PERF] Window ready to show in ${duration}ms`);
            win === null || win === void 0 ? void 0 : win.show();
        });
        win.on('closed', () => {
            win = null;
        });
    }
    return win;
}
app.on('ready', () => {
    setTimeout(createWindow, 400);
    // Register Escape key to exit Kiosk mode (optional, or make it quit)
    globalShortcut.register('Escape', () => {
        if (win) {
            // For VIBES, maybe we just want to quit? Or toggle fullscreen?
            // Let's quit for now as per "black screen" pure experience usually means dedicated exit
            // or sticking to standard Alt+F4.
            // But 'Escape' is nice for dev.
            // win.setFullScreen(!win.isFullScreen());
        }
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
    if (win)
        win.close();
});
ipcMain.on('app:minimize', () => {
    if (win)
        win.minimize();
});
ipcMain.on('app:maximize', () => {
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    }
});
//# sourceMappingURL=main.js.map