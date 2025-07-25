# Google Calendar OAuth Setup - Complete Guide

## ✅ What's Now Configured:

### Environment Variables (.env):
```
VITE_GOOGLE_CLIENT_ID=749125970287-1tqvm2r7o0dg8jetib6tb8g594v5vicv.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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
VITE_GOOGLE_API_KEY=AIzaSyBdFCtb6Y12s4uW2YgvJQpj5xhF6JG1xGQ
```

### Scopes Fixed:
- `https://www.googleapis.com/auth/calendar.events` - Create/edit events
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar list

## 🚀 Next Steps:

### 1. Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Enable APIs:
   - **Google Calendar API** ✅
   - **Google+ API** (for OAuth)

### 3. Configure OAuth Consent Screen
1. APIs & Services → OAuth consent screen
2. Choose "External" (for testing with any Google account)
3. Fill required fields:
   - App name: "JustGoals"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add test users (your Gmail account)

### 4. Configure OAuth 2.0 Credentials
1. APIs & Services → Credentials
2. Your OAuth 2.0 Client ID should have:
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (Vite dev server)
     - `https://your-domain.vercel.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/oauth2callback`
     - `https://your-domain.vercel.app/oauth2callback`

## 🧪 Testing Steps:

1. **Start dev server**: `npm run dev`
2. **Create a goal** and go to step 4 (Advanced Settings)
3. **Click "Choose Google Calendar"** - should trigger Google sign-in
4. **Sign in with Google** - should see permission request
5. **Grant permissions** - should load your calendars
6. **Select calendar** from dropdown
7. **Click "Sync to Google Calendar"** - should create event and open it

## 🔍 Debugging Common Issues:

### "Google API not loaded"
- Check browser console for script loading errors
- Verify internet connection
- Clear browser cache

### "Google Auth not initialized"
- Check API key is correct
- Verify client ID matches your Google Cloud project
- Check browser console for gapi initialization errors

### "User not signed in"
- Try signing out of Google and back in
- Check OAuth consent screen is configured
- Verify test users are added

### "Permission denied" 
- Check scopes in Google Cloud Console
- Verify OAuth consent screen is published or you're a test user
- Check authorized domains match your current URL

### "Calendar list empty"
- Verify user has Google Calendar enabled
- Check calendar.readonly scope is granted
- Some users need to create at least one calendar first

## 🎯 Expected Flow:

1. ✅ Environment variables loaded
2. ✅ Google API script loads
3. ✅ gapi.client.init() succeeds  
4. ✅ User clicks "Choose Google Calendar"
5. ✅ Google sign-in popup appears
6. ✅ User grants permissions
7. ✅ Calendar list loads
8. ✅ User selects calendar and clicks sync
9. ✅ Event created in Google Calendar
10. ✅ Calendar event opens in new tab

## 📝 Debug Commands:

Open browser console and run:
```javascript
// Check if environment variables loaded
console.log('API Key:', import.meta.env.VITE_GOOGLE_API_KEY);
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Check Google API status
console.log('gapi loaded:', !!window.gapi);
console.log('gapi.auth2:', !!window.gapi?.auth2);
console.log('Signed in:', window.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get());
```

The setup should now work! Let me know if you encounter any specific errors. 🎉
