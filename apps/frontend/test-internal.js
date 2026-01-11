console.log('Attempting require("electron/main")...');
try {
    const main = require('electron/main');
    console.log('Success!');
    console.log('App Object:', main.app ? 'Present' : 'Missing');
} catch (e) {
    console.error('Failed:', e.message);
}
