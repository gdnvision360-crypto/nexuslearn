"use client";

import { cn } from "@/lib/utils";

const PLAN_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  free: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    label: "Free",
  },
  pro: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-400",
    label: "Pro",
  },
  enterprise: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    label: "Enterprise",
  },
};

interface PlanBadgeProps {
  plan: string;
  size?: "sm" | "md";
  className?: string;
}

export function PlanBadge({ plan, size = "sm", className }: PlanBadgeProps) {
  const style = PLAN_STYLES[plan] || PLAN_STYLES.free;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        style.bg,
        style.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {style.label}
    </span>
  );
}
