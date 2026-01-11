const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const electronPath = path.join(rootDir, 'node_modules', 'electron');
const electronBinPath = path.join(rootDir, 'node_modules', 'electron-bin');

// Use the renamed path if it exists (in case of previous crash), otherwise standard
const currentPath = fs.existsSync(electronBinPath) ? electronBinPath : electronPath;
const targetPath = electronBinPath; // We want it to be here during run

// Path to executable inside the folder
// Adjust for Windows .cmd vs .exe if needed, but we go direct to dist for safety
const executable = path.join(targetPath, 'dist', 'electron.exe');

async function launch() {
    console.log('[Launcher] Starting Electron...');

    // 1. Rename to hide from module resolution
    if (currentPath === electronPath && fs.existsSync(electronPath)) {
        console.log('[Launcher] Hiding electron package...');
        try {
            fs.renameSync(electronPath, electronBinPath);
        } catch (e) {
            console.error('[Launcher] Failed to rename electron folder:', e);
            process.exit(1);
        }
    } else if (!fs.existsSync(targetPath)) {
        console.error('[Launcher] Electron package not found at:', sourcePath, 'or', targetPath);
        process.exit(1);
    }

    console.log('[Launcher] Spawning:', executable);

    // 2. Spawn Electron
    // passing process.argv[2] (script to run) or '.' (app dir)
    // pass remaining args as well? For now just the target.
    const targetScript = process.argv[2] || '.';
    const args = [targetScript, '--serve'];
    console.log('[Launcher] Spawning args:', args);

    const child = spawn(executable, args, {
        cwd: rootDir,
        stdio: 'inherit',
        shell: false 
    });

    // 3. Cleanup on exit
    child.on('close', (code) => {
        console.log(`[Launcher] Electron exited with code ${code}`);
        restore();
        process.exit(code);
    });
    
    child.on('error', (err) => {
        console.error('[Launcher] Failed to start subprocess:', err);
        restore();
    });
}

function restore() {
    if (fs.existsSync(electronBinPath)) {
        console.log('[Launcher] Restoring electron package...');
        try {
            fs.renameSync(electronBinPath, electronPath);
        } catch (e) {
            console.error('[Launcher] CRITICAL: Failed to restore electron package!', e);
        }
    }
}

// Handle signals to ensure cleanup
process.on('SIGINT', () => { restore(); process.exit(); });
process.on('SIGTERM', () => { restore(); process.exit(); });
process.on('exit', () => { restore(); });

launch();
