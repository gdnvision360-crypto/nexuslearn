import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateCourseSchema } from "@/lib/validations";

type RouteContext = { params: { courseId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, image: true, bio: true },
        },
        modules: {
          include: {
            lessons: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json(course);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateCourseSchema.parse(body);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: validated,
      include: {
        instructor: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { enrollments: true, modules: true } },
      },
    });

    return Response.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.course.delete({ where: { id: courseId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
