"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  SmilePlus,
  Paperclip,
  Reply,
  Pin,
  X,
  ChevronDown,
} from "lucide-react";
import { useMeetingContext, type ChatMessage } from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface MeetingChatProps {
  onClose: () => void;
  onFileShare?: () => void;
}

const EMOJI_SHORTCUTS = ["😊", "👍", "❤️", "😂", "🎉", "🔥", "👏", "🤔", "😮", "✅", "❌", "💡"];

// ============================================================
// ChatMessageItem
// ============================================================

function ChatMessageItem({
  message,
  onReply,
  onPin,
  allMessages,
}: {
  message: ChatMessage;
  onReply: (id: string) => void;
  onPin: (id: string) => void;
  allMessages: ChatMessage[];
}) {
  const [showActions, setShowActions] = useState(false);
  const replyTarget = message.replyToId
    ? allMessages.find((m) => m.id === message.replyToId)
    : null;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="group relative rounded-lg px-3 py-2 hover:bg-gray-800/50"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply context */}
      {replyTarget && (
        <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
          <Reply className="h-3 w-3" />
          <span className="font-medium">{replyTarget.senderName}:</span>
          <span className="truncate">{replyTarget.content}</span>
        </div>
      )}

      {/* Pin indicator */}
      {message.isPinned && (
        <div className="mb-1 flex items-center gap-1 text-xs text-yellow-500">
          <Pin className="h-3 w-3" />
          <span>Pinned</span>
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {message.senderName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">
              {message.senderName}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
          <p className="mt-0.5 text-sm text-gray-300 break-words">
            {message.content}
          </p>
        </div>
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute -top-2 right-2 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-lg">
          <button
            onClick={() => onReply(message.id)}
            className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
            title="Reply"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPin(message.id)}
            className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-yellow-400"
            title={message.isPinned ? "Unpin" : "Pin"}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MeetingChat
// ============================================================

export function MeetingChat({ onClose, onFileShare }: MeetingChatProps) {
  const { chatMessages, sendChatMessage, pinMessage } = useMeetingContext();
  const [inputValue, setInputValue] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pinnedMessages = chatMessages.filter((m) => m.isPinned);
  const replyTarget = replyToId
    ? chatMessages.find((m) => m.id === replyToId)
    : null;

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, autoScroll]);

  // Detect scroll position for auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    sendChatMessage(trimmed, replyToId ?? undefined);
    setInputValue("");
    setReplyToId(null);
    setAutoScroll(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-gray-800 bg-yellow-500/5 px-4 py-2">
          <div className="flex items-center gap-1 text-xs font-medium text-yellow-500">
            <Pin className="h-3 w-3" />
            {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
          </div>
          <p className="mt-1 truncate text-xs text-gray-400">
            {pinnedMessages[pinnedMessages.length - 1].content}
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-1 py-2"
        onScroll={handleScroll}
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onReply={setReplyToId}
                onPin={pinMessage}
                allMessages={chatMessages}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Scroll to bottom */}
        {!autoScroll && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setAutoScroll(true);
            }}
            className="fixed bottom-32 right-8 rounded-full bg-gray-700 p-2 shadow-lg hover:bg-gray-600"
          >
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Reply context */}
      {replyTarget && (
        <div className="flex items-center gap-2 border-t border-gray-800 bg-gray-800/50 px-4 py-2">
          <Reply className="h-4 w-4 flex-shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-blue-400">
              {replyTarget.senderName}
            </p>
            <p className="truncate text-xs text-gray-400">
              {replyTarget.content}
            </p>
          </div>
          <button
            onClick={() => setReplyToId(null)}
            className="flex-shrink-0 text-gray-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="border-t border-gray-800 bg-gray-800/50 px-4 py-2">
          <div className="flex flex-wrap gap-1">
            {EMOJI_SHORTCUTS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputValue((prev) => prev + emoji);
                  setShowEmoji(false);
                }}
                className="rounded p-1 text-lg hover:bg-gray-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 px-3 py-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <SmilePlus className="h-5 w-5" />
          </button>
          {onFileShare && (
            <button
              onClick={onFileShare}
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          )}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-24 min-h-[36px] flex-1 resize-none rounded-xl bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex-shrink-0 rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
