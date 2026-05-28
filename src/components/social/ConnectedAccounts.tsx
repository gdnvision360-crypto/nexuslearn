"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  tokenStatus: string;
  postCount: number;
  createdAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-gradient-to-r from-purple-500 to-pink-500",
  YOUTUBE: "bg-red-600",
  TIKTOK: "bg-black",
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
};

const PLATFORM_ICONS: Record<string, string> = {
  TWITTER: "𝕏",
  LINKEDIN: "in",
  FACEBOOK: "f",
  INSTAGRAM: "camera",
  YOUTUBE: "play",
  TIKTOK: "music",
};

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = async (accountId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId ? { ...a, isActive: !isActive } : a
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle account:", error);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      const res = await fetch(`/api/social/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      }
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    }
  };

  const handleConnectNew = () => {
    setConnecting(true);
    // In production, this would initiate OAuth flow for selected platform
    // For now, show the available platforms
    setConnecting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Connected Accounts
          </h3>
          <p className="text-sm text-gray-500">
            Manage your social media connections
          </p>
        </div>
        <button
          onClick={handleConnectNew}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Connect Account
        </button>
      </div>

      {/* Connect New Account Panel */}
      {connecting && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-4 font-medium text-gray-900 dark:text-white">
            Choose a platform to connect
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(PLATFORM_NAMES).map(([key, name]) => (
              <button
                key={key}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-indigo-300 hover:shadow-sm transition-all dark:border-gray-600 dark:bg-gray-700"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold ${PLATFORM_COLORS[key]}`}
                >
                  {PLATFORM_ICONS[key]}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No accounts connected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your social media accounts to start sharing content
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                {/* Platform Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold ${PLATFORM_COLORS[account.platform]}`}
                >
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={account.username}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    PLATFORM_ICONS[account.platform]
                  )}
                </div>

                {/* Account Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {account.displayName || account.username}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {PLATFORM_NAMES[account.platform]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span>@{account.username}</span>
                    <span>·</span>
                    <span>{account.postCount} posts</span>
                    <span>·</span>
                    {account.tokenStatus === "active" ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        Token Expired
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAccount(account.id, account.isActive)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  title={account.isActive ? "Disable" : "Enable"}
                >
                  {account.isActive ? (
                    <ToggleRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {account.tokenStatus === "expired" && (
                  <button
                    className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                    title="Reconnect"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => disconnectAccount(account.id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  title="Disconnect"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
