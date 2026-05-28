import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ── Feature display names ──────────────────────────────────
export const FEATURES = {
  cloud_recording: "Cloud Recording",
  webinars: "Webinars",
  live_streaming: "Live Streaming",
  ai_minutes: "AI Meeting Minutes",
  pdf_export_minutes: "PDF Export (Minutes)",
  admin_dashboard: "Admin Dashboard",
  custom_branding: "Custom Branding",
  white_label: "White Label",
  sso_saml: "SSO/SAML",
  api_access: "API Access",
  priority_support: "Priority Support",
  dedicated_support: "Dedicated Support",
  advanced_analytics: "Advanced Analytics",
  custom_reports: "Custom Reports",
  approval_workflow: "Approval Workflow (Minutes)",
  scorm: "SCORM Support",
} as const;

export type FeatureKey = keyof typeof FEATURES;

// ── Limit display names ────────────────────────────────────
export const LIMITS = {
  max_users: "Maximum Users",
  max_participants: "Max Meeting Participants",
  max_meeting_duration_min: "Meeting Duration (min)",
  storage_gb: "File Storage (GB)",
  recording_storage_gb: "Recording Storage (GB)",
  max_courses: "Maximum Courses",
  max_social_accounts: "Social Media Accounts",
  max_social_posts_monthly: "Social Posts per Month",
  max_webinar_attendees: "Webinar Attendees",
} as const;

export type LimitKey = keyof typeof LIMITS;

// ── Usage summary types ────────────────────────────────────
export interface UsageSummary {
  planName: string;
  planSlug: string;
  features: Record<string, boolean>;
  limits: Record<string, { limit: number; used: number; remaining: number; percentage: number }>;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

// ── Get active subscription + plan for a user ──────────────
export async function getUserPlan(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: {
        include: {
          features: true,
          limits: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (subscription) {
    return subscription.plan;
  }

  // Fall back to free plan
  const freePlan = await prisma.plan.findUnique({
    where: { slug: "free" },
    include: {
      features: true,
      limits: true,
    },
  });

  return freePlan;
}

// ── Check if user has access to a feature ──────────────────
export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  if (!plan) return false;

  const planFeature = plan.features.find((f) => f.feature === feature);
  return planFeature?.enabled ?? false;
}

// ── Check if user is within a numeric limit ────────────────
export async function checkLimit(
  userId: string,
  limitKey: string,
  currentUsage?: number
): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  if (!plan) {
    return { allowed: false, limit: 0, used: currentUsage ?? 0, remaining: 0 };
  }

  const planLimit = plan.limits.find((l) => l.limitKey === limitKey);
  const limit = planLimit?.value ?? 0;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, used: currentUsage ?? 0, remaining: Infinity };
  }

  const used = currentUsage ?? (await getCurrentUsage(userId, limitKey));
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    limit,
    used,
    remaining,
  };
}

// ── Get current usage for a limit key ──────────────────────
async function getCurrentUsage(userId: string, limitKey: string): Promise<number> {
  switch (limitKey) {
    case "max_courses": {
      return prisma.course.count({ where: { instructorId: userId } });
    }
    case "max_social_accounts": {
      return prisma.socialAccount.count({ where: { userId } });
    }
    case "max_social_posts_monthly": {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return prisma.socialPost.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });
    }
    case "storage_gb": {
      const files = await prisma.file.aggregate({
        where: { uploadedById: userId },
        _sum: { size: true },
      });
      return (files._sum.size ?? 0) / (1024 * 1024 * 1024); // bytes to GB
    }
    case "recording_storage_gb": {
      // Would query recording storage - placeholder returns 0
      return 0;
    }
    case "max_users": {
      // Organization user count - placeholder
      return 1;
    }
    default:
      return 0;
  }
}

// ── Get full usage summary ─────────────────────────────────
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const plan = await getUserPlan(userId);
  if (!plan) {
    return {
      planName: "Free",
      planSlug: "free",
      features: {},
      limits: {},
    };
  }

  const features: Record<string, boolean> = {};
  for (const f of plan.features) {
    features[f.feature] = f.enabled;
  }

  const limits: UsageSummary["limits"] = {};
  for (const l of plan.limits) {
    const used = await getCurrentUsage(userId, l.limitKey);
    const limit = l.value;
    const remaining = limit === -1 ? Infinity : Math.max(0, limit - used);
    const percentage = limit === -1 ? 0 : limit === 0 ? 100 : Math.round((used / limit) * 100);

    limits[l.limitKey] = { limit, used, remaining, percentage };
  }

  return {
    planName: plan.name,
    planSlug: plan.slug,
    features,
    limits,
  };
}

// ── Record usage increment ─────────────────────────────────
export async function recordUsage(
  subscriptionId: string,
  metric: string,
  value: number
): Promise<void> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  await prisma.usageRecord.create({
    data: {
      subscriptionId,
      metric,
      value,
      period: startOfMonth,
    },
  });
}

// ── Middleware: Feature gate for API routes ─────────────────
export function withFeatureGate(feature: string) {
  return function (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest, context?: any): Promise<NextResponse> {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allowed = await hasFeature(session.user.id, feature);
        if (!allowed) {
          return NextResponse.json(
            {
              error: "Feature not available",
              feature,
              message: `Your current plan does not include ${FEATURES[feature as FeatureKey] ?? feature}. Please upgrade to access this feature.`,
              upgradeUrl: "/pricing",
            },
            { status: 403 }
          );
        }

        return handler(req, context);
      } catch (error) {
        console.error("Feature gate error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    };
  };
}

// ── Middleware: Limit check for API routes ──────────────────
export function withLimitCheck(limitKey: string) {
  return function (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest, context?: any): Promise<NextResponse> {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await checkLimit(session.user.id, limitKey);
        if (!result.allowed) {
          return NextResponse.json(
            {
              error: "Limit reached",
              limitKey,
              message: `You've reached your limit of ${result.limit} for ${LIMITS[limitKey as LimitKey] ?? limitKey}. Please upgrade your plan.`,
              limit: result.limit,
              used: result.used,
              upgradeUrl: "/pricing",
            },
            { status: 403 }
          );
        }

        return handler(req, context);
      } catch (error) {
        console.error("Limit check error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    };
  };
}
