import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createDocumentSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const folderId = searchParams.get("folderId");

    const where: any = { ownerId: user.id };

    if (type) {
      where.type = type;
    }
    if (folderId) {
      where.folderId = folderId;
    } else if (folderId === null && searchParams.has("folderId")) {
      where.folderId = null; // root folder
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        _count: { select: { versions: true, comments: true } },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createDocumentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        title: validated.title,
        type: validated.type,
        content: validated.content,
        folderId: validated.folderId,
        ownerId: user.id,
        isTemplate: validated.isTemplate,
        settings: validated.settings,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DOCUMENT_CREATED",
        entityType: "DOCUMENT",
        entityId: document.id,
        metadata: { title: document.title, type: document.type },
      },
    });

    return Response.json(document, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
