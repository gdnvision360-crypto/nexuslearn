import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateTaskSchema } from "@/lib/validations";

type RouteContext = { params: { projectId: string; taskId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { projectId, taskId } = params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, image: true },
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: {
            file: {
              select: { id: true, name: true, originalName: true, mimeType: true, size: true },
            },
          },
        },
      },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { projectId, taskId } = params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateTaskSchema.parse(body);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : validated.dueDate,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "TASK_UPDATED",
        entityType: "TASK",
        entityId: taskId,
        metadata: { changes: Object.keys(validated) },
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
    const { projectId, taskId } = params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.reporterId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
