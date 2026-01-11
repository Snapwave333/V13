import pkg from 'electron';
console.log('Testing ESM Default Export...');
console.log('Type:', typeof pkg);
console.log('Value:', pkg);
if (typeof pkg === 'object') {
    console.log('Keys:', Object.keys(pkg));
}
