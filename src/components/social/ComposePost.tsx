"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Clock,
  Image,
  Hash,
  Smile,
  FileText,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { PlatformPreview } from "./PlatformPreview";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive: boolean;
}

interface ComposePostProps {
  accounts: SocialAccount[];
  onPostCreated?: () => void;
  initialContent?: string;
  initialTemplate?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "bg-sky-500",
  LINKEDIN: "bg-blue-700",
  FACEBOOK: "bg-blue-600",
  INSTAGRAM: "bg-gradient-to-r from-purple-500 to-pink-500",
  YOUTUBE: "bg-red-600",
  TIKTOK: "bg-black",
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
};

const EMOJI_PICKER = ["🚀", "📚", "🎓", "📅", "💡", "🔥", "🎉", "👏", "💪", "🌟", "📹", "🏆", "✨", "❤️", "👍", "🙌"];

export function ComposePost({
  accounts,
  onPostCreated,
  initialContent = "",
}: ComposePostProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (showTemplates && templates.length === 0) {
      fetchTemplates();
    }
  }, [showTemplates]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/social/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const insertEmoji = (emoji: string) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
  };

  const applyTemplate = (template: any) => {
    setContent(template.template);
    if (template.suggestedHashtags) {
      setHashtags(template.suggestedHashtags);
    }
    setShowTemplates(false);
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!content.trim()) {
      setError("Post content is required");
      return;
    }
    if (selectedAccounts.length === 0) {
      setError("Select at least one account");
      return;
    }

    setPosting(true);
    setError("");
    setSuccess("");

    try {
      // Create a post for each selected account
      for (const accountId of selectedAccounts) {
        const postData: any = {
          accountId,
          content: content + (hashtags.length > 0 ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : ""),
          mediaUrls,
          hashtags,
        };

        if (showScheduler && scheduledAt) {
          postData.scheduledAt = scheduledAt;
        }

        const res = await fetch("/api/social/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create post");
        }

        // If publish now
        if (publishNow) {
          const post = await res.json();
          const pubRes = await fetch(`/api/social/posts/${post.id}/publish`, {
            method: "POST",
          });
          if (!pubRes.ok) {
            const pubData = await pubRes.json();
            throw new Error(pubData.error || "Failed to publish post");
          }
        }
      }

      setSuccess(
        publishNow
          ? `Published to ${selectedAccounts.length} platform(s)!`
          : showScheduler && scheduledAt
            ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}`
            : `Draft saved for ${selectedAccounts.length} platform(s)`
      );

      // Reset form
      setContent("");
      setSelectedAccounts([]);
      setMediaUrls([]);
      setHashtags([]);
      setScheduledAt("");
      setShowScheduler(false);

      onPostCreated?.();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Post to
        </label>
        <div className="flex flex-wrap gap-2">
          {accounts
            .filter((a) => a.isActive)
            .map((account) => (
              <button
                key={account.id}
                onClick={() => toggleAccount(account.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selectedAccounts.includes(account.id)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${PLATFORM_COLORS[account.platform]}`}
                />
                <span>{account.displayName || account.username}</span>
                <span className="text-xs text-gray-400">
                  {PLATFORM_NAMES[account.platform]}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <FileText className="h-3 w-3 inline mr-1" />
            Use Template
          </button>
        </div>

        {/* Templates Panel */}
        {showTemplates && (
          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left rounded-lg border border-gray-200 bg-white p-2 hover:border-indigo-300 transition-colors dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <span>{template.emoji}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                    <span className="text-xs text-gray-400">{template.category}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {template.template}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="What would you like to share?"
          />

          {/* Toolbar */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_PICKER.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="rounded p-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
              <Image className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className={`rounded-md p-1.5 ${showScheduler ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"} dark:hover:bg-gray-700`}
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Hash className="h-4 w-4 inline mr-1" />
          Hashtags
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
            >
              #{tag}
              <button onClick={() => removeHashtag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              placeholder="Add hashtag"
              className="w-28 rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={addHashtag}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Schedule */}
      {showScheduler && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Schedule for
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm dark:border-indigo-500/30 dark:bg-gray-800"
          />
        </div>
      )}

      {/* Preview */}
      {showPreview && selectedAccounts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Platform Previews
          </h4>
          {selectedAccounts.map((accountId) => {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) return null;
            const fullContent =
              content + (hashtags.length > 0 ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "");
            return (
              <PlatformPreview
                key={accountId}
                platform={account.platform}
                content={fullContent}
                username={account.username}
                displayName={account.displayName}
                avatarUrl={account.avatarUrl}
                mediaUrls={mediaUrls}
              />
            );
          })}
        </div>
      )}

      {/* Error/Success */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(false)}
            disabled={posting || !content.trim() || selectedAccounts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            {showScheduler && scheduledAt ? (
              <>
                <Clock className="h-4 w-4" />
                Schedule
              </>
            ) : (
              "Save Draft"
            )}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={posting || !content.trim() || selectedAccounts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post Now
          </button>
        </div>
      </div>
    </div>
  );
}
