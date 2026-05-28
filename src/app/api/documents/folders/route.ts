import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createDocumentFolderSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const folders = await prisma.documentFolder.findMany({
      where: { ownerId: user.id },
      include: {
        _count: { select: { documents: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json(folders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createDocumentFolderSchema.parse(body);

    const folder = await prisma.documentFolder.create({
      data: {
        name: validated.name,
        parentId: validated.parentId,
        ownerId: user.id,
        color: validated.color,
      },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    return Response.json(folder, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
