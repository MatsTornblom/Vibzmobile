# Google OAuth Setup for VibzWorld WebView App

## Overview

This mobile app now supports Google OAuth authentication through the system browser, bypassing the WebView's "disallowed_useragent" restriction.

## How It Works

1. **WebView Detection**: The WebView sends a custom user agent `VibzWorldApp/1.0` so your web app can detect when it's running in the mobile app.

2. **OAuth Request**: When your web app needs to authenticate with Google, it calls:
   ```javascript
   window.requestGoogleLogin();
   ```

3. **System Browser Opens**: The mobile app opens Google OAuth in the system browser using `expo-auth-session`.

4. **Token Return**: After successful login, the mobile app sends the tokens back to the WebView:
   ```javascript
   window.addEventListener('message', (event) => {
     if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
       const { accessToken, idToken } = event.data;
       // Use these tokens to authenticate with your backend
     }
   });
   ```

## Configuration

### Mobile App (Already Configured)

- **URL Scheme**: `vibzworld`
- **Google Client ID**: `130221165582-8nbialqq6t9vhefs5iu8hqos0b31inhg.apps.googleusercontent.com`
- **WebView URL**: `https://enter.vibz.world/login`
- **Custom User Agent**: `VibzWorldApp/1.0`

### Web App Integration (Required on Your Web App)

Add this code to your web app (`https://enter.vibz.world/login`):

```javascript
// Detect if running in VibzWorld mobile app
const isVibzWorldApp = /VibzWorldApp/.test(navigator.userAgent);

if (isVibzWorldApp) {
  // Listen for OAuth responses from mobile app
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
      const { accessToken, idToken } = event.data;

      // Send tokens to your backend for verification
      fetch('/api/auth/mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, idToken })
      })
      .then(response => response.json())
      .then(data => {
        // Handle successful login
        console.log('Logged in successfully:', data);
      });
    } else if (event.data.type === 'GOOGLE_LOGIN_ERROR') {
      console.error('Login failed:', event.data.error);
    }
  });

  // Replace Google login button click handler
  document.getElementById('google-login-btn').addEventListener('click', (e) => {
    e.preventDefault();

    // Request OAuth through mobile app
    if (window.requestGoogleLogin) {
      window.requestGoogleLogin();
    } else {
      console.error('Mobile OAuth bridge not available');
    }
  });
}
```

## Google Cloud Console Setup

To use this OAuth flow, you need to add the redirect URI to your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URI: `vibzworld://`

## Testing

### On iOS/Android

1. Build a development build:
   ```bash
   eas build --profile development --platform ios
   # or
   eas build --profile development --platform android
   ```

2. Install on your device and test the Google login flow

### On Web

The web version will continue to use your existing OAuth flow (since it doesn't have the WebView restrictions).

## Files Modified

- `app.json`: Updated scheme to `vibzworld`
- `components/PlatformWebView.tsx`: Added message handling and OAuth integration
- `utils/googleAuth.ts`: Google OAuth service using expo-auth-session
- `package.json`: Added `expo-auth-session` and `expo-crypto`

## Troubleshooting

**Error: "disallowed_useragent"**
- Make sure you're using the system browser OAuth (through `requestGoogleLogin()`)
- Verify the custom user agent is being set correctly

**Tokens not received in web app**
- Check browser console for messages
- Verify the message event listener is set up before calling `requestGoogleLogin()`

**Redirect URI mismatch**
- Ensure `vibzworld://` is added to Google Cloud Console
- Check that app.json scheme matches (`vibzworld`)
