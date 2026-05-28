import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateProjectSchema } from "@/lib/validations";

type RouteContext = { params: { projectId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tasks: {
          select: { status: true, priority: true },
        },
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const taskStats = {
      total: project.tasks.length,
      byStatus: { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 },
      byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
    };
    project.tasks.forEach((t) => {
      taskStats.byStatus[t.status]++;
      taskStats.byPriority[t.priority]++;
    });

    return Response.json({
      ...project,
      tasks: undefined,
      taskStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { where: { userId: user.id } },
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const membership = project.members[0];
    if (
      project.ownerId !== user.id &&
      user.role !== "ADMIN" &&
      (!membership || !["OWNER", "ADMIN"].includes(membership.role))
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: validated,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, tasks: true } },
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
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({ where: { id: projectId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
