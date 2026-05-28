import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { addTranscriptSchema } from "@/lib/validations";

type RouteContext = { params: { meetingId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const transcripts = await prisma.meetingTranscript.findMany({
      where: { meetingId },
      include: {
        speaker: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    return Response.json(transcripts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = addTranscriptSchema.parse(body);

    const transcript = await prisma.meetingTranscript.create({
      data: {
        meetingId,
        speakerId: user.id,
        content: validated.content,
        timestamp: new Date(validated.timestamp),
        language: validated.language,
        confidence: validated.confidence,
        sentiment: validated.sentiment,
      },
      include: {
        speaker: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return Response.json(transcript, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
