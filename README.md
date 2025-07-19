# Yaeger's Goals

## 🚀 Download & Install (Desktop App)

### One-Click Installer (Unsigned - Free Option)

Since code signing requires paid certificates, here's how to distribute your app without them:

- **Mac:** [Download for Mac (.dmg)](https://github.com/yaeger/yaeger_s_goals/releases/latest/download/YaegerGoals-mac.dmg)
- **Windows:** [Download for Windows (.exe)](https://github.com/yaeger/yaeger_s_goals/releases/latest/download/YaegerGoals-win.exe)

**Installation Instructions (Unsigned Apps):**

**Mac:**
1. Download the `.dmg` file
2. Double-click to mount the disk image
3. Drag the app to Applications folder
4. Right-click the app in Applications and select "Open"
5. Click "Open" in the security dialog that appears
6. The app will now open normally on future launches

**Windows:**
1. Download the `.exe` file
2. Right-click the installer and select "Run as administrator"
3. If Windows SmartScreen blocks it, click "More info" then "Run anyway"
4. Follow the installation wizard

**Note:** Unsigned apps will show security warnings, but they're safe to install. The warnings are just because the app isn't signed by a recognized developer.

### Code-Signed Version (Optional)
For a seamless experience without security warnings, see the "Code Signing & Notarization" section below.

Just double-click the downloaded file to install. The app is code-signed and notarized for your security. It will auto-update to the latest version.

![screenshot](public/assets/images/ChatGPT%20Image%20Jul%2015,%202025,%2003_31_29%20PM.png)

### Troubleshooting
- If you see a security warning, check that the publisher is "Yaeger" and click "Allow" or "Open Anyway".
- On Mac, you may need to right-click and choose "Open" the first time.
- The app will auto-update in the background.

## 🖥️ Run Locally (Developers)

1. Clone this repo:
   ```sh
   git clone https://github.com/yaeger/yaeger_s_goals.git
   cd yaeger_s_goals
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the app in Electron:
   ```sh
   npm run electron:start
   ```
4. Or run the web version:
   ```sh
   npm run dev
   ```

## Features
- Cross-platform (Mac & Windows)
- One-click installer, code-signed and notarized
- Auto-updates
- Full offline/local support
- Modern, beautiful UI

## Support
If you have issues, open an issue on GitHub or email support@yaeger.com.

## 🔒 Code Signing & Notarization (For Developers)

To prevent security warnings and ensure trust, you must code sign and notarize your Electron builds:

### Mac (Apple Notarization)
1. **Obtain an Apple Developer Account** ($99/year):
   - https://developer.apple.com/account/
2. **Create a Certificate:**
   - In Xcode > Preferences > Accounts, add your Apple ID and create a "Developer ID Application" certificate.
   - Download and install it in your Keychain.
3. **Set Environment Variables:**
   - `APPLE_ID`, `APPLE_ID_PASSWORD` (app-specific password), and `CSC_LINK` (path to .p12 certificate) in your CI or shell.
4. **Configure Electron Forge:**
   - Use `electron-osx-sign` and `electron-notarize` in your `forge.config.js`.
   - Example:
```js
     packagerConfig: {
       osxSign: {
         identity: 'Developer ID Application: Your Name (TEAMID)',
         hardenedRuntime: true,
         entitlements: 'entitlements.plist',
         'entitlements-inherit': 'entitlements.plist',
       },
       osxNotarize: {
         appleId: process.env.APPLE_ID,
         appleIdPassword: process.env.APPLE_ID_PASSWORD,
       },
     }
     ```
5. **Build & Notarize:**
   - `npm run electron:make` (or via CI)

### Windows (EV Code Signing)
1. **Obtain an EV Code Signing Certificate:**
   - Purchase from a trusted Certificate Authority (CA) such as Sectigo, DigiCert, GlobalSign, or SSL.com.
   - The CA will require identity verification (business or individual) and may ship a physical USB token for secure certificate storage.
   - Follow the CA's instructions to activate and export your certificate (usually as a `.pfx` file).
2. **Set Environment Variables:**
   - `WIN_CERT_FILE` — Path to your `.pfx` certificate file (e.g., `C:/certs/yourcert.pfx`).
   - `WIN_CERT_PASS` — Password for your certificate file.
3. **Build & Sign:**
   - Only the developer (you) needs to build and sign the app. End users just download and install the signed installer—no certificates or special steps needed for them.
   - Run `npm run electron:make` to build, sign, and package the app for distribution.

### Onboarding Screen & Auto-Updater
- The app includes a built-in onboarding screen with install and getting started instructions for new users.
- The auto-updater checks for new releases and updates the app automatically, so users always have the latest version with no manual steps.

### Troubleshooting
- **Mac:** If notarization fails, check your Apple ID, app-specific password, and certificate validity.
- **Windows:** If signing fails, ensure the certificate is installed and the password is correct.
- See Electron Forge docs for more: https://www.electronforge.io/advanced/code-signing

## Google Calendar OAuth Setup

- Google Calendar sync uses Firebase Cloud Functions for secure OAuth token exchange.
- The Google OAuth Client Secret is never exposed in frontend code.
- The OAuth handler will be implemented in `functions/googleOAuth.js`.
- See project documentation for setup and deployment instructions.
