"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Check } from "lucide-react";

export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt availability
    const handler = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    window.dispatchEvent(new CustomEvent("pwa-install-trigger"));
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm">
        <Check className="w-4 h-4" />
        App Installed
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Install App</span>
      <Smartphone className="w-4 h-4 sm:hidden" />
    </button>
  );
}
