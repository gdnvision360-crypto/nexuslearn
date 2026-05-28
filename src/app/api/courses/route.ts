import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createCourseSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const published = searchParams.get("published");

    const where: any = {};

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (published !== null && published !== undefined) {
      where.isPublished = published === "true";
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { enrollments: true, modules: true } },
        enrollments: {
          where: { status: "COMPLETED" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = courses.map((course) => ({
      ...course,
      enrollmentCount: course._count.enrollments,
      completionCount: course.enrollments.length,
      enrollments: undefined,
    }));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      return Response.json(
        { error: "Only instructors and admins can create courses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createCourseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        title: validated.title,
        description: validated.description,
        instructorId: user.id,
        thumbnail: validated.thumbnail,
        category: validated.category,
        difficulty: validated.difficulty,
        price: validated.price,
        tags: validated.tags,
      },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "COURSE_CREATED",
        entityType: "COURSE",
        entityId: course.id,
        metadata: { title: course.title },
      },
    });

    return Response.json(course, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
