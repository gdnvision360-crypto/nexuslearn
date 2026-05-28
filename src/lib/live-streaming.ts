"use server";

// ============================================================
// Types
// ============================================================

export type StreamPlatform = "youtube" | "twitch" | "facebook" | "custom";
export type StreamStatus = "idle" | "connecting" | "live" | "error";

export interface StreamTarget {
  id: string;
  platform: StreamPlatform;
  rtmpUrl: string;
  streamKey: string;
  status: StreamStatus;
  startedAt?: string;
  viewerCount?: number;
  errorMessage?: string;
}

export interface StreamHealth {
  bitrate: number;
  droppedFrames: number;
  fps: number;
  resolution: string;
  uptime: number;
}

export interface StreamOverlay {
  enabled: boolean;
  text: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  fontSize: number;
  color: string;
  backgroundColor: string;
}

export interface StreamConfig {
  targets: StreamTarget[];
  overlay: StreamOverlay;
  layout: "grid" | "speaker" | "screen-share" | "custom";
  resolution: "720p" | "1080p" | "480p";
  bitrate: number;
  countdownSeconds: number;
}

interface EgressInfo {
  egressId: string;
  roomName: string;
  status: string;
}

// ============================================================
// Platform RTMP defaults
// ============================================================

const PLATFORM_RTMP_URLS: Record<StreamPlatform, string> = {
  youtube: "rtmp://a.rtmp.youtube.com/live2",
  twitch: "rtmp://live.twitch.tv/app",
  facebook: "rtmps://live-api-s.facebook.com:443/rtmp/",
  custom: "",
};

export function getDefaultRtmpUrl(platform: StreamPlatform): string {
  return PLATFORM_RTMP_URLS[platform] || "";
}

// ============================================================
// Resolution presets
// ============================================================

const RESOLUTION_PRESETS: Record<string, { width: number; height: number; maxBitrate: number }> = {
  "480p": { width: 854, height: 480, maxBitrate: 2_000_000 },
  "720p": { width: 1280, height: 720, maxBitrate: 4_500_000 },
  "1080p": { width: 1920, height: 1080, maxBitrate: 8_000_000 },
};

// ============================================================
// LiveStreamingService
// ============================================================

export class LiveStreamingService {
  private livekitUrl: string;
  private livekitApiKey: string;
  private livekitApiSecret: string;

  constructor() {
    this.livekitUrl = process.env.LIVEKIT_URL || "";
    this.livekitApiKey = process.env.LIVEKIT_API_KEY || "";
    this.livekitApiSecret = process.env.LIVEKIT_API_SECRET || "";
  }

  /**
   * Start streaming a room to one or more RTMP targets
   * using LiveKit Egress API (RoomCompositeEgress with StreamOutput).
   */
  async startStream(
    roomName: string,
    targets: StreamTarget[],
    config?: Partial<StreamConfig>
  ): Promise<{ egressId: string; targets: StreamTarget[] }> {
    const resolution = RESOLUTION_PRESETS[config?.resolution || "720p"];
    const rtmpUrls = targets.map(
      (t) => `${t.rtmpUrl}/${t.streamKey}`
    );

    // Build LiveKit Egress request
    const egressRequest = {
      room_name: roomName,
      layout: config?.layout || "grid",
      stream_outputs: [
        {
          protocol: "RTMP",
          urls: rtmpUrls,
        },
      ],
      options: {
        width: resolution.width,
        height: resolution.height,
        video_bitrate: config?.bitrate || resolution.maxBitrate,
        framerate: 30,
      },
    };

    try {
      const response = await fetch(
        `${this.livekitUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.generateEgressToken()}`,
          },
          body: JSON.stringify(egressRequest),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("LiveKit Egress start failed:", errorText);
        return {
          egressId: "",
          targets: targets.map((t) => ({
            ...t,
            status: "error" as StreamStatus,
            errorMessage: "Failed to start stream via LiveKit Egress",
          })),
        };
      }

      const data = (await response.json()) as EgressInfo;
      const updatedTargets = targets.map((t) => ({
        ...t,
        status: "connecting" as StreamStatus,
        startedAt: new Date().toISOString(),
      }));

      return { egressId: data.egressId, targets: updatedTargets };
    } catch (error) {
      console.error("Stream start error:", error);
      return {
        egressId: "",
        targets: targets.map((t) => ({
          ...t,
          status: "error" as StreamStatus,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })),
      };
    }
  }

  /**
   * Stop an active stream by egress ID.
   */
  async stopStream(egressId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.livekitUrl}/twirp/livekit.Egress/StopEgress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.generateEgressToken()}`,
          },
          body: JSON.stringify({ egress_id: egressId }),
        }
      );

      return { success: response.ok };
    } catch (error) {
      console.error("Stream stop error:", error);
      return { success: false };
    }
  }

  /**
   * Get stream status from LiveKit Egress.
   */
  async getStreamStatus(
    egressId: string
  ): Promise<{ status: StreamStatus; health: StreamHealth | null }> {
    try {
      const response = await fetch(
        `${this.livekitUrl}/twirp/livekit.Egress/ListEgress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.generateEgressToken()}`,
          },
          body: JSON.stringify({ egress_id: egressId }),
        }
      );

      if (!response.ok) {
        return { status: "error", health: null };
      }

      const data = (await response.json()) as {
        items?: Array<{
          status: string;
          stream_results?: Array<{
            duration?: number;
            started_at?: number;
          }>;
        }>;
      };
      const egress = data.items?.[0];

      if (!egress) {
        return { status: "idle", health: null };
      }

      const statusMap: Record<string, StreamStatus> = {
        EGRESS_STARTING: "connecting",
        EGRESS_ACTIVE: "live",
        EGRESS_ENDING: "connecting",
        EGRESS_COMPLETE: "idle",
        EGRESS_FAILED: "error",
      };

      const status = statusMap[egress.status] || "idle";
      const streamResult = egress.stream_results?.[0];

      const health: StreamHealth | null = status === "live"
        ? {
            bitrate: 0,
            droppedFrames: 0,
            fps: 30,
            resolution: "1280x720",
            uptime: streamResult?.duration || 0,
          }
        : null;

      return { status, health };
    } catch (error) {
      console.error("Get stream status error:", error);
      return { status: "error", health: null };
    }
  }

  /**
   * Generate a JWT token for LiveKit Egress API authentication.
   */
  private async generateEgressToken(): Promise<string> {
    // In production, use livekit-server-sdk to generate a proper JWT:
    // import { AccessToken } from 'livekit-server-sdk';
    // const token = new AccessToken(apiKey, apiSecret, { ttl: 600 });
    // token.addGrant({ roomAdmin: true, room: '*' });
    // return token.toJwt();

    // Simplified placeholder - should use livekit-server-sdk
    const payload = {
      iss: this.livekitApiKey,
      exp: Math.floor(Date.now() / 1000) + 600,
      video: { roomAdmin: true, room: "*" },
    };

    // Base64 encode for placeholder (replace with proper JWT in production)
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  /**
   * Get default stream configuration.
   */
  static getDefaultConfig(): StreamConfig {
    return {
      targets: [],
      overlay: {
        enabled: false,
        text: "",
        position: "bottom-left",
        fontSize: 16,
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.5)",
      },
      layout: "grid",
      resolution: "720p",
      bitrate: 4_500_000,
      countdownSeconds: 3,
    };
  }

  /**
   * Get platform display info.
   */
  static getPlatformInfo(platform: StreamPlatform): {
    name: string;
    color: string;
    icon: string;
  } {
    const platforms: Record<StreamPlatform, { name: string; color: string; icon: string }> = {
      youtube: { name: "YouTube Live", color: "#FF0000", icon: "youtube" },
      twitch: { name: "Twitch", color: "#9146FF", icon: "twitch" },
      facebook: { name: "Facebook Live", color: "#1877F2", icon: "facebook" },
      custom: { name: "Custom RTMP", color: "#6B7280", icon: "radio" },
    };
    return platforms[platform];
  }
}

// Singleton
let liveStreamingServiceInstance: LiveStreamingService | null = null;

export function getLiveStreamingService(): LiveStreamingService {
  if (!liveStreamingServiceInstance) {
    liveStreamingServiceInstance = new LiveStreamingService();
  }
  return liveStreamingServiceInstance;
}
