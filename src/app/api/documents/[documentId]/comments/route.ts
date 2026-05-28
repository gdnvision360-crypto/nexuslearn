import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createDocumentCommentSchema } from "@/lib/validations";

type RouteContext = { params: { documentId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { documentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const comments = await prisma.documentComment.findMany({
      where: { documentId, replyToId: null },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { documentId } = params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createDocumentCommentSchema.parse(body);

    const comment = await prisma.documentComment.create({
      data: {
        documentId,
        userId: user.id,
        content: validated.content,
        position: validated.position,
        replyToId: validated.replyToId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return Response.json(comment, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
