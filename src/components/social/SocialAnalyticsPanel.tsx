"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MousePointer,
  TrendingUp,
  RefreshCw,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  totals: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    totalPosts: number;
    avgEngagementRate: number;
  };
  platformBreakdown: Record<
    string,
    { impressions: number; reach: number; engagement: number; posts: number }
  >;
  topPosts: {
    postId: string;
    content: string;
    platform: string;
    username: string;
    publishedAt: string;
    metrics: {
      impressions: number;
      likes: number;
      comments: number;
      shares: number;
      clicks: number;
      engagementRate: number;
    };
  }[];
  timeSeries: { date: string; impressions: number; engagement: number }[];
}

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "#1DA1F2",
  LINKEDIN: "#0A66C2",
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  YOUTUBE: "#FF0000",
  TIKTOK: "#000000",
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
};

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function SocialAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/social/analytics?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`
      );
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/social/analytics/refresh", { method: "POST" });
      await fetchAnalytics();
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available yet. Publish some posts to see analytics.
      </div>
    );
  }

  const maxEngagement = Math.max(
    ...data.timeSeries.map((d) => d.engagement),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Social Analytics
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            Impressions
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(data.totals.impressions)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            Reach
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(data.totals.reach)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4" />
            Total Engagement
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(
              data.totals.likes +
                data.totals.comments +
                data.totals.shares
            )}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="h-4 w-4" />
            Avg. Engagement Rate
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.totals.avgEngagementRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Engagement Over Time Chart (CSS-based) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Engagement Over Time
        </h4>
        {data.timeSeries.length > 0 ? (
          <div className="flex items-end gap-1 h-40">
            {data.timeSeries.slice(-30).map((point, i) => (
              <div
                key={i}
                className="group relative flex-1 min-w-[4px]"
                title={`${point.date}: ${point.engagement} engagements`}
              >
                <div
                  className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600 transition-colors"
                  style={{
                    height: `${(point.engagement / maxEngagement) * 100}%`,
                    minHeight: point.engagement > 0 ? "4px" : "1px",
                  }}
                />
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                  {point.date}: {point.engagement}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-8">
            No time series data available
          </p>
        )}
      </div>

      {/* Platform Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Platform Breakdown
        </h4>
        <div className="space-y-4">
          {Object.entries(data.platformBreakdown).map(([platform, metrics]) => {
            const maxImpressions = Math.max(
              ...Object.values(data.platformBreakdown).map(
                (m) => m.impressions
              ),
              1
            );
            const percentage = (metrics.impressions / maxImpressions) * 100;

            return (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {PLATFORM_NAMES[platform] || platform}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{metrics.posts} posts</span>
                    <span>{formatNumber(metrics.impressions)} impressions</span>
                    <span>{formatNumber(metrics.engagement)} engagement</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: PLATFORM_COLORS[platform] || "#6366F1",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Posts */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          Top Performing Posts
        </h4>
        <div className="space-y-3">
          {data.topPosts.length > 0 ? (
            data.topPosts.map((post, i) => (
              <div
                key={post.postId}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          PLATFORM_COLORS[post.platform] || "#6366F1",
                      }}
                    />
                    <span className="text-xs text-gray-500">
                      {PLATFORM_NAMES[post.platform]} · @{post.username}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {post.content}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(post.metrics.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {formatNumber(post.metrics.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {formatNumber(post.metrics.shares)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {formatNumber(post.metrics.clicks)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(post.metrics.impressions)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-400 py-4">
              No published posts with analytics data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
