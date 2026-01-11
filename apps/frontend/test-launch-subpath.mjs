import pkg from 'electron/main';
try {
    const { app } = pkg;
    console.log("Electron/Main Default Import Successful");
    console.log("App Object exists:", !!app);
    app.quit();
} catch (e) {
    console.error("Import failed:", e);
    process.exit(1);
}
