// electron/main.ts
import electron from "electron";
import * as path from "node:path";
import * as url from "node:url";
var { app, BrowserWindow, screen, globalShortcut } = electron;
var win = null;
var args = process.argv.slice(1);
var serve = args.includes("--serve");
function createWindow() {
  const size = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    frame: false,
    backgroundColor: "#000000",
    fullscreen: true,
    kiosk: true,
    // Lockdown mode
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      webSecurity: false
      // electron-reload removed to prevent conflicts with manual binary usage.
    }
  });
  if (serve) {
    if (win) {
      win.loadURL("http://localhost:4200");
      win.webContents.openDevTools();
    }
  } else if (win) {
    win.loadURL(url.format({
      pathname: path.join(__dirname, "../../dist/frontend/browser/index.html"),
      protocol: "file:",
      slashes: true
    }));
  }
  if (win) {
    win.on("closed", () => {
      win = null;
    });
  }
  return win;
}
app.on("ready", () => {
  setTimeout(createWindow, 400);
  globalShortcut.register("Escape", () => {
    if (win) {
    }
  });
  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
