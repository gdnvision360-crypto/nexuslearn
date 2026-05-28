import { Metadata } from "next";
import { BillingDashboard } from "@/components/billing/BillingDashboard";

export const metadata: Metadata = {
  title: "Billing & Subscription",
};

export default function BillingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage your subscription, view invoices, and track usage
        </p>
      </div>
      <BillingDashboard />
    </div>
  );
}
