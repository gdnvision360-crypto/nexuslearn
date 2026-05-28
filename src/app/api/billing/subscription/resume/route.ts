import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeSubscription } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        cancelAtPeriodEnd: true,
        status: "ACTIVE",
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No canceled subscription found to resume" },
        { status: 404 }
      );
    }

    await resumeSubscription(subscription.stripeSubscriptionId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription resumed" });
  } catch (error: any) {
    console.error("Error resuming subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resume subscription" },
      { status: 500 }
    );
  }
}
