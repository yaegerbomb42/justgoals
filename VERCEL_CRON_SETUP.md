# Vercel Cron Setup Guide (100% FREE)

## What You Just Got:
✅ **FREE background notifications** that work when browser is closed  
✅ **No paid Firebase plan needed** - uses free Firestore  
✅ **No server costs** - runs on Vercel's free tier  
✅ **Reliable scheduling** - Vercel cron runs every hour  

## Setup Steps (5 minutes):

### 1. Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Settings → Service Accounts
3. Click "Generate new private key" → Download JSON file
4. Extract these values from the JSON:
   - `project_id` 
   - `client_email`
   - `private_key` (copy the ENTIRE value including BEGIN/END lines)

**Example of what the private_key looks like in the JSON:**
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
}
```
Copy that entire string exactly as-is (with the `\n` characters).

### 2. Set Vercel Environment Variables
Go to your Vercel dashboard → Settings → Environment Variables:

```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com  
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----
CRON_SECRET = justgoals_cron_2025_secure_key_xyz789
```

**Important notes:**
- **CRON_SECRET**: This is a security password YOU create to prevent unauthorized access to your cron endpoint. Use any random string like `justgoals_cron_2025_secure_key_xyz789` or generate one with: `openssl rand -base64 32`
- **FIREBASE_PRIVATE_KEY**: YES, include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Copy the entire `private_key` value from your Firebase JSON file exactly as-is.

### 3. Deploy
```bash
git add .
git commit -m "Add free background notifications"
git push
```

Vercel will automatically deploy and start the hourly cron job.

## How It Works:

1. **Every hour**, Vercel runs `/api/cron-notifications`
2. **Checks Firestore** for user notification settings
3. **Sends ntfy notifications** for:
   - Morning motivation (8 AM)
   - Evening reflection (8 PM) 
   - Focus reminders (2 PM)
   - Streak protection (9 PM)
   - Goal deadlines (7, 3, 1 days before)
   - Test notifications from UI

## Testing:

1. Set up ntfy on your phone
2. Configure notification settings in your app
3. Click "Test Backend" button
4. Should receive notification within 1 hour (or manually trigger)

## Manual Trigger (for testing):

Visit: `https://your-app.vercel.app/api/cron-notifications` with header:
```
Authorization: Bearer your-cron-secret
```

## Cost Breakdown:
- **Vercel hosting**: FREE (hobby plan)
- **Vercel cron jobs**: FREE (included)
- **Firebase Firestore**: FREE (generous limits)
- **ntfy.sh**: FREE (unlimited)
- **Total monthly cost**: $0.00 ✅

## Advantages over Cloud Functions:
- ✅ Completely free forever
- ✅ No billing account required
- ✅ Simple deployment
- ✅ Reliable Vercel infrastructure
- ✅ Easy monitoring via Vercel dashboard

Your users will now get notifications even when their browser is closed, without spending a penny! 🎉
