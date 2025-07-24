# 🔐 Google OAuth Setup Guide for JustGoals

## Quick Setup (5 minutes)

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "New Project" → Enter project name: "JustGoals Calendar Sync"
3. Click "Create"

### 2. Enable Calendar API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it → Click "Enable"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen if prompted:
   - User Type: External
   - App name: "JustGoals"
   - User support email: your email
   - Developer contact: your email
4. Application type: "Web application"
5. Name: "JustGoals Web Client"
6. Authorized redirect URIs:
   - `http://localhost:5173/oauth2callback` (for development)
   - `https://yourdomain.com/oauth2callback` (for production)
7. Click "Create"

### 4. Configure Environment Variables
1. Copy the Client ID and Client Secret from the credentials page
2. Create `.env` file in your project root:
```bash
# Copy from .env.example
cp .env.example .env
```

3. Edit `.env` file:
```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_actual_client_secret
```

### 5. Test the Integration
1. Restart your development server:
```bash
npm run dev
```

2. Go to Day Planner → Try Google Calendar sync
3. You should see the OAuth flow working!

## Environment Variables Template

Create `.env` file with:
```bash
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghijklmnop

# Optional: Other integrations
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Troubleshooting

### Common Issues:
1. **"OAuth client not configured"** → Check environment variables are set correctly
2. **"Redirect URI mismatch"** → Ensure redirect URI in Google Console matches exactly
3. **"Access blocked"** → Make sure OAuth consent screen is configured

### Testing OAuth:
1. Open browser dev tools → Network tab
2. Try calendar sync in day planner
3. Check for successful OAuth redirect
4. Verify tokens are stored in localStorage

## Security Notes

- ✅ Client ID is safe to expose (already in frontend code)
- ⚠️ Client Secret should be kept secure (used in API routes)
- 🔒 Tokens are stored locally and expire automatically
- 🛡️ OAuth scope is limited to calendar access only

## Production Deployment

For production (Vercel/Netlify):
1. Add environment variables in deployment settings
2. Update redirect URI to production domain
3. Test OAuth flow on production URL

That's it! The Google Calendar integration should work perfectly once configured. 🚀
