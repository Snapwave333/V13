try {
    const electron = await import('electron');
    console.log("Dynamic Import Success");
    console.log("Electron:", electron);
    if (electron.default && electron.default.app) {
        console.log("App Version:", electron.default.app.getVersion());
        electron.default.app.quit();
    }
} catch (e) {
    console.error("Dynamic Import Failed:", e);
    process.exit(1);
}
