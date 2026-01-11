module.exports = {
  packagerConfig: {
    name: 'VIBES',
    asar: true,
    icon: 'src/assets/icon' // Electron Forge automatically adds .ico/.icns extension
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Antigravity',
        description: 'VIBES v13 Desktop App',
        exe: 'VIBES.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
