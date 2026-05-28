import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCheckoutSession,
  cancelSubscription,
  updateSubscription,
} from "@/lib/stripe";
import { getUsageSummary } from "@/lib/feature-gate";

// GET: Get current user's subscription, plan, and usage
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
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

    const usage = await getUsageSummary(session.user.id);

    if (!subscription) {
      // Return free plan info
      const freePlan = await prisma.plan.findUnique({
        where: { slug: "free" },
        include: { features: true, limits: true },
      });

      return NextResponse.json({
        subscription: null,
        plan: freePlan
          ? {
              name: freePlan.name,
              slug: freePlan.slug,
              description: freePlan.description,
              features: Object.fromEntries(
                freePlan.features.map((f) => [f.feature, f.enabled])
              ),
              limits: Object.fromEntries(
                freePlan.limits.map((l) => [l.limitKey, l.value])
              ),
            }
          : null,
        usage,
      });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialEndsAt: subscription.trialEndsAt,
        quantity: subscription.quantity,
      },
      plan: {
        name: subscription.plan.name,
        slug: subscription.plan.slug,
        description: subscription.plan.description,
        monthlyPrice: subscription.plan.monthlyPrice,
        yearlyPrice: subscription.plan.yearlyPrice,
        features: Object.fromEntries(
          subscription.plan.features.map((f) => [f.feature, f.enabled])
        ),
        limits: Object.fromEntries(
          subscription.plan.limits.map((l) => [l.limitKey, l.value])
        ),
      },
      usage,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST: Create checkout session to subscribe
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, billingCycle = "MONTHLY", couponCode } = body;

    if (!planSlug) {
      return NextResponse.json({ error: "Plan slug is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      planSlug,
      billingCycle,
      successUrl: `${appUrl}/billing?success=true`,
      cancelUrl: `${appUrl}/billing?canceled=true`,
      couponCode,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 400 }
    );
  }
}

// PATCH: Update subscription (change plan, billing cycle, seats)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, billingCycle, quantity } = body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: { plan: true },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    let targetPlan = subscription.plan;
    if (planSlug && planSlug !== subscription.plan.slug) {
      const newPlan = await prisma.plan.findUnique({
        where: { slug: planSlug },
      });
      if (!newPlan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      targetPlan = newPlan;
    }

    const cycle = billingCycle || subscription.billingCycle;
    const priceId =
      cycle === "YEARLY"
        ? targetPlan.stripePriceIdYearly
        : targetPlan.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "No Stripe price configured for this plan/cycle" },
        { status: 400 }
      );
    }

    await updateSubscription(
      subscription.stripeSubscriptionId,
      priceId,
      quantity || subscription.quantity
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel subscription
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    await cancelSubscription(subscription.stripeSubscriptionId, false);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Subscription will cancel at period end" });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
