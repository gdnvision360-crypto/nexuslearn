# NexusLearn — PWA Setup & Installation Guide

## What is a PWA?

A Progressive Web App (PWA) turns your website into an installable app. Users visit your URL and click "Install" — it then appears on their home screen with its own icon, splash screen, and runs fullscreen like a native app.

**No app store needed. No extra code. Works on Android, iPhone, Windows, Mac, ChromeOS.**

---

## ✅ What's Already Built In NexusLearn

Your production codebase already includes PWA support:

| Feature | Status | File |
|---------|--------|------|
| Web App Manifest | ✅ Built | `public/manifest.json` |
| Service Worker | ✅ Built | `public/sw.js` |
| Offline caching | ✅ Built | Inside service worker |
| Meta tags | ✅ Built | `src/app/layout.tsx` |
| Responsive design | ✅ Built | All components |

---

## Step 1: Deploy Your Web App First

Before users can install the PWA, NexusLearn needs to be live on the internet with HTTPS.

### Option A: Deploy to Vercel (Easiest — Free)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to your project
cd nexuslearn-production

# 3. Deploy
vercel

# 4. Follow prompts — you'll get a URL like:
# https://nexuslearn-abc123.vercel.app
```

### Option B: Deploy to Your Own Server

Follow the `CLOUD-DEPLOY-GUIDE.md` included in your ZIP.

### Option C: Run Locally (For Testing)

```bash
cd nexuslearn-production
npm install
npx prisma generate
npm run dev
# Open http://localhost:3000
```

> ⚠️ **Important:** PWA install only works on HTTPS (or localhost for testing).

---

## Step 2: Verify Your Manifest File

Open `public/manifest.json` and ensure it looks like this:

```json
{
  "name": "NexusLearn",
  "short_name": "NexusLearn",
  "description": "Video Conferencing & Learning Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity", "business"],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "NexusLearn Dashboard"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "NexusLearn Mobile"
    }
  ],
  "shortcuts": [
    {
      "name": "New Meeting",
      "short_name": "Meet",
      "url": "/meetings/new",
      "icons": [{ "src": "/icons/meet-shortcut.png", "sizes": "96x96" }]
    },
    {
      "name": "My Courses",
      "short_name": "Courses",
      "url": "/courses",
      "icons": [{ "src": "/icons/courses-shortcut.png", "sizes": "96x96" }]
    },
    {
      "name": "Chat",
      "short_name": "Chat",
      "url": "/chat",
      "icons": [{ "src": "/icons/chat-shortcut.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## Step 3: Create App Icons

You need icons in multiple sizes. Here's how:

### Quick Method — Use an Online Generator

1. Go to [https://www.pwabuilder.com/imageGenerator](https://www.pwabuilder.com/imageGenerator)
2. Upload a **512x512 PNG** of your NexusLearn logo
3. Click **Generate** — it creates all sizes automatically
4. Download the ZIP
5. Extract icons into `public/icons/` folder

### Required Icon Sizes

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
    apple-touch-icon.png    (180x180)
    favicon.ico             (32x32)
```

> 💡 **Tip:** Use a simple, bold icon that looks good at small sizes. Avoid text in the icon.

---

## Step 4: Add Apple-Specific Meta Tags

Open `src/app/layout.tsx` and verify these tags are in the `<head>`:

```html
<!-- PWA Meta Tags (should already be there) -->
<meta name="application-name" content="NexusLearn" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="NexusLearn" />
<meta name="theme-color" content="#6366f1" />
<meta name="mobile-web-app-capable" content="yes" />

<!-- Icons -->
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />

<!-- Splash Screens for iPhone (optional but polished) -->
<link rel="apple-touch-startup-image"
  media="screen and (device-width: 430px) and (device-height: 932px)"
  href="/splash/iPhone_15_Pro_Max.png" />
<link rel="apple-touch-startup-image"
  media="screen and (device-width: 393px) and (device-height: 852px)"
  href="/splash/iPhone_15_Pro.png" />
```

---

## Step 5: Test Your PWA

### Method 1: Chrome DevTools (Desktop)

1. Open your deployed NexusLearn URL in Chrome
2. Press `F12` → DevTools
3. Go to **Application** tab
4. Click **Manifest** — verify all fields are green ✅
5. Click **Service Workers** — verify it's registered ✅
6. Click **Lighthouse** → Run audit → Check PWA score

### Method 2: PWA Builder (Online Validator)

1. Go to [https://www.pwabuilder.com](https://www.pwabuilder.com)
2. Enter your deployed URL
3. It grades your PWA and shows what's missing

---

## Step 6: Install the PWA

### 📱 On Android Phone

1. Open Chrome → go to your NexusLearn URL
2. You'll see a banner: **"Add NexusLearn to Home screen"**
3. Tap **Install**
4. NexusLearn icon appears on your home screen
5. Opens fullscreen — looks and feels like a native app!

**If no banner appears:**
- Tap the **⋮ menu** (top right)
- Tap **"Install app"** or **"Add to Home screen"**

### 🍎 On iPhone / iPad

1. Open **Safari** → go to your NexusLearn URL
2. Tap the **Share button** (box with arrow, bottom center)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add**
5. NexusLearn icon appears on your home screen

> ⚠️ **iPhone note:** PWA install ONLY works in Safari, not Chrome on iOS.

### 💻 On Desktop (Windows / Mac / ChromeOS)

1. Open Chrome → go to your NexusLearn URL
2. Look for the **install icon** (⊕) in the address bar
3. Click **Install**
4. NexusLearn opens in its own window with its own taskbar/dock icon

### 📸 What Users See

```
┌─────────────────────────────────┐
│  ┌───────┐                      │
│  │       │  NexusLearn          │
│  │  NL   │  app.nexuslearn.com  │
│  │       │                      │
│  └───────┘  [Install]  [Cancel] │
│                                 │
└─────────────────────────────────┘
```

---

## Step 7: Add an Install Prompt in Your App

Help users discover the install option with an in-app prompt:

### Create `src/components/InstallPrompt.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the browser's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
                    bg-indigo-600 text-white rounded-xl shadow-2xl p-4 z-50
                    flex items-center gap-3 animate-slide-up">
      <div className="bg-white/20 rounded-lg p-2">
        <Download className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="font-semibold">Install NexusLearn</p>
        <p className="text-sm text-indigo-100">
          Add to your home screen for the best experience
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-indigo-600 px-4 py-2 rounded-lg
                   font-semibold text-sm hover:bg-indigo-50 transition"
      >
        Install
      </button>
      <button
        onClick={() => setShowPrompt(false)}
        className="text-white/70 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### Add it to your layout:

```tsx
// In src/app/layout.tsx, inside the <body> tag:
import InstallPrompt from '@/components/InstallPrompt';

// Add before closing </body>:
<InstallPrompt />
```

---

## Step 8: Enable Push Notifications (Optional)

Let users receive meeting reminders and messages even when the app is closed:

### Create `src/lib/push-notifications.ts`

```typescript
// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    // Send subscription to your server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    return true;
  }
  return false;
}
```

### Generate VAPID Keys

```bash
# Install web-push
npm install web-push

# Generate keys
npx web-push generate-vapid-keys
```

Add the keys to your `.env`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUY...
VAPID_PRIVATE_KEY=your-private-key
```

---

## Step 9: Enable Offline Support

The service worker already caches pages. To enhance offline mode:

### Update `public/sw.js`

```javascript
const CACHE_NAME = 'nexuslearn-v1';
const OFFLINE_URL = '/offline';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install — cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'NexusLearn', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: data.url || '/' }
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

## Step 10: Create an Offline Page

### Create `src/app/offline/page.tsx`

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          You're Offline
        </h1>
        <p className="text-slate-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg
                     hover:bg-indigo-700 transition font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 📋 Quick Checklist

```
□ Step 1: Deploy NexusLearn to a server (Vercel / VPS)
□ Step 2: Verify manifest.json is correct
□ Step 3: Generate & add all icon sizes
□ Step 4: Add Apple meta tags to layout.tsx
□ Step 5: Test PWA in Chrome DevTools
□ Step 6: Install on your phone & desktop
□ Step 7: Add the InstallPrompt component
□ Step 8: Set up push notifications (optional)
□ Step 9: Update service worker for offline
□ Step 10: Create offline fallback page
```

---

## 🎯 Result

After completing these steps, NexusLearn will:

- ✅ **Install from browser** on any device (Android, iPhone, Desktop)
- ✅ **Own icon** on home screen / taskbar / dock
- ✅ **Fullscreen** — no browser UI visible
- ✅ **Push notifications** — meeting reminders, messages
- ✅ **Offline page** — graceful fallback without internet
- ✅ **Auto-update** — users always get the latest version
- ✅ **No app store fees** — free distribution

> 🏆 **This is exactly how Twitter, Starbucks, Pinterest, and Spotify do it — PWA first, native app later.**
