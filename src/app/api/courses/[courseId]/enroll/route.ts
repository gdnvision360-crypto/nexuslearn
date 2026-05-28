import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

type RouteContext = { params: { courseId: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.isPublished && user.role !== "ADMIN") {
      return Response.json({ error: "Course is not published" }, { status: 400 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: { courseId, userId: user.id },
      },
    });

    if (existing) {
      if (existing.status === "DROPPED") {
        const enrollment = await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", enrolledAt: new Date() },
        });
        return Response.json(enrollment);
      }
      return Response.json({ error: "Already enrolled" }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId: user.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "COURSE_ENROLLED",
        entityType: "COURSE",
        entityId: courseId,
        metadata: { title: course.title },
      },
    });

    return Response.json(enrollment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { courseId } = params;

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: { courseId, userId: user.id },
      },
    });

    if (!enrollment) {
      return Response.json({ error: "Not enrolled" }, { status: 404 });
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "DROPPED" },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
