// ============================================================
// Meeting Keyboard Shortcuts
// ============================================================

export interface ShortcutDefinition {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  label: string;
  description: string;
  category: "audio" | "video" | "general" | "navigation";
  action: string;
}

export const MEETING_SHORTCUTS: ShortcutDefinition[] = [
  {
    key: " ",
    label: "Space",
    description: "Push to talk (hold to unmute)",
    category: "audio",
    action: "push-to-talk",
  },
  {
    key: "a",
    altKey: true,
    label: "Alt + A",
    description: "Toggle mute/unmute",
    category: "audio",
    action: "toggle-mute",
  },
  {
    key: "v",
    altKey: true,
    label: "Alt + V",
    description: "Toggle camera on/off",
    category: "video",
    action: "toggle-camera",
  },
  {
    key: "s",
    altKey: true,
    label: "Alt + S",
    description: "Toggle screen share",
    category: "video",
    action: "toggle-screen-share",
  },
  {
    key: "h",
    altKey: true,
    label: "Alt + H",
    description: "Raise/lower hand",
    category: "general",
    action: "toggle-hand",
  },
  {
    key: "r",
    altKey: true,
    label: "Alt + R",
    description: "Start/stop recording",
    category: "general",
    action: "toggle-recording",
  },
  {
    key: "f",
    altKey: true,
    label: "Alt + F",
    description: "Toggle fullscreen",
    category: "navigation",
    action: "toggle-fullscreen",
  },
  {
    key: "?",
    altKey: true,
    label: "Alt + ?",
    description: "Show keyboard shortcuts",
    category: "navigation",
    action: "show-shortcuts",
  },
  {
    key: "c",
    altKey: true,
    label: "Alt + C",
    description: "Toggle chat panel",
    category: "navigation",
    action: "toggle-chat",
  },
  {
    key: "p",
    altKey: true,
    label: "Alt + P",
    description: "Toggle participants panel",
    category: "navigation",
    action: "toggle-participants",
  },
];

export type ShortcutHandler = (action: string) => void;

export class MeetingShortcutManager {
  private handler: ShortcutHandler;
  private pushToTalkActive = false;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private keyupListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(handler: ShortcutHandler) {
    this.handler = handler;
  }

  attach(): void {
    this.keydownListener = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Push to talk (Space)
      if (e.key === " " && !e.altKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        if (!this.pushToTalkActive) {
          this.pushToTalkActive = true;
          this.handler("push-to-talk-start");
        }
        return;
      }

      // Alt shortcuts
      if (e.altKey) {
        const shortcut = MEETING_SHORTCUTS.find(
          (s) =>
            s.altKey &&
            s.key.toLowerCase() === e.key.toLowerCase()
        );
        if (shortcut) {
          e.preventDefault();
          this.handler(shortcut.action);
        }
      }
    };

    this.keyupListener = (e: KeyboardEvent) => {
      if (e.key === " " && this.pushToTalkActive) {
        this.pushToTalkActive = false;
        this.handler("push-to-talk-end");
      }
    };

    document.addEventListener("keydown", this.keydownListener);
    document.addEventListener("keyup", this.keyupListener);
  }

  detach(): void {
    if (this.keydownListener) {
      document.removeEventListener("keydown", this.keydownListener);
    }
    if (this.keyupListener) {
      document.removeEventListener("keyup", this.keyupListener);
    }
    this.pushToTalkActive = false;
  }

  updateHandler(handler: ShortcutHandler): void {
    this.handler = handler;
  }
}
