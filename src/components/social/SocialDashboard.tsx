"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Edit,
  Calendar,
  BarChart3,
  Zap,
  FileText,
  Link2,
  RefreshCw,
} from "lucide-react";
import { ConnectedAccounts } from "./ConnectedAccounts";
import { ComposePost } from "./ComposePost";
import { SocialCalendar } from "./SocialCalendar";
import { SocialAnalyticsPanel } from "./SocialAnalyticsPanel";
import { AutoRulesPanel } from "./AutoRulesPanel";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
  tokenStatus: string;
  postCount: number;
}

interface RecentPost {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  account: {
    platform: string;
    username: string;
  };
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "compose", label: "Compose", icon: Edit },
  { id: "scheduler", label: "Scheduler", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "auto-rules", label: "Auto-Rules", icon: Zap },
  { id: "accounts", label: "Accounts", icon: Link2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-pink-500",
  YOUTUBE: "bg-red-600",
  TIKTOK: "bg-gray-900",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-yellow-100 text-yellow-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function SocialDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    connectedAccounts: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [accountsRes, postsRes] = await Promise.all([
        fetch("/api/social/accounts"),
        fetch("/api/social/posts?limit=5"),
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setRecentPosts(postsData.posts || []);
        setStats({
          totalPosts: postsData.pagination?.total || 0,
          scheduledPosts: (postsData.posts || []).filter(
            (p: any) => p.status === "SCHEDULED"
          ).length,
          publishedPosts: (postsData.posts || []).filter(
            (p: any) => p.status === "PUBLISHED"
          ).length,
          connectedAccounts: accounts.length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500">Connected Accounts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {accounts.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500">Total Posts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalPosts}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {stats.scheduledPosts}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500">Published</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {stats.publishedPosts}
          </p>
        </div>
      </div>

      {/* Connected Accounts Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Connected Accounts
          </h3>
          <button
            onClick={() => setActiveTab("accounts")}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Manage →
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No accounts connected yet.{" "}
            <button
              onClick={() => setActiveTab("accounts")}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Connect your first account
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              >
                <span
                  className={`h-3 w-3 rounded-full ${PLATFORM_COLORS[account.platform]}`}
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  @{account.username}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    account.tokenStatus === "active"
                      ? "bg-green-500"
                      : "bg-amber-500"
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Recent Posts
          </h3>
          <button
            onClick={() => setActiveTab("compose")}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Edit className="h-3 w-3" />
            New Post
          </button>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No posts yet.{" "}
            <button
              onClick={() => setActiveTab("compose")}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Create your first post
            </button>
          </p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PLATFORM_COLORS[post.account.platform]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {post.content}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>@{post.account.username}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status] || ""}`}
                    >
                      {post.status}
                    </span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          onClick={() => setActiveTab("compose")}
          className="rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <Edit className="mx-auto h-6 w-6 text-indigo-600 mb-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Compose Post
          </span>
        </button>
        <button
          onClick={() => setActiveTab("scheduler")}
          className="rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <Calendar className="mx-auto h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            View Schedule
          </span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className="rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <BarChart3 className="mx-auto h-6 w-6 text-green-600 mb-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Analytics
          </span>
        </button>
        <button
          onClick={() => setActiveTab("auto-rules")}
          className="rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800"
        >
          <Zap className="mx-auto h-6 w-6 text-amber-600 mb-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Auto Rules
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading && activeTab === "overview" ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "compose" && (
            <ComposePost
              accounts={accounts}
              onPostCreated={fetchDashboardData}
            />
          )}
          {activeTab === "scheduler" && <SocialCalendar />}
          {activeTab === "analytics" && <SocialAnalyticsPanel />}
          {activeTab === "auto-rules" && <AutoRulesPanel />}
          {activeTab === "accounts" && <ConnectedAccounts />}
        </>
      )}
    </div>
  );
}
