"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Settings,
  Users,
  Check,
  X,
  Loader2,
  Monitor,
  Speaker,
  ChevronDown,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface WaitingParticipant {
  id: string;
  name: string;
  image?: string;
  requestedAt: number;
}

interface WaitingRoomProps {
  meetingId: string;
  meetingTitle: string;
  userName: string;
  isHost: boolean;
  onJoin: (displayName: string, settings: { audioDeviceId?: string; videoDeviceId?: string }) => void;
  onAdmit?: (participantId: string) => void;
  onDeny?: (participantId: string) => void;
  waitingParticipants?: WaitingParticipant[];
}

// ============================================================
// DeviceSelector
// ============================================================

function DeviceSelector({
  label,
  icon: Icon,
  devices,
  selectedId,
  onSelect,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  devices: MediaDeviceInfo[];
  selectedId?: string;
  onSelect: (deviceId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedDevice = devices.find((d) => d.deviceId === selectedId);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-xl bg-gray-800 px-3 py-2.5 text-left text-sm text-white hover:bg-gray-700"
      >
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="flex-1 truncate">
          {selectedDevice?.label || "Default"}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && devices.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-xl">
          {devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() => {
                onSelect(device.deviceId);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 ${
                device.deviceId === selectedId
                  ? "text-blue-400"
                  : "text-gray-300"
              }`}
            >
              {device.deviceId === selectedId && (
                <Check className="h-3.5 w-3.5" />
              )}
              <span className="truncate">
                {device.label || `Device ${device.deviceId.slice(0, 8)}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// WaitingRoom
// ============================================================

export function WaitingRoom({
  meetingId,
  meetingTitle,
  userName,
  isHost,
  onJoin,
  onAdmit,
  onDeny,
  waitingParticipants = [],
}: WaitingRoomProps) {
  const [displayName, setDisplayName] = useState(userName);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>();
  const [selectedVideo, setSelectedVideo] = useState<string>();
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>();
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Enumerate devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Need permission first
        const tempStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        tempStream.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setSpeakerDevices(devices.filter((d) => d.kind === "audiooutput"));
      } catch (err) {
        console.error("Failed to enumerate devices:", err);
      }
    };
    getDevices();
  }, []);

  // Get camera/mic preview
  useEffect(() => {
    let active = true;

    const getStream = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: isMicOn
            ? { deviceId: selectedAudio ? { exact: selectedAudio } : undefined }
            : false,
          video: isCameraOn
            ? { deviceId: selectedVideo ? { exact: selectedVideo } : undefined }
            : false,
        };

        if (!isCameraOn && !isMicOn) {
          setStream(null);
          return;
        }

        const s = await navigator.mediaDevices.getUserMedia(constraints);
        if (active) {
          setStream(s);
          if (videoRef.current && isCameraOn) {
            videoRef.current.srcObject = s;
          }

          // Audio level meter
          if (isMicOn) {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(s);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!active) return;
              analyser.getByteFrequencyData(dataArray);
              const avg =
                dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
              setAudioLevel(avg / 255);
              requestAnimationFrame(updateLevel);
            };
            updateLevel();
          }
        }
      } catch (err) {
        console.error("Failed to get media stream:", err);
      }
    };

    getStream();

    return () => {
      active = false;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isCameraOn, isMicOn, selectedAudio, selectedVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const handleTestAudio = async () => {
    setIsTestingAudio(true);
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedAudio ? { exact: selectedAudio } : undefined },
      });

      const recorder = new MediaRecorder(testStream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        testStream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        if (selectedSpeaker && "setSinkId" in audio) {
          (audio as any).setSinkId(selectedSpeaker);
        }
        audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsTestingAudio(false);
        };
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000);
    } catch (err) {
      console.error("Audio test failed:", err);
      setIsTestingAudio(false);
    }
  };

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (!isHost) {
      setIsWaiting(true);
    }
    onJoin(displayName || userName, {
      audioDeviceId: selectedAudio,
      videoDeviceId: selectedVideo,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-950 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-purple-600/5 blur-3xl" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6">
        {/* Meeting info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{meetingTitle}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {isWaiting ? "Waiting for the host to let you in..." : "Set up your audio and video before joining"}
          </p>
        </div>

        {isWaiting ? (
          <div className="flex flex-col items-center space-y-4 rounded-2xl bg-gray-900/80 p-8 backdrop-blur-sm">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <Users className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-blue-400" />
            </div>
            <p className="text-lg font-medium text-white">
              Please wait, the host will let you in soon
            </p>
            <p className="text-sm text-gray-400">Meeting: {meetingTitle}</p>
          </div>
        ) : (
          <>
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
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-700 text-4xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Audio level indicator */}
              {isMicOn && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 w-1 rounded-full transition-all ${
                          audioLevel > i * 0.2
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                        style={{
                          height: `${8 + i * 4}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Preview controls */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`rounded-full p-3 transition-colors ${
                    isMicOn
                      ? "bg-gray-700/80 text-white hover:bg-gray-600"
                      : "bg-red-600 text-white hover:bg-red-700"
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
                  className={`rounded-full p-3 transition-colors ${
                    isCameraOn
                      ? "bg-gray-700/80 text-white hover:bg-gray-600"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isCameraOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`rounded-full p-3 transition-colors ${
                    showSettings
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700/80 text-white hover:bg-gray-600"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Device Settings */}
            {showSettings && (
              <div className="space-y-4 rounded-2xl bg-gray-900/80 p-4 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white">
                  Device Settings
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DeviceSelector
                    label="Microphone"
                    icon={Mic}
                    devices={audioDevices}
                    selectedId={selectedAudio}
                    onSelect={setSelectedAudio}
                  />
                  <DeviceSelector
                    label="Camera"
                    icon={Video}
                    devices={videoDevices}
                    selectedId={selectedVideo}
                    onSelect={setSelectedVideo}
                  />
                  <DeviceSelector
                    label="Speaker"
                    icon={Speaker}
                    devices={speakerDevices}
                    selectedId={selectedSpeaker}
                    onSelect={setSelectedSpeaker}
                  />
                </div>
                <button
                  onClick={handleTestAudio}
                  disabled={isTestingAudio}
                  className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-50"
                >
                  <Volume2 className="h-4 w-4" />
                  {isTestingAudio ? "Recording... (3s)" : "Test Audio"}
                </button>
              </div>
            )}

            {/* Name + Join */}
            <div className="space-y-4">
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

              <button
                onClick={handleJoin}
                disabled={!displayName.trim()}
                className="w-full rounded-xl bg-blue-600 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isHost ? "Join Meeting" : "Ask to Join"}
              </button>
            </div>
          </>
        )}

        {/* Host: Waiting participants list */}
        {isHost && waitingParticipants.length > 0 && (
          <div className="rounded-2xl bg-gray-900/80 p-4 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4" />
              Waiting to Join ({waitingParticipants.length})
            </h3>
            <div className="space-y-2">
              {waitingParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-800/50 px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-sm font-medium text-white">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-white">{p.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAdmit?.(p.id)}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeny?.(p.id)}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {waitingParticipants.length > 1 && (
                <button
                  onClick={() =>
                    waitingParticipants.forEach((p) => onAdmit?.(p.id))
                  }
                  className="w-full rounded-lg bg-green-600/20 py-2 text-sm font-medium text-green-400 hover:bg-green-600/30"
                >
                  Admit All
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
