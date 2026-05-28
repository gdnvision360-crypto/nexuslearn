import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: {
        features: true,
        limits: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    const formatted = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      isDefault: plan.isDefault,
      sortOrder: plan.sortOrder,
      features: Object.fromEntries(
        plan.features.map((f) => [f.feature, f.enabled])
      ),
      limits: Object.fromEntries(
        plan.limits.map((l) => [l.limitKey, l.value])
      ),
    }));

    return NextResponse.json({ plans: formatted });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
