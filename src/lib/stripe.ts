import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
  typescript: true,
});

/**
 * Create a Stripe Checkout session for subscribing to a plan
 */
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  planSlug: string;
  billingCycle: "MONTHLY" | "YEARLY";
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
}): Promise<Stripe.Checkout.Session> {
  const { userId, email, planSlug, billingCycle, successUrl, cancelUrl, couponCode } = params;

  const plan = await prisma.plan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) {
    throw new Error(`Plan not found: ${planSlug}`);
  }

  if (planSlug === "free") {
    throw new Error("Cannot create checkout for free plan");
  }

  if (planSlug === "enterprise") {
    throw new Error("Enterprise plans require contacting sales");
  }

  const priceId =
    billingCycle === "YEARLY" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

  if (!priceId) {
    throw new Error(`No Stripe price ID configured for ${planSlug} (${billingCycle})`);
  }

  // Check for existing Stripe customer
  const existingSub = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: existingSub?.stripeCustomerId ? undefined : email,
    customer: existingSub?.stripeCustomerId || undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planSlug,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        userId,
        planSlug,
        billingCycle,
      },
    },
  };

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (coupon?.stripeCouponId) {
      sessionParams.discounts = [{ coupon: coupon.stripeCouponId }];
    }
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<void> {
  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Resume a canceled subscription (before period ends)
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update a subscription (change plan or seats)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  quantity?: number
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;

  if (!itemId) {
    throw new Error("No subscription item found");
  }

  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        price: newPriceId,
        quantity: quantity ?? 1,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

/**
 * Apply a coupon to an existing subscription
 */
export async function applyCoupon(
  subscriptionId: string,
  couponId: string
): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    coupon: couponId,
  });
}

/**
 * Construct and verify a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
