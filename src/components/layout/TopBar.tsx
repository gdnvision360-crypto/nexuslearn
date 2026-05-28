"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Bell,
  Plus,
  Video,
  FileText,
  CheckSquare,
  ChevronRight,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  meetings: "Meetings",
  chat: "Chat",
  docs: "Documents",
  tasks: "Tasks",
  learning: "Learning",
  analytics: "Analytics",
  files: "Files",
  "ai-studio": "AI Studio",
  settings: "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg) => ({
    label: breadcrumbMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, segments.indexOf(seg) + 1).join("/"),
  }));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setShowUserMenu(false);
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node))
        setShowQuickActions(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            <Link
              href={crumb.href}
              className={cn(
                "rounded px-1.5 py-0.5",
                i === breadcrumbs.length - 1
                  ? "font-semibold text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              )}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 w-40 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-white lg:w-64"
            />
            <kbd className="hidden rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline-block dark:border-gray-600">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative" ref={quickActionsRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          {showQuickActions && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <Link
                href="/meetings?action=create"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowQuickActions(false)}
              >
                <Video className="h-4 w-4 text-indigo-500" />
                New Meeting
              </Link>
              <Link
                href="/docs?action=create"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowQuickActions(false)}
              >
                <FileText className="h-4 w-4 text-green-500" />
                New Document
              </Link>
              <Link
                href="/tasks?action=create"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowQuickActions(false)}
              >
                <CheckSquare className="h-4 w-4 text-orange-500" />
                New Task
              </Link>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? ""}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name ?? "U")
            )}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
