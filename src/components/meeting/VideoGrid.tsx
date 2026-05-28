"use client";

import { useState, useMemo } from "react";
import {
  VideoTrack,
  AudioTrack,
  useParticipants,
  useTracks,
  TrackRefContext,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  Maximize2,
  Monitor,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

export type LayoutMode = "gallery" | "speaker";

interface VideoGridProps {
  layoutMode: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
}

interface VideoTileProps {
  participant: Participant;
  isLarge?: boolean;
  isPinned?: boolean;
  onPin?: (identity: string) => void;
  onSpotlight?: (identity: string) => void;
  isMirrored?: boolean;
}

// ============================================================
// VideoTile
// ============================================================

function VideoTile({
  participant,
  isLarge = false,
  isPinned = false,
  onPin,
  onSpotlight,
  isMirrored = false,
}: VideoTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isMuted = !participant.isMicrophoneEnabled;
  const isCameraOff = !participant.isCameraEnabled;
  const isScreenSharing = participant.isScreenShareEnabled;
  const isSpeaking = participant.isSpeaking;
  const displayName = participant.name ?? participant.identity;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-900 ${
        isLarge ? "col-span-2 row-span-2" : ""
      } ${isSpeaking ? "ring-2 ring-green-500" : "ring-1 ring-gray-700"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Track */}
      {!isCameraOff ? (
        <div
          className={`h-full w-full ${isMirrored ? "scale-x-[-1]" : ""}`}
        >
          <VideoTrack
            trackRef={{
              participant,
              source: Track.Source.Camera,
              publication: participant.getTrackPublication(Track.Source.Camera) ?? undefined,
            }}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-600 text-2xl font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Audio Track (hidden) */}
      {participant.getTrackPublication(Track.Source.Microphone) && (
        <AudioTrack
          trackRef={{
            participant,
            source: Track.Source.Microphone,
            publication: participant.getTrackPublication(Track.Source.Microphone) ?? undefined,
          }}
        />
      )}

      {/* Name Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {displayName}
          </span>
          {isMuted && (
            <MicOff className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
          )}
          {isCameraOff && (
            <VideoOff className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
          )}
          {isScreenSharing && (
            <Monitor className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
          )}
          {isPinned && (
            <Pin className="h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
          )}
        </div>
      </div>

      {/* Audio Level Indicator */}
      {isSpeaking && !isMuted && (
        <div className="absolute left-2 top-2">
          <div className="flex items-end gap-0.5">
            <div className="h-2 w-1 animate-pulse rounded-full bg-green-400" />
            <div className="h-3 w-1 animate-pulse rounded-full bg-green-400 delay-75" />
            <div className="h-1.5 w-1 animate-pulse rounded-full bg-green-400 delay-150" />
          </div>
        </div>
      )}

      {/* Hover Controls */}
      {isHovered && (
        <div className="absolute right-2 top-2 flex gap-1">
          {onPin && (
            <button
              onClick={() => onPin(participant.identity)}
              className="rounded-lg bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
              title="Pin"
            >
              <Pin className="h-4 w-4" />
            </button>
          )}
          {onSpotlight && (
            <button
              onClick={() => onSpotlight(participant.identity)}
              className="rounded-lg bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
              title="Spotlight"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ScreenShareTile
// ============================================================

function ScreenShareTile({ participant }: { participant: Participant }) {
  return (
    <div className="relative col-span-2 row-span-2 overflow-hidden rounded-xl bg-gray-900 ring-2 ring-blue-500">
      <VideoTrack
        trackRef={{
          participant,
          source: Track.Source.ScreenShare,
          publication: participant.getTrackPublication(Track.Source.ScreenShare) ?? undefined,
        }}
        className="h-full w-full object-contain"
      />
      <div className="absolute bottom-0 left-0 bg-blue-600/80 px-3 py-1.5 text-sm font-medium text-white">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          {participant.name ?? participant.identity}&apos;s screen
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VideoGrid
// ============================================================

export function VideoGrid({ layoutMode, onLayoutChange }: VideoGridProps) {
  const participants = useParticipants();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  // Find screen share participant
  const screenShareParticipant = useMemo(
    () => participants.find((p) => p.isScreenShareEnabled),
    [participants]
  );

  const handlePin = (identity: string) => {
    setPinnedId((prev) => (prev === identity ? null : identity));
  };

  const handleSpotlight = (identity: string) => {
    setSpotlightId((prev) => (prev === identity ? null : identity));
  };

  // Determine grid columns based on participant count
  const getGridClass = (count: number): string => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  // Screen share layout
  if (screenShareParticipant) {
    const otherParticipants = participants.filter(
      (p) => p.identity !== screenShareParticipant.identity
    );

    return (
      <div className="flex h-full gap-2 p-2">
        {/* Main screen share area */}
        <div className="flex-1">
          <ScreenShareTile participant={screenShareParticipant} />
        </div>
        {/* Side strip */}
        <div className="flex w-48 flex-col gap-2 overflow-y-auto">
          {participants.map((p) => (
            <div key={p.identity} className="aspect-video">
              <VideoTile
                participant={p}
                onPin={handlePin}
                isPinned={pinnedId === p.identity}
                isMirrored={p.isLocal}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Speaker layout
  if (layoutMode === "speaker") {
    const activeSpeaker =
      participants.find((p) => p.identity === spotlightId) ??
      participants.find((p) => p.identity === pinnedId) ??
      participants.find((p) => p.isSpeaking) ??
      participants[0];

    const others = participants.filter(
      (p) => p.identity !== activeSpeaker?.identity
    );

    return (
      <div className="flex h-full flex-col gap-2 p-2">
        {/* Active speaker - large */}
        {activeSpeaker && (
          <div className="flex-1">
            <VideoTile
              participant={activeSpeaker}
              isLarge
              onPin={handlePin}
              onSpotlight={handleSpotlight}
              isPinned={pinnedId === activeSpeaker.identity}
              isMirrored={activeSpeaker.isLocal}
            />
          </div>
        )}
        {/* Others - strip */}
        {others.length > 0 && (
          <div className="flex h-32 gap-2 overflow-x-auto">
            {others.map((p) => (
              <div key={p.identity} className="aspect-video h-full flex-shrink-0">
                <VideoTile
                  participant={p}
                  onPin={handlePin}
                  onSpotlight={handleSpotlight}
                  isPinned={pinnedId === p.identity}
                  isMirrored={p.isLocal}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Gallery layout (default)
  return (
    <div
      className={`grid h-full auto-rows-fr gap-2 p-2 ${getGridClass(participants.length)}`}
    >
      {participants.map((p) => (
        <VideoTile
          key={p.identity}
          participant={p}
          onPin={handlePin}
          onSpotlight={handleSpotlight}
          isPinned={pinnedId === p.identity}
          isMirrored={p.isLocal}
        />
      ))}
    </div>
  );
}
