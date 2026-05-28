"use client";

import { AlertTriangle } from "lucide-react";

interface PlatformPreviewProps {
  platform: string;
  content: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  mediaUrls?: string[];
}

const CHAR_LIMITS: Record<string, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  FACEBOOK: 63206,
  INSTAGRAM: 2200,
  YOUTUBE: 5000,
  TIKTOK: 2200,
};

export function PlatformPreview({
  platform,
  content,
  username,
  displayName,
  avatarUrl,
  mediaUrls = [],
}: PlatformPreviewProps) {
  const maxLength = CHAR_LIMITS[platform] || 5000;
  const isOverLimit = content.length > maxLength;
  const percentage = Math.min((content.length / maxLength) * 100, 100);

  const renderTwitterPreview = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-sky-100 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full" />
          ) : (
            <span className="text-sm font-bold text-sky-600">
              {(displayName || username)?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              {displayName || username}
            </span>
            <span className="text-sm text-gray-500">@{username}</span>
          </div>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {content.slice(0, 280)}
          </p>
          {mediaUrls.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:bg-gray-700">
              📷 {mediaUrls.length} media attachment{mediaUrls.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLinkedInPreview = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full" />
          ) : (
            <span className="text-sm font-bold text-blue-700">
              {(displayName || username)?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {displayName || username}
          </span>
          <p className="text-xs text-gray-500">Just now · 🌐</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
        {content.slice(0, 3000)}
      </p>
      {mediaUrls.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:bg-gray-700">
          📷 {mediaUrls.length} media attachment{mediaUrls.length > 1 ? "s" : ""}
        </div>
      )}
      <div className="mt-3 flex items-center gap-6 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>🔄 Repost</span>
        <span>📨 Send</span>
      </div>
    </div>
  );

  const renderFacebookPreview = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full" />
          ) : (
            <span className="text-sm font-bold text-blue-600">
              {(displayName || username)?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {displayName || username}
          </span>
          <p className="text-xs text-gray-500">Just now · 🌐</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
        {content.slice(0, 500)}{content.length > 500 ? "... See more" : ""}
      </p>
      {mediaUrls.length > 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400 dark:border-gray-600 dark:bg-gray-700">
          📷 {mediaUrls.length} media attachment{mediaUrls.length > 1 ? "s" : ""}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  );

  const renderGenericPreview = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex gap-3 items-center mb-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">
            {(displayName || username)?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {displayName || username}
          </span>
          <p className="text-xs text-gray-500">@{username}</p>
        </div>
      </div>
      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
        {content}
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {platform} Preview
        </h4>
        <div className="flex items-center gap-2">
          {isOverLimit && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              isOverLimit ? "text-red-500" : content.length > maxLength * 0.9 ? "text-amber-500" : "text-gray-400"
            }`}
          >
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* Character limit bar */}
      <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-1 rounded-full transition-all ${
            isOverLimit ? "bg-red-500" : percentage > 90 ? "bg-amber-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Platform-specific preview */}
      {platform === "TWITTER" && renderTwitterPreview()}
      {platform === "LINKEDIN" && renderLinkedInPreview()}
      {platform === "FACEBOOK" && renderFacebookPreview()}
      {!["TWITTER", "LINKEDIN", "FACEBOOK"].includes(platform) && renderGenericPreview()}
    </div>
  );
}
