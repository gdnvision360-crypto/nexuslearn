"use client";

import Link from "next/link";
import {
  Video,
  MessageSquare,
  CheckSquare,
  GraduationCap,
  Plus,
  Users,
  FileText,
  ArrowRight,
  Clock,
  Zap,
  Calendar,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface DashboardProps {
  userName: string;
  greeting: string;
  stats: {
    activeMeetings: number;
    unreadMessages: number;
    pendingTasks: number;
    courseProgress: number;
  };
  upcomingMeetings: any[];
  enrollments: any[];
  recentActivity: any[];
}

const statCards = [
  { key: "activeMeetings", label: "Active Meetings", icon: Video, color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  { key: "unreadMessages", label: "Unread Messages", icon: MessageSquare, color: "text-green-600 bg-green-50 dark:bg-green-500/10" },
  { key: "pendingTasks", label: "Pending Tasks", icon: CheckSquare, color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
  { key: "courseProgress", label: "Avg. Course Progress", icon: GraduationCap, color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10", suffix: "%" },
] as const;

const quickActions = [
  { label: "Start Meeting", href: "/meetings?action=start", icon: Video, color: "bg-blue-600 hover:bg-blue-700" },
  { label: "Join Meeting", href: "/meetings?action=join", icon: Users, color: "bg-indigo-600 hover:bg-indigo-700" },
  { label: "New Document", href: "/docs?action=create", icon: FileText, color: "bg-green-600 hover:bg-green-700" },
  { label: "Create Task", href: "/tasks?action=create", icon: Plus, color: "bg-orange-600 hover:bg-orange-700" },
];

export function DashboardClient({
  userName,
  greeting,
  stats,
  upcomingMeetings,
  enrollments,
  recentActivity,
}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          {greeting}, {userName}!
        </h1>
        <p className="mt-1 text-indigo-100">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats[card.key]}
                  {card.suffix ?? ""}
                </p>
              </div>
              <div className={cn("rounded-xl p-3", card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors",
              action.color
            )}
          >
            <action.icon className="h-5 w-5" />
            {action.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Meetings */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Upcoming Meetings
            </h2>
            <Link
              href="/meetings"
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {upcomingMeetings.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                No upcoming meetings
              </div>
            ) : (
              upcomingMeetings.map((meeting: any) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                      <Video className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {meeting.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {new Date(meeting.scheduledStart).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {meeting.participants?.slice(0, 3).map((p: any) => (
                        <div
                          key={p.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium dark:border-gray-900 dark:bg-gray-700"
                          title={p.user?.name}
                        >
                          {getInitials(p.user?.name ?? "?")}
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Course Progress */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Course Progress
            </h2>
            <Link
              href="/learning"
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {enrollments.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                <GraduationCap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                Not enrolled in any courses yet
              </div>
            ) : (
              enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {enrollment.course.title}
                    </p>
                    <span className="text-xs font-medium text-indigo-600">
                      {Math.round(enrollment.progress)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${Math.min(enrollment.progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {enrollment.course.category ?? "General"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              No recent activity
            </div>
          ) : (
            recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Zap className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {log.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
