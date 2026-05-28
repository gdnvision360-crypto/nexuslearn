import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createTaskSchema } from "@/lib/validations";

type RouteContext = { params: { projectId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const priority = searchParams.get("priority");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const where: any = { projectId, parentTaskId: null };

    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true },
        },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return Response.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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

    if (
      project.ownerId !== user.id &&
      user.role !== "ADMIN" &&
      project.members.length === 0
    ) {
      return Response.json({ error: "You are not a member of this project" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        projectId,
        assigneeId: validated.assigneeId,
        reporterId: user.id,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        storyPoints: validated.storyPoints,
        labels: validated.labels,
        parentTaskId: validated.parentTaskId,
        sortOrder: validated.sortOrder,
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
        action: "TASK_CREATED",
        entityType: "TASK",
        entityId: task.id,
        metadata: { title: task.title, projectId },
      },
    });

    return Response.json(task, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
