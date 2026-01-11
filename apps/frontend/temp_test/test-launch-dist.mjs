import pkg from 'electron';
console.log("Dist Import Successful");
const { app } = pkg;
console.log("App Version:", app.getVersion());
app.quit();
