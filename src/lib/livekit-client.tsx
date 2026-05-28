"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  Room,
  RoomEvent,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
  DataPacket_Kind,
  type Participant,
  type RemoteTrackPublication,
} from "livekit-client";

// ============================================================
// Types
// ============================================================

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  replyToId?: string;
  isPinned: boolean;
}

export interface HandRaise {
  participantId: string;
  participantName: string;
  raisedAt: number;
}

export interface Reaction {
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isLocal: boolean;
  isHandRaised: boolean;
  metadata?: string;
}

export type DataMessageType =
  | "chat"
  | "reaction"
  | "hand_raise"
  | "hand_lower"
  | "pin_message";

interface DataMessage {
  type: DataMessageType;
  payload: Record<string, unknown>;
}

// ============================================================
// useMeetingRoom
// ============================================================

export function useMeetingRoom(token: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] =
    useState<LocalParticipant | null>(null);
  const roomRef = useRef<Room | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  const connect = useCallback(async () => {
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720, frameRate: 30 },
      },
    });

    roomRef.current = newRoom;

    newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      setConnectionState(state);
    });

    newRoom.on(RoomEvent.ParticipantConnected, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.ParticipantDisconnected, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.TrackSubscribed, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.TrackUnsubscribed, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.TrackMuted, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.TrackUnmuted, () => {
      updateParticipants(newRoom);
    });

    newRoom.on(RoomEvent.Reconnecting, () => {
      setConnectionState(ConnectionState.Reconnecting);
    });

    newRoom.on(RoomEvent.Reconnected, () => {
      setConnectionState(ConnectionState.Connected);
      updateParticipants(newRoom);
    });

    await newRoom.connect(serverUrl, token);
    setRoom(newRoom);
    setLocalParticipant(newRoom.localParticipant);
    updateParticipants(newRoom);
  }, [token, serverUrl]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setLocalParticipant(null);
      setParticipants([]);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, []);

  function updateParticipants(rm: Room) {
    const allParticipants: Participant[] = [
      rm.localParticipant,
      ...Array.from(rm.remoteParticipants.values()),
    ];
    setParticipants(allParticipants);
  }

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    room,
    participants,
    localParticipant,
    connectionState,
    connect,
    disconnect,
    isConnected: connectionState === ConnectionState.Connected,
    isReconnecting: connectionState === ConnectionState.Reconnecting,
  };
}

// ============================================================
// useScreenShare
// ============================================================

export function useScreenShare(room: Room | null) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const startScreenShare = useCallback(async () => {
    if (!room) return;
    try {
      await room.localParticipant.setScreenShareEnabled(true);
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Failed to start screen share:", error);
    }
  }, [room]);

  const stopScreenShare = useCallback(async () => {
    if (!room) return;
    try {
      await room.localParticipant.setScreenShareEnabled(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error("Failed to stop screen share:", error);
    }
  }, [room]);

  return { isScreenSharing, startScreenShare, stopScreenShare };
}

// ============================================================
// useRecording
// ============================================================

export function useRecording(roomName: string) {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "start" }),
      });
      if (res.ok) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [roomName]);

  const stopRecording = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, action: "stop" }),
      });
      if (res.ok) {
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }, [roomName]);

  return { isRecording, startRecording, stopRecording };
}

// ============================================================
// MeetingProvider
// ============================================================

interface MeetingContextValue {
  room: Room | null;
  participants: ParticipantInfo[];
  localParticipant: LocalParticipant | null;
  chatMessages: ChatMessage[];
  handRaises: HandRaise[];
  reactions: Reaction[];
  sendChatMessage: (content: string, replyToId?: string) => void;
  pinMessage: (messageId: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendReaction: (emoji: string) => void;
  isConnected: boolean;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  breakoutAssignment: string | null;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function useMeetingContext() {
  const ctx = useContext(MeetingContext);
  if (!ctx) {
    throw new Error("useMeetingContext must be used within MeetingProvider");
  }
  return ctx;
}

interface MeetingProviderProps {
  token: string;
  children: ReactNode;
}

export function MeetingProvider({ token, children }: MeetingProviderProps) {
  const {
    room,
    participants: rawParticipants,
    localParticipant,
    connectionState,
    connect,
    disconnect,
    isConnected,
  } = useMeetingRoom(token);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [breakoutAssignment, setBreakoutAssignment] = useState<string | null>(
    null
  );
  const [handRaisedSet, setHandRaisedSet] = useState<Set<string>>(new Set());

  // Process participants into ParticipantInfo
  const participants: ParticipantInfo[] = rawParticipants.map((p) => ({
    identity: p.identity,
    name: p.name ?? p.identity,
    isSpeaking: p.isSpeaking,
    isMuted: p instanceof RemoteParticipant
      ? Array.from(p.trackPublications.values()).some(
          (t) => t.kind === "audio" && t.isMuted
        )
      : p instanceof LocalParticipant
        ? !p.isMicrophoneEnabled
        : false,
    isCameraOff: p instanceof RemoteParticipant
      ? !Array.from(p.trackPublications.values()).some(
          (t) => t.kind === "video" && t.track && !t.isMuted
        )
      : p instanceof LocalParticipant
        ? !p.isCameraEnabled
        : true,
    isScreenSharing: p instanceof RemoteParticipant
      ? Array.from(p.trackPublications.values()).some(
          (t) => t.source === "screen_share" && t.track
        )
      : p instanceof LocalParticipant
        ? p.isScreenShareEnabled
        : false,
    isLocal: p instanceof LocalParticipant,
    isHandRaised: handRaisedSet.has(p.identity),
    metadata: p.metadata ?? undefined,
  }));

  // Handle incoming data messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const message: DataMessage = JSON.parse(decoded);
        const senderId = participant?.identity ?? "unknown";
        const senderName = participant?.name ?? "Unknown";

        switch (message.type) {
          case "chat": {
            const chatMsg: ChatMessage = {
              id: `${Date.now()}-${senderId}`,
              senderId,
              senderName,
              content: message.payload.content as string,
              timestamp: Date.now(),
              replyToId: message.payload.replyToId as string | undefined,
              isPinned: false,
            };
            setChatMessages((prev) => [...prev, chatMsg]);
            break;
          }
          case "reaction": {
            const reaction: Reaction = {
              emoji: message.payload.emoji as string,
              senderId,
              senderName,
              timestamp: Date.now(),
            };
            setReactions((prev) => [...prev, reaction]);
            // Auto-remove reaction after 5 seconds
            setTimeout(() => {
              setReactions((prev) =>
                prev.filter((r) => r.timestamp !== reaction.timestamp)
              );
            }, 5000);
            break;
          }
          case "hand_raise": {
            setHandRaises((prev) => [
              ...prev.filter((h) => h.participantId !== senderId),
              { participantId: senderId, participantName: senderName, raisedAt: Date.now() },
            ]);
            setHandRaisedSet((prev) => new Set(prev).add(senderId));
            break;
          }
          case "hand_lower": {
            setHandRaises((prev) =>
              prev.filter((h) => h.participantId !== senderId)
            );
            setHandRaisedSet((prev) => {
              const next = new Set(prev);
              next.delete(senderId);
              return next;
            });
            break;
          }
          case "pin_message": {
            const msgId = message.payload.messageId as string;
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
              )
            );
            break;
          }
        }
      } catch (error) {
        console.error("Failed to parse data message:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const sendDataMessage = useCallback(
    (message: DataMessage) => {
      if (!room) return;
      const payload = new TextEncoder().encode(JSON.stringify(message));
      room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
    },
    [room]
  );

  const sendChatMessage = useCallback(
    (content: string, replyToId?: string) => {
      if (!localParticipant) return;

      const chatMsg: ChatMessage = {
        id: `${Date.now()}-${localParticipant.identity}`,
        senderId: localParticipant.identity,
        senderName: localParticipant.name ?? localParticipant.identity,
        content,
        timestamp: Date.now(),
        replyToId,
        isPinned: false,
      };
      setChatMessages((prev) => [...prev, chatMsg]);

      sendDataMessage({
        type: "chat",
        payload: { content, replyToId },
      });
    },
    [localParticipant, sendDataMessage]
  );

  const pinMessage = useCallback(
    (messageId: string) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
        )
      );
      sendDataMessage({
        type: "pin_message",
        payload: { messageId },
      });
    },
    [sendDataMessage]
  );

  const raiseHand = useCallback(() => {
    if (!localParticipant) return;
    setHandRaises((prev) => [
      ...prev.filter((h) => h.participantId !== localParticipant.identity),
      {
        participantId: localParticipant.identity,
        participantName: localParticipant.name ?? localParticipant.identity,
        raisedAt: Date.now(),
      },
    ]);
    setHandRaisedSet((prev) => new Set(prev).add(localParticipant.identity));
    sendDataMessage({ type: "hand_raise", payload: {} });
  }, [localParticipant, sendDataMessage]);

  const lowerHand = useCallback(() => {
    if (!localParticipant) return;
    setHandRaises((prev) =>
      prev.filter((h) => h.participantId !== localParticipant.identity)
    );
    setHandRaisedSet((prev) => {
      const next = new Set(prev);
      next.delete(localParticipant.identity);
      return next;
    });
    sendDataMessage({ type: "hand_lower", payload: {} });
  }, [localParticipant, sendDataMessage]);

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!localParticipant) return;
      const reaction: Reaction = {
        emoji,
        senderId: localParticipant.identity,
        senderName: localParticipant.name ?? localParticipant.identity,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) =>
          prev.filter((r) => r.timestamp !== reaction.timestamp)
        );
      }, 5000);
      sendDataMessage({ type: "reaction", payload: { emoji } });
    },
    [localParticipant, sendDataMessage]
  );

  const value: MeetingContextValue = {
    room,
    participants,
    localParticipant,
    chatMessages,
    handRaises,
    reactions,
    sendChatMessage,
    pinMessage,
    raiseHand,
    lowerHand,
    sendReaction,
    isConnected,
    connectionState,
    connect,
    disconnect,
    breakoutAssignment,
  };

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}
