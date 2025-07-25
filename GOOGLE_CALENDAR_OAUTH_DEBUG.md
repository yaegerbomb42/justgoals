# Google Calendar OAuth Fix Guide

## Current Issues Found:
1. ❌ Missing `VITE_GOOGLE_API_KEY` environment variable
2. ❌ OAuth scope might be too restrictive
3. ❌ Error handling could be improved
4. ❌ Auth state management needs work

## Step-by-Step Fixes:

### 1. Add Missing Google API Key

**Go to Google Cloud Console:**
1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Add to your `.env` file:

```bash
VITE_GOOGLE_API_KEY=your_api_key_here
```

### 2. Update Google Calendar Scopes

The current scopes might be too restrictive. Let's expand them:

```javascript
// Current scope:
"https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly"

// Better scope (includes calendar list access):
"https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
```

### 3. Verify OAuth Redirect URIs

Make sure these are configured in Google Cloud Console:

**Development:**
- `http://localhost:5173/oauth2callback`
- `http://localhost:3000/oauth2callback`

**Production:**
- `https://your-vercel-app.vercel.app/oauth2callback`
- `https://your-custom-domain.com/oauth2callback`

### 4. Test OAuth Flow

**Debug steps:**
1. Open browser dev tools
2. Try calendar sync
3. Check console for specific error messages
4. Verify all environment variables are loaded

### 5. Common Issues & Solutions:

**"API key not valid" error:**
- Ensure API key is created and has Calendar API enabled
- Check that VITE_GOOGLE_API_KEY is in .env file

**"Unauthorized" error:**
- Verify OAuth redirect URIs match exactly
- Check that OAuth consent screen is published (not in testing mode)

**"Access blocked" error:**
- OAuth app might be in testing mode - publish it or add test users

**"Invalid client" error:**
- Client ID might be wrong or not for web application type

### 6. Enhanced Error Handling

I'll create an improved version of the calendar sync with better error messages and debugging.

### 7. Manual Test

You can test OAuth manually by visiting:
```
https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/calendar&response_type=code
```

Replace YOUR_CLIENT_ID and YOUR_REDIRECT_URI with your actual values.
