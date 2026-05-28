"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Hash,
  Lock,
  MessageSquare,
  Search,
  Plus,
  Send,
  Smile,
  Paperclip,
  Code,
  AtSign,
  Pin,
  Phone,
  Video,
  Users,
  Settings,
  ChevronDown,
  X,
  User,
  MoreVertical,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DM";
  description?: string;
  _count?: { members: number };
}

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null };
  createdAt: string;
  isEdited: boolean;
  isPinned: boolean;
  reactions: any[];
  replyTo?: { id: string; content: string; sender: { name: string } } | null;
}

export default function ChatPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (data.length > 0 && !activeChannel) {
          setActiveChannel(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeChannel) return;
    try {
      const res = await fetch(`/api/channels/${activeChannel.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? data ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (activeChannel) fetchMessages();
  }, [activeChannel, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    try {
      const res = await fetch(`/api/channels/${activeChannel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const publicChannels = filteredChannels.filter((c) => c.type === "PUBLIC");
  const privateChannels = filteredChannels.filter((c) => c.type === "PRIVATE");
  const dmChannels = filteredChannels.filter((c) => c.type === "DM");

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)]">
      {/* Channel List */}
      <div className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Public Channels */}
          {publicChannels.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 px-2 text-xs font-semibold uppercase text-gray-400">
                Channels
              </p>
              {publicChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    activeChannel?.id === ch.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 px-2 text-xs font-semibold uppercase text-gray-400">
                Private
              </p>
              {privateChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    activeChannel?.id === ch.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <Lock className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* DMs */}
          {dmChannels.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 px-2 text-xs font-semibold uppercase text-gray-400">
                Direct Messages
              </p>
              {dmChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    activeChannel?.id === ch.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )}

          {!loading && channels.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              No channels yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                {activeChannel.type === "PUBLIC" ? (
                  <Hash className="h-5 w-5 text-gray-400" />
                ) : activeChannel.type === "PRIVATE" ? (
                  <Lock className="h-5 w-5 text-gray-400" />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {activeChannel.name}
                </h2>
                {activeChannel.description && (
                  <span className="hidden text-sm text-gray-500 sm:inline">
                    — {activeChannel.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Video className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className={cn(
                    "rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800",
                    showMembers ? "bg-gray-100 text-indigo-600 dark:bg-gray-800" : "text-gray-500"
                  )}
                >
                  <Users className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages + Optional Member List */}
            <div className="flex flex-1 overflow-hidden">
              {/* Messages */}
              <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-gray-500">
                      <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="group flex gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-bold text-white">
                            {getInitials(msg.sender?.name ?? "?")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {msg.sender?.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {msg.isEdited && (
                                <span className="text-xs text-gray-400">(edited)</span>
                              )}
                            </div>
                            {msg.replyTo && (
                              <div className="mt-1 rounded border-l-2 border-indigo-300 bg-gray-50 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800">
                                <span className="font-medium">{msg.replyTo.sender?.name}</span>:{" "}
                                {msg.replyTo.content?.slice(0, 80)}
                              </div>
                            )}
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                              {msg.content}
                            </p>
                            {msg.reactions?.length > 0 && (
                              <div className="mt-1 flex gap-1">
                                {msg.reactions.map((r: any, i: number) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
                                  >
                                    {r.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button className="hidden rounded p-1 text-gray-400 hover:bg-gray-100 group-hover:block dark:hover:bg-gray-800">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Composer */}
                <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800">
                      <textarea
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        placeholder={`Message #${activeChannel.name}`}
                        className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 dark:text-white"
                      />
                      <div className="flex items-center gap-1 border-t border-gray-200 px-2 py-1.5 dark:border-gray-700">
                        <button type="button" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                          <Smile className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                          <Code className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                          <AtSign className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Members Panel */}
              {showMembers && (
                <div className="w-60 border-l border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Members</h3>
                    <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {activeChannel._count?.members ?? 0} members
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">Select a channel</p>
              <p className="text-sm">Choose a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
