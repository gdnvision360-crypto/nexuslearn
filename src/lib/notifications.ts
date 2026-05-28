// src/lib/notifications.ts
// Real-Time Notification System using Server-Sent Events

export type NotificationType =
  | 'meeting_invite'
  | 'chat_message'
  | 'task_assigned'
  | 'task_due'
  | 'course_update'
  | 'quiz_graded'
  | 'certificate_earned'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  type: NotificationType;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { type: 'meeting_invite', email: true, push: true, inApp: true },
  { type: 'chat_message', email: false, push: true, inApp: true },
  { type: 'task_assigned', email: true, push: true, inApp: true },
  { type: 'task_due', email: true, push: true, inApp: true },
  { type: 'course_update', email: true, push: false, inApp: true },
  { type: 'quiz_graded', email: true, push: true, inApp: true },
  { type: 'certificate_earned', email: true, push: true, inApp: true },
  { type: 'system_alert', email: true, push: true, inApp: true },
];

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  meeting_invite: 'Meeting Invitations',
  chat_message: 'Chat Messages',
  task_assigned: 'Task Assignments',
  task_due: 'Task Due Dates',
  course_update: 'Course Updates',
  quiz_graded: 'Quiz Graded',
  certificate_earned: 'Certificates Earned',
  system_alert: 'System Alerts',
};

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  meeting_invite: 'video',
  chat_message: 'message-square',
  task_assigned: 'clipboard-list',
  task_due: 'clock',
  course_update: 'book-open',
  quiz_graded: 'file-text',
  certificate_earned: 'trophy',
  system_alert: 'bell',
};

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'text-gray-500',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

// Client-side Notification Manager using SSE
export class NotificationManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private badgeCount = 0;

  constructor(private userId: string) {}

  connect(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(
      `/api/notifications/sse?userId=${this.userId}`
    );

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected', null);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('notification', data);

        if (!data.read) {
          this.badgeCount++;
          this.emit('badge_update', this.badgeCount);
        }
      } catch {
        // skip malformed messages
      }
    };

    this.eventSource.addEventListener('badge_count', (event) => {
      const me = event as MessageEvent;
      this.badgeCount = parseInt(me.data, 10) || 0;
      this.emit('badge_update', this.badgeCount);
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.emit('disconnected', null);
      this.attemptReconnect();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect', null);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  getBadgeCount(): number {
    return this.badgeCount;
  }

  setBadgeCount(count: number): void {
    this.badgeCount = count;
    this.emit('badge_update', this.badgeCount);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [notificationId] }),
    });
    this.badgeCount = Math.max(0, this.badgeCount - 1);
    this.emit('badge_update', this.badgeCount);
  }

  async markAllAsRead(): Promise<void> {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    this.badgeCount = 0;
    this.emit('badge_update', 0);
  }
}

// Helper to group notifications by time
export function groupByTime(
  notifications: Array<{ createdAt: string | Date }>
): Record<string, typeof notifications> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, typeof notifications> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= today) groups['Today'].push(n);
    else if (d >= yesterday) groups['Yesterday'].push(n);
    else if (d >= weekAgo) groups['This Week'].push(n);
    else groups['Earlier'].push(n);
  }

  // Remove empty groups
  for (const key of Object.keys(groups)) {
    if (groups[key].length === 0) delete groups[key];
  }

  return groups;
}
