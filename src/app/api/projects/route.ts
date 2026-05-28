import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createProjectSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Add task counts by status
    const result = projects.map((project) => {
      const taskCounts = {
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      };
      project.tasks.forEach((task) => {
        taskCounts[task.status]++;
      });
      return {
        ...project,
        tasks: undefined,
        taskCounts,
      };
    });

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        ownerId: user.id,
        color: validated.color,
        icon: validated.icon,
        sprintDuration: validated.sprintDuration,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PROJECT_CREATED",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: { name: project.name },
      },
    });

    return Response.json(project, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
