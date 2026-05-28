"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Video,
  Plus,
  Zap,
  Clock,
  Users,
  Calendar,
  Film,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface MeetingsClientProps {
  upcoming: any[];
  past: any[];
  recordings: any[];
  userId: string;
}

type Tab = "upcoming" | "past" | "recordings";

export function MeetingsClient({
  upcoming,
  past,
  recordings,
  userId,
}: MeetingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledStart: "",
    scheduledEnd: "",
  });

  const tabs: { key: Tab; label: string; count: number; icon: any }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length, icon: Calendar },
    { key: "past", label: "Past", count: past.length, icon: Clock },
    { key: "recordings", label: "Recordings", count: recordings.length, icon: Film },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const handleStartInstant = async () => {
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Instant Meeting",
          scheduledStart: new Date().toISOString(),
          scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/meetings/${data.id}`;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const meetings = activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meetings
          </h1>
          <p className="text-sm text-gray-500">
            Schedule, join, and manage your meetings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartInstant}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400"
          >
            <Zap className="h-4 w-4" />
            Start Instant Meeting
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Meeting
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Meeting Cards */}
      {activeTab !== "recordings" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
              <Video className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">
                No {activeTab} meetings
              </p>
            </div>
          ) : (
            meetings.map((meeting: any) => (
              <div
                key={meeting.id}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {meeting.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      {new Date(meeting.scheduledStart).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {meeting.status === "LIVE" && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      Live
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  Hosted by {meeting.host?.name}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {meeting.participants?.slice(0, 4).map((p: any) => (
                      <div
                        key={p.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-medium dark:border-gray-900 dark:bg-gray-700"
                        title={p.user?.name}
                      >
                        {getInitials(p.user?.name ?? "?")}
                      </div>
                    ))}
                    {(meeting.participants?.length ?? 0) > 4 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium dark:border-gray-900">
                        +{meeting.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {activeTab === "past" ? "View" : "Join"}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Recordings */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
              <Film className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">No recordings yet</p>
            </div>
          ) : (
            recordings.map((rec: any) => (
              <div
                key={rec.id}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                    <Film className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {rec.meeting?.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(rec.createdAt).toLocaleDateString()} • {rec.format}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Meeting
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledStart}
                    onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledEnd}
                    onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
