# Testing Push Notifications - Complete Guide

This guide explains how to test all three scenarios for push notification token and permission handling.

## 📱 Log Labels Reference

All console logs use emoji prefixes to make them easy to spot:

- 🚀 = Initialization/Starting
- ✅ = Success/Granted
- ❌ = Denied/Revoked
- 📤 = Sending to web app
- 📥 = Receiving from web app
- 🔄 = Update/Change detected
- 📋 = Status check
- 🔔 = Notification permission request
- 📝 = User response
- 🎫 = Token generated
- 🔍 = Recheck/Inspection
- 📱 = App state change
- 👆 = Notification tapped
- ⚠️ = Warning/Not available

## 🧪 Test Scenarios

### SCENARIO 1: App Starts - User Chooses Allow/Deny

**When it happens:** First time app launches or after reinstalling

**Expected logs:**

#### If user chooses ALLOW:
```
[useNotifications] 🚀 Hook initialized - registering for push notifications
[useNotifications] 📋 Current permission status: undetermined
[useNotifications] 🔔 Requesting notification permissions from user...
[useNotifications] 📝 User response: granted
[useNotifications] ✅ SCENARIO 1: User GRANTED permission - getting token
[useNotifications] 🎫 Token generated: ExpoToken[xxxxx...]
[useNotifications] ✅ Initial token received: ExpoToken[xxxxx...]
[RootLayout] 🔄 Context state updated: { pushToken: 'ExpoToken[...]', permissionStatus: 'granted' }
[PlatformWebView] 📤 Sending token update to web app: { token: 'ExpoToken[...]', permissionStatus: 'granted' }
[PlatformWebView] ✅ Message sent via postMessage
```

#### If user chooses DENY:
```
[useNotifications] 🚀 Hook initialized - registering for push notifications
[useNotifications] 📋 Current permission status: undetermined
[useNotifications] 🔔 Requesting notification permissions from user...
[useNotifications] 📝 User response: denied
[useNotifications] ❌ SCENARIO 1: User DENIED permission - setting status to "denied"
[useNotifications] ⚠️ No token received during initial registration
[RootLayout] 🔄 Context state updated: { pushToken: null, permissionStatus: 'denied' }
[PlatformWebView] 📤 Sending token update to web app: { token: null, permissionStatus: 'denied' }
[PlatformWebView] ✅ Message sent via postMessage
```

**How to test:**
1. Uninstall the app completely
2. Reinstall and launch
3. When permission prompt appears, tap "Allow" or "Don't Allow"
4. Check console logs

---

### SCENARIO 2: User Changes Settings in OS Settings Menu

**When it happens:** User goes to iOS Settings → Your App → Notifications and toggles permissions

**Expected logs:**

#### When user ENABLES notifications:
```
[useNotifications] 📱 App came to foreground - rechecking permissions
[useNotifications] 🔍 Recheck - Previous: denied → Current: granted
[useNotifications] 🔄 Permission status CHANGED!
[useNotifications] ✅ SCENARIO 2: User RE-ENABLED notifications in settings - getting token
[useNotifications] 🎫 New token generated: ExpoToken[xxxxx...]
[RootLayout] 🔄 Context state updated: { pushToken: 'ExpoToken[...]', permissionStatus: 'granted' }
[PlatformWebView] 📤 Sending token update to web app: { token: 'ExpoToken[...]', permissionStatus: 'granted' }
[PlatformWebView] ✅ Message sent via postMessage
```

#### When user DISABLES notifications:
```
[useNotifications] 📱 App came to foreground - rechecking permissions
[useNotifications] 🔍 Recheck - Previous: granted → Current: denied
[useNotifications] 🔄 Permission status CHANGED!
[useNotifications] ❌ SCENARIO 2: User DISABLED notifications in settings - clearing token
[RootLayout] 🔄 Context state updated: { pushToken: null, permissionStatus: 'denied' }
[PlatformWebView] 📤 Sending token update to web app: { token: null, permissionStatus: 'denied' }
[PlatformWebView] ✅ Message sent via postMessage
```

**How to test:**
1. Open your app (ensure notifications are enabled or disabled)
2. Minimize the app
3. Go to iOS Settings → Your App → Notifications
4. Toggle "Allow Notifications" on/off
5. Return to your app
6. Check console logs

---

### SCENARIO 3: Web App Requests Token (After Login)

**When it happens:** Web app calls `window.ReactNativeWebView.postMessage({ type: 'requestPushToken' })` after user logs in

**Expected logs:**
```
[PlatformWebView] 📥 Web app requested token (likely after login)
[PlatformWebView] 📤 Sending current token: { token: 'ExpoToken[...]', permissionStatus: 'granted' }
[PlatformWebView] ✅ Message sent via postMessage
```

**How to test:**
1. Launch the app
2. Log into your web app
3. Web app should automatically request token
4. Check console logs

**Note:** Token is NOT sent when WebView first loads (when user is not logged in). Token is only sent when explicitly requested by the web app after login.

---

## 🌐 Web App Side (What you should see in your web app)

Your web app should receive messages with this structure:

```javascript
{
  type: 'pushToken',
  token: 'ExpoToken[xxxxx...]' | null,
  permissionStatus: 'granted' | 'denied' | 'unavailable' | 'unknown',
  timestamp: '2025-11-03T12:34:56.789Z'
}
```

### Web App Logging Example

Add this to your web app to verify:

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'pushToken') {
    console.log('📥 [Web App] Received push token:', {
      token: event.data.token,
      permissionStatus: event.data.permissionStatus,
      timestamp: event.data.timestamp
    });

    if (event.data.permissionStatus === 'denied') {
      console.log('🗑️ [Web App] User denied - should DELETE token from database');
    } else if (event.data.permissionStatus === 'granted') {
      console.log('💾 [Web App] User granted - should SAVE token to database');
    }
  }
});
```

---

## ✅ Complete Test Checklist

- [ ] **Scenario 1a:** Fresh install → Allow notifications → Check logs
- [ ] **Scenario 1b:** Fresh install → Deny notifications → Check logs
- [ ] **Scenario 2a:** Disabled → Enable in Settings → Return to app → Check logs
- [ ] **Scenario 2b:** Enabled → Disable in Settings → Return to app → Check logs
- [ ] **Scenario 3:** App loads → Login to web app → Token requested → Check logs

---

## 🐛 Troubleshooting

### No logs appearing?
- Check if you're running on a real device (simulator won't work)
- Ensure you have React Native debugger or Expo Go connected
- Check both native logs and web app console

### Token is always null?
- Verify EAS project ID is configured in `app.json`
- Check if running on simulator (notifications don't work on simulators)
- Ensure FCM/APNs is properly configured for production

### Permission status stuck on 'unknown'?
- This is the initial state before any permission request
- Should change to 'granted' or 'denied' after user responds
- If stuck, try reinstalling the app

---

## 📊 Log Summary Quick Reference

| Scenario | When | Key Logs |
|----------|------|----------|
| 1 | App first launch | `SCENARIO 1: User GRANTED/DENIED` |
| 2 | Settings changed | `SCENARIO 2: User RE-ENABLED/DISABLED` |
| 3 | After web app login | `Web app requested token` |
