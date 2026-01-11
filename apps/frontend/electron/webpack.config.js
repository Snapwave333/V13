
const path = require('path');

module.exports = {
  mode: 'production', // or 'development' if you need debugging
  externalsType: 'module',
  externals: {
    electron: 'electron',
  },
  entry: './electron/main.ts',
  target: 'electron-main', // This is CRITICAL. It tells Webpack to handle 'electron' import correctly.
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: /electron/,
        use: [{ loader: 'ts-loader' }]
      }
    ]
  },
  experiments: {
    outputModule: true,
  },
  output: {
    path: path.join(__dirname, '..'),
    filename: 'main.mjs',
    library: {
      type: 'module',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // Optional: alias electron if needed, but target: electron-main usually handles it.
    }
  },
  // Ensure we don't bundle node_modules (optional but good for startup speed if you trust node_modules)
  // But wait! If we bundle node_modules, we might accidentally bundle 'electron' package?
  // No, target 'electron-main' treats 'electron' as external automatically.
  // Best practice for main process: check if we should bundle dependencies.
  // We generally DO NOT want to bundle 'electron' package.
  // We usually execute 'electron dist/main.js'.
  // If we bundle dependencies, we are self-contained.
  // Let's rely on target: electron-main defaults.
};
