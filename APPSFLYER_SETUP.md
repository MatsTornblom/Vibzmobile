# AppsFlyer Setup Guide

This guide explains how to configure and use AppsFlyer for deferred deep linking in your Vibz World app.

## Overview

AppsFlyer is integrated to handle **deferred deep linking** - when users click a link without the app installed, install the app, and are automatically taken to the specific content (like a love note).

### How It Works

1. **User clicks link in web browser** (app not installed)
2. **Web app shows banner**: "Open in App" or "Continue in Browser"
3. **User clicks "Open in App"** → Web app redirects to AppsFlyer OneLink
4. **AppsFlyer OneLink** → Takes user to App Store/Play Store
5. **User installs and opens app**
6. **App retrieves deferred deep link** from AppsFlyer SDK
7. **App automatically navigates** to the specific love note

## Configuration Steps

### 1. Get Your AppsFlyer Credentials

You need three values from your AppsFlyer dashboard:

1. **Dev Key**: Found in AppsFlyer Dashboard → Settings → App Settings
2. **Apple App ID**: Your iOS app ID (format: `id123456789`)
3. **Android Package Name**: Already set to `world.vibz.browserapp`

### 2. Update Configuration File

Edit `/utils/appsflyerConfig.ts` and replace the placeholder values:

```typescript
const APPSFLYER_DEV_KEY = 'YOUR_APPSFLYER_DEV_KEY'; // Replace with your actual dev key
const APPLE_APP_ID = 'YOUR_APPLE_APP_ID'; // Replace with your Apple app ID (e.g., 'id123456789')
```

### 3. Create OneLink in AppsFlyer Dashboard

1. Go to AppsFlyer Dashboard → OneLink
2. Create a new OneLink
3. Set the subdomain to: `vibzworld` (creates `vibzworld.onelink.me`)
4. Configure the link template ID (you'll get something like `rzzM`)

Your OneLink URL format will be:
```
https://vibzworld.onelink.me/[LINK_ID]/[ALIAS]
```

## OneLink URL Structure for Web App

### Basic Format

When constructing OneLink URLs from your web app, use this structure:

```
https://vibzworld.onelink.me/[LINK_ID]/[ALIAS]?deep_link_value=[PATH]
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `deep_link_value` | Yes | The path to the love note | `/OrWkHfkTOx` |
| `campaign` | No | Campaign name for tracking | `share_button` |
| `media_source` | No | Traffic source | `web_app` |

### Example OneLink URLs

**Simple love note link:**
```
https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=/OrWkHfkTOx
```

**With tracking parameters:**
```
https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=/OrWkHfkTOx&campaign=user_share&media_source=web_banner
```

**With full URL:**
```
https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=https://lovenote.vibz.world/OrWkHfkTOx
```

## Web App Integration

### Smart Banner Implementation

In your web app, add a banner that detects mobile devices and shows install/open options:

```javascript
// Detect if user is on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Show banner with two options:
  // 1. "Open in App" button
  // 2. "Continue in Browser" button
}
```

### "Open in App" Button Logic

When user clicks "Open in App":

```javascript
function handleOpenInApp() {
  const currentPath = window.location.pathname; // e.g., "/OrWkHfkTOx"

  // Try to open app directly using custom scheme
  window.location = `vibzworld://lovenote.vibz.world${currentPath}`;

  // If app not installed, redirect to OneLink after 2 seconds
  setTimeout(() => {
    const oneLinkUrl = `https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=${currentPath}`;
    window.location = oneLinkUrl;
  }, 2000);
}
```

### Helper Function for Web App

```javascript
/**
 * Generates AppsFlyer OneLink URL with deep link parameter
 * @param {string} path - The love note path (e.g., "/OrWkHfkTOx")
 * @param {object} options - Optional tracking parameters
 * @returns {string} Complete OneLink URL
 */
function generateOneLink(path, options = {}) {
  const baseUrl = 'https://vibzworld.onelink.me/rzzM/lovenote';
  const params = new URLSearchParams({
    deep_link_value: path,
    ...options
  });

  return `${baseUrl}?${params.toString()}`;
}

// Usage example:
const oneLinkUrl = generateOneLink('/OrWkHfkTOx', {
  campaign: 'user_share',
  media_source: 'web_app'
});
```

## Native App Flow

The native app automatically handles deferred deep links:

1. **On first launch after install**: AppsFlyer SDK checks for deferred deep link
2. **If deferred link exists**: Extracts `deep_link_value` parameter
3. **Constructs full URL**: Adds `https://lovenote.vibz.world` if needed
4. **Navigates automatically**: Opens the WebView with the love note

## Testing

### Test Direct Deep Links (App Installed)

1. Install the app on your device
2. Click: `https://lovenote.vibz.world/OrWkHfkTOx`
3. App should open directly (bypasses AppsFlyer)
4. Love note should display correctly

### Test Deferred Deep Links (App Not Installed)

1. **Uninstall the app** from your test device
2. **Clear browser data** to ensure fresh state
3. Open web browser and go to: `https://lovenote.vibz.world/OrWkHfkTOx`
4. Click the "Open in App" button in the smart banner
5. You'll be redirected to OneLink → App Store/Play Store
6. **Install the app**
7. **Open the app** for the first time
8. App should automatically navigate to the love note `/OrWkHfkTOx`

### Test Multiple Installs

1. Uninstall app
2. Click a different love note link: `https://lovenote.vibz.world/AbCd1234`
3. Install and open
4. Should navigate to the new love note automatically

### Debugging

Enable development logs by keeping `__DEV__` mode on:

```typescript
// In appsflyerConfig.ts
isDebug: __DEV__, // Enables AppsFlyer logs
```

Look for these console logs:

- `[AppsFlyer] SDK initialized successfully`
- `[AppsFlyer Deep Link] Received deep link data`
- `[Deep Link] Processing deferred deep link from AppsFlyer`
- `[Deep Link] Navigating to deferred deep link URL`

## Important Notes

### When AppsFlyer is Used

- **Only for deferred deep links** (first install attribution)
- **Not used** when app is already installed
- **Not involved** in direct OS-level deep linking

### When OS Deep Linking is Used

- **Always used** when app is installed
- **Takes precedence** over AppsFlyer for installed users
- **Configured via** Universal Links (iOS) and App Links (Android)

### Data Flow

```
User Without App:
Web → OneLink → App Store → Install → Open App → AppsFlyer SDK → Navigate

User With App:
Web → OS Deep Link → Open App → Navigate (AppsFlyer not involved)
```

## Troubleshooting

### Deferred Deep Link Not Working

1. Check AppsFlyer dev key is correct
2. Verify OneLink is properly configured in dashboard
3. Ensure `deep_link_value` parameter is included in OneLink URL
4. Test on real device (simulators may not work correctly)
5. Make sure it's truly the first install (uninstall and clear data)

### App Opens But Doesn't Navigate

1. Check console logs for deferred deep link retrieval
2. Verify the `deep_link_value` format matches your expected paths
3. Ensure URL construction logic handles both `/path` and full URLs
4. Test AsyncStorage is working correctly

### OneLink Redirects to Wrong Store

1. Verify OneLink configuration in AppsFlyer dashboard
2. Check fallback URLs are set correctly for iOS and Android
3. Ensure bundle identifiers match: iOS (`com.example.browserapp`) and Android (`world.vibz.browserapp`)

## Security Considerations

- **Never expose** AppsFlyer dev key in client-side web code
- **Validate** deep link values before navigation
- **Sanitize** URL parameters to prevent injection attacks
- **Use HTTPS** for all OneLink URLs

## Next Steps

After setup is complete:

1. Test on both iOS and Android devices
2. Monitor AppsFlyer dashboard for attribution data
3. Optimize OneLink parameters based on analytics
4. Consider adding campaign tracking for marketing campaigns
