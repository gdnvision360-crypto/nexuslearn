import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Admin view of all subscriptions and revenue stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [subscriptions, total, stats] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.subscription.count(),
      getRevenueStats(),
    ]);

    return NextResponse.json({
      subscriptions,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching admin billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Admin override (change user plan, extend trial, apply credit)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, action, planSlug, trialEndDate } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    switch (action) {
      case "change_plan": {
        if (!planSlug) {
          return NextResponse.json({ error: "planSlug required" }, { status: 400 });
        }
        const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
        if (!plan) {
          return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { planId: plan.id },
        });
        break;
      }

      case "extend_trial": {
        if (!trialEndDate) {
          return NextResponse.json({ error: "trialEndDate required" }, { status: 400 });
        }
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            trialEndsAt: new Date(trialEndDate),
            status: "TRIALING",
          },
        });
        break;
      }

      case "activate": {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: "ACTIVE" },
        });
        break;
      }

      case "cancel": {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: "CANCELED", canceledAt: new Date() },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getRevenueStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalActive,
    totalRevenue,
    monthlyRevenue,
    planDistribution,
  ] = await Promise.all([
    prisma.subscription.count({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      _count: true,
    }),
  ]);

  return {
    totalActiveSubscriptions: totalActive,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    planDistribution,
  };
}
