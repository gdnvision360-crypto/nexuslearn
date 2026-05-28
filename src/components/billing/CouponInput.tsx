"use client";

import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  onValidCoupon: (code: string, discount: string) => void;
  onClear: () => void;
  planSlug?: string;
}

export function CouponInput({ onValidCoupon, onClear, planSlug }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    description?: string;
    error?: string;
  } | null>(null);

  async function handleValidate() {
    if (!code.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch("/api/billing/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), planSlug }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setResult({ valid: true, description: data.description });
        onValidCoupon(data.code, data.description);
      } else {
        setResult({ valid: false, error: data.error || "Invalid coupon" });
      }
    } catch {
      setResult({ valid: false, error: "Failed to validate coupon" });
    } finally {
      setValidating(false);
    }
  }

  function handleClear() {
    setCode("");
    setResult(null);
    onClear();
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (result) {
                setResult(null);
                onClear();
              }
            }}
            placeholder="Coupon code"
            className={cn(
              "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 dark:bg-gray-900",
              result?.valid
                ? "border-green-300 focus:ring-green-500"
                : result?.error
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-200 focus:ring-indigo-500 dark:border-gray-700"
            )}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />
        </div>

        {result?.valid ? (
          <button
            onClick={handleClear}
            className="rounded-lg border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleValidate}
            disabled={!code.trim() || validating}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {validating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </button>
        )}
      </div>

      {/* Result Messages */}
      {result?.valid && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>Coupon applied: {result.description}</span>
        </div>
      )}
      {result?.error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{result.error}</p>
      )}
    </div>
  );
}
