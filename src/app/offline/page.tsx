"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Signal } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      window.location.href = "/dashboard";
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.href = "/dashboard";
      } else {
        setChecking(false);
      }
    }, 2000);
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Signal className="w-16 h-16 text-green-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Connection Restored!</h1>
          <p className="text-slate-400">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          You&apos;re Offline
        </h1>

        <p className="text-slate-400 mb-8 leading-relaxed">
          NexusLearn needs an internet connection for video calls, chat, and
          course content. Check your connection and try again.
        </p>

        <button
          onClick={handleRetry}
          disabled={checking}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Try Again"}
        </button>

        <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-slate-400">Waiting for connection...</span>
          </div>
          <ul className="text-left text-sm text-slate-500 space-y-2">
            <li>• Check your Wi-Fi or mobile data</li>
            <li>• Try moving closer to your router</li>
            <li>• Restart your browser if needed</li>
            <li>• Cached content may still be available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
