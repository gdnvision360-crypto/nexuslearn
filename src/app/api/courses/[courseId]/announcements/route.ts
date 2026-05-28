import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    where: { courseId: params.courseId },
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    announcements: announcements.map(a => ({
      id: a.id, title: a.title, content: a.content, authorName: a.author.name || "Instructor",
      isPinned: a.isPinned, createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const announcement = await prisma.announcement.create({
    data: { courseId: params.courseId, authorId: session.user.id, title: body.title, content: body.content, isPinned: body.isPinned || false },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
