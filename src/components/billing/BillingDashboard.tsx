"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanBadge } from "./PlanBadge";
import { UsageIndicator } from "./UsageIndicator";
import { InvoiceTable } from "./InvoiceTable";

interface SubscriptionData {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEndsAt: string | null;
  quantity: number;
}

interface PlanData {
  name: string;
  slug: string;
  description: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

interface UsageData {
  planName: string;
  planSlug: string;
  features: Record<string, boolean>;
  limits: Record<string, { limit: number; used: number; remaining: number; percentage: number }>;
}

type Tab = "overview" | "invoices" | "usage" | "payment";

export function BillingDashboard() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      setSubscription(data.subscription);
      setPlan(data.plan);
      setUsage(data.usage);
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of the billing period.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/subscription", { method: "DELETE" });
      if (res.ok) {
        await fetchBillingData();
      }
    } catch (error) {
      console.error("Error canceling:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResumeSubscription() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/subscription/resume", { method: "POST" });
      if (res.ok) {
        await fetchBillingData();
      }
    } catch (error) {
      console.error("Error resuming:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function openPortal() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening portal:", error);
    } finally {
      setActionLoading(false);
    }
  }

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: CreditCard },
    { id: "invoices" as Tab, label: "Invoices", icon: FileText },
    { id: "usage" as Tab, label: "Usage", icon: BarChart3 },
    { id: "payment" as Tab, label: "Payment Method", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Your subscription has been activated successfully!
          </p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Checkout was canceled. No charges were made.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Plan
                  </h3>
                  <PlanBadge plan={plan?.slug || "free"} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {plan?.description}
                </p>
              </div>
              <a
                href="/pricing"
                className="flex items-center gap-1 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
              >
                Change Plan
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {subscription && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Billing Cycle
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {subscription.billingCycle === "YEARLY" ? "Annual" : "Monthly"}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Next Billing Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        subscription.status === "ACTIVE" && "bg-green-500",
                        subscription.status === "TRIALING" && "bg-blue-500",
                        subscription.status === "PAST_DUE" && "bg-red-500",
                        subscription.status === "CANCELED" && "bg-gray-500"
                      )}
                    />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {subscription.cancelAtPeriodEnd ? "Canceling" : subscription.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel/Resume Actions */}
            {subscription && (
              <div className="mt-6 flex gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={actionLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Resuming..." : "Resume Subscription"}
                  </button>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {actionLoading ? "Canceling..." : "Cancel Subscription"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Usage Overview */}
          {usage && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Usage Overview
              </h3>
              <UsageIndicator usage={usage} />
            </div>
          )}
        </div>
      )}

      {activeTab === "invoices" && <InvoiceTable />}

      {activeTab === "usage" && usage && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Usage
          </h3>
          <UsageIndicator usage={usage} detailed />
        </div>
      )}

      {activeTab === "payment" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Payment Method
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Manage your payment methods and billing information through the Stripe Customer Portal.
          </p>
          <button
            onClick={openPortal}
            disabled={actionLoading || !subscription}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Open Billing Portal
          </button>
          {!subscription && (
            <p className="mt-3 text-xs text-gray-400">
              Subscribe to a paid plan to manage payment methods.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
