"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Circle,
  Hand,
  SmilePlus,
  MessageSquare,
  Users,
  Captions,
  PhoneOff,
  MoreVertical,
  Settings,
  ImageIcon,
  AudioLines,
  ChevronUp,
  LogOut,
  BarChart3,
  Keyboard,
  LayoutDashboard,
  DoorOpen,
  ClipboardList,
  Sparkles,
  Phone,
  Radio,
  Cast,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface MeetingControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
  isHost: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isCaptionsOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleHand: () => void;
  onReaction: (emoji: string) => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleCaptions: () => void;
  onToggleVirtualBackground: () => void;
  isVirtualBgOpen: boolean;
  onToggleRecordingPanel: () => void;
  isRecordingPanelOpen: boolean;
  onToggleBreakoutRooms?: () => void;
  onTogglePolls?: () => void;
  onToggleSpeakerStats?: () => void;
  onToggleShortcuts?: () => void;
  onToggleAISummary?: () => void;
  onTogglePhoneDialIn?: () => void;
  onToggleWebinar?: () => void;
  onToggleLiveStream?: () => void;
  elapsedTime?: number;
  onLeave: () => void;
  onEndMeeting: () => void;
  audioLevel?: number;
  availableDevices?: {
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  };
  onSelectAudioDevice?: (deviceId: string) => void;
  onSelectVideoDevice?: (deviceId: string) => void;
}

const REACTIONS = ["👍", "❤️", "😂", "👏", "🎉", "🔥", "😮", "🤔"];

// ============================================================
// ControlButton
// ============================================================

function ControlButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  recording = false,
  badge,
  onClick,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  danger?: boolean;
  recording?: boolean;
  badge?: number;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
          danger
            ? "bg-red-600 text-white hover:bg-red-700"
            : active
              ? "bg-white/20 text-white hover:bg-white/30"
              : recording
                ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                : "bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {recording && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-red-500" />
        )}
      </button>
      {/* Tooltip */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// MeetingControls
// ============================================================

export function MeetingControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isRecording,
  isHandRaised,
  isHost,
  isChatOpen,
  isParticipantsOpen,
  isCaptionsOn,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onToggleHand,
  onReaction,
  onToggleChat,
  onToggleParticipants,
  onToggleCaptions,
  onToggleVirtualBackground,
  isVirtualBgOpen,
  onToggleBreakoutRooms,
  onTogglePolls,
  onToggleSpeakerStats,
  onToggleShortcuts,
  onToggleAISummary,
  onTogglePhoneDialIn,
  onToggleWebinar,
  onToggleLiveStream,
  elapsedTime,
  onLeave,
  onEndMeeting,
  audioLevel = 0,
  availableDevices,
  onSelectAudioDevice,
  onSelectVideoDevice,
}: MeetingControlsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState<
    "audio" | "video" | null
  >(null);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const leaveRef = useRef<HTMLDivElement>(null);

  // Close popups on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(e.target as Node)
      ) {
        setShowReactions(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
        setShowDeviceSelector(null);
      }
      if (leaveRef.current && !leaveRef.current.contains(e.target as Node)) {
        setShowLeaveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900/90 px-4 py-3 backdrop-blur-sm">
      {/* Mic Toggle */}
      <div className="relative">
        <ControlButton
          icon={isMuted ? MicOff : Mic}
          label={isMuted ? "Unmute" : "Mute"}
          active={!isMuted}
          onClick={onToggleMic}
        />
        {/* Audio level bar */}
        {!isMuted && audioLevel > 0 && (
          <div className="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Camera Toggle */}
      <ControlButton
        icon={isCameraOff ? VideoOff : Video}
        label={isCameraOff ? "Turn on camera" : "Turn off camera"}
        active={!isCameraOff}
        onClick={onToggleCamera}
      />

      {/* Screen Share */}
      <ControlButton
        icon={isScreenSharing ? MonitorOff : Monitor}
        label={isScreenSharing ? "Stop sharing" : "Share screen"}
        active={isScreenSharing}
        onClick={onToggleScreenShare}
      />

      {/* Record (host only) */}
      {isHost && (
        <ControlButton
          icon={Circle}
          label={isRecording ? "Stop recording" : "Start recording"}
          recording={isRecording}
          onClick={onToggleRecording}
        />
      )}

      <div className="mx-1 h-8 w-px bg-gray-700" />

      {/* Hand Raise */}
      <ControlButton
        icon={Hand}
        label={isHandRaised ? "Lower hand" : "Raise hand"}
        active={isHandRaised}
        onClick={onToggleHand}
      />

      {/* Reactions */}
      <div ref={reactionsRef} className="relative">
        <ControlButton
          icon={SmilePlus}
          label="Reactions"
          onClick={() => setShowReactions(!showReactions)}
        />
        {showReactions && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 rounded-xl bg-gray-800 p-2 shadow-xl">
            <div className="flex gap-1">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="rounded-lg p-1.5 text-xl transition-transform hover:scale-125 hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mx-1 h-8 w-px bg-gray-700" />

      {/* Chat */}
      <ControlButton
        icon={MessageSquare}
        label="Chat"
        active={isChatOpen}
        onClick={onToggleChat}
      />

      {/* Participants */}
      <ControlButton
        icon={Users}
        label="Participants"
        active={isParticipantsOpen}
        onClick={onToggleParticipants}
      />

      {/* Captions */}
      <ControlButton
        icon={Captions}
        label={isCaptionsOn ? "Turn off captions" : "Turn on captions"}
        active={isCaptionsOn}
        onClick={onToggleCaptions}
      />

      {/* More Menu */}
      <div ref={moreRef} className="relative">
        <ControlButton
          icon={MoreVertical}
          label="More"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        />
        {showMoreMenu && (
          <div className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 overflow-hidden rounded-xl bg-gray-800 py-1 shadow-xl max-h-[70vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowDeviceSelector("audio");
                setShowMoreMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Audio settings
            </button>
            <button
              onClick={() => {
                setShowDeviceSelector("video");
                setShowMoreMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Video className="h-4 w-4" />
              Video settings
            </button>
            <button
              onClick={() => {
                onToggleVirtualBackground();
                setShowMoreMenu(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-700 ${
                isVirtualBgOpen ? "text-blue-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Virtual background
            </button>
            <button
              onClick={() => {
                onToggleRecordingPanel();
                setShowMoreMenu(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-700 ${
                isRecordingPanelOpen ? "text-blue-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <Circle className="h-4 w-4" />
              Recording studio &amp; eye contact
            </button>
            <button
              onClick={() => setShowMoreMenu(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <AudioLines className="h-4 w-4" />
              Noise suppression
            </button>
            {onTogglePhoneDialIn && (
              <button
                onClick={() => {
                  onTogglePhoneDialIn();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                Phone dial-in
              </button>
            )}
            {onToggleWebinar && (
              <button
                onClick={() => {
                  onToggleWebinar();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Radio className="h-4 w-4" />
                Webinar mode
              </button>
            )}
            {onToggleLiveStream && (
              <button
                onClick={() => {
                  onToggleLiveStream();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Cast className="h-4 w-4" />
                Live stream
              </button>
            )}
            <div className="my-1 border-t border-gray-700" />
            {onToggleBreakoutRooms && (
              <button
                onClick={() => {
                  onToggleBreakoutRooms();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <DoorOpen className="h-4 w-4" />
                Breakout rooms
              </button>
            )}
            {onTogglePolls && (
              <button
                onClick={() => {
                  onTogglePolls();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ClipboardList className="h-4 w-4" />
                Polls &amp; Q&amp;A
              </button>
            )}
            {onToggleSpeakerStats && (
              <button
                onClick={() => {
                  onToggleSpeakerStats();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                Speaker stats
              </button>
            )}
            {onToggleAISummary && (
              <button
                onClick={() => {
                  onToggleAISummary();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                AI meeting summary
              </button>
            )}
            <div className="my-1 border-t border-gray-700" />
            {onToggleShortcuts && (
              <button
                onClick={() => {
                  onToggleShortcuts();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Keyboard className="h-4 w-4" />
                Keyboard shortcuts
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-1 h-8 w-px bg-gray-700" />

      {/* Leave / End */}
      <div ref={leaveRef} className="relative">
        <ControlButton
          icon={PhoneOff}
          label="Leave meeting"
          danger
          onClick={() => setShowLeaveMenu(!showLeaveMenu)}
        />
        {showLeaveMenu && (
          <div className="absolute -top-24 left-1/2 w-48 -translate-x-1/2 overflow-hidden rounded-xl bg-gray-800 py-1 shadow-xl">
            <button
              onClick={() => {
                onLeave();
                setShowLeaveMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Leave meeting
            </button>
            {isHost && (
              <button
                onClick={() => {
                  onEndMeeting();
                  setShowLeaveMenu(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-600/10 hover:text-red-300"
              >
                <PhoneOff className="h-4 w-4" />
                End meeting for all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Device Selector Popup */}
      {showDeviceSelector && availableDevices && (
        <div className="absolute bottom-20 left-1/2 w-72 -translate-x-1/2 overflow-hidden rounded-xl bg-gray-800 p-4 shadow-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">
            {showDeviceSelector === "audio" ? "Select Microphone" : "Select Camera"}
          </h3>
          <div className="space-y-1">
            {(showDeviceSelector === "audio"
              ? availableDevices.audioInputs
              : availableDevices.videoInputs
            ).map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  if (showDeviceSelector === "audio") {
                    onSelectAudioDevice?.(device.deviceId);
                  } else {
                    onSelectVideoDevice?.(device.deviceId);
                  }
                  setShowDeviceSelector(null);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {device.label || `Device ${device.deviceId.slice(0, 8)}`}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDeviceSelector(null)}
            className="mt-3 w-full rounded-lg bg-gray-700 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
