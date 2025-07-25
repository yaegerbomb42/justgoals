# Google Calendar OAuth Troubleshooting Steps

## Step 1: Get Your Google API Key

**🔑 You need to add the missing VITE_GOOGLE_API_KEY to your .env file:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "API Key"
5. Copy the generated API key
6. Add it to your `.env` file:

```bash
VITE_GOOGLE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 2: Verify API Settings

**In Google Cloud Console:**

1. **Enable Calendar API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Make sure it's ENABLED

2. **Check OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Make sure it's published or in testing mode with your email added

3. **Verify OAuth Client:**
   - Go to "APIs & Services" → "Credentials"
   - Click on your OAuth 2.0 Client ID
   - Check Authorized redirect URIs include:
     - `http://localhost:5173/oauth2callback`
     - `https://your-vercel-app.vercel.app/oauth2callback`

## Step 3: Environment Variables Check

Your `.env` file should now have:
```bash
VITE_GOOGLE_CLIENT_ID=749125970287-1tqvm2r7o0dg8jetib6tb8g594v5vicv.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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  
VITE_GOOGLE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Restart Development Server

After adding the API key:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 5: Test the Integration

1. **Go to Goal Creation** (step 4 - Advanced Settings)
2. **Click "Choose Google Calendar"**
3. **Check browser console** for any error messages
4. **Look for these success messages:**
   - ✅ Google API initialized successfully
   - 🔐 Attempting Google sign-in...
   - 📅 Fetching calendar list...
   - ✅ Found X calendars

## Common Error Messages & Solutions:

### "API key not valid"
- Double-check the API key is correct
- Ensure Calendar API is enabled in Google Cloud

### "Unauthorized client"
- Check OAuth redirect URIs match exactly
- Verify OAuth client type is "Web application"

### "Access blocked"
- OAuth consent screen might need to be published
- Or add your email as a test user

### "Failed to load Google API script"
- Check internet connection
- Try refreshing the page

## Debug Mode

I've added detailed console logging. Open browser dev tools and watch for:
- ⚠️ Warning messages about missing environment variables
- ❌ Error messages with specific failure reasons
- ✅ Success messages showing progress

## Manual Test

You can manually test the OAuth flow by visiting:
```
https://accounts.google.com/oauth/authorize?client_id=749125970287-1tqvm2r7o0dg8jetib6tb8g594v5vicv.apps.googleusercontent.com&redirect_uri=http://localhost:5173/oauth2callback&scope=https://www.googleapis.com/auth/calendar&response_type=code
```

This should redirect you to Google's permission screen.
