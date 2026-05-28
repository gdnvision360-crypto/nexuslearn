"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Video,
  MessageSquare,
  FileText,
  CheckSquare,
  GraduationCap,
  BarChart3,
  Share2,
  FolderOpen,
  Sparkles,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Hexagon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings", label: "Meetings", icon: Video },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/social", label: "Social Media", icon: Share2 },
];

const secondaryNavItems = [
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { href: "/video-studio", label: "Video Studio", icon: Film },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const notificationCount = 3;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <Hexagon className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            NexusLearn
          </span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Workspace
          </p>
        )}
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 border-t border-gray-200 dark:border-gray-800" />

        <ul className="space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-400"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Notification Bell */}
      <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-800">
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="relative shrink-0">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </div>
          {!collapsed && <span>Notifications</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-800">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? ""}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name ?? "U")
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {(user as any)?.role ?? "Member"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
