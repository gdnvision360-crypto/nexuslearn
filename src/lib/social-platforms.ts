import { SocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ── Platform Configuration ──────────────────────────────────
export const PLATFORM_CONFIG: Record<
  SocialPlatform,
  {
    name: string;
    maxLength: number;
    supportsMedia: boolean;
    mediaTypes: string[];
    maxMediaCount: number;
    color: string;
    icon: string;
    oauthUrl?: string;
  }
> = {
  TWITTER: {
    name: "Twitter / X",
    maxLength: 280,
    supportsMedia: true,
    mediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxMediaCount: 4,
    color: "#1DA1F2",
    icon: "twitter",
    oauthUrl: "https://twitter.com/i/oauth2/authorize",
  },
  LINKEDIN: {
    name: "LinkedIn",
    maxLength: 3000,
    supportsMedia: true,
    mediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxMediaCount: 9,
    color: "#0A66C2",
    icon: "linkedin",
    oauthUrl: "https://www.linkedin.com/oauth/v2/authorization",
  },
  FACEBOOK: {
    name: "Facebook",
    maxLength: 63206,
    supportsMedia: true,
    mediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxMediaCount: 10,
    color: "#1877F2",
    icon: "facebook",
    oauthUrl: "https://www.facebook.com/v18.0/dialog/oauth",
  },
  INSTAGRAM: {
    name: "Instagram",
    maxLength: 2200,
    supportsMedia: true,
    mediaTypes: ["image/jpeg", "image/png", "video/mp4"],
    maxMediaCount: 10,
    color: "#E4405F",
    icon: "instagram",
    oauthUrl: "https://api.instagram.com/oauth/authorize",
  },
  YOUTUBE: {
    name: "YouTube",
    maxLength: 5000,
    supportsMedia: true,
    mediaTypes: ["video/mp4", "video/webm"],
    maxMediaCount: 1,
    color: "#FF0000",
    icon: "youtube",
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  TIKTOK: {
    name: "TikTok",
    maxLength: 2200,
    supportsMedia: true,
    mediaTypes: ["video/mp4"],
    maxMediaCount: 1,
    color: "#000000",
    icon: "tiktok",
    oauthUrl: "https://www.tiktok.com/v2/auth/authorize/",
  },
};

// ── Platform API Clients ────────────────────────────────────

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

interface AnalyticsData {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

// Twitter/X API
async function publishToTwitter(
  accessToken: string,
  content: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  try {
    // Upload media first if present
    const mediaIds: string[] = [];
    for (const url of mediaUrls) {
      const mediaRes = await fetch(
        "https://upload.twitter.com/1.1/media/upload.json",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ media_data: url }),
        }
      );
      if (mediaRes.ok) {
        const data = await mediaRes.json();
        mediaIds.push(data.media_id_string);
      }
    }

    const body: any = { text: content };
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds };
    }

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.detail || "Failed to post to Twitter" };
    }

    const data = await res.json();
    return {
      success: true,
      platformPostId: data.data.id,
      platformUrl: `https://twitter.com/i/web/status/${data.data.id}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// LinkedIn API
async function publishToLinkedIn(
  accessToken: string,
  content: string,
  _mediaUrls: string[],
  platformId: string
): Promise<PublishResult> {
  try {
    const body = {
      author: `urn:li:person:${platformId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || "Failed to post to LinkedIn" };
    }

    const data = await res.json();
    const postId = data.id;
    return {
      success: true,
      platformPostId: postId,
      platformUrl: `https://www.linkedin.com/feed/update/${postId}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Facebook Graph API
async function publishToFacebook(
  accessToken: string,
  content: string,
  mediaUrls: string[],
  platformId: string
): Promise<PublishResult> {
  try {
    let endpoint = `https://graph.facebook.com/v18.0/${platformId}/feed`;
    const params: any = { message: content, access_token: accessToken };

    if (mediaUrls.length > 0) {
      endpoint = `https://graph.facebook.com/v18.0/${platformId}/photos`;
      params.url = mediaUrls[0];
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || "Failed to post to Facebook" };
    }

    const data = await res.json();
    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Instagram Graph API
async function publishToInstagram(
  accessToken: string,
  content: string,
  mediaUrls: string[],
  platformId: string
): Promise<PublishResult> {
  try {
    if (mediaUrls.length === 0) {
      return { success: false, error: "Instagram requires at least one image or video" };
    }

    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${platformId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption: content,
          access_token: accessToken,
        }),
      }
    );

    if (!containerRes.ok) {
      const err = await containerRes.json();
      return { success: false, error: err.error?.message || "Failed to create Instagram media" };
    }

    const container = await containerRes.json();

    // Step 2: Publish media container
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${platformId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.json();
      return { success: false, error: err.error?.message || "Failed to publish to Instagram" };
    }

    const data = await publishRes.json();
    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.instagram.com/p/${data.id}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// YouTube Community Post (limited API)
async function publishToYouTube(
  accessToken: string,
  content: string,
  _mediaUrls: string[]
): Promise<PublishResult> {
  try {
    // YouTube Data API v3 — community posts are limited
    // This posts a community post (text only via API)
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/activities?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            description: content,
          },
        }),
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: "YouTube community posts have limited API support. Consider using the web intent URL.",
      };
    }

    const data = await res.json();
    return {
      success: true,
      platformPostId: data.id,
      platformUrl: `https://www.youtube.com/post/${data.id}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// TikTok Video Sharing API
async function publishToTikTok(
  accessToken: string,
  content: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  try {
    if (mediaUrls.length === 0) {
      return { success: false, error: "TikTok requires a video to publish" };
    }

    const res = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: content,
            privacy_level: "PUBLIC_TO_EVERYONE",
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: mediaUrls[0],
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || "Failed to post to TikTok" };
    }

    const data = await res.json();
    return {
      success: true,
      platformPostId: data.data?.publish_id,
      platformUrl: undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Main Publish Router ─────────────────────────────────────

export async function publishToPlatform(
  account: {
    platform: SocialPlatform;
    accessToken: string;
    platformId: string;
  },
  content: string,
  mediaUrls: string[] = []
): Promise<PublishResult> {
  switch (account.platform) {
    case "TWITTER":
      return publishToTwitter(account.accessToken, content, mediaUrls);
    case "LINKEDIN":
      return publishToLinkedIn(account.accessToken, content, mediaUrls, account.platformId);
    case "FACEBOOK":
      return publishToFacebook(account.accessToken, content, mediaUrls, account.platformId);
    case "INSTAGRAM":
      return publishToInstagram(account.accessToken, content, mediaUrls, account.platformId);
    case "YOUTUBE":
      return publishToYouTube(account.accessToken, content, mediaUrls);
    case "TIKTOK":
      return publishToTikTok(account.accessToken, content, mediaUrls);
    default:
      return { success: false, error: `Unsupported platform: ${account.platform}` };
  }
}

// ── Fetch Analytics ─────────────────────────────────────────

export async function fetchAnalytics(
  account: {
    platform: SocialPlatform;
    accessToken: string;
    platformId: string;
  },
  platformPostId: string
): Promise<AnalyticsData> {
  const defaultData: AnalyticsData = {
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
    engagementRate: 0,
  };

  try {
    switch (account.platform) {
      case "TWITTER": {
        const res = await fetch(
          `https://api.twitter.com/2/tweets/${platformPostId}?tweet.fields=public_metrics`,
          { headers: { Authorization: `Bearer ${account.accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const metrics = data.data?.public_metrics;
          if (metrics) {
            const totalEngagement =
              metrics.like_count + metrics.reply_count + metrics.retweet_count;
            return {
              impressions: metrics.impression_count || 0,
              reach: metrics.impression_count || 0,
              likes: metrics.like_count || 0,
              comments: metrics.reply_count || 0,
              shares: metrics.retweet_count || 0,
              clicks: metrics.url_link_clicks || 0,
              engagementRate:
                metrics.impression_count > 0
                  ? (totalEngagement / metrics.impression_count) * 100
                  : 0,
            };
          }
        }
        return defaultData;
      }

      case "LINKEDIN": {
        const res = await fetch(
          `https://api.linkedin.com/v2/socialActions/${platformPostId}`,
          {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          return {
            impressions: data.totalShareStatistics?.impressionCount || 0,
            reach: data.totalShareStatistics?.uniqueImpressionsCount || 0,
            likes: data.likesSummary?.totalLikes || 0,
            comments: data.commentsSummary?.totalFirstLevelComments || 0,
            shares: data.totalShareStatistics?.shareCount || 0,
            clicks: data.totalShareStatistics?.clickCount || 0,
            engagementRate: data.totalShareStatistics?.engagementRate || 0,
          };
        }
        return defaultData;
      }

      case "FACEBOOK": {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${platformPostId}/insights?metric=post_impressions,post_reach,post_reactions_by_type_total,post_clicks&access_token=${account.accessToken}`
        );
        if (res.ok) {
          const data = await res.json();
          const metrics: Record<string, number> = {};
          for (const item of data.data || []) {
            metrics[item.name] = item.values?.[0]?.value || 0;
          }
          return {
            impressions: metrics.post_impressions || 0,
            reach: metrics.post_reach || 0,
            likes:
              typeof metrics.post_reactions_by_type_total === "object"
                ? Object.values(metrics.post_reactions_by_type_total).reduce(
                    (a: number, b: number) => a + b,
                    0
                  )
                : 0,
            comments: 0,
            shares: 0,
            clicks: metrics.post_clicks || 0,
            engagementRate: 0,
          };
        }
        return defaultData;
      }

      default:
        return defaultData;
    }
  } catch {
    return defaultData;
  }
}

// ── OAuth Token Refresh ─────────────────────────────────────

export async function refreshToken(accountId: string): Promise<boolean> {
  try {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.refreshToken) return false;

    let tokenUrl: string;
    let body: Record<string, string>;

    switch (account.platform) {
      case "TWITTER":
        tokenUrl = "https://api.twitter.com/2/oauth2/token";
        body = {
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
          client_id: process.env.TWITTER_CLIENT_ID!,
        };
        break;
      case "LINKEDIN":
        tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
        body = {
          grant_type: "refresh_token",
          refresh_token: account.refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        };
        break;
      case "FACEBOOK":
      case "INSTAGRAM":
        tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
        body = {
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_CLIENT_ID!,
          client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
          fb_exchange_token: account.accessToken,
        };
        break;
      default:
        return false;
    }

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });

    if (!res.ok) return false;

    const data = await res.json();

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || account.refreshToken,
        tokenExpiry: data.expires_in
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
      },
    });

    return true;
  } catch {
    return false;
  }
}

// ── Web Intent URLs (Fallback) ──────────────────────────────

export function generateShareUrl(
  platform: SocialPlatform,
  content: string,
  url?: string
): string {
  const encodedContent = encodeURIComponent(content);
  const encodedUrl = url ? encodeURIComponent(url) : "";

  switch (platform) {
    case "TWITTER":
      return `https://twitter.com/intent/tweet?text=${encodedContent}${url ? `&url=${encodedUrl}` : ""}`;
    case "LINKEDIN":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "FACEBOOK":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedContent}`;
    case "INSTAGRAM":
      return ""; // Instagram doesn't support web intent sharing
    case "YOUTUBE":
      return ""; // YouTube doesn't support web intent text sharing
    case "TIKTOK":
      return ""; // TikTok doesn't support web intent sharing
    default:
      return "";
  }
}

// ── Content Validation ──────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  characterCount: number;
  maxLength: number;
}

export function validateContent(
  platform: SocialPlatform,
  content: string,
  mediaUrls: string[] = []
): ValidationResult {
  const config = PLATFORM_CONFIG[platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.trim()) {
    errors.push("Content cannot be empty");
  }

  if (content.length > config.maxLength) {
    errors.push(
      `Content exceeds ${config.name} limit of ${config.maxLength} characters (${content.length})`
    );
  }

  if (content.length > config.maxLength * 0.9) {
    warnings.push("Content is approaching the character limit");
  }

  if (mediaUrls.length > config.maxMediaCount) {
    errors.push(
      `${config.name} allows a maximum of ${config.maxMediaCount} media files`
    );
  }

  // Platform-specific validations
  if (platform === "INSTAGRAM" && mediaUrls.length === 0) {
    errors.push("Instagram posts require at least one image or video");
  }

  if (platform === "TIKTOK" && mediaUrls.length === 0) {
    errors.push("TikTok posts require a video");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    characterCount: content.length,
    maxLength: config.maxLength,
  };
}
