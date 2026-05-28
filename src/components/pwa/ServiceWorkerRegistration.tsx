"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker after page load
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered:", registration.scope);

            // Check for updates every 60 minutes
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Handle updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (!newWorker) return;

              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "activated" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available - show refresh prompt
                  if (
                    window.confirm(
                      "A new version of NexusLearn is available. Reload to update?"
                    )
                  ) {
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch((error) => {
            console.log("SW registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}

export function PWAInstallPrompt() {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      // Store for later use - components can dispatch custom event to trigger install
      window.addEventListener("pwa-install-trigger", () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choice) => {
            if (choice.outcome === "accepted") {
              console.log("PWA installed");
            }
            deferredPrompt = null;
          });
        }
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}
