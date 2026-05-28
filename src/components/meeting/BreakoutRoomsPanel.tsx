"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Plus,
  Play,
  Square,
  Users,
  Timer,
  Megaphone,
  Shuffle,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Send,
  AlertCircle,
} from "lucide-react";
import { useMeetingContext } from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
  isOpen: boolean;
  timerEnd?: number;
}

interface BreakoutRoomsPanelProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

// ============================================================
// RoomCard
// ============================================================

function RoomCard({
  room,
  allParticipants,
  isHost,
  onDrop,
  onRemoveParticipant,
  onDeleteRoom,
  onRenameRoom,
}: {
  room: BreakoutRoom;
  allParticipants: { identity: string; name: string }[];
  isHost: boolean;
  onDrop: (participantId: string, roomId: string) => void;
  onRemoveParticipant: (participantId: string, roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!room.timerEnd) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.timerEnd! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [room.timerEnd]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2", "ring-blue-500");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-blue-500");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-blue-500");
    const participantId = e.dataTransfer.getData("participantId");
    if (participantId) onDrop(participantId, room.id);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const roomParticipants = room.participants
    .map((id) => allParticipants.find((p) => p.identity === id))
    .filter(Boolean);

  return (
    <div
      className="rounded-xl border border-gray-700 bg-gray-800/50 transition-all"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Room Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              onRenameRoom(room.id, editName);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRenameRoom(room.id, editName);
                setIsEditing(false);
              }
            }}
            className="flex-1 rounded bg-gray-700 px-2 py-0.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-sm font-medium text-white hover:text-blue-400"
            onDoubleClick={() => isHost && setIsEditing(true)}
          >
            {room.name}
          </span>
        )}

        <span className="text-xs text-gray-500">
          {roomParticipants.length} participant{roomParticipants.length !== 1 ? "s" : ""}
        </span>

        {timeLeft !== null && timeLeft > 0 && (
          <span className="flex items-center gap-1 text-xs text-yellow-400">
            <Timer className="h-3 w-3" />
            {formatTime(timeLeft)}
          </span>
        )}

        {room.isOpen && (
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
            Open
          </span>
        )}

        {isHost && (
          <button
            onClick={() => onDeleteRoom(room.id)}
            className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Participants */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 px-3 py-2">
          {roomParticipants.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-500">
              Drag participants here
            </p>
          ) : (
            <div className="space-y-1">
              {roomParticipants.map((p) => (
                <div
                  key={p!.identity}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("participantId", p!.identity)
                  }
                  className="group flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-700/50"
                >
                  <GripVertical className="h-3 w-3 text-gray-600" />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white">
                    {p!.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-gray-300">{p!.name}</span>
                  {isHost && (
                    <button
                      onClick={() => onRemoveParticipant(p!.identity, room.id)}
                      className="rounded p-0.5 text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BreakoutRoomsPanel
// ============================================================

export function BreakoutRoomsPanel({
  meetingId,
  isHost,
  onClose,
}: BreakoutRoomsPanelProps) {
  const { participants } = useMeetingContext();
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [autoAssign, setAutoAssign] = useState(true);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/breakout-rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setRoomsOpen(data.rooms?.some((r: BreakoutRoom) => r.isOpen) || false);
      }
    } catch (error) {
      console.error("Failed to fetch breakout rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Create rooms
  const handleCreateRooms = async () => {
    try {
      const participantIds = participants.map((p) => p.identity);
      const roomDefs: { name: string; participantIds: string[] }[] = [];

      if (autoAssign) {
        for (let i = 0; i < numRooms; i++) {
          roomDefs.push({ name: `Room ${i + 1}`, participantIds: [] });
        }
        participantIds.forEach((id, idx) => {
          roomDefs[idx % numRooms].participantIds.push(id);
        });
      } else {
        for (let i = 0; i < numRooms; i++) {
          roomDefs.push({ name: `Room ${i + 1}`, participantIds: [] });
        }
      }

      const res = await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: roomDefs, autoAssign }),
      });

      if (res.ok) {
        await fetchRooms();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error("Failed to create breakout rooms:", error);
    }
  };

  // Open/close all rooms
  const handleToggleRooms = async () => {
    try {
      if (roomsOpen) {
        await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
          method: "DELETE",
        });
        setRoomsOpen(false);
      } else {
        await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "open",
            timerMinutes: timerMinutes > 0 ? timerMinutes : undefined,
          }),
        });
        setRoomsOpen(true);
      }
      await fetchRooms();
    } catch (error) {
      console.error("Failed to toggle rooms:", error);
    }
  };

  // Move participant
  const handleDrop = async (participantId: string, targetRoomId: string) => {
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        participants: r.id === targetRoomId
          ? [...new Set([...r.participants, participantId])]
          : r.participants.filter((p) => p !== participantId),
      }))
    );

    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          participantId,
          targetRoomId,
        }),
      });
    } catch (error) {
      console.error("Failed to move participant:", error);
      await fetchRooms();
    }
  };

  const handleRemoveParticipant = async (participantId: string, roomId: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, participants: r.participants.filter((p) => p !== participantId) }
          : r
      )
    );

    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", participantId, roomId }),
      });
    } catch (error) {
      await fetchRooms();
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteRoom", roomId }),
      });
    } catch (error) {
      await fetchRooms();
    }
  };

  const handleRenameRoom = async (roomId: string, name: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, name } : r))
    );
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", roomId, name }),
      });
    } catch (error) {
      await fetchRooms();
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await fetch(`/api/meetings/${meetingId}/breakout-rooms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", message: broadcastMsg }),
      });
      setBroadcastMsg("");
      setShowBroadcast(false);
    } catch (error) {
      console.error("Failed to broadcast:", error);
    }
  };

  // Auto-assign (shuffle)
  const handleAutoAssign = () => {
    const allIds = participants.map((p) => p.identity);
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    const updated = rooms.map((r, _) => ({ ...r, participants: [] as string[] }));
    shuffled.forEach((id, idx) => {
      updated[idx % updated.length].participants.push(id);
    });
    setRooms(updated);
  };

  const allParticipantsList = participants.map((p) => ({
    identity: p.identity,
    name: p.name,
  }));

  // Unassigned participants
  const assignedIds = new Set(rooms.flatMap((r) => r.participants));
  const unassigned = participants.filter((p) => !assignedIds.has(p.identity));

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Breakout Rooms</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Controls */}
          {isHost && (
            <div className="space-y-2 border-b border-gray-800 px-4 py-3">
              <div className="flex gap-2">
                {rooms.length === 0 ? (
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Rooms
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleToggleRooms}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                        roomsOpen
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {roomsOpen ? (
                        <>
                          <Square className="h-4 w-4" /> Close All
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Open All
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCreateDialog(true)}
                      className="rounded-lg bg-gray-700 p-2 text-gray-300 hover:bg-gray-600 hover:text-white"
                      title="Add room"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {rooms.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAutoAssign}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600 hover:text-white"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Auto-assign
                  </button>
                  <button
                    onClick={() => setShowBroadcast(!showBroadcast)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-600 hover:text-white"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    Broadcast
                  </button>
                </div>
              )}

              {/* Timer setting */}
              {rooms.length > 0 && !roomsOpen && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Timer:</span>
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    min={0}
                    max={120}
                    className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              )}

              {/* Broadcast message */}
              {showBroadcast && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Message to all rooms..."
                    className="flex-1 rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && handleBroadcast()}
                  />
                  <button
                    onClick={handleBroadcast}
                    className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create Dialog */}
          {showCreateDialog && (
            <div className="border-b border-gray-800 bg-gray-800/50 px-4 py-3">
              <h4 className="mb-2 text-sm font-medium text-white">Create Breakout Rooms</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Number of rooms:</label>
                  <input
                    type="number"
                    value={numRooms}
                    onChange={(e) => setNumRooms(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={50}
                    className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-xs text-white outline-none"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                  <span className="text-xs text-gray-300">Auto-assign participants</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRooms}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1 rounded-lg bg-gray-700 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rooms List */}
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 h-10 w-10 text-gray-600" />
                <p className="text-sm text-gray-400">No breakout rooms yet</p>
                {isHost && (
                  <p className="mt-1 text-xs text-gray-500">
                    Create rooms to split participants into groups
                  </p>
                )}
              </div>
            ) : (
              <>
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    allParticipants={allParticipantsList}
                    isHost={isHost}
                    onDrop={handleDrop}
                    onRemoveParticipant={handleRemoveParticipant}
                    onDeleteRoom={handleDeleteRoom}
                    onRenameRoom={handleRenameRoom}
                  />
                ))}

                {/* Unassigned */}
                {unassigned.length > 0 && (
                  <div className="mt-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Unassigned ({unassigned.length})
                    </h4>
                    <div className="space-y-1">
                      {unassigned.map((p) => (
                        <div
                          key={p.identity}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData("participantId", p.identity)
                          }
                          className="flex cursor-grab items-center gap-2 rounded-lg bg-gray-800/50 px-2 py-1.5 hover:bg-gray-700/50"
                        >
                          <GripVertical className="h-3 w-3 text-gray-600" />
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-300">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
