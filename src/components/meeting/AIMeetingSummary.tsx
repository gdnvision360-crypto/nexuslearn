"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Download,
  Mail,
  Loader2,
  FileText,
  CheckCircle2,
  ListChecks,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface ActionItem {
  text: string;
  assignee?: string;
  priority?: "high" | "medium" | "low";
}

interface MeetingSummary {
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  followUpQuestions: string[];
  overallSummary: string;
  generatedAt: string;
}

interface AIMeetingSummaryProps {
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
}

// ============================================================
// AIMeetingSummary
// ============================================================

export function AIMeetingSummary({
  meetingId,
  meetingTitle,
  onClose,
}: AIMeetingSummaryProps) {
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const generateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/summary`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  // Check for existing summary
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await fetch(`/api/meetings/${meetingId}/summary`);
        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setSummary(data.summary);
          }
        }
      } catch {
        // No existing summary
      }
    };
    fetchExisting();
  }, [meetingId]);

  const handleExportMarkdown = () => {
    if (!summary) return;

    let md = `# Meeting Summary: ${meetingTitle}\n\n`;
    md += `*Generated: ${new Date(summary.generatedAt).toLocaleString()}*\n\n`;
    md += `## Overview\n\n${summary.overallSummary}\n\n`;

    if (summary.keyPoints.length > 0) {
      md += `## Key Discussion Points\n\n`;
      summary.keyPoints.forEach((p) => {
        md += `- ${p}\n`;
      });
      md += "\n";
    }

    if (summary.actionItems.length > 0) {
      md += `## Action Items\n\n`;
      summary.actionItems.forEach((item) => {
        md += `- [ ] ${item.text}`;
        if (item.assignee) md += ` *(${item.assignee})*`;
        if (item.priority) md += ` [${item.priority}]`;
        md += "\n";
      });
      md += "\n";
    }

    if (summary.decisions.length > 0) {
      md += `## Decisions Made\n\n`;
      summary.decisions.forEach((d) => {
        md += `- ${d}\n`;
      });
      md += "\n";
    }

    if (summary.followUpQuestions.length > 0) {
      md += `## Follow-up Questions\n\n`;
      summary.followUpQuestions.forEach((q) => {
        md += `- ${q}\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-summary-${meetingId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!summary) return;

    let text = `Meeting Summary: ${meetingTitle}\n\n`;
    text += `${summary.overallSummary}\n\n`;
    if (summary.keyPoints.length > 0) {
      text += "Key Points:\n";
      summary.keyPoints.forEach((p) => (text += `• ${p}\n`));
      text += "\n";
    }
    if (summary.actionItems.length > 0) {
      text += "Action Items:\n";
      summary.actionItems.forEach(
        (i) => (text += `• ${i.text}${i.assignee ? ` (${i.assignee})` : ""}\n`)
      );
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSummary = async () => {
    if (!summary) return;
    setIsSending(true);

    try {
      await fetch(`/api/meetings/${meetingId}/summary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email" }),
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      console.error("Failed to email summary:", err);
    } finally {
      setIsSending(false);
    }
  };

  const priorityColors = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    low: "text-green-400 bg-green-500/10",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Meeting Summary
          </h2>
          <div className="flex items-center gap-2">
            {summary && (
              <>
                <button
                  onClick={handleCopy}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                  title="Export as Markdown"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleEmailSummary}
                  disabled={isSending}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50"
                  title="Email to participants"
                >
                  {emailSent ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm text-gray-400">
                Generating AI summary from meeting transcripts...
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This may take a moment
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-red-500/10 p-3">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={generateSummary}
                className="mt-4 flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-purple-500/10 p-4">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-lg font-medium text-white">
                Generate AI Summary
              </p>
              <p className="mt-2 text-center text-sm text-gray-400">
                Use AI to create a summary of this meeting including key
                discussion points, action items, and decisions.
              </p>
              <button
                onClick={generateSummary}
                className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                Generate Summary
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview */}
              <div>
                <p className="text-sm leading-relaxed text-gray-300">
                  {summary.overallSummary}
                </p>
              </div>

              {/* Key Points */}
              {summary.keyPoints.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Key Discussion Points
                  </h3>
                  <ul className="space-y-2">
                    {summary.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-gray-800/50 px-3 py-2"
                      >
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <ListChecks className="h-4 w-4 text-green-400" />
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {summary.actionItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-gray-800/50 px-3 py-2"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-300">
                            {item.text}
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            {item.assignee && (
                              <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                                {item.assignee}
                              </span>
                            )}
                            {item.priority && (
                              <span
                                className={`rounded px-2 py-0.5 text-xs ${
                                  priorityColors[item.priority]
                                }`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decisions */}
              {summary.decisions.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                    Decisions Made
                  </h3>
                  <ul className="space-y-2">
                    {summary.decisions.map((decision, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-purple-500/5 border border-purple-500/20 px-3 py-2 text-sm text-gray-300"
                      >
                        {decision}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {summary.followUpQuestions.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <HelpCircle className="h-4 w-4 text-yellow-400" />
                    Follow-up Questions
                  </h3>
                  <ul className="space-y-2">
                    {summary.followUpQuestions.map((q, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 text-sm text-gray-300"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regenerate */}
              <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                <span className="text-xs text-gray-500">
                  Generated {new Date(summary.generatedAt).toLocaleString()}
                </span>
                <button
                  onClick={generateSummary}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
