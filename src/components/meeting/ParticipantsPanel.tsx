"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MoreVertical,
  UserMinus,
  Shield,
  ArrowRightFromLine,
  Crown,
  Pin,
  Star,
  HandMetal,
} from "lucide-react";
import {
  useMeetingContext,
  type ParticipantInfo,
  type HandRaise,
} from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface ParticipantsPanelProps {
  onClose: () => void;
  isHost: boolean;
  onMuteParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  onMakeCoHost?: (participantId: string) => void;
  onMoveToBreakout?: (participantId: string, roomId: string) => void;
  onPinParticipant?: (participantId: string) => void;
  onSpotlightParticipant?: (participantId: string) => void;
  pinnedParticipants?: string[];
  spotlightedParticipants?: string[];
}

// ============================================================
// ParticipantItem
// ============================================================

function ParticipantItem({
  participant,
  isHost,
  handRaise,
  onMute,
  onRemove,
  onMakeCoHost,
  onPin,
  onSpotlight,
  isPinned,
  isSpotlighted,
}: {
  participant: ParticipantInfo;
  isHost: boolean;
  handRaise?: HandRaise;
  onMute?: () => void;
  onRemove?: () => void;
  onMakeCoHost?: () => void;
  onPin?: () => void;
  onSpotlight?: () => void;
  isPinned?: boolean;
  isSpotlighted?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-800/50">
      {/* Avatar */}
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-white">
        {participant.name.charAt(0).toUpperCase()}
        {participant.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500" />
        )}
      </div>

      {/* Name + status */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-white">
            {participant.name}
          </span>
          {participant.isLocal && (
            <span className="text-xs text-gray-500">(You)</span>
          )}
          {isPinned && (
            <Pin className="h-3 w-3 text-blue-400" />
          )}
          {isSpotlighted && (
            <Star className="h-3 w-3 text-yellow-400" />
          )}
          {participant.isHandRaised && (
            <Hand className="h-3.5 w-3.5 text-yellow-400" />
          )}
        </div>
      </div>

      {/* Audio/Video indicators */}
      <div className="flex items-center gap-1">
        {participant.isMuted ? (
          <MicOff className="h-4 w-4 text-red-400" />
        ) : (
          <Mic className="h-4 w-4 text-gray-400" />
        )}
        {participant.isCameraOff ? (
          <VideoOff className="h-4 w-4 text-red-400" />
        ) : (
          <Video className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Participant actions (pin for all, host actions for host) */}
      {!participant.isLocal && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-gray-500 opacity-0 transition-opacity hover:bg-gray-700 hover:text-white group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 w-48 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-xl">
              {onPin && (
                <button
                  onClick={() => {
                    onPin();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 ${
                    isPinned ? "text-blue-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Pin className="h-4 w-4" />
                  {isPinned ? "Unpin" : "Pin for me"}
                </button>
              )}
              {onSpotlight && isHost && (
                <button
                  onClick={() => {
                    onSpotlight();
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 ${
                    isSpotlighted ? "text-yellow-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  {isSpotlighted ? "Remove spotlight" : "Spotlight for everyone"}
                </button>
              )}
              {(onPin || (onSpotlight && isHost)) && (
                <div className="my-1 border-t border-gray-700" />
              )}
              {onMute && (
                <button
                  onClick={() => {
                    onMute();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <MicOff className="h-4 w-4" />
                  Mute
                </button>
              )}
              {onMakeCoHost && (
                <button
                  onClick={() => {
                    onMakeCoHost();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Shield className="h-4 w-4" />
                  Make co-host
                </button>
              )}
              <button
                onClick={() => setShowMenu(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <ArrowRightFromLine className="h-4 w-4" />
                Move to breakout room
              </button>
              {onRemove && (
                <button
                  onClick={() => {
                    onRemove();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-600/10 hover:text-red-300"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ParticipantsPanel
// ============================================================

export function ParticipantsPanel({
  onClose,
  isHost,
  onMuteParticipant,
  onRemoveParticipant,
  onMakeCoHost,
  onPinParticipant,
  onSpotlightParticipant,
  pinnedParticipants = [],
  spotlightedParticipants = [],
}: ParticipantsPanelProps) {
  const { participants, handRaises } = useMeetingContext();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter((p) => p.name.toLowerCase().includes(q));
  }, [participants, searchQuery]);

  const handRaiseQueue = useMemo(
    () => [...handRaises].sort((a, b) => a.raisedAt - b.raisedAt),
    [handRaises]
  );

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full rounded-lg bg-gray-800 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Hand Raise Queue */}
      {handRaiseQueue.length > 0 && (
        <div className="border-b border-gray-800 px-4 py-2">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-yellow-500">
            <Hand className="h-3.5 w-3.5" />
            Hand Raised ({handRaiseQueue.length})
          </h4>
          <div className="space-y-1">
            {handRaiseQueue.map((hr, index) => (
              <div
                key={hr.participantId}
                className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1.5"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                  {index + 1}
                </span>
                <span className="text-sm text-yellow-300">
                  {hr.participantName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredParticipants.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">No participants found</p>
          </div>
        ) : (
          filteredParticipants.map((p) => (
            <ParticipantItem
              key={p.identity}
              participant={p}
              isHost={isHost}
              handRaise={handRaises.find(
                (hr) => hr.participantId === p.identity
              )}
              onMute={
                onMuteParticipant
                  ? () => onMuteParticipant(p.identity)
                  : undefined
              }
              onRemove={
                onRemoveParticipant
                  ? () => onRemoveParticipant(p.identity)
                  : undefined
              }
              onMakeCoHost={
                onMakeCoHost
                  ? () => onMakeCoHost(p.identity)
                  : undefined
              }
              onPin={
                onPinParticipant
                  ? () => onPinParticipant(p.identity)
                  : undefined
              }
              onSpotlight={
                onSpotlightParticipant
                  ? () => onSpotlightParticipant(p.identity)
                  : undefined
              }
              isPinned={pinnedParticipants.includes(p.identity)}
              isSpotlighted={spotlightedParticipants.includes(p.identity)}
            />
          ))
        )}
      </div>
    </div>
  );
}
