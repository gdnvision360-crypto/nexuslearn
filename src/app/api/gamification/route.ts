import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all_time";

  const userPoints = await prisma.userPoints.findUnique({ where: { userId: session.user.id } });
  const stats = userPoints || { total: 0, level: 1, streak: 0, lastActive: new Date() };

  const allBadges = await prisma.badge.findMany();
  const earnedBadges = await prisma.userBadge.findMany({ where: { userId: session.user.id }, select: { badgeId: true, earnedAt: true } });
  const earnedMap = new Map(earnedBadges.map(b => [b.badgeId, b.earnedAt]));

  const badges = allBadges.map(b => ({
    id: b.id, name: b.name, description: b.description, icon: b.icon, points: b.points, category: b.category,
    earned: earnedMap.has(b.id), earnedAt: earnedMap.get(b.id)?.toISOString(),
  }));

  const leaderboard = await prisma.leaderboard.findMany({
    where: { period, courseId: null },
    orderBy: { points: "desc" },
    take: 20,
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({
    stats: { ...stats, nextLevelPoints: (stats.level) * 100 },
    badges,
    leaderboard: leaderboard.map((l, idx) => ({ rank: idx + 1, userId: l.userId, name: l.user.name || "User", image: l.user.image, points: l.points })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, points, badgeId } = body;

  if (action === "award_points" && points) {
    const userPoints = await prisma.userPoints.upsert({
      where: { userId: session.user.id },
      update: { total: { increment: points }, lastActive: new Date(), level: { set: Math.floor(points / 100) + 1 } },
      create: { userId: session.user.id, total: points, level: 1 },
    });
    return NextResponse.json({ userPoints });
  }

  if (action === "award_badge" && badgeId) {
    const userBadge = await prisma.userBadge.create({
      data: { userId: session.user.id, badgeId },
    });
    return NextResponse.json({ userBadge });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
