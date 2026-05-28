'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
import { Bell } from 'lucide-react';
  groupByTime,
  NOTIFICATION_ICONS,
  PRIORITY_COLORS,
  type NotificationType,
  type NotificationPriority,
} from '@/lib/notifications';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type TabType = 'all' | 'unread' | 'mentions';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '20',
          ...(activeTab === 'unread' && { unread: 'true' }),
          ...(activeTab === 'mentions' && { type: 'chat_message' }),
        });

        const res = await fetch(`/api/notifications?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }
        setUnreadCount(data.unreadCount ?? 0);
        setHasMore(data.hasMore ?? false);
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Pulse animation for new notifications
  useEffect(() => {
    if (hasNewNotification) {
      const timer = setTimeout(() => setHasNewNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNewNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) handleMarkAsRead(notification.id);
    if (notification.link) window.location.href = notification.link;
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const filteredNotifications = notifications;
  const grouped = groupByTime(filteredNotifications);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'mentions', label: 'Mentions' },
  ];

  return (
    <div className="relative" ref={panelRef}>
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="none">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white rounded-lg
                   hover:bg-white/10 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex items-center justify-center
                       min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white
                       bg-red-500 rounded-full ${hasNewNotification ? 'animate-pulse' : ''}`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-slate-800
                     border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50
                     flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`flex-1 py-2 text-xs font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'}`}
              >
                {tab.label}
                {tab.key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  {"We'll notify you when something arrives"}
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-slate-800/50 sticky top-0">
                    {group}
                  </div>
                  {(items as Notification[]).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-700/50
                                 transition-colors border-b border-slate-700/50
                                 ${!notification.read ? 'bg-indigo-500/5' : ''}`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                        <Bell className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${
                            notification.read ? 'text-gray-400' : 'text-white'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                        {notification.priority !== 'normal' && (
                          <span className={`text-[10px] font-medium mt-1 inline-block ${
                            PRIORITY_COLORS[notification.priority]
                          }`}>
                            {notification.priority.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}

            {/* Load More */}
            {hasMore && notifications.length > 0 && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-xs text-indigo-400 hover:text-indigo-300
                         hover:bg-slate-700/30 transition-colors"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
