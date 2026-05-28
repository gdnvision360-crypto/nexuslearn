import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: {
      steps: { include: { course: { select: { title: true } } }, orderBy: { sortOrder: "asc" } },
      _count: { select: { enrollments: true } },
      enrollments: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    paths: paths.map(p => ({
      id: p.id, title: p.title, description: p.description, thumbnail: p.thumbnail,
      estimatedHours: p.estimatedHours, isPublished: p.isPublished,
      enrollmentCount: p._count.enrollments,
      enrolled: p.enrollments.length > 0,
      progress: p.enrollments[0]?.progress || 0,
      steps: p.steps.map(s => ({
        id: s.id, courseId: s.courseId, courseTitle: s.course.title,
        sortOrder: s.sortOrder, isRequired: s.isRequired, completed: false,
      })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "enroll") {
    const enrollment = await prisma.learningPathEnrollment.create({
      data: { learningPathId: body.pathId, userId: session.user.id },
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  }

  const path = await prisma.learningPath.create({
    data: {
      title: body.title, description: body.description, thumbnail: body.thumbnail,
      createdById: session.user.id, estimatedHours: body.estimatedHours || 0,
      isPublished: body.isPublished || false,
      steps: { create: (body.steps || []).map((s: any, idx: number) => ({ courseId: s.courseId, sortOrder: idx, isRequired: s.isRequired !== false })) },
    },
  });

  return NextResponse.json({ path }, { status: 201 });
}
