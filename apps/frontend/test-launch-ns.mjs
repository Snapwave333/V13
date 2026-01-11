import * as ns from 'electron';
console.log("Namespace Import Test");
console.log("Keys:", Object.keys(ns));
if (ns.default) {
    console.log("Default export found");
    console.log("App:", ns.default.app);
    ns.default.app.quit();
} else {
    console.log("No default export");
    console.log("App directly:", ns.app);
    if (ns.app) ns.app.quit();
}
