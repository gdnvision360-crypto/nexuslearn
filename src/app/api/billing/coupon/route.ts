import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, planSlug } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        redemptions: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    // Check expiry
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }

    // Check not before valid date
    if (new Date() < coupon.validFrom) {
      return NextResponse.json({ error: "Coupon is not yet active" }, { status: 400 });
    }

    // Check max redemptions
    if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
      return NextResponse.json({ error: "Coupon has been fully redeemed" }, { status: 400 });
    }

    // Check already used by this user
    if (coupon.redemptions.length > 0) {
      return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
    }

    // Check applicable plans
    if (planSlug && coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planSlug)) {
      return NextResponse.json(
        { error: "This coupon is not applicable to the selected plan" },
        { status: 400 }
      );
    }

    // Calculate discount preview
    let discountDescription = "";
    if (coupon.discountType === "PERCENTAGE") {
      discountDescription = `${coupon.discountValue}% off`;
    } else {
      discountDescription = `$${coupon.discountValue.toFixed(2)} off`;
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: discountDescription,
      applicablePlans: coupon.applicablePlans,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
