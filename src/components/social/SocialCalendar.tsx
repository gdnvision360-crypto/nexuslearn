"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface CalendarPost {
  id: string;
  content: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  account: {
    id: string;
    platform: string;
    username: string;
    displayName?: string;
  };
}

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-pink-500",
  YOUTUBE: "bg-red-600",
  TIKTOK: "bg-gray-900",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Edit className="h-3 w-3 text-gray-400" />,
  SCHEDULED: <Clock className="h-3 w-3 text-blue-500" />,
  PUBLISHED: <CheckCircle className="h-3 w-3 text-green-500" />,
  FAILED: <XCircle className="h-3 w-3 text-red-500" />,
  CANCELLED: <AlertCircle className="h-3 w-3 text-gray-400" />,
};

export function SocialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [view, setView] = useState<"month" | "week">("month");

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const res = await fetch(
        `/api/social/scheduler?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&view=${view}`
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month's trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month's leading days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return posts.filter((post) => {
      const postDate = (
        post.scheduledAt || post.publishedAt || post.createdAt
      ).split("T")[0];
      return postDate === dateStr;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/social/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthName}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-xs font-medium ${
                view === "month"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-medium ${
                view === "week"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Week
            </button>
          </div>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayPosts = getPostsForDate(day.date);
            return (
              <div
                key={index}
                className={`min-h-[100px] border-b border-r border-gray-100 p-2 dark:border-gray-700 ${
                  !day.isCurrentMonth ? "bg-gray-50 dark:bg-gray-800/50" : ""
                } ${isToday(day.date) ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday(day.date)
                      ? "bg-indigo-600 text-white font-bold"
                      : day.isCurrentMonth
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-400"
                  }`}
                >
                  {day.date.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${PLATFORM_COLORS[post.account.platform]}`}
                      />
                      <span className="truncate text-xs text-gray-700 dark:text-gray-300">
                        {post.content.slice(0, 30)}
                      </span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-xs text-gray-400 pl-1">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Post Detail */}
      {selectedPost && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`inline-block h-3 w-3 rounded-full ${PLATFORM_COLORS[selectedPost.account.platform]}`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {selectedPost.account.displayName || selectedPost.account.username}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    {STATUS_ICONS[selectedPost.status]}
                    {selectedPost.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {selectedPost.content}
                </p>
                {selectedPost.scheduledAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    Scheduled: {new Date(selectedPost.scheduledAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {["DRAFT", "SCHEDULED"].includes(selectedPost.status) && (
                <button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
          <span key={platform} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
            {platform}
          </span>
        ))}
      </div>
    </div>
  );
}
