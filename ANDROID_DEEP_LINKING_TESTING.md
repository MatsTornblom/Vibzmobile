# Android Deep Linking Testing Guide

This guide provides comprehensive testing instructions for all three Android deep linking scenarios in the Vibz World mobile app.

## Prerequisites

- Android device or emulator with the app installed
- ADB (Android Debug Bridge) installed on your computer
- App installed from a development build or production build

## Quick Command Reference

```bash
# Test custom URL scheme with query parameter (PRIMARY FORMAT)
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FOrWkHfkTOx"

# Test custom URL scheme with domain path (FALLBACK FORMAT)
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://lovenote.vibz.world/OrWkHfkTOx"

# Test App Links (direct web URL)
adb shell am start -W -a android.intent.action.VIEW -d "https://lovenote.vibz.world/OrWkHfkTOx"
```

## Test Scenario 1: App Links (Android's Universal Links)

App Links allow your app to open automatically when users click web links without showing a disambiguation dialog.

### Setup Verification

1. **Verify assetlinks.json is accessible:**
   ```bash
   curl https://lovenote.vibz.world/.well-known/assetlinks.json
   ```

   Expected: Should return JSON with your package name and SHA256 fingerprint

2. **Verify App Links configuration:**
   ```bash
   adb shell dumpsys package domain-preferred-apps | grep -A 3 "world.vibz.browserapp"
   ```

### Testing App Links

#### Test 1.1: Cold Start (App Not Running)

1. **Kill the app completely:**
   ```bash
   adb shell am force-stop world.vibz.browserapp
   ```

2. **Click a web link via ADB:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://lovenote.vibz.world/OrWkHfkTOx"
   ```

3. **Expected Result:**
   - App should open directly (no browser or app chooser dialog)
   - Webview should load: `https://lovenote.vibz.world/OrWkHfkTOx`
   - Console logs should show: `[Deep Link] Direct web link from allowed domain`

#### Test 1.2: Background (App in Background)

1. **Open the app**
2. **Press home button to send app to background**
3. **Click a different web link:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://lovenote.vibz.world/AbCd1234"
   ```

4. **Expected Result:**
   - App should come to foreground
   - Webview should navigate to the new URL: `https://lovenote.vibz.world/AbCd1234`
   - Console logs should show: `[Deep Link] Received URL while app is running`

#### Test 1.3: Foreground (App Currently Active)

1. **With app open and visible**
2. **Click a web link:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://lovenote.vibz.world/XyZ9876"
   ```

3. **Expected Result:**
   - App should navigate to the new URL immediately
   - Webview should update to show: `https://lovenote.vibz.world/XyZ9876`

#### Test 1.4: From Browser

1. **Open Chrome or any browser on your Android device**
2. **Type and visit:** `https://lovenote.vibz.world/TestShare`
3. **Tap the link in the address bar or a link on the page**

4. **Expected Result:**
   - Android should show "Open with Vibz World" option or open directly
   - App should launch and display the content

### Troubleshooting App Links

**If app doesn't open automatically:**

1. Check assetlinks.json is properly formatted and accessible
2. Verify SHA256 fingerprint matches your signing certificate:
   ```bash
   # For debug builds
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For production builds (get from Google Play Console)
   # Go to: Play Console > Release > Setup > App signing > App signing key certificate
   ```

3. Reset App Links preferences:
   ```bash
   adb shell pm set-app-links --package world.vibz.browserapp 0 all
   adb shell pm verify-app-links --re-verify world.vibz.browserapp
   ```

4. Check verification status:
   ```bash
   adb shell pm get-app-links world.vibz.browserapp
   ```

---

## Test Scenario 2: Custom URL Scheme with Query Parameter

This is the **PRIMARY FORMAT** for your implementation. It allows the web app to pass the full URL as a parameter.

### Format

```
vibzworld://?url=<URL_ENCODED_WEB_URL>
```

Example:
```
vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FOrWkHfkTOx
```

### Testing Custom URL Scheme

#### Test 2.1: Cold Start (App Not Running)

1. **Kill the app:**
   ```bash
   adb shell am force-stop world.vibz.browserapp
   ```

2. **Open with custom scheme:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FOrWkHfkTOx"
   ```

3. **Expected Result:**
   - App should launch
   - Console should show: `[Deep Link] Found URL query parameter: https://lovenote.vibz.world/OrWkHfkTOx`
   - Webview should load the decoded URL: `https://lovenote.vibz.world/OrWkHfkTOx`

#### Test 2.2: Background

1. **Send app to background**
2. **Trigger custom scheme with different URL:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FNewShare123"
   ```

3. **Expected Result:**
   - App should come to foreground
   - Webview should navigate to: `https://lovenote.vibz.world/NewShare123`

#### Test 2.3: Foreground

1. **With app open**
2. **Trigger custom scheme:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FForegroundTest"
   ```

3. **Expected Result:**
   - Webview should immediately navigate to the new URL

#### Test 2.4: Different Domains

Test with all supported domains:

```bash
# Test lovenote.vibz.world
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2Ftest1"

# Test loveappneo.vibz.world
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Floveappneo.vibz.world%2Ftest2"

# Test openinapp.vibz.world
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Fopeninapp.vibz.world%2Ftest3"
```

### Testing from HTML (Web App Integration)

Create a test HTML file or add to your web app:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Deep Link Test</title>
</head>
<body>
  <h1>Test Deep Links</h1>

  <button onclick="openInApp()">Open in App</button>

  <script>
    function openInApp() {
      const currentPath = '/OrWkHfkTOx'; // Your share ID
      const fullUrl = 'https://lovenote.vibz.world' + currentPath;
      const encodedUrl = encodeURIComponent(fullUrl);
      const deepLink = 'vibzworld://?url=' + encodedUrl;

      console.log('Opening deep link:', deepLink);
      window.location.href = deepLink;
    }
  </script>
</body>
</html>
```

### Security Testing

Test that invalid URLs are rejected:

```bash
# Should be REJECTED - non-HTTPS
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=http%3A%2F%2Flovenote.vibz.world%2Ftest"

# Should be REJECTED - unauthorized domain
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=https%3A%2F%2Fmalicious-site.com%2Ftest"

# Should be REJECTED - invalid URL format
adb shell am start -W -a android.intent.action.VIEW -d "vibzworld://?url=not-a-valid-url"
```

**Expected Results:**
- Console should show warning messages
- App should not navigate to invalid URLs
- Webview should remain on current page or show default page

---

## Test Scenario 3: Deferred Deep Linking (AppsFlyer)

Deferred deep linking allows users who don't have the app installed to be directed to the correct content after installing and opening the app for the first time.

### Setup

1. **Verify AppsFlyer configuration:**
   - Dev Key is set in `utils/appsflyerConfig.ts`
   - Android package name is correct: `world.vibz.browserapp`

2. **Verify OneLink configuration in AppsFlyer dashboard:**
   - OneLink domain: `vibzworld.onelink.me`
   - deep_link_value parameter is configured

### Testing Deferred Deep Linking

#### Test 3.1: Fresh Install Flow

1. **Completely uninstall the app:**
   ```bash
   adb uninstall world.vibz.browserapp
   ```

2. **Clear browser data** (optional but recommended for clean test)

3. **Visit your web app in Chrome:**
   ```
   https://lovenote.vibz.world/OrWkHfkTOx
   ```

4. **Click "Open in App" or "Install App" button**
   - This should redirect to your AppsFlyer OneLink
   - Example: `https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=https://lovenote.vibz.world/OrWkHfkTOx`

5. **Install the app from Play Store** (or sideload your APK)

6. **Open the app for the first time**

7. **Expected Results:**
   - AppsFlyer SDK initializes
   - Console shows: `[AppsFlyer] SDK initialized successfully`
   - Console shows: `[AppsFlyer Deep Link] First launch - storing deferred deep link`
   - Console shows: `[Deep Link] Found stored deferred deep link: https://lovenote.vibz.world/OrWkHfkTOx`
   - Webview automatically loads: `https://lovenote.vibz.world/OrWkHfkTOx`

#### Test 3.2: Different OneLink Parameters

Test with different content:

1. **Uninstall app**
2. **Click OneLink with different deep_link_value:**
   ```
   https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=https://lovenote.vibz.world/DifferentShare
   ```
3. **Install and open app**
4. **Expected:** App opens to the new share URL

#### Test 3.3: OneLink with Path-Only Parameter

Test if AppsFlyer sends just a path instead of full URL:

1. **Uninstall app**
2. **Use OneLink with path only:**
   ```
   https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=/OrWkHfkTOx
   ```
3. **Install and open app**
4. **Expected:**
   - App constructs full URL: `https://lovenote.vibz.world/OrWkHfkTOx`
   - Webview loads the complete URL

### Monitoring AppsFlyer Events

Watch console logs for AppsFlyer activity:

```bash
adb logcat | grep -E "AppsFlyer|Deep Link"
```

Look for these key logs:
- `[AppsFlyer] SDK initialized successfully`
- `[AppsFlyer] onDeepLink callback triggered`
- `[AppsFlyer Deep Link] Received deep link data`
- `[AppsFlyer Deep Link] First launch - storing deferred deep link`

### Troubleshooting Deferred Deep Links

**If deferred deep link doesn't work:**

1. **Check AppsFlyer Dev Key:**
   - Verify it's correct in `utils/appsflyerConfig.ts`
   - Get it from AppsFlyer Dashboard > App Settings

2. **Check OneLink Configuration:**
   - Verify OneLink is active in AppsFlyer dashboard
   - Check deep_link_value parameter is included in the URL

3. **Test on Real Device:**
   - Deferred deep linking may not work reliably on emulators
   - Use a real Android device for testing

4. **Check Attribution Window:**
   - AppsFlyer has an attribution window (usually 24 hours)
   - Install must happen within this window after clicking the link

5. **Clear App Data Between Tests:**
   ```bash
   adb shell pm clear world.vibz.browserapp
   ```

6. **Check AppsFlyer Dashboard:**
   - Go to Dashboard > Installs
   - Verify install attribution is recorded
   - Check deep link data is captured

---

## Monitoring and Debugging

### Real-time Logs

Monitor all deep linking activity:

```bash
# Filter for deep linking logs
adb logcat | grep -E "Deep Link|AppsFlyer|Linking"

# Clear logcat and start fresh
adb logcat -c && adb logcat | grep -E "Deep Link|AppsFlyer"
```

### Console Log Checklist

For successful deep linking, you should see these logs:

**Initial URL (Cold Start):**
```
[Deep Link] Starting initial URL check on app launch
[Deep Link] Got initial URL from OS: <url>
[Deep Link] Extracting target URL from: <url>
[Deep Link] Found URL query parameter: <decoded_url>
[Deep Link] Navigating to extracted URL: <final_url>
```

**Foreground URL:**
```
[Deep Link] Received URL while app is running: <url>
[Deep Link] Extracting target URL from: <url>
[Deep Link] Navigating to extracted URL: <final_url>
```

**AppsFlyer Deferred:**
```
[AppsFlyer] SDK initialized successfully
[AppsFlyer Deep Link] First launch - storing deferred deep link: <url>
[Deep Link] Found stored deferred deep link: <url>
[Deep Link] Navigating to extracted URL: <url>
```

---

## URL Encoding Reference

When testing with ADB, remember to URL-encode the parameter:

```
https://lovenote.vibz.world/OrWkHfkTOx
         ↓ URL encode ↓
https%3A%2F%2Flovenote.vibz.world%2FOrWkHfkTOx
```

Common characters:
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`

JavaScript encoding:
```javascript
const url = 'https://lovenote.vibz.world/OrWkHfkTOx';
const encoded = encodeURIComponent(url);
// Result: https%3A%2F%2Flovenote.vibz.world%2FOrWkHfkTOx
```

---

## Success Criteria

✅ **All tests pass when:**

1. **App Links work from browser:**
   - Clicking web links opens the app directly
   - No disambiguation dialog appears
   - Correct content loads in webview

2. **Custom URL Scheme works:**
   - `vibzworld://?url=...` format is properly parsed
   - URL parameter is decoded correctly
   - Webview loads the decoded URL
   - Works in cold start, background, and foreground

3. **Deferred Deep Linking works:**
   - Fresh install after clicking OneLink navigates correctly
   - AppsFlyer attribution is recorded
   - Webview loads the intended content on first launch

4. **Security works:**
   - Non-HTTPS URLs are rejected
   - Unauthorized domains are blocked
   - Malformed URLs don't crash the app

5. **All app states work:**
   - Cold start (app not running)
   - Background (app in background)
   - Foreground (app actively in use)

---

## Integration with Web App

Your web app should implement this pattern:

```javascript
// Detect if user is on Android
const isAndroid = /Android/i.test(navigator.userAgent);

// Detect if app is installed (will fail silently if not)
function tryOpenInApp() {
  const currentUrl = window.location.href; // e.g., https://lovenote.vibz.world/OrWkHfkTOx
  const encodedUrl = encodeURIComponent(currentUrl);
  const deepLink = `vibzworld://?url=${encodedUrl}`;

  // Try to open app
  window.location.href = deepLink;

  // If app not installed, redirect to AppsFlyer OneLink after delay
  setTimeout(() => {
    const oneLinkUrl = `https://vibzworld.onelink.me/rzzM/lovenote?deep_link_value=${encodeURIComponent(currentUrl)}`;
    window.location.href = oneLinkUrl;
  }, 2000);
}

// Show "Open in App" button on Android
if (isAndroid) {
  // Display button with onclick="tryOpenInApp()"
}
```

---

## Questions or Issues?

If you encounter any issues during testing:

1. Check console logs first
2. Verify URL formats are correct
3. Ensure assetlinks.json is accessible
4. Test on a real device (not emulator) for AppsFlyer
5. Check AppsFlyer dashboard for attribution data

All deep linking flows should now work correctly on Android!
