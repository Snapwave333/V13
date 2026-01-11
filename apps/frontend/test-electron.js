try {
    console.log('Versions:', process.versions);
    console.log('Attempting require("electron")...');
    // const electron = require('electron'); // We know this fails/shadows
    
    console.log('Attempting require("electron/main")...');
    try { console.log(require('electron/main')); } catch(e) { console.log('main failed'); }

    console.log('Attempting require("electron/common")...');
    try { console.log(require('electron/common')); } catch(e) { console.log('common failed'); }

} catch (e) {
    console.error('FATAL:', e);
}
