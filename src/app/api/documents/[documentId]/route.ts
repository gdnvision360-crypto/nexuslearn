import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateDocumentSchema } from "@/lib/validations";

type RouteContext = { params: { documentId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { documentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        folder: { select: { id: true, name: true } },
        _count: { select: { versions: true, comments: true } },
        comments: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Check access: owner, collaborator, or admin
    const collaborators = document.collaborators as string[];
    if (
      document.ownerId !== user.id &&
      user.role !== "ADMIN" &&
      !collaborators.includes(user.id)
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(document);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { documentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const collaborators = document.collaborators as string[];
    if (
      document.ownerId !== user.id &&
      user.role !== "ADMIN" &&
      !collaborators.includes(user.id)
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateDocumentSchema.parse(body);

    // Create a version snapshot before updating
    if (validated.content !== undefined && validated.content !== document.content) {
      await prisma.documentVersion.create({
        data: {
          documentId,
          version: document.version,
          content: document.content,
          changedById: user.id,
          changeDescription: validated.changeDescription || `Version ${document.version}`,
        },
      });
    }

    const { changeDescription, ...updateData } = validated;

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...updateData,
        ...(validated.content !== undefined ? { version: { increment: 1 } } : {}),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { versions: true, comments: true } },
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
    const { documentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.document.delete({ where: { id: documentId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
