# Backend Notifications Deployment Guide

This guide explains how to deploy the backend notification system using Firebase Cloud Functions to enable notifications when the browser is closed.

## Overview

The system consists of:
- **Frontend**: `notificationSchedulerService.js` - syncs user settings to Firestore
- **Backend**: `firebase-functions-example.js` - Cloud Functions for scheduled notifications
- **Database**: Firestore collections for user settings and notification schedules

## Prerequisites

1. Firebase project with Firestore enabled
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Active Blaze plan (required for Cloud Functions)

## Deployment Steps

### 1. Initialize Firebase Functions

```bash
cd /Users/yaeger/justgoals-1
firebase init functions
```

Choose:
- Use existing Firebase project
- JavaScript (not TypeScript)
- Install dependencies

### 2. Setup Cloud Functions

Copy the code from `firebase-functions-example.js` to `functions/index.js`:

```bash
cp firebase-functions-example.js functions/index.js
```

### 3. Install Dependencies

```bash
cd functions
npm install firebase-admin
```

### 4. Configure Environment

Set up any required environment variables:

```bash
firebase functions:config:set ntfy.default_topic="justgoals_notifications"
```

### 5. Deploy Functions

```bash
firebase deploy --only functions
```

### 6. Configure Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// User notification settings
match /userNotificationSettings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Notification queue (Cloud Functions only)
match /notificationQueue/{notificationId} {
  allow read, write: if false; // Only Cloud Functions can access
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Testing

1. **Frontend Sync**: Save notification settings in the app - should sync to Firestore
2. **Backend Test**: Click "Test Backend" button in notification settings
3. **Scheduled Notifications**: Wait for hourly function execution or trigger manually

## Monitoring

Check Cloud Functions logs:
```bash
firebase functions:log --only checkScheduledNotifications
```

View Firestore data:
- `userNotificationSettings/{userId}` - user preferences
- `notificationQueue/{id}` - queued test notifications

## Free Tier Limits

Firebase Spark (free) plan includes:
- 125K function invocations/month
- 40K GB-seconds/month
- 5GB Firestore storage

With hourly checks (24 × 30 = 720/month), you're well within limits.

## Troubleshooting

### Function Not Triggering
- Check Cloud Functions logs
- Verify cron expression: `0 * * * *` (every hour)
- Ensure function is deployed successfully

### Notifications Not Sending
- Verify ntfy topic is correct
- Check network connectivity from Cloud Functions
- Review function logs for errors

### Firestore Permission Denied
- Verify security rules allow user access
- Check authentication token validity
- Ensure user ID matches document path

## Next Steps

1. Deploy the functions to your Firebase project
2. Test the complete flow end-to-end
3. Monitor function execution and costs
4. Optionally customize notification schedules and messages

The system will automatically:
- Sync user preferences when they change settings
- Check for scheduled notifications every hour
- Send ntfy notifications for deadlines, motivation, etc.
- Work even when the user's browser is closed
