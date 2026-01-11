const electron = require('electron');
console.log('Successfully loaded electron');
console.log('app is:', typeof electron.app);
try {
    console.log('BrowserWindow is:', typeof electron.BrowserWindow);
} catch (e) {
    console.log('Error accessing BrowserWindow:', e.message);
}
// Keep alive briefly
setTimeout(() => {
    console.log('Exiting debug script');
    if (electron.app) electron.app.quit();
}, 1000);
