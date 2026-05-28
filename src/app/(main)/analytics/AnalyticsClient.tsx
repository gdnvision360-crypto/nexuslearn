"use client";

import {
  Users,
  Video,
  GraduationCap,
  TrendingUp,
  Download,
  Activity,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsClientProps {
  stats: {
    totalUsers: number;
    meetingsToday: number;
    courseCompletions: number;
    engagementScore: number;
    taskCompletionRate: number;
  };
  dailyMeetings: { day: string; count: number }[];
  topCourses: any[];
  recentLogs: any[];
}

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  { key: "meetingsToday", label: "Active Meetings Today", icon: Video, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  { key: "courseCompletions", label: "Course Completions", icon: GraduationCap, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10" },
  { key: "engagementScore", label: "Engagement Score", icon: TrendingUp, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
] as const;

export function AnalyticsClient({ stats, dailyMeetings, topCourses, recentLogs }: AnalyticsClientProps) {
  const maxMeetings = Math.max(...dailyMeetings.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500">Platform metrics and insights</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats[card.key]}</p>
              </div>
              <div className={cn("rounded-xl p-3", card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Meeting Activity Bar Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Meeting Activity (Last 7 Days)</h2>
          <div className="flex h-48 items-end gap-3">
            {dailyMeetings.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.count}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400 transition-all"
                  style={{ height: `${Math.max((d.count / maxMeetings) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Task Completion Rate</h2>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <svg className="h-36 w-36" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="3"
                  strokeDasharray={`${stats.taskCompletionRate}, 100`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.taskCompletionRate}%</span>
                <span className="text-xs text-gray-500">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity Heatmap */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Activity Heatmap</h2>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const intensity = Math.random();
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-sm",
                    intensity > 0.7
                      ? "bg-indigo-600"
                      : intensity > 0.4
                        ? "bg-indigo-400"
                        : intensity > 0.2
                          ? "bg-indigo-200 dark:bg-indigo-800"
                          : "bg-gray-100 dark:bg-gray-800"
                  )}
                  title={`Activity level: ${Math.round(intensity * 100)}%`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-gray-400">
            Less
            <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-3 rounded-sm bg-indigo-200 dark:bg-indigo-800" />
            <div className="h-3 w-3 rounded-sm bg-indigo-400" />
            <div className="h-3 w-3 rounded-sm bg-indigo-600" />
            More
          </div>
        </div>

        {/* Top Courses */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Top Courses by Enrollment</h2>
          <div className="space-y-3">
            {topCourses.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No courses yet</p>
            ) : (
              topCourses.map((course: any, i: number) => (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(((course._count?.enrollments ?? 0) / Math.max(topCourses[0]?._count?.enrollments ?? 1, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{course._count?.enrollments ?? 0}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                <th className="px-5 py-2">User</th>
                <th className="px-5 py-2">Action</th>
                <th className="px-5 py-2">Entity</th>
                <th className="px-5 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-5 py-2 text-sm text-gray-700 dark:text-gray-300">{log.user?.name ?? "System"}</td>
                  <td className="px-5 py-2 text-sm text-gray-500">{log.action.replace(/_/g, " ")}</td>
                  <td className="px-5 py-2 text-sm text-gray-500">{log.entityType}</td>
                  <td className="px-5 py-2 text-sm text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
