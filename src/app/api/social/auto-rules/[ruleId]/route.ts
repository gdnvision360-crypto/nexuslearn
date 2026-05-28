import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.socialAutoRule.findFirst({
      where: { id: params.ruleId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Rule not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.trigger !== undefined) updateData.trigger = body.trigger;
    if (body.platforms !== undefined) updateData.platforms = body.platforms;
    if (body.templateText !== undefined) updateData.templateText = body.templateText;
    if (typeof body.includeMedia === "boolean") updateData.includeMedia = body.includeMedia;
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    const rule = await prisma.socialAutoRule.update({
      where: { id: params.ruleId },
      data: updateData,
    });

    return Response.json(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { ruleId: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.socialAutoRule.findFirst({
      where: { id: params.ruleId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.socialAutoRule.delete({
      where: { id: params.ruleId },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
