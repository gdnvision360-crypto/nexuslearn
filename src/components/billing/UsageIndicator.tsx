"use client";

import { cn } from "@/lib/utils";

interface UsageData {
  planName: string;
  planSlug: string;
  features: Record<string, boolean>;
  limits: Record<string, { limit: number; used: number; remaining: number; percentage: number }>;
}

const LIMIT_DISPLAY: Record<string, { label: string; icon: string }> = {
  storage_gb: { label: "File Storage", icon: "HardDrive" },
  recording_storage_gb: { label: "Recording Storage", icon: "Video" },
  max_courses: { label: "Courses", icon: "BookOpen" },
  max_social_accounts: { label: "Social Accounts", icon: "Smartphone" },
  max_social_posts_monthly: { label: "Posts This Month", icon: "FileText" },
  max_users: { label: "Team Members", icon: "Users" },
  max_participants: { label: "Meeting Participants", icon: "Mic" },
  max_webinar_attendees: { label: "Webinar Attendees", icon: "Mic" },
  max_meeting_duration_min: { label: "Meeting Duration", icon: "Clock" },
};

function formatValue(key: string, value: number): string {
  if (value === -1) return "∞";
  if (key === "storage_gb" || key === "recording_storage_gb") {
    return `${value.toFixed(1)} GB`;
  }
  if (key === "max_meeting_duration_min") {
    if (value >= 60) return `${Math.floor(value / 60)}h ${value % 60}m`;
    return `${value}m`;
  }
  return value.toFixed(0);
}

function getBarColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-indigo-500";
}

function getTextColor(percentage: number): string {
  if (percentage >= 90) return "text-red-600 dark:text-red-400";
  if (percentage >= 75) return "text-amber-600 dark:text-amber-400";
  return "text-gray-600 dark:text-gray-400";
}

interface Props {
  usage: UsageData;
  detailed?: boolean;
  compact?: boolean;
}

export function UsageIndicator({ usage, detailed = false, compact = false }: Props) {
  const limitEntries = Object.entries(usage.limits).filter(([key]) => {
    const info = LIMIT_DISPLAY[key];
    if (!info) return false;
    // In compact mode, only show limits with usage
    if (compact) {
      const data = usage.limits[key];
      return data.limit !== -1 && data.limit > 0;
    }
    return true;
  });

  if (compact) {
    return (
      <div className="space-y-3">
        {limitEntries.slice(0, 4).map(([key]) => {
          const data = usage.limits[key];
          const display = LIMIT_DISPLAY[key];
          const percentage = data.limit === -1 ? 0 : Math.min(100, data.percentage);

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{display.label}</span>
                <span className={cn("font-medium", getTextColor(percentage))}>
                  {formatValue(key, data.used)} / {formatValue(key, data.limit)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn("h-full rounded-full transition-all", getBarColor(percentage))}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", detailed ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
      {limitEntries.map(([key]) => {
        const data = usage.limits[key];
        const display = LIMIT_DISPLAY[key];
        const isUnlimited = data.limit === -1;
        const percentage = isUnlimited ? 0 : Math.min(100, data.percentage);

        return (
          <div
            key={key}
            className={cn(
              "rounded-xl border border-gray-100 p-4 dark:border-gray-800",
              detailed && "p-5"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{display.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {display.label}
                </span>
              </div>
              {!isUnlimited && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    getTextColor(percentage)
                  )}
                >
                  {percentage}%
                </span>
              )}
            </div>

            <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              {isUnlimited ? (
                <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 opacity-30" />
              ) : (
                <div
                  className={cn("h-full rounded-full transition-all", getBarColor(percentage))}
                  style={{ width: `${percentage}%` }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Used: {formatValue(key, data.used)}
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {isUnlimited ? "Unlimited" : `Limit: ${formatValue(key, data.limit)}`}
              </span>
            </div>

            {detailed && !isUnlimited && (
              <p className="mt-2 text-xs text-gray-400">
                {data.remaining > 0
                  ? `${formatValue(key, data.remaining)} remaining`
                  : "Limit reached — upgrade to continue"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
