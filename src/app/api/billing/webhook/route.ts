import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import Stripe from "stripe";

// Disable body parsing for webhook signature verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planSlug = session.metadata?.planSlug;
  const billingCycle = session.metadata?.billingCycle as "MONTHLY" | "YEARLY" | undefined;

  if (!userId || !planSlug) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) {
    console.error("Plan not found:", planSlug);
    return;
  }

  // Retrieve full subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Cancel any existing active subscriptions for this user
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    data: { status: "CANCELED" },
  });

  // Create new subscription record
  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      billingCycle: billingCycle || "MONTHLY",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      quantity: 1,
    },
  });

  console.log(`Subscription activated for user ${userId} on plan ${planSlug}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string;
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.error("Subscription not found for invoice:", invoice.id);
    return;
  }

  // Ensure subscription is active
  if (subscription.status !== "ACTIVE") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE" },
    });
  }

  // Record invoice
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: "PAID",
      paidAt: new Date(),
      amount: (invoice.amount_paid ?? 0) / 100,
      invoiceUrl: invoice.hosted_invoice_url ?? undefined,
      invoicePdf: invoice.invoice_pdf ?? undefined,
    },
    create: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid ?? 0) / 100,
      currency: invoice.currency.toUpperCase(),
      status: "PAID",
      paidAt: new Date(),
      invoiceUrl: invoice.hosted_invoice_url ?? undefined,
      invoicePdf: invoice.invoice_pdf ?? undefined,
      periodStart: new Date((invoice.period_start ?? 0) * 1000),
      periodEnd: new Date((invoice.period_end ?? 0) * 1000),
    },
  });

  console.log(`Invoice paid: ${invoice.id}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = invoice.subscription as string;
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });

  // Record failed invoice
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: { status: "FAILED" },
    create: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_due ?? 0) / 100,
      currency: invoice.currency.toUpperCase(),
      status: "FAILED",
      invoiceUrl: invoice.hosted_invoice_url ?? undefined,
      invoicePdf: invoice.invoice_pdf ?? undefined,
      periodStart: new Date((invoice.period_start ?? 0) * 1000),
      periodEnd: new Date((invoice.period_end ?? 0) * 1000),
    },
  });

  console.log(`Invoice payment failed: ${invoice.id}`);
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    paused: "PAUSED",
  };

  const status = statusMap[stripeSubscription.status] || "ACTIVE";

  // Check if plan changed via price
  const newPriceId = stripeSubscription.items.data[0]?.price.id;
  let newPlanId = subscription.planId;

  if (newPriceId) {
    const matchedPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: newPriceId },
          { stripePriceIdYearly: newPriceId },
        ],
      },
    });
    if (matchedPlan) {
      newPlanId = matchedPlan.id;
    }
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: status as any,
      planId: newPlanId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  console.log(`Subscription updated: ${stripeSubscription.id}`);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription canceled: ${stripeSubscription.id}`);
}
