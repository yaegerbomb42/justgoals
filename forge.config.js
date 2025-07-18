module.exports = {
  packagerConfig: {
    icon: 'public/favicon.ico', // You can replace with a real .icns/.ico for production
    asar: true,
    name: 'JustGoals',
    // --- Mac Code Signing & Notarization (Optional) ---
    ...(process.env.APPLE_DEV_IDENTITY && {
      osxSign: {
        identity: process.env.APPLE_DEV_IDENTITY,
        hardenedRuntime: true,
        entitlements: 'entitlements.plist',
        'entitlements-inherit': 'entitlements.plist',
      },
    }),
    ...(process.env.APPLE_ID && {
      osxNotarize: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
      },
    }),
    // --- Windows Code Signing (Optional) ---
    ...(process.env.WIN_CERT_FILE && {
      sign: {
        certificateFile: process.env.WIN_CERT_FILE,
        certificatePassword: process.env.WIN_CERT_PASS,
      },
    }),
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'justgoals',
        setupIcon: 'public/favicon.ico',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: 'public/favicon.ico',
        format: 'ULFO',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
}; 