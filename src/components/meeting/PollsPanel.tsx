"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Plus,
  Play,
  Square,
  BarChart3,
  MessageCircleQuestion,
  ThumbsUp,
  ChevronDown,
  ChevronRight,
  Send,
  Download,
  Check,
  Star,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

type PollType = "multiple_choice" | "single_answer" | "rating" | "word_cloud";

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  id: string;
  question: string;
  type: PollType;
  options: PollOption[];
  status: "draft" | "active" | "ended";
  createdAt: number;
  totalVotes: number;
  maxRating?: number;
  averageRating?: number;
  wordCloudEntries?: { text: string; count: number }[];
}

interface Question {
  id: string;
  text: string;
  askedBy: string;
  askedByName: string;
  timestamp: number;
  upvotes: number;
  upvoters: string[];
  isAnswered: boolean;
  answer?: string;
  isHighlighted: boolean;
  isDismissed: boolean;
}

interface PollsPanelProps {
  meetingId: string;
  isHost: boolean;
  userId: string;
  onClose: () => void;
}

// ============================================================
// AnimatedBar
// ============================================================

function AnimatedBar({
  percentage,
  color,
  label,
  votes,
  isSelected,
}: {
  percentage: number;
  color: string;
  label: string;
  votes: number;
  isSelected?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={`text-gray-300 ${isSelected ? "font-semibold text-blue-400" : ""}`}>
          {label}
          {isSelected && <Check className="ml-1 inline h-3.5 w-3.5" />}
        </span>
        <span className="text-gray-400">
          {votes} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// CreatePollForm
// ============================================================

function CreatePollForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (poll: { question: string; type: PollType; options: string[]; maxRating?: number }) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<PollType>("single_answer");
  const [options, setOptions] = useState(["", ""]);
  const [maxRating, setMaxRating] = useState(5);

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (idx: number) =>
    setOptions(options.filter((_, i) => i !== idx));

  const isValid =
    question.trim() &&
    (type === "word_cloud" ||
      type === "rating" ||
      options.filter((o) => o.trim()).length >= 2);

  return (
    <div className="space-y-3 border-b border-gray-800 px-4 py-3">
      <h4 className="text-sm font-medium text-white">Create Poll</h4>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question..."
        className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex gap-1.5">
        {(
          [
            ["single_answer", "Single"],
            ["multiple_choice", "Multiple"],
            ["rating", "Rating"],
            ["word_cloud", "Word Cloud"],
          ] as [PollType, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              type === t
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {type === "rating" ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Max rating:</span>
          <input
            type="number"
            value={maxRating}
            onChange={(e) => setMaxRating(Number(e.target.value))}
            min={3}
            max={10}
            className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-xs text-white outline-none"
          />
        </div>
      ) : type !== "word_cloud" ? (
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[idx] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="rounded p-1 text-gray-500 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addOption}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add option
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          onClick={() =>
            isValid &&
            onSubmit({
              question,
              type,
              options: options.filter((o) => o.trim()),
              maxRating: type === "rating" ? maxRating : undefined,
            })
          }
          disabled={!isValid}
          className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-700 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PollsPanel
// ============================================================

export function PollsPanel({ meetingId, isHost, userId, onClose }: PollsPanelProps) {
  const [activeTab, setActiveTab] = useState<"polls" | "qa">("polls");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/polls`);
      if (res.ok) {
        const data = await res.json();
        setPolls(data.polls || []);
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 5000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const handleCreatePoll = async (pollData: {
    question: string;
    type: PollType;
    options: string[];
    maxRating?: number;
  }) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pollData),
      });
      if (res.ok) {
        await fetchPolls();
        setShowCreate(false);
      }
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  };

  const handleLaunchPoll = async (pollId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch", pollId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to launch poll:", error);
    }
  };

  const handleEndPoll = async (pollId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", pollId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to end poll:", error);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", pollId, optionId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ask", text: newQuestion }),
      });
      setNewQuestion("");
      await fetchPolls();
    } catch (error) {
      console.error("Failed to submit question:", error);
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote", questionId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", questionId, answer }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to answer:", error);
    }
  };

  const handleDismissQuestion = async (questionId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", questionId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to dismiss:", error);
    }
  };

  const handleHighlightQuestion = async (questionId: string) => {
    try {
      await fetch(`/api/meetings/${meetingId}/polls`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "highlight", questionId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error("Failed to highlight:", error);
    }
  };

  const handleExportResults = () => {
    const data = polls.map((p) => ({
      question: p.question,
      type: p.type,
      totalVotes: p.totalVotes,
      options: p.options.map((o) => ({
        text: o.text,
        votes: o.votes,
        percentage: p.totalVotes > 0 ? Math.round((o.votes / p.totalVotes) * 100) : 0,
      })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `polls-${meetingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const barColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  const sortedQuestions = useMemo(
    () =>
      [...questions]
        .filter((q) => !q.isDismissed)
        .sort((a, b) => {
          if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1;
          if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
          return b.upvotes - a.upvotes;
        }),
    [questions]
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Polls &amp; Q&amp;A</h3>
        <div className="flex items-center gap-2">
          {isHost && polls.length > 0 && (
            <button
              onClick={handleExportResults}
              className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              title="Export results"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("polls")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "polls"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Polls
        </button>
        <button
          onClick={() => setActiveTab("qa")}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "qa"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageCircleQuestion className="h-4 w-4" />
          Q&amp;A
          {questions.filter((q) => !q.isAnswered && !q.isDismissed).length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs">
              {questions.filter((q) => !q.isAnswered && !q.isDismissed).length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "polls" ? (
          <>
            {/* Create poll button */}
            {isHost && !showCreate && (
              <div className="px-4 py-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Poll
                </button>
              </div>
            )}

            {showCreate && (
              <CreatePollForm
                onSubmit={handleCreatePoll}
                onCancel={() => setShowCreate(false)}
              />
            )}

            {/* Polls list */}
            <div className="space-y-3 px-4 py-2">
              {polls.length === 0 && !showCreate ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <BarChart3 className="mb-3 h-10 w-10 text-gray-600" />
                  <p className="text-sm text-gray-400">No polls yet</p>
                </div>
              ) : (
                polls.map((poll) => {
                  const isExpanded = expandedPoll === poll.id;
                  const hasVoted = poll.options.some((o) =>
                    o.voters.includes(userId)
                  );

                  return (
                    <div
                      key={poll.id}
                      className="rounded-xl border border-gray-700 bg-gray-800/50"
                    >
                      <button
                        onClick={() =>
                          setExpandedPoll(isExpanded ? null : poll.id)
                        }
                        className="flex w-full items-center gap-2 px-3 py-2.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="flex-1 text-left text-sm font-medium text-white">
                          {poll.question}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            poll.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : poll.status === "ended"
                                ? "bg-gray-600/50 text-gray-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {poll.status}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-700/50 px-3 py-3">
                          {/* Host controls */}
                          {isHost && (
                            <div className="mb-3 flex gap-2">
                              {poll.status === "draft" && (
                                <button
                                  onClick={() => handleLaunchPoll(poll.id)}
                                  className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                                >
                                  <Play className="h-3 w-3" /> Launch
                                </button>
                              )}
                              {poll.status === "active" && (
                                <button
                                  onClick={() => handleEndPoll(poll.id)}
                                  className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                                >
                                  <Square className="h-3 w-3" /> End
                                </button>
                              )}
                            </div>
                          )}

                          {/* Vote / Results */}
                          {poll.status === "active" && !hasVoted ? (
                            <div className="space-y-2">
                              {poll.options.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVote(poll.id, opt.id)}
                                  className="w-full rounded-lg border border-gray-600 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:border-blue-500 hover:bg-blue-500/10 hover:text-white"
                                >
                                  {opt.text}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {poll.options.map((opt, idx) => (
                                <AnimatedBar
                                  key={opt.id}
                                  label={opt.text}
                                  votes={opt.votes}
                                  percentage={
                                    poll.totalVotes > 0
                                      ? (opt.votes / poll.totalVotes) * 100
                                      : 0
                                  }
                                  color={barColors[idx % barColors.length]}
                                  isSelected={opt.voters.includes(userId)}
                                />
                              ))}
                              <p className="text-xs text-gray-500">
                                {poll.totalVotes} total vote{poll.totalVotes !== 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Q&A Tab */
          <>
            <div className="space-y-2 px-4 py-3">
              {sortedQuestions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MessageCircleQuestion className="mb-3 h-10 w-10 text-gray-600" />
                  <p className="text-sm text-gray-400">No questions yet</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Be the first to ask a question!
                  </p>
                </div>
              ) : (
                sortedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-3 ${
                      q.isHighlighted
                        ? "border-yellow-500/50 bg-yellow-500/10"
                        : q.isAnswered
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-gray-700 bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => handleUpvoteQuestion(q.id)}
                        className={`flex flex-col items-center rounded p-1 ${
                          q.upvoters.includes(userId)
                            ? "text-blue-400"
                            : "text-gray-500 hover:text-blue-400"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-xs">{q.upvotes}</span>
                      </button>
                      <div className="flex-1">
                        <p className="text-sm text-white">{q.text}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          by {q.askedByName}
                        </p>
                        {q.answer && (
                          <div className="mt-2 rounded-lg bg-green-500/10 px-3 py-2">
                            <p className="text-xs font-medium text-green-400">Answer:</p>
                            <p className="text-sm text-gray-300">{q.answer}</p>
                          </div>
                        )}
                      </div>
                      {isHost && !q.isAnswered && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleHighlightQuestion(q.id)}
                            className={`rounded p-1 ${
                              q.isHighlighted
                                ? "text-yellow-400"
                                : "text-gray-500 hover:text-yellow-400"
                            }`}
                            title={q.isHighlighted ? "Remove highlight" : "Highlight"}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDismissQuestion(q.id)}
                            className="rounded p-1 text-gray-500 hover:text-red-400"
                            title="Dismiss"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Answer input for host */}
                    {isHost && !q.isAnswered && (
                      <AnswerInput
                        onSubmit={(answer) => handleAnswerQuestion(q.id, answer)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Q&A Input */}
      {activeTab === "qa" && (
        <div className="border-t border-gray-800 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitQuestion()}
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim()}
              className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AnswerInput (inline host answer)
// ============================================================

function AnswerInput({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [answer, setAnswer] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="mt-2 text-xs text-blue-400 hover:text-blue-300"
      >
        Reply...
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="flex-1 rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-white placeholder-gray-500 outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && answer.trim()) {
            onSubmit(answer);
            setAnswer("");
            setIsExpanded(false);
          }
        }}
        autoFocus
      />
      <button
        onClick={() => {
          if (answer.trim()) {
            onSubmit(answer);
            setAnswer("");
            setIsExpanded(false);
          }
        }}
        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
}
