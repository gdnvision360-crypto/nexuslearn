import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: params.courseId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  const records = await prisma.attendance.findMany({
    where: { courseId: params.courseId },
    orderBy: { date: "asc" },
  });

  const dates = [...new Set(records.map(r => r.date.toISOString().split("T")[0]))];
  const attendance: Record<string, Record<string, any>> = {};
  records.forEach(r => {
    const dateKey = r.date.toISOString().split("T")[0];
    if (!attendance[dateKey]) attendance[dateKey] = {};
    attendance[dateKey][r.userId] = { userId: r.userId, status: r.status, notes: r.notes };
  });

  return NextResponse.json({
    students: enrollments.map(e => ({ userId: e.userId, name: e.user.name || "Student", image: e.user.image })),
    dates,
    attendance,
  });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = new Date(body.date);

  const record = await prisma.attendance.upsert({
    where: { courseId_userId_date: { courseId: params.courseId, userId: body.userId, date } },
    update: { status: body.status, notes: body.notes },
    create: { courseId: params.courseId, userId: body.userId, date, status: body.status, notes: body.notes },
  });

  return NextResponse.json({ record });
}
