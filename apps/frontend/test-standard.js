try {
    console.log('Testing require("electron") with package present...');
    const e = require('electron');
    console.log('Type:', typeof e);
    if (typeof e === 'string') {
        console.log('Value (String):', e);
    } else {
        console.log('Keys:', Object.keys(e));
        console.log('Has app:', !!e.app);
    }
} catch (err) {
    console.error('ERROR:', err);
}
