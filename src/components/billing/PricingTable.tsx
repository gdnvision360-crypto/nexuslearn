"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CouponInput } from "./CouponInput";

interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  isDefault: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

const FEATURE_LABELS: Record<string, string> = {
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
  approval_workflow: "Approval Workflow",
  scorm: "SCORM Support",
};

const LIMIT_LABELS: Record<string, { label: string; format: (v: number) => string }> = {
  max_users: { label: "Users", format: (v) => (v === -1 ? "Unlimited" : `Up to ${v}`) },
  max_participants: { label: "Meeting Participants", format: (v) => (v === -1 ? "Unlimited" : `Up to ${v}`) },
  max_meeting_duration_min: {
    label: "Meeting Duration",
    format: (v) => (v === -1 ? "Unlimited" : v >= 1440 ? `${Math.floor(v / 60)} hours` : `${v} min`),
  },
  storage_gb: { label: "File Storage", format: (v) => (v === -1 ? "Unlimited" : `${v} GB`) },
  recording_storage_gb: { label: "Recording Storage", format: (v) => (v === -1 ? "Unlimited" : v === 0 ? "None" : `${v} GB`) },
  max_courses: { label: "LMS Courses", format: (v) => (v === -1 ? "Unlimited" : `${v}`) },
  max_social_accounts: { label: "Social Accounts", format: (v) => (v === -1 ? "Unlimited" : `${v}`) },
  max_social_posts_monthly: { label: "Posts/Month", format: (v) => (v === -1 ? "Unlimited" : `${v}`) },
  max_webinar_attendees: { label: "Webinar Attendees", format: (v) => (v === -1 ? "Unlimited" : v === 0 ? "N/A" : `Up to ${v.toLocaleString()}`) },
};

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  pro: Sparkles,
  enterprise: Building2,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-gray-200 dark:border-gray-700",
  pro: "border-indigo-500 ring-2 ring-indigo-500/20",
  enterprise: "border-gray-200 dark:border-gray-700",
};

export function PricingTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (session?.user) {
      fetchCurrentPlan();
    }
  }, [session]);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/billing/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCurrentPlan() {
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      setCurrentPlanSlug(data.plan?.slug || "free");
    } catch {
      setCurrentPlanSlug("free");
    }
  }

  async function handleSubscribe(planSlug: string) {
    if (!session?.user) {
      router.push("/auth/signin?callbackUrl=/pricing");
      return;
    }

    if (planSlug === "enterprise") {
      window.location.href = "mailto:sales@nexuslearn.app?subject=Enterprise%20Plan%20Inquiry";
      return;
    }

    if (planSlug === "free") return;

    setSubscribing(planSlug);
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          billingCycle: isYearly ? "YEARLY" : "MONTHLY",
          couponCode: couponValid ? couponCode : undefined,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="mb-10 flex items-center justify-center gap-4">
        <span
          className={cn(
            "text-sm font-medium",
            !isYearly ? "text-gray-900 dark:text-white" : "text-gray-500"
          )}
        >
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={cn(
            "relative inline-flex h-7 w-14 items-center rounded-full transition-colors",
            isYearly ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
              isYearly ? "translate-x-8" : "translate-x-1"
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium",
            isYearly ? "text-gray-900 dark:text-white" : "text-gray-500"
          )}
        >
          Yearly
        </span>
        {isYearly && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Save 20%
          </span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.slug] || Zap;
          const isPopular = plan.slug === "pro";
          const isCurrent = currentPlanSlug === plan.slug;
          const isEnterprise = plan.slug === "enterprise";
          const price = isYearly
            ? plan.yearlyPrice / 12
            : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-lg dark:bg-gray-900",
                PLAN_COLORS[plan.slug],
                isPopular && "scale-[1.02]"
              )}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      plan.slug === "free" && "bg-gray-100 dark:bg-gray-800",
                      plan.slug === "pro" && "bg-indigo-100 dark:bg-indigo-900/30",
                      plan.slug === "enterprise" && "bg-purple-100 dark:bg-purple-900/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        plan.slug === "free" && "text-gray-600 dark:text-gray-400",
                        plan.slug === "pro" && "text-indigo-600 dark:text-indigo-400",
                        plan.slug === "enterprise" && "text-purple-600 dark:text-purple-400"
                      )}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {isEnterprise ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      Custom
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${price.toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /mo per user
                    </span>
                  </div>
                )}
                {isYearly && !isEnterprise && plan.yearlyPrice > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    ${plan.yearlyPrice}/year · Billed annually
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan.slug)}
                disabled={isCurrent || subscribing === plan.slug}
                className={cn(
                  "mb-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors",
                  isCurrent
                    ? "cursor-default bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    : plan.slug === "pro"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : plan.slug === "enterprise"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                )}
              >
                {subscribing === plan.slug ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Current Plan"
                ) : isEnterprise ? (
                  "Contact Sales"
                ) : plan.slug === "free" ? (
                  "Get Started"
                ) : (
                  "Upgrade Now"
                )}
              </button>

              {/* Limits */}
              <div className="mb-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Includes
                </p>
                {Object.entries(plan.limits).map(([key, value]) => {
                  const limDef = LIMIT_LABELS[key];
                  if (!limDef) return null;
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{limDef.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {limDef.format(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Feature Checks */}
              <div className="space-y-3 border-t border-gray-100 pt-6 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Features
                </p>
                {Object.entries(plan.features).map(([key, enabled]) => {
                  const label = FEATURE_LABELS[key];
                  if (!label) return null;
                  return (
                    <div key={key} className="flex items-center gap-3 text-sm">
                      {enabled ? (
                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                      )}
                      <span
                        className={cn(
                          enabled
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-600"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Input */}
      <div className="mx-auto mt-10 max-w-md">
        <CouponInput
          onValidCoupon={(code) => {
            setCouponCode(code);
            setCouponValid(true);
          }}
          onClear={() => {
            setCouponCode("");
            setCouponValid(false);
          }}
        />
      </div>
    </div>
  );
}
