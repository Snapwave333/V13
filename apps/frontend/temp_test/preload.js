"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    close: () => electron_1.ipcRenderer.send('app:close'),
    minimize: () => electron_1.ipcRenderer.send('app:minimize'),
    maximize: () => electron_1.ipcRenderer.send('app:maximize'),
    // Add other methods as needed for future phases
});
//# sourceMappingURL=preload.js.map