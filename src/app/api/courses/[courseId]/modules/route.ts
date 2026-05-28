import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createModuleSchema } from "@/lib/validations";

type RouteContext = { params: { courseId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { courseId } = params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            sortOrder: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return Response.json(modules);
  } catch (error) {
    return handleApiError(error);
  }
}

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

    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Only the instructor can add modules" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createModuleSchema.parse(body);

    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title: validated.title,
        description: validated.description,
        sortOrder: validated.sortOrder,
      },
      include: {
        lessons: true,
      },
    });

    return Response.json(module, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
