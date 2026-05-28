# NexusLearn — Capacitor Native App Guide

## Convert Your Web App into iOS & Android Apps for the App Store & Play Store

> **Time:** 1–2 days | **Cost:** $25 (Google Play) + $99/year (Apple) | **Code Reuse:** 95%

---

## 🎯 What Is Capacitor?

Capacitor (by the Ionic team) wraps your existing Next.js web app inside a native shell. Your web code runs inside a native WebView, but you get:

- ✅ Listed on **App Store** and **Google Play Store**
- ✅ Native **push notifications**
- ✅ Access to **camera, microphone, GPS, contacts, file system**
- ✅ Native **splash screen** and **app icon**
- ✅ **Background execution** for calls and notifications
- ✅ **Auto-updates** — update web code without resubmitting to app stores

---

## 📋 Prerequisites

Before you start, you need:

| Requirement | Purpose | How to Get |
|-------------|---------|------------|
| **Node.js 18+** | Build tools | https://nodejs.org |
| **NexusLearn deployed** | Live URL for the app | Follow Cloud Deploy Guide |
| **Xcode 15+** (Mac only) | Build iOS app | Mac App Store (free) |
| **Android Studio** | Build Android app | https://developer.android.com/studio (free) |
| **Apple Developer Account** | Publish to App Store | https://developer.apple.com ($99/year) |
| **Google Play Console** | Publish to Play Store | https://play.google.com/console ($25 one-time) |

> ⚠️ **You need a Mac** to build the iOS app. Android can be built on any OS.

---

## PHASE 1: PROJECT SETUP (30 minutes)

### Step 1: Install Capacitor

Open your terminal in the NexusLearn project folder:

```bash
cd nexuslearn-production

# Install Capacitor core packages
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
```

When prompted:
- **App name:** `NexusLearn`
- **App ID:** `com.nexuslearn.app` (use your own domain reversed)
- **Web asset directory:** `out` (we'll configure this)

### Step 2: Configure capacitor.config.ts

Create/edit `capacitor.config.ts` in your project root:

```typescript
import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.nexuslearn.app',
  appName: 'NexusLearn',
  
  // Option A: Point to your LIVE deployed URL (recommended)
  server: {
    url: 'https://your-nexuslearn-domain.com',
    cleartext: false,  // HTTPS only
    allowNavigation: ['your-nexuslearn-domain.com'],
  },

  // Option B: Bundle static files (use 'out' directory)
  // webDir: 'out',

  // Native plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#6366f1', // NexusLearn indigo
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#6366f1',
    },
  },

  // iOS specific
  ios: {
    contentInset: 'automatic',
    scheme: 'NexusLearn',
  },

  // Android specific  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set true for debugging
  },
};

export default config;
```

### Step 3: Add Native Platforms

```bash
# Add iOS platform
npx cap add ios

# Add Android platform  
npx cap add android
```

This creates `ios/` and `android/` folders in your project.

### Step 4: Install Essential Native Plugins

```bash
# Push Notifications
npm install @capacitor/push-notifications

# Camera & Microphone (for video calls)
npm install @capacitor/camera

# File System (for file sharing)
npm install @capacitor/filesystem

# Share (native share sheet)
npm install @capacitor/share

# Status Bar
npm install @capacitor/status-bar

# Splash Screen
npm install @capacitor/splash-screen

# App (lifecycle events)
npm install @capacitor/app

# Haptics (vibration feedback)
npm install @capacitor/haptics

# Network (online/offline detection)
npm install @capacitor/network

# Local Notifications
npm install @capacitor/local-notifications

# Browser (open external links)
npm install @capacitor/browser

# Sync plugins to native projects
npx cap sync
```

---

## PHASE 2: APP ICON & SPLASH SCREEN (30 minutes)

### Step 5: Create App Assets

You need two images:

| Asset | Size | Format | Purpose |
|-------|------|--------|---------|
| **App Icon** | 1024 × 1024 px | PNG (no transparency) | App icon on home screen |
| **Splash Screen** | 2732 × 2732 px | PNG | Loading screen |

#### Generate all sizes automatically:

```bash
# Install the asset generator
npm install -g @capacitor/assets

# Place your source images:
# assets/icon-only.png        (1024x1024, app icon)
# assets/icon-foreground.png  (1024x1024, for Android adaptive icon)
# assets/icon-background.png  (1024x1024, for Android adaptive icon background)
# assets/splash.png           (2732x2732, splash screen)
# assets/splash-dark.png      (2732x2732, dark mode splash — optional)

# Generate all icon and splash screen sizes
npx capacitor-assets generate
```

This auto-generates all required sizes for both iOS and Android.

#### If you don't have images yet:

Create a `assets/` folder and I can generate a NexusLearn app icon for you — or use a simple placeholder:

```bash
mkdir -p assets
# Use any 1024x1024 PNG as icon-only.png
# Use any 2732x2732 PNG as splash.png
```

---

## PHASE 3: NATIVE CODE SETUP (45 minutes)

### Step 6: iOS Configuration

#### 6a. Open in Xcode:

```bash
npx cap open ios
```

#### 6b. Set permissions in `ios/App/App/Info.plist`:

Add these entries (Xcode → Info tab → Custom iOS Target Properties):

```xml
<!-- Camera for video calls -->
<key>NSCameraUsageDescription</key>
<string>NexusLearn needs camera access for video conferences</string>

<!-- Microphone for audio -->
<key>NSMicrophoneUsageDescription</key>
<string>NexusLearn needs microphone access for meetings</string>

<!-- Photo Library for file sharing -->
<key>NSPhotoLibraryUsageDescription</key>
<string>NexusLearn needs photo access to share files</string>

<!-- Background audio for calls -->
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>voip</string>
  <string>remote-notification</string>
</array>
```

#### 6c. Set deployment target:

In Xcode → Project → General:
- **Minimum Deployment:** iOS 14.0
- **Bundle Identifier:** com.nexuslearn.app
- **Display Name:** NexusLearn

### Step 7: Android Configuration

#### 7a. Open in Android Studio:

```bash
npx cap open android
```

#### 7b. Set permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Camera & Microphone for video calls -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- File access -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- Push notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Keep screen on during meetings -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Network state -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Vibration for haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NexusLearn"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <!-- ... existing activity config ... -->
        
    </application>
</manifest>
```

#### 7c. Set minimum SDK in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        minSdkVersion 23        // Android 6.0+
        targetSdkVersion 34     // Android 14
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## PHASE 4: NATIVE BRIDGE CODE (30 minutes)

### Step 8: Create Native Bridge Helper

Create `src/lib/capacitor-bridge.ts` in your NexusLearn project:

```typescript
import { Capacitor } from '@capacitor/core';

// Detect if running as native app
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// ---- Push Notifications ----
export async function initPushNotifications() {
  if (!isNative) return;
  
  const { PushNotifications } = await import('@capacitor/push-notifications');
  
  // Request permission
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;
  
  // Register with APNS/FCM
  await PushNotifications.register();
  
  // Get device token → send to your backend
  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // POST to /api/devices/register with token
    fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: token.value, 
        platform: platform 
      }),
    });
  });
  
  // Handle incoming notification while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
    // Show in-app notification banner
  });
  
  // Handle notification tap (app was in background)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data;
    // Navigate to relevant page
    if (data.meetingId) {
      window.location.href = `/meetings/${data.meetingId}`;
    }
  });
}

// ---- File Sharing ----
export async function shareFile(title: string, url: string) {
  if (!isNative) {
    // Web fallback
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
    return;
  }
  
  const { Share } = await import('@capacitor/share');
  await Share.share({ title, url, dialogTitle: 'Share from NexusLearn' });
}

// ---- Network Status ----
export async function watchNetwork(callback: (connected: boolean) => void) {
  if (!isNative) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
    return;
  }
  
  const { Network } = await import('@capacitor/network');
  Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
}

// ---- Status Bar ----
export async function configureStatusBar() {
  if (!isNative) return;
  
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#6366f1' });
}

// ---- Haptics ----
export async function vibrate() {
  if (!isNative) return;
  
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

// ---- App Lifecycle ----
export async function initAppLifecycle() {
  if (!isNative) return;
  
  const { App } = await import('@capacitor/app');
  
  // Handle back button (Android)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
  
  // Handle app going to background/foreground
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // Reconnect WebSocket, refresh data
      console.log('App resumed');
    } else {
      // Save state, pause non-essential operations
      console.log('App backgrounded');
    }
  });
}
```

### Step 9: Initialize in Your App

Add to `src/app/layout.tsx` or `src/app/providers.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { 
  isNative, 
  initPushNotifications, 
  configureStatusBar, 
  initAppLifecycle 
} from '@/lib/capacitor-bridge';

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isNative) {
      initPushNotifications();
      configureStatusBar();
      initAppLifecycle();
    }
  }, []);

  return <>{children}</>;
}
```

---

## PHASE 5: BUILD & TEST (1 hour)

### Step 10: Build Your Web App

```bash
# Build the Next.js app
npm run build

# Sync to native projects
npx cap sync
```

### Step 11: Test on Simulators

#### iOS Simulator:
```bash
# Run on iOS simulator
npx cap run ios

# Or open in Xcode and press ▶️ (Play)
npx cap open ios
```

#### Android Emulator:
```bash
# Run on Android emulator
npx cap run android

# Or open in Android Studio and press ▶️ (Play)
npx cap open android
```

### Step 12: Test on Real Devices

#### iOS (real iPhone):
1. Connect iPhone via USB
2. In Xcode → Select your iPhone as target
3. **Trust the developer** on your iPhone: Settings → General → VPN & Device Management
4. Click ▶️ to run

#### Android (real phone):
1. Enable **Developer Options**: Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**: Settings → Developer Options → USB Debugging
3. Connect phone via USB
4. In Android Studio → Select your phone → Click ▶️

### Step 13: Test Checklist

| Feature | Test on iOS | Test on Android |
|---------|-------------|-----------------|
| App opens and loads | ☐ | ☐ |
| Login/signup works | ☐ | ☐ |
| Video calls work (camera + mic) | ☐ | ☐ |
| Push notifications arrive | ☐ | ☐ |
| File upload/download works | ☐ | ☐ |
| Screen sharing works | ☐ | ☐ |
| Chat messages send/receive | ☐ | ☐ |
| Navigation & back button | ☐ | ☐ |
| App icon & splash screen | ☐ | ☐ |
| Offline → shows fallback | ☐ | ☐ |

---

## PHASE 6: PUBLISH TO APP STORES (2–4 hours + review time)

### Step 14: Build Release Versions

#### iOS Release Build:
1. In Xcode → Product → Archive
2. Window → Organizer → Select archive
3. Click "Distribute App"
4. Choose "App Store Connect"
5. Follow the wizard to upload

#### Android Release Build:
```bash
# Generate a signing key (one time only — SAVE THIS!)
keytool -genkey -v -keystore nexuslearn-release.keystore \
  -alias nexuslearn -keyalg RSA -keysize 2048 -validity 10000

# ⚠️ SAVE the keystore file and password! You need them for ALL future updates.
```

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle"
3. Select your keystore
4. Build type: Release
5. Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 15: Submit to Apple App Store

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"+"** → New App
3. Fill in:

| Field | Value |
|-------|-------|
| **Name** | NexusLearn |
| **Primary Language** | English |
| **Bundle ID** | com.nexuslearn.app |
| **SKU** | nexuslearn-001 |
| **Category** | Education / Business |

4. Upload **screenshots** (required sizes):
   - iPhone 6.7" (1290 × 2796 px) — at least 3
   - iPhone 6.5" (1284 × 2778 px)
   - iPad 12.9" (2048 × 2732 px) — if supporting iPad

5. Write **description** and **keywords**
6. Set **pricing** (Free or Paid)
7. Upload the build from Xcode Organizer
8. Submit for **Review** (takes 1–3 days)

### Step 16: Submit to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create Application → Enter details
3. Fill in:

| Section | What to Do |
|---------|------------|
| **Store Listing** | App name, description, screenshots |
| **Screenshots** | Phone (min 2), Tablet (min 1), 7" tablet |
| **Content Rating** | Complete the questionnaire |
| **Pricing** | Free or Paid |
| **App Content** | Privacy policy URL, ads declaration |
| **Target Audience** | Select age group |

4. Upload the `.aab` file to **Production** track
5. Submit for **Review** (takes a few hours to 7 days)

---

## PHASE 7: ONGOING UPDATES

### Step 17: How to Push Updates

The beauty of Capacitor with a **live URL** (server mode): 

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Web code changes?     → Deploy to server        │
│  (UI, features, bugs)    No app store update!    │
│                          Users get it instantly.  │
│                                                  │
│  Native code changes?  → Rebuild + resubmit      │
│  (new plugins, icons)    App store review needed  │
│                                                  │
└──────────────────────────────────────────────────┘
```

```bash
# For web-only updates (most updates):
# Just deploy to your server — done! Users get updates instantly.

# For native updates (rare):
npm run build
npx cap sync
# Then build and submit through Xcode / Android Studio
```

### Step 18: Set Up CI/CD (Optional — Advanced)

Automate builds with **Fastlane**:

```bash
# Install Fastlane
gem install fastlane

# iOS auto-build & upload
cd ios/App
fastlane init
fastlane release  # Builds + uploads to App Store Connect

# Android auto-build & upload
cd android
fastlane init
fastlane release  # Builds + uploads to Google Play
```

---

## 💰 Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Account | $99 | Per year |
| Google Play Console | $25 | One-time |
| Capacitor | Free | Open source |
| All plugins used | Free | Open source |
| **Total Year 1** | **$124** | — |
| **Total Year 2+** | **$99** | — |

---

## 📁 Final Project Structure

```
nexuslearn-production/
├── src/                          # Your existing web app code
│   ├── lib/
│   │   └── capacitor-bridge.ts   # ← NEW: Native bridge helper
│   └── app/
│       └── providers.tsx         # ← UPDATED: Initialize native features
├── ios/                          # ← NEW: iOS native project
│   └── App/
│       ├── App/
│       │   ├── Info.plist        # iOS permissions
│       │   └── Assets.xcassets/  # App icons
│       └── Podfile               # iOS dependencies
├── android/                      # ← NEW: Android native project
│   └── app/
│       ├── src/main/
│       │   ├── AndroidManifest.xml  # Android permissions
│       │   └── res/              # App icons & splash
│       └── build.gradle          # Android build config
├── capacitor.config.ts           # ← NEW: Capacitor configuration
├── assets/                       # ← NEW: Source icon & splash images
│   ├── icon-only.png
│   └── splash.png
└── package.json                  # Updated with Capacitor deps
```

---

## ✅ Quick Reference — Commands Cheat Sheet

```bash
# Setup (one time)
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android

# Daily development
npm run build && npx cap sync    # Sync web changes to native
npx cap run ios                  # Test on iOS simulator
npx cap run android              # Test on Android emulator
npx cap open ios                 # Open in Xcode
npx cap open android             # Open in Android Studio

# Publishing
# iOS: Xcode → Product → Archive → Distribute
# Android: Android Studio → Build → Generate Signed Bundle
```

---

> 🎉 **That's it!** Your NexusLearn web app is now a native app on both app stores — with 95% code reuse and instant web updates!
