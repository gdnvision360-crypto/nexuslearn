"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import {
  MeetingProvider,
  useMeetingContext,
  useScreenShare,
  useRecording,
} from "@/lib/livekit-client";
import { VideoGrid, type LayoutMode } from "./VideoGrid";
import { MeetingControls } from "./MeetingControls";
import { MeetingChat } from "./MeetingChat";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { TranscriptionOverlay } from "./TranscriptionOverlay";
import { VirtualBackgroundPanel } from "./VirtualBackground";
import { RecordingPanel } from "./RecordingPanel";
import { BreakoutRoomsPanel } from "./BreakoutRoomsPanel";
import { PollsPanel } from "./PollsPanel";
import { MeetingReactions } from "./MeetingReactions";
import { HandRaiseManager } from "./HandRaiseManager";
import { SpeakerStats } from "./SpeakerStats";
import { NetworkQuality } from "./NetworkQuality";
import { MeetingTimer } from "./MeetingTimer";
import { ViewModeSwitcher, type ViewMode } from "./ViewModeSwitcher";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { AIMeetingSummary } from "./AIMeetingSummary";
import { PhoneDialIn } from "./PhoneDialIn";
import { WebinarMode } from "./WebinarMode";
import { LiveStreamPanel } from "./LiveStreamPanel";
import { MinutesLivePanel } from "./MinutesLivePanel";
import {
  MeetingShortcutManager,
  type ShortcutHandler,
} from "@/lib/meeting-shortcuts";
import {
  type VirtualBackgroundConfig,
  VirtualBackgroundProcessor,
} from "@/lib/virtual-background";
import {
  type EyeContactConfig,
  DEFAULT_EYE_CONTACT_CONFIG,
} from "@/lib/eye-contact";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Settings,
  Users,
  Circle,
  LayoutGrid,
  Presentation,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface MeetingRoomProps {
  meetingId: string;
  meetingTitle: string;
  token: string;
  isHost: boolean;
  userName: string;
  userId: string;
}

// ============================================================
// PreJoinScreen
// ============================================================

function PreJoinScreen({
  userName,
  onJoin,
}: {
  userName: string;
  onJoin: (displayName: string) => void;
}) {
  const [displayName, setDisplayName] = useState(userName);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get camera preview
  useEffect(() => {
    let active = true;
    if (isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: isMicOn })
        .then((s) => {
          if (active) {
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          }
        })
        .catch(() => {
          // Permission denied
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }
    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-center text-2xl font-bold text-white">
          Ready to join?
        </h1>

        {/* Video Preview */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-900">
          {isCameraOn && stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full scale-x-[-1] object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700 text-3xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Preview controls */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`rounded-full p-3 ${
                isMicOn
                  ? "bg-gray-700/80 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`rounded-full p-3 ${
                isCameraOn
                  ? "bg-gray-700/80 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {isCameraOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl bg-gray-800 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        {/* Join Button */}
        <button
          onClick={() => {
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
            }
            onJoin(displayName || userName);
          }}
          disabled={!displayName.trim()}
          className="w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MeetingRoomInner (inside MeetingProvider context)
// ============================================================

function MeetingRoomInner({
  meetingId,
  meetingTitle,
  isHost,
}: {
  meetingId: string;
  meetingTitle: string;
  isHost: boolean;
}) {
  const {
    room,
    participants,
    localParticipant,
    isConnected,
    connectionState,
    raiseHand,
    lowerHand,
    sendReaction,
    handRaises,
    reactions,
    disconnect,
  } = useMeetingContext();

  const { isScreenSharing, startScreenShare, stopScreenShare } =
    useScreenShare(room);
  const { isRecording, startRecording, stopRecording } =
    useRecording(meetingId);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("gallery");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isVirtualBgOpen, setIsVirtualBgOpen] = useState(false);
  const [isRecordingPanelOpen, setIsRecordingPanelOpen] = useState(false);
  const [isBreakoutRoomsOpen, setIsBreakoutRoomsOpen] = useState(false);
  const [isPollsOpen, setIsPollsOpen] = useState(false);
  const [isSpeakerStatsOpen, setIsSpeakerStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [isPhoneDialInOpen, setIsPhoneDialInOpen] = useState(false);
  const [isWebinarOpen, setIsWebinarOpen] = useState(false);
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);
  const [isMinutesOpen, setIsMinutesOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [gridSize, setGridSize] = useState(25);
  const [eyeContactConfig, setEyeContactConfig] = useState<EyeContactConfig>(DEFAULT_EYE_CONTACT_CONFIG);
  const [virtualBgConfig, setVirtualBgConfig] = useState<VirtualBackgroundConfig>({
    mode: "none",
    blurIntensity: 10,
    chromaKeyColor: "#00ff00",
    chromaKeyTolerance: 0.3,
    chromaKeySmoothness: 0.1,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  const shortcutManagerRef = useRef<MeetingShortcutManager | null>(null);
  useEffect(() => {
    const handler: ShortcutHandler = (action) => {
      switch (action) {
        case "toggle-mute":
          handleToggleMic();
          break;
        case "toggle-camera":
          handleToggleCamera();
          break;
        case "toggle-screen-share":
          isScreenSharing ? stopScreenShare() : startScreenShare();
          break;
        case "toggle-hand":
          handleToggleHand();
          break;
        case "toggle-recording":
          if (isHost) isRecording ? stopRecording() : startRecording();
          break;
        case "toggle-fullscreen":
          document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen();
          break;
        case "show-shortcuts":
          setIsShortcutsOpen((p) => !p);
          break;
        case "toggle-chat":
          setIsChatOpen((p) => !p);
          break;
        case "toggle-participants":
          setIsParticipantsOpen((p) => !p);
          break;
        case "push-to-talk-start":
          if (room && !room.localParticipant.isMicrophoneEnabled) {
            room.localParticipant.setMicrophoneEnabled(true);
          }
          break;
        case "push-to-talk-end":
          if (room) {
            room.localParticipant.setMicrophoneEnabled(false);
          }
          break;
      }
    };
    shortcutManagerRef.current = new MeetingShortcutManager(handler);
    shortcutManagerRef.current.attach();
    return () => shortcutManagerRef.current?.detach();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const isMuted = localParticipant
    ? !localParticipant.isMicrophoneEnabled
    : true;
  const isCameraOff = localParticipant
    ? !localParticipant.isCameraEnabled
    : true;

  const handleToggleMic = useCallback(async () => {
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(
      !room.localParticipant.isMicrophoneEnabled
    );
  }, [room]);

  const handleToggleCamera = useCallback(async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(
      !room.localParticipant.isCameraEnabled
    );
  }, [room]);

  const handleToggleHand = useCallback(() => {
    if (isHandRaised) {
      lowerHand();
    } else {
      raiseHand();
    }
    setIsHandRaised(!isHandRaised);
  }, [isHandRaised, raiseHand, lowerHand]);

  const handleLeave = useCallback(async () => {
    await disconnect();
    window.location.href = "/meetings";
  }, [disconnect]);

  const handleEndMeeting = useCallback(async () => {
    try {
      await fetch(`/api/meetings/${meetingId}/end`, { method: "POST" });
    } catch (error) {
      console.error("Failed to end meeting:", error);
    }
    await disconnect();
    window.location.href = "/meetings";
  }, [meetingId, disconnect]);

  const handleMuteParticipant = useCallback(
    async (participantId: string) => {
      try {
        await fetch(`/api/meetings/${meetingId}/participants/${participantId}/mute`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mute participant:", error);
      }
    },
    [meetingId]
  );

  const handleRemoveParticipant = useCallback(
    async (participantId: string) => {
      try {
        await fetch(`/api/meetings/${meetingId}/participants/${participantId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to remove participant:", error);
      }
    },
    [meetingId]
  );

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">{meetingTitle}</h1>
          {isRecording && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-600/20 px-2.5 py-1">
              <Circle className="h-2.5 w-2.5 animate-pulse fill-red-500 text-red-500" />
              <span className="text-xs font-medium text-red-400">REC</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <MeetingTimer
            elapsedTime={elapsedTime}
            isHost={isHost}
            onTimerExpire={handleEndMeeting}
          />
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            {participants.length}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setLayoutMode("gallery")}
              className={`rounded-md p-1.5 ${
                layoutMode === "gallery"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Gallery view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayoutMode("speaker")}
              className={`rounded-md p-1.5 ${
                layoutMode === "speaker"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Speaker view"
            >
              <Presentation className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="relative flex-1">
          <VideoGrid layoutMode={layoutMode} onLayoutChange={setLayoutMode} />

          {/* Floating Reactions */}
          {reactions.length > 0 && (
            <div className="pointer-events-none absolute bottom-28 left-1/2 flex -translate-x-1/2 gap-2">
              {reactions.slice(-5).map((r, i) => (
                <div
                  key={`${r.timestamp}-${i}`}
                  className="animate-bounce text-4xl"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animationDuration: "1s",
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>
          )}

          {/* Transcription Overlay */}
          <TranscriptionOverlay
            meetingId={meetingId}
            isEnabled={isCaptionsOn}
            onClose={() => setIsCaptionsOn(false)}
          />
        </div>

        {/* Side Panels */}
        {isChatOpen && (
          <MeetingChat onClose={() => setIsChatOpen(false)} />
        )}
        {isParticipantsOpen && (
          <ParticipantsPanel
            onClose={() => setIsParticipantsOpen(false)}
            isHost={isHost}
            onMuteParticipant={isHost ? handleMuteParticipant : undefined}
            onRemoveParticipant={isHost ? handleRemoveParticipant : undefined}
          />
        )}
        {isRecordingPanelOpen && (
          <RecordingPanel
            meetingId={meetingId}
            onClose={() => setIsRecordingPanelOpen(false)}
            eyeContactConfig={eyeContactConfig}
            onEyeContactChange={(updates) =>
              setEyeContactConfig((prev) => ({ ...prev, ...updates }))
            }
          />
        )}
        {isVirtualBgOpen && (
          <VirtualBackgroundPanel
            config={virtualBgConfig}
            onConfigChange={(updates) =>
              setVirtualBgConfig((prev) => ({ ...prev, ...updates }))
            }
            onClose={() => setIsVirtualBgOpen(false)}
          />
        )}
        {isBreakoutRoomsOpen && (
          <BreakoutRoomsPanel
            meetingId={meetingId}
            isHost={isHost}
            onClose={() => setIsBreakoutRoomsOpen(false)}
          />
        )}
        {isPollsOpen && (
          <PollsPanel
            meetingId={meetingId}
            isHost={isHost}
            onClose={() => setIsPollsOpen(false)}
          />
        )}
        {isSpeakerStatsOpen && (
          <SpeakerStats
            onClose={() => setIsSpeakerStatsOpen(false)}
          />
        )}
        {isPhoneDialInOpen && (
          <PhoneDialIn
            meetingId={meetingId}
            isHost={isHost}
            onClose={() => setIsPhoneDialInOpen(false)}
          />
        )}
        {isWebinarOpen && (
          <WebinarMode
            meetingId={meetingId}
            isHost={isHost}
            onClose={() => setIsWebinarOpen(false)}
          />
        )}
        {isMinutesOpen && (
          <MinutesLivePanel
            meetingId={meetingId}
            meetingTitle={meetingTitle}
            isHost={isHost}
            onClose={() => setIsMinutesOpen(false)}
          />
        )}
        {isLiveStreamOpen && (
          <LiveStreamPanel
            meetingId={meetingId}
            isHost={isHost}
            onClose={() => setIsLiveStreamOpen(false)}
          />
        )}
      </div>

      {/* Floating overlays */}
      <MeetingReactions />
      <NetworkQuality />

      {/* Modals */}
      {isShortcutsOpen && (
        <ShortcutsPanel onClose={() => setIsShortcutsOpen(false)} />
      )}
      {isAISummaryOpen && (
        <AIMeetingSummary
          meetingId={meetingId}
          meetingTitle={meetingTitle}
          onClose={() => setIsAISummaryOpen(false)}
        />
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-center py-3">
        <MeetingControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          isHandRaised={isHandRaised}
          isHost={isHost}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          isCaptionsOn={isCaptionsOn}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleScreenShare={
            isScreenSharing ? stopScreenShare : startScreenShare
          }
          onToggleRecording={isRecording ? stopRecording : startRecording}
          onToggleHand={handleToggleHand}
          onReaction={sendReaction}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onToggleParticipants={() =>
            setIsParticipantsOpen(!isParticipantsOpen)
          }
          onToggleCaptions={() => setIsCaptionsOn(!isCaptionsOn)}
          onToggleVirtualBackground={() => setIsVirtualBgOpen(!isVirtualBgOpen)}
          isVirtualBgOpen={isVirtualBgOpen}
          onToggleRecordingPanel={() => setIsRecordingPanelOpen(!isRecordingPanelOpen)}
          isRecordingPanelOpen={isRecordingPanelOpen}
          onToggleBreakoutRooms={() => setIsBreakoutRoomsOpen(!isBreakoutRoomsOpen)}
          onTogglePolls={() => setIsPollsOpen(!isPollsOpen)}
          onToggleSpeakerStats={() => setIsSpeakerStatsOpen(!isSpeakerStatsOpen)}
          onToggleShortcuts={() => setIsShortcutsOpen(!isShortcutsOpen)}
          onToggleAISummary={() => setIsAISummaryOpen(!isAISummaryOpen)}
          onTogglePhoneDialIn={() => setIsPhoneDialInOpen(!isPhoneDialInOpen)}
          onToggleWebinar={() => setIsWebinarOpen(!isWebinarOpen)}
          onToggleLiveStream={() => setIsLiveStreamOpen(!isLiveStreamOpen)}
          onToggleMinutes={() => setIsMinutesOpen(!isMinutesOpen)}
          elapsedTime={elapsedTime}
          onLeave={handleLeave}
          onEndMeeting={handleEndMeeting}
        />
      </div>
    </div>
  );
}

// ============================================================
// MeetingRoom (Outer wrapper)
// ============================================================

export function MeetingRoom({
  meetingId,
  meetingTitle,
  token,
  isHost,
  userName,
  userId,
}: MeetingRoomProps) {
  const [hasJoined, setHasJoined] = useState(false);
  const [joinName, setJoinName] = useState(userName);

  if (!hasJoined) {
    return (
      <PreJoinScreen
        userName={userName}
        onJoin={(name) => {
          setJoinName(name);
          setHasJoined(true);
        }}
      />
    );
  }

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <MeetingProvider token={token}>
        <MeetingRoomInner
          meetingId={meetingId}
          meetingTitle={meetingTitle}
          isHost={isHost}
        />
      </MeetingProvider>
    </LiveKitRoom>
  );
}
