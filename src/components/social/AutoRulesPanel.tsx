"use client";

import { useState, useEffect } from "react";
import { Bell, BookOpen, Calendar, ChevronDown, ChevronUp, Edit, GraduationCap, Plus, RefreshCw, Star, ToggleLeft, ToggleRight, Trash2, Trophy, Users, Video, X, Zap } from 'lucide-react';;

interface AutoRule {
  id: string;
  name: string;
  trigger: string;
  platforms: string[];
  templateText: string;
  includeMedia: boolean;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

const TRIGGER_OPTIONS = [
  { value: "COURSE_PUBLISHED", label: "Course Published", emoji: <BookOpen className="w-4 h-4" />, description: "When a new course is published" },
  { value: "WEBINAR_SCHEDULED", label: "Webinar Scheduled", emoji: <Calendar className="w-4 h-4" />, description: "When a new webinar is created" },
  { value: "MEETING_RECORDED", label: "Meeting Recorded", emoji: <Video className="w-4 h-4" />, description: "When a meeting recording is available" },
  { value: "CERTIFICATE_EARNED", label: "Certificate Earned", emoji: <GraduationCap className="w-4 h-4" />, description: "When someone earns a certificate" },
  { value: "MILESTONE_REACHED", label: "Milestone Reached", emoji: <Trophy className="w-4 h-4" />, description: "When a platform milestone is hit" },
  { value: "EVENT_REMINDER", label: "Event Reminder", emoji: <Bell className="w-4 h-4" />, description: "Reminder before an event starts" },
];

const PLATFORM_OPTIONS = [
  { value: "TWITTER", label: "Twitter / X", color: "bg-sky-500" },
  { value: "LINKEDIN", label: "LinkedIn", color: "bg-blue-700" },
  { value: "FACEBOOK", label: "Facebook", color: "bg-blue-600" },
  { value: "INSTAGRAM", label: "Instagram", color: "bg-pink-500" },
  { value: "YOUTUBE", label: "YouTube", color: "bg-red-600" },
  { value: "TIKTOK", label: "TikTok", color: "bg-black" },
];

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  COURSE_PUBLISHED: ["courseName", "description", "link", "instructorName"],
  WEBINAR_SCHEDULED: ["title", "date", "time", "description", "link"],
  MEETING_RECORDED: ["title", "link", "duration"],
  CERTIFICATE_EARNED: ["certificateName", "courseName", "studentName"],
  MILESTONE_REACHED: ["userName", "milestone", "count"],
  EVENT_REMINDER: ["eventName", "when", "link"],
};

export function AutoRulesPanel() {
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("");
  const [formPlatforms, setFormPlatforms] = useState<string[]>([]);
  const [formTemplate, setFormTemplate] = useState("");
  const [formIncludeMedia, setFormIncludeMedia] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/social/auto-rules");
      if (res.ok) {
        setRules(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormTrigger("");
    setFormPlatforms([]);
    setFormTemplate("");
    setFormIncludeMedia(true);
    setEditingRule(null);
    setShowForm(false);
    setError("");
  };

  const openEditForm = (rule: AutoRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormTrigger(rule.trigger);
    setFormPlatforms(rule.platforms);
    setFormTemplate(rule.templateText);
    setFormIncludeMedia(rule.includeMedia);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || !formTrigger || formPlatforms.length === 0 || !formTemplate) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingRule) {
        const res = await fetch(`/api/social/auto-rules/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            trigger: formTrigger,
            platforms: formPlatforms,
            templateText: formTemplate,
            includeMedia: formIncludeMedia,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update rule");
        }

        const updated = await res.json();
        setRules(rules.map((r) => (r.id === editingRule.id ? updated : r)));
      } else {
        const res = await fetch("/api/social/auto-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            trigger: formTrigger,
            platforms: formPlatforms,
            templateText: formTemplate,
            includeMedia: formIncludeMedia,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create rule");
        }

        const newRule = await res.json();
        setRules([newRule, ...rules]);
      }

      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/social/auto-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setRules(rules.map((r) => (r.id === ruleId ? { ...r, isActive: !isActive } : r)));
      }
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Delete this auto-announcement rule?")) return;
    try {
      const res = await fetch(`/api/social/auto-rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) {
        setRules(rules.filter((r) => r.id !== ruleId));
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const togglePlatform = (platform: string) => {
    setFormPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
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
            Auto-Announcements
          </h3>
          <p className="text-sm text-gray-500">
            Automatically post to social media when events happen
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Rule
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {editingRule ? "Edit Rule" : "New Auto-Announcement Rule"}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Rule Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rule Name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Auto-post new courses"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            {/* Trigger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trigger Event
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TRIGGER_OPTIONS.map((trigger) => (
                  <button
                    key={trigger.value}
                    onClick={() => setFormTrigger(trigger.value)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                      formTrigger === trigger.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <span className="text-lg">{trigger.emoji}</span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {trigger.label}
                      </span>
                      <p className="text-xs text-gray-500">{trigger.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Post To
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <button
                    key={platform.value}
                    onClick={() => togglePlatform(platform.value)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      formPlatforms.includes(platform.value)
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                        : "border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${platform.color}`} />
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Post Template
              </label>
              {formTrigger && (
                <div className="mb-2 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500">Variables:</span>
                  {(TEMPLATE_VARIABLES[formTrigger] || []).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFormTemplate(formTemplate + `{{${v}}}`)}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={formTemplate}
                onChange={(e) => setFormTemplate(e.target.value)}
                rows={3}
                placeholder="Write your template. Use {{variableName}} for dynamic content."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            {/* Include Media */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formIncludeMedia}
                onChange={(e) => setFormIncludeMedia(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Include media attachments when available
              </span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {editingRule ? "Update Rule" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <Zap className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            No auto-announcement rules
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create rules to automatically post to social media when events happen
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const triggerInfo = TRIGGER_OPTIONS.find(
              (t) => t.value === rule.trigger
            );
            return (
              <div
                key={rule.id}
                className={`rounded-xl border bg-white p-4 transition-colors dark:bg-gray-800 ${
                  rule.isActive
                    ? "border-gray-200 dark:border-gray-700"
                    : "border-gray-100 opacity-60 dark:border-gray-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{triggerInfo?.emoji || <Zap className="w-5 h-5" />}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rule.name}
                        </h4>
                        {rule.isActive && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {triggerInfo?.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {rule.platforms.map((platform) => {
                          const info = PLATFORM_OPTIONS.find(
                            (p) => p.value === platform
                          );
                          return (
                            <span
                              key={platform}
                              className="inline-flex items-center gap-1 text-xs text-gray-500"
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${info?.color || "bg-gray-400"}`}
                              />
                              {info?.label || platform}
                            </span>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-gray-400 italic truncate max-w-md">
                        {rule.templateText}
                      </p>
                      {rule.lastTriggered && (
                        <p className="mt-1 text-xs text-gray-400">
                          Last triggered:{" "}
                          {new Date(rule.lastTriggered).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleRule(rule.id, rule.isActive)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditForm(rule)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
