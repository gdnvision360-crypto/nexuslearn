import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forums = await prisma.discussionForum.findMany({
    where: { courseId: params.courseId },
    include: { _count: { select: { threads: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    forums: forums.map(f => ({ id: f.id, title: f.title, description: f.description, threadCount: f._count.threads, isLocked: f.isLocked })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const forum = await prisma.discussionForum.create({
    data: { courseId: params.courseId, title: body.title, description: body.description },
  });

  return NextResponse.json({ forum }, { status: 201 });
}
