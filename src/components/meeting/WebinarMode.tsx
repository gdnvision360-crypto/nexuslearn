"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Eye,
  Mic,
  MicOff,
  Settings,
  Play,
  Square,
  MessageSquare,
  Shield,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

type WebinarRole = "host" | "panelist" | "attendee";

interface WebinarParticipant {
  id: string;
  userId: string;
  name: string;
  role: WebinarRole;
  isMuted: boolean;
  hasVideo: boolean;
  joinedAt: string;
}

interface WebinarConfig {
  maxAttendees: number;
  requireRegistration: boolean;
  allowAttendeeChat: boolean;
  allowAttendeeQA: boolean;
  allowAttendeeReactions: boolean;
  practiceMode: boolean;
  autoRecord: boolean;
}

interface WebinarState {
  isWebinarMode: boolean;
  config: WebinarConfig;
  isPracticeSession: boolean;
  isLive: boolean;
  attendeeCount: number;
  panelistCount: number;
}

interface WebinarModeProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

const MAX_ATTENDEE_OPTIONS = [100, 500, 1000, 5000, 10000];

const DEFAULT_CONFIG: WebinarConfig = {
  maxAttendees: 500,
  requireRegistration: false,
  allowAttendeeChat: true,
  allowAttendeeQA: true,
  allowAttendeeReactions: true,
  practiceMode: false,
  autoRecord: false,
};

// ============================================================
// WebinarMode
// ============================================================

export function WebinarMode({ meetingId, isHost, onClose }: WebinarModeProps) {
  const [state, setState] = useState<WebinarState>({
    isWebinarMode: false,
    config: DEFAULT_CONFIG,
    isPracticeSession: false,
    isLive: false,
    attendeeCount: 0,
    panelistCount: 0,
  });
  const [participants, setParticipants] = useState<WebinarParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "participants" | "qa">("settings");
  const [promoteUserId, setPromoteUserId] = useState<string | null>(null);
  const [qaQuestions, setQaQuestions] = useState<
    { id: string; question: string; author: string; answered: boolean }[]
  >([]);

  // Fetch webinar settings
  useEffect(() => {
    async function fetchWebinar() {
      try {
        setLoading(true);
        const response = await fetch(`/api/meetings/${meetingId}/webinar`);
        if (response.ok) {
          const data = (await response.json()) as Partial<WebinarState> & {
            participants?: WebinarParticipant[];
          };
          setState((prev) => ({
            ...prev,
            ...data,
            config: { ...prev.config, ...(data.config || {}) },
          }));
          if (data.participants) {
            setParticipants(data.participants);
          }
        }
      } catch {
        setError("Failed to load webinar settings");
      } finally {
        setLoading(false);
      }
    }
    fetchWebinar();
  }, [meetingId]);

  // Toggle webinar mode
  const toggleWebinarMode = useCallback(async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/webinar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isWebinarMode: !state.isWebinarMode,
          config: state.config,
        }),
      });
      if (response.ok) {
        setState((prev) => ({
          ...prev,
          isWebinarMode: !prev.isWebinarMode,
        }));
      }
    } catch {
      setError("Failed to toggle webinar mode");
    } finally {
      setSaving(false);
    }
  }, [meetingId, state.isWebinarMode, state.config]);

  // Update config
  const updateConfig = useCallback(
    async (updates: Partial<WebinarConfig>) => {
      const newConfig = { ...state.config, ...updates };
      setState((prev) => ({ ...prev, config: newConfig }));

      try {
        await fetch(`/api/meetings/${meetingId}/webinar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isWebinarMode: state.isWebinarMode,
            config: newConfig,
          }),
        });
      } catch {
        // Revert on error
        setState((prev) => ({ ...prev, config: state.config }));
      }
    },
    [meetingId, state.isWebinarMode, state.config]
  );

  // Promote/Demote participant
  const changeRole = useCallback(
    async (userId: string, newRole: WebinarRole) => {
      setPromoteUserId(userId);
      try {
        const response = await fetch(`/api/meetings/${meetingId}/webinar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: newRole }),
        });
        if (response.ok) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.userId === userId ? { ...p, role: newRole } : p
            )
          );
        }
      } catch {
        setError("Failed to change participant role");
      } finally {
        setPromoteUserId(null);
      }
    },
    [meetingId]
  );

  // Toggle practice session
  const togglePractice = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isPracticeSession: !prev.isPracticeSession,
    }));
  }, []);

  // Go Live
  const goLive = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLive: true,
      isPracticeSession: false,
    }));
  }, []);

  // Stop webinar
  const stopLive = useCallback(async () => {
    setState((prev) => ({ ...prev, isLive: false }));
  }, []);

  const panelists = participants.filter((p) => p.role === "panelist" || p.role === "host");
  const attendees = participants.filter((p) => p.role === "attendee");

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Webinar Mode</h2>
          {state.isLive && (
            <span className="flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Webinar toggle */}
      {isHost && (
        <div className="border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Webinar Mode</p>
              <p className="text-xs text-gray-400">
                Enable for large events with panelists &amp; attendees
              </p>
            </div>
            <button
              onClick={toggleWebinarMode}
              disabled={saving}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                state.isWebinarMode ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  state.isWebinarMode ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {state.isWebinarMode && (
        <div className="flex border-b border-gray-800">
          {(["settings", "participants", "qa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-purple-500 text-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "settings" ? "Settings" : tab === "participants" ? "People" : "Q&A"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg bg-red-600/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        ) : !state.isWebinarMode ? (
          <div className="rounded-lg bg-gray-800/50 p-6 text-center">
            <Radio className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-sm text-gray-400">
              Enable webinar mode to host large events with separate panelist
              and attendee roles.
            </p>
          </div>
        ) : (
          <>
            {/* Settings Tab */}
            {activeTab === "settings" && isHost && (
              <div className="space-y-4">
                {/* Live Controls */}
                <div className="rounded-xl bg-gray-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          {state.attendeeCount} attendees
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Crown className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-300">
                          {state.panelistCount} panelists
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!state.isLive ? (
                      <>
                        <button
                          onClick={togglePractice}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            state.isPracticeSession
                              ? "bg-yellow-600/20 text-yellow-400"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          Practice
                        </button>
                        <button
                          onClick={goLive}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                        >
                          <Play className="h-4 w-4" />
                          Go Live
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={stopLive}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                      >
                        <Square className="h-4 w-4" />
                        End Webinar
                      </button>
                    )}
                  </div>
                  {state.isPracticeSession && (
                    <p className="mt-2 text-center text-xs text-yellow-400">
                      Practice session — only panelists can see this
                    </p>
                  )}
                </div>

                {/* Max Attendees */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Max Attendees
                  </label>
                  <div className="relative">
                    <select
                      value={state.config.maxAttendees}
                      onChange={(e) =>
                        updateConfig({ maxAttendees: Number(e.target.value) })
                      }
                      className="w-full appearance-none rounded-lg bg-gray-800 px-3 py-2 pr-8 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {MAX_ATTENDEE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.toLocaleString()} attendees
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Toggles */}
                {[
                  {
                    key: "requireRegistration" as const,
                    label: "Require Registration",
                    desc: "Attendees must register before joining",
                  },
                  {
                    key: "allowAttendeeChat" as const,
                    label: "Attendee Chat",
                    desc: "Allow attendees to send chat messages",
                  },
                  {
                    key: "allowAttendeeQA" as const,
                    label: "Q&A",
                    desc: "Allow attendees to submit questions",
                  },
                  {
                    key: "allowAttendeeReactions" as const,
                    label: "Reactions",
                    desc: "Allow attendees to send reactions",
                  },
                  {
                    key: "autoRecord" as const,
                    label: "Auto-Record",
                    desc: "Automatically record when going live",
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg px-1 py-1"
                  >
                    <div>
                      <p className="text-sm text-white">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        updateConfig({ [key]: !state.config[key] })
                      }
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        state.config[key] ? "bg-purple-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          state.config[key] ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === "participants" && (
              <div className="space-y-4">
                {/* Panelists */}
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Crown className="h-3.5 w-3.5 text-yellow-400" />
                    Panelists ({panelists.length})
                  </h3>
                  <div className="space-y-1">
                    {panelists.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-white">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.role}</p>
                          </div>
                        </div>
                        {isHost && p.role !== "host" && (
                          <button
                            onClick={() => changeRole(p.userId, "attendee")}
                            disabled={promoteUserId === p.userId}
                            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-red-400"
                            title="Demote to attendee"
                          >
                            {promoteUserId === p.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                    {panelists.length === 0 && (
                      <p className="py-2 text-center text-xs text-gray-500">
                        No panelists yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Eye className="h-3.5 w-3.5" />
                    Attendees ({attendees.length})
                  </h3>
                  <div className="space-y-1">
                    {attendees.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white">
                            {p.name.charAt(0)}
                          </div>
                          <p className="text-sm text-white">{p.name}</p>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => changeRole(p.userId, "panelist")}
                            disabled={promoteUserId === p.userId}
                            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-green-400"
                            title="Promote to panelist"
                          >
                            {promoteUserId === p.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                    {attendees.length === 0 && (
                      <p className="py-2 text-center text-xs text-gray-500">
                        No attendees yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === "qa" && (
              <div className="space-y-3">
                {qaQuestions.length === 0 ? (
                  <div className="rounded-lg bg-gray-800/50 p-6 text-center">
                    <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-400">
                      No questions yet. Attendees can submit questions during the webinar.
                    </p>
                  </div>
                ) : (
                  qaQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-lg bg-gray-800 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">
                          {q.author}
                        </span>
                        {q.answered && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-white">{q.question}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
