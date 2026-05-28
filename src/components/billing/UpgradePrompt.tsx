"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  type?: "modal" | "banner" | "inline";
  title?: string;
  message: string;
  feature?: string;
  limitKey?: string;
  limitValue?: number;
  onDismiss?: () => void;
  className?: string;
}

export function UpgradePrompt({
  type = "banner",
  title,
  message,
  feature,
  limitKey,
  limitValue,
  onDismiss,
  className,
}: UpgradePromptProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  function handleUpgrade() {
    router.push("/pricing");
  }

  if (type === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20",
          className
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-sm text-amber-700 dark:text-amber-300">{message}</p>
        <button
          onClick={handleUpgrade}
          className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Upgrade
        </button>
      </div>
    );
  }

  if (type === "banner") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 dark:border-indigo-800 dark:from-indigo-900/20 dark:to-purple-900/20",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {title || "Upgrade Your Plan"}
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</p>
            <button
              onClick={handleUpgrade}
              className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Upgrade Now
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {title || "You've Reached Your Limit"}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>

        {limitValue !== undefined && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <p className="text-xs text-gray-500">Current limit: <strong>{limitValue}</strong></p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
