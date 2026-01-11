const Module = require('module');
try {
    const electron = Module._load('electron', null, true);
    console.log('Electron API type:', typeof electron);
    console.log('App object:', electron ? electron.app : 'null');
    if (electron && electron.app) {
        console.log('SUCCESS: Found Electron API');
    } else {
        console.log('FAILURE: Still not finding it');
    }
} catch (err) {
    console.error('Error loading electron via Module._load:', err);
}
