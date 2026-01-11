try {
    const { app } = require('electron');
    console.log("Electron CJS Require Successful");
    console.log("App Version:", app.getVersion());
    app.quit();
} catch (e) {
    console.error("Require failed:", e);
    process.exit(1);
}
