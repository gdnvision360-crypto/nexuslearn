'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / 86400000;
      if (daysSince < 30) return;
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
      setShowBanner(true);
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50
                    bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl
                    animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            N
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">Install NexusLearn</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Get quick access from your {platform === 'desktop' ? 'desktop' : 'home screen'}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {platform === 'ios' ? 'How to Install' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>

          {/* Close */}
          <button onClick={handleDismiss} className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-t-xl md:rounded-xl p-6 w-full md:max-w-sm mx-0 md:mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Install on {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'Desktop'}
            </h3>

            {platform === 'ios' && (
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span className="text-sm text-gray-300">
                    Tap the <span className="text-white font-medium">Share</span> button
                    <span className="inline-block ml-1">⬆️</span> in Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span className="text-sm text-gray-300">
                    Scroll down and tap <span className="text-white font-medium">&quot;Add to Home Screen&quot;</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span className="text-sm text-gray-300">
                    Tap <span className="text-white font-medium">&quot;Add&quot;</span> to confirm
                  </span>
                </li>
              </ol>
            )}

            {platform === 'android' && (
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span className="text-sm text-gray-300">
                    Tap the <span className="text-white font-medium">menu</span> (⋮) in Chrome
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span className="text-sm text-gray-300">
                    Tap <span className="text-white font-medium">&quot;Add to Home screen&quot;</span>
                  </span>
                </li>
              </ol>
            )}

            {platform === 'desktop' && (
              <p className="text-sm text-gray-300">
                Click the install icon in your browser&apos;s address bar, or use the browser menu to install this app.
              </p>
            )}

            <button
              onClick={() => { setShowInstructions(false); handleDismiss(); }}
              className="w-full mt-5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
