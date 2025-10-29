# Push Notifications Integration Guide

This app now supports push notifications using Expo's push notification service. The mobile app handles all notification setup and communicates with your web app via the WebView bridge.

## ⚠️ REQUIRED SETUP: FCM Credentials for Android

Before notifications will work on Android, you **MUST** configure Firebase Cloud Messaging (FCM) credentials. Follow these steps:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" (or use existing project)
3. Enter project name and complete setup

### 2. Add Android App to Firebase

1. In Firebase Console, click the Android icon
2. Enter Android package name: **`world.vibz.browserapp`**
3. Download **`google-services.json`**
4. Place `google-services.json` in your project root (next to `app.json`)

### 3. Upload FCM Credentials to EAS

**Option A: Using EAS CLI**
```bash
npm install -g eas-cli
eas login
eas credentials
```
- Select "Android" → "production"
- Upload your `google-services.json`

**Option B: Using Expo Dashboard**
1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Go to "Credentials" → "Android"
4. Upload `google-services.json`

### 4. Configuration Added

The `app.json` has been configured with:
```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

### 5. Rebuild Your App

After adding FCM credentials, you **must rebuild** your Android app:
```bash
eas build --platform android
```

---

## How It Works

1. **Mobile App**: Requests notification permissions and gets an Expo push token
2. **Mobile → Web**: Sends the push token to your web app via `postMessage`
3. **Web → Backend**: Your web app sends the token to your backend to associate with the user
4. **Backend → User**: Your backend sends push notifications using Expo's Push API
5. **User Interaction**: When user taps a notification, the mobile app sends the notification data to your web app

## Web App Integration

### 1. Listen for Push Token

Add this code to your web app to receive the push token:

```javascript
// Listen for messages from the native app
window.addEventListener('message', (event) => {
  const data = event.data;

  if (data.type === 'pushToken') {
    console.log('Received push token:', data.token);
    console.log('Permission status:', data.permissionStatus);

    // Send token to your backend
    fetch('/api/register-push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pushToken: data.token,
        userId: getCurrentUserId(), // Your user ID
      })
    });
  }
});
```

### 2. Handle Notification Taps

When a user taps on a notification, you'll receive the notification data:

```javascript
window.addEventListener('message', (event) => {
  const data = event.data;

  if (data.type === 'notificationTapped') {
    console.log('User tapped notification:', data.data);

    // Handle the notification tap (e.g., navigate to specific page)
    if (data.data.postId) {
      window.location.href = `/posts/${data.data.postId}`;
    }
  }
});
```

## Backend Integration

### Sending Push Notifications

Use Expo's Push API to send notifications from your backend:

```javascript
// Example using Node.js
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(pushToken, title, body, data) {
  // Check that the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error('Invalid Expo push token:', pushToken);
    return;
  }

  // Create the message
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data, // Custom data to pass to the app
    priority: 'default',
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Example usage
sendPushNotification(
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  'New Message',
  'You have a new message from John',
  { messageId: '12345', userId: '67890' }
);
```

### Install Expo Server SDK

```bash
npm install expo-server-sdk
```

## Notification Data Structure

### Push Token Message (Mobile → Web)

```javascript
{
  type: 'pushToken',
  token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  permissionStatus: 'granted' // or 'denied', 'unavailable'
}
```

### Notification Tapped Message (Mobile → Web)

```javascript
{
  type: 'notificationTapped',
  data: {
    // Your custom data from the notification
    messageId: '12345',
    userId: '67890',
    // ... any other data you included
  }
}
```

## Testing Notifications

### Using Expo Push Tool

1. Get the push token from your app (check console logs)
2. Visit: https://expo.dev/notifications
3. Enter your push token
4. Enter notification title, body, and data (as JSON)
5. Click "Send a Notification"

### Example Test Notification

```json
{
  "to": "ExponentPushToken[your-token-here]",
  "title": "Test Notification",
  "body": "This is a test notification",
  "data": {
    "testId": "123",
    "action": "open-profile"
  }
}
```

## Important Notes

- **iOS**: Requires a physical device (not simulator) and proper push notification certificates in production
- **Android**: Works on emulators and physical devices
- **Web Platform**: Notifications are not available when running on web
- **Permissions**: Users must grant permission for notifications to work
- **Token Expiry**: Push tokens can change; implement token refresh in your backend
- **Data Limit**: Keep notification data small (under 4KB recommended)

## Configuration

All notification settings are configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff",
          "sounds": []
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#ffffff"
    }
  }
}
```

## Troubleshooting

### No Push Token Received

- Check device is physical (not simulator for iOS)
- Check permissions are granted
- Check console logs for errors
- Verify EAS project ID in `app.json`

### Notifications Not Showing

- Check notification permissions
- Verify push token is valid (starts with `ExponentPushToken[`)
- Check backend is sending notifications correctly
- Review device notification settings

### Notification Taps Not Working

- Verify notification includes `data` field
- Check web app is listening for `notificationTapped` messages
- Review console logs for errors
