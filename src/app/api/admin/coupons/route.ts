import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all coupons
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      include: {
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create coupon
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      currency,
      maxRedemptions,
      validFrom,
      validUntil,
      applicablePlans,
      stripeCouponId,
    } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "code, discountType, and discountValue are required" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        currency: currency || "USD",
        maxRedemptions: maxRedemptions || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        applicablePlans: applicablePlans || [],
        stripeCouponId: stripeCouponId || null,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update coupon
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.maxRedemptions !== undefined && { maxRedemptions: updates.maxRedemptions }),
        ...(updates.validUntil !== undefined && { validUntil: updates.validUntil ? new Date(updates.validUntil) : null }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.applicablePlans !== undefined && { applicablePlans: updates.applicablePlans }),
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Deactivate coupon (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
