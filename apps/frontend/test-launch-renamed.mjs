import { default as pkg } from 'electron';
console.log("Renamed Import Test");
console.log("Pkg:", pkg);
if (pkg && pkg.app) {
    console.log("App Version:", pkg.app.getVersion());
    pkg.app.quit();
} else {
    console.error("Pkg is not valid electron object");
    process.exit(1);
}
