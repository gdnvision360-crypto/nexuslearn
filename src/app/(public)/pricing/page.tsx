import { Metadata } from "next";
import { PricingTable } from "@/components/billing/PricingTable";
import {
  MessageCircleQuestion,
  Shield,
  Zap,
  Users,
  CreditCard,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - NexusLearn",
  description:
    "Simple, transparent pricing for teams of all sizes. Start free and scale as you grow.",
};

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount for the remainder of your billing cycle. When downgrading, you'll receive credit toward your next bill.",
  },
  {
    q: "What happens when my trial ends?",
    a: "If you don't subscribe to a paid plan, your account will automatically switch to the Free plan. You won't lose any data, but some features will become limited.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes! Save 20% by choosing annual billing. That's like getting over 2 months free every year.",
  },
  {
    q: "What does 'per user' mean?",
    a: "Each user in your workspace counts toward your plan's user limit. The Pro plan supports up to 100 users, and Enterprise is unlimited.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="px-4 pb-8 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the plan that fits your team
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Start free and scale as you grow. No hidden fees, no surprises.
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="px-4 py-8">
        <PricingTable />
      </section>

      {/* Trust Indicators */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                14-Day Money Back
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Not satisfied? Get a full refund within 14 days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Secure Payments
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Powered by Stripe. Your data is always encrypted.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Scale With You
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Easily add or remove users as your team changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Everything you need to know about our pricing
          </p>
        </div>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
            >
              <div className="flex items-start gap-3">
                <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-center text-white shadow-xl">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Need a custom solution?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-indigo-100">
            Our Enterprise plan includes unlimited everything, dedicated
            support, SLA guarantees, and custom integrations.
          </p>
          <a
            href="mailto:sales@nexuslearn.app?subject=Enterprise%20Plan%20Inquiry"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-indigo-700 shadow-lg transition-colors hover:bg-indigo-50"
          >
            Contact Sales
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
