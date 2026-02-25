# Splash Screen Configuration

The app is now configured to use a custom splash screen image.

## 🎨 Your Custom Splash Screen Image

### Where to Put Your Image

**Location:**
```
/assets/images/splash.png
```

Place your custom splash screen image at this exact path in your project.

### Image Specifications

**Recommended Sizes:**
- **Universal (Best)**: **2048 × 2048 pixels** - Works perfectly for all devices
- **Android Optimized**: 1242 × 2436 px (portrait)
- **iOS Optimized**: 2048 × 2732 px (portrait)

**Format:**
- PNG (recommended)
- JPG also works
- Transparency supported

**Design Mode:**
- Current setting: **`cover`** - Image fills entire screen, may crop edges
- Alternative: **`contain`** - Image fits within screen, may show background color

### Design Guidelines

**Safe Area (Important!):**
- Keep logos and text in the center **80%** of the image
- Edges may be cropped on different screen sizes
- Test on both tall (18:9) and standard (16:9) aspect ratios

**Tips for Best Results:**
1. Design for the largest size (2048 × 2048 or larger)
2. Use high resolution to avoid pixelation
3. Keep important elements centered
4. Avoid thin borders (they'll be cropped)
5. Consider both light and dark themes

**Example Layout:**
```
┌────────────────────────┐
│   [may be cropped]     │
│                        │
│    ┌──────────┐        │
│    │   LOGO   │  ← Safe area
│    └──────────┘        │
│                        │
│   [may be cropped]     │
└────────────────────────┘
```

---

## Configuration Details

### Current Settings in `app.json`

```json
{
  "expo": {
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#ffffff"
    }
  }
}
```

**What This Means:**
- **image**: Path to your custom splash screen
- **resizeMode**: `cover` fills the entire screen
- **backgroundColor**: White background (shows if image has transparency)

### Splash Screen Behavior

**Timeline:**
1. App launches → Splash screen appears instantly
2. Shows for minimum 1 second while loading
3. Automatically hides when app is ready

**Code Control:**
Located in `app/_layout.tsx`:
- Prevents auto-hide on launch
- Waits for app to initialize
- Smooth transition to main content

---

## Customization Options

### Change Background Color

If your splash image has transparency or doesn't fill the screen:

```json
"splash": {
  "backgroundColor": "#000000"  // Black
  "backgroundColor": "#1a1a1a"  // Dark gray
  "backgroundColor": "#yourHexColor"
}
```

### Change Resize Mode

**Option 1: Cover (Current)**
```json
"resizeMode": "cover"
```
- Fills entire screen
- Maintains aspect ratio
- May crop edges
- No borders/gaps
- **Best for**: Full-screen designs

**Option 2: Contain**
```json
"resizeMode": "contain"
```
- Fits entirely within screen
- Shows background color around image
- No cropping
- **Best for**: Logos on solid background

**Option 3: Native**
```json
"resizeMode": "native"
```
- Uses image at exact resolution
- May not fill screen
- **Best for**: Pixel-perfect designs

### Adjust Display Duration

Edit `app/_layout.tsx` to change how long the splash shows:

```typescript
// Current: 1 second
await new Promise(resolve => setTimeout(resolve, 1000));

// 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// 500ms (faster)
await new Promise(resolve => setTimeout(resolve, 500));

// Wait for something to load
await yourLoadingFunction();
```

---

## Platform-Specific Details

### Android
- Splash screen follows Material Design guidelines
- Shows immediately on app launch
- Smooth fade transition
- Supports all screen sizes and orientations

### iOS
- Uses launch storyboard system
- Instant display on tap
- Automatic safe area handling
- Works on all iPhone/iPad models

### Web
- Uses different loading mechanism
- No native splash screen
- Can implement custom loader

---

## Testing Your Splash Screen

### Required Steps

**IMPORTANT:** Splash screen changes require a full rebuild!

1. Add your `splash.png` to `/assets/images/`
2. Rebuild your app:
   ```bash
   # For Android
   eas build --platform android

   # For iOS
   eas build --platform ios
   ```
3. Install and test the new build

### Verification Checklist

- ✅ Image displays correctly (not stretched/distorted)
- ✅ Logo/text is centered and visible
- ✅ No important elements are cropped
- ✅ Smooth transition to app
- ✅ Works in portrait and landscape
- ✅ Background color looks good (if visible)

---

## Troubleshooting

### Splash Screen Not Showing

**Problem:** Old icon still appears
**Solution:** You need to rebuild the native app. Changes to `app.json` splash settings don't apply to existing builds.

**Steps:**
1. Make sure `splash.png` exists at `/assets/images/splash.png`
2. Run a full rebuild (not just restart dev server)
3. Install the new APK/IPA

### Image Looks Stretched

**Problem:** Wrong aspect ratio or resize mode
**Solutions:**
- Use 2048 × 2048 square image
- Change `resizeMode` to `contain`
- Design image for target aspect ratio

### Parts of Image Are Cut Off

**Problem:** Using `cover` mode with important content near edges
**Solutions:**
- Keep content in center safe area
- Use `contain` mode instead
- Redesign with more padding

### Colors Look Wrong

**Problem:** Color space or format issue
**Solutions:**
- Save as RGB/RGBA PNG
- Use sRGB color profile
- Avoid CMYK color mode

### Background Color Shows Through

**Problem:** Image has transparency or doesn't fill screen
**Solutions:**
- Change `backgroundColor` to match your design
- Make image fully opaque
- Extend image design to edges

---

## Quick Reference

| Setting | Current Value | Change To |
|---------|---------------|-----------|
| **Image Path** | `./assets/images/splash.png` | Your custom path |
| **Resize Mode** | `cover` | `contain` or `native` |
| **Background** | `#ffffff` (white) | Your color |
| **Duration** | 1000ms | Any value in ms |

---

## Example: High-Quality Splash Screen

**Recipe for Professional Splash:**

1. **Create Image:**
   - Size: 2048 × 2048 px
   - Format: PNG (24-bit with alpha)
   - Place logo in center 1600 × 1600 area

2. **Export Settings:**
   - Resolution: 300 DPI minimum
   - Color: sRGB
   - Compression: PNG-8 or PNG-24

3. **File Location:**
   - Save as: `splash.png`
   - Place in: `/assets/images/`

4. **Test:**
   - Rebuild app
   - Check on different screen sizes
   - Verify on both Android and iOS

---

## Need Help?

- Splash screen changes REQUIRE a native rebuild
- The image file must exist before building
- Use high resolution images to avoid blur
- Keep critical content in the center safe area
