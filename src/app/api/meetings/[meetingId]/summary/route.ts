import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

type RouteContext = { params: { meetingId: string } };

// GET: Retrieve existing summary
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { settings: true },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    const settings = (meeting.settings as Record<string, any>) || {};

    return Response.json({ summary: settings.summary || null });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Generate AI summary from transcripts
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        transcripts: {
          orderBy: { timestamp: "asc" },
          include: {
            speaker: {
              select: { id: true, name: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        host: {
          select: { id: true, name: true },
        },
      },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build transcript text
    const transcriptText = meeting.transcripts
      .map(
        (t) =>
          `[${new Date(t.timestamp).toLocaleTimeString()}] ${
            t.speaker.name || "Unknown"
          }: ${t.content}`
      )
      .join("\n");

    if (!transcriptText.trim()) {
      return Response.json(
        { error: "No transcripts available for this meeting" },
        { status: 400 }
      );
    }

    const participantNames = meeting.participants
      .map((p) => p.user.name)
      .filter(Boolean)
      .join(", ");

    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert meeting summarizer. Analyze the meeting transcript and produce a structured summary in JSON format with the following fields:
- overallSummary: A 2-3 sentence overview of the meeting
- keyPoints: Array of key discussion points (strings)
- actionItems: Array of objects with { text, assignee (name or null), priority ("high"|"medium"|"low") }
- decisions: Array of decisions that were made (strings)
- followUpQuestions: Array of unresolved questions or follow-ups needed (strings)

Be concise but thorough. Only include items that were actually discussed.`,
            },
            {
              role: "user",
              content: `Meeting: ${meeting.title}
Host: ${meeting.host.name}
Participants: ${participantNames}
Date: ${meeting.scheduledStart.toLocaleDateString()}

Transcript:
${transcriptText}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 2000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return Response.json(
        { error: "Failed to generate summary with AI" },
        { status: 500 }
      );
    }

    const aiData = await openaiResponse.json();
    const summaryContent = JSON.parse(
      aiData.choices[0].message.content
    );

    const summary = {
      ...summaryContent,
      generatedAt: new Date().toISOString(),
    };

    // Save summary to meeting settings
    const settings = (meeting.settings as Record<string, any>) || {};
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        settings: { ...settings, summary },
      },
    });

    return Response.json({ summary });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Email summary to participants
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = (meeting.settings as Record<string, any>) || {};
    const summary = settings.summary;

    if (!summary) {
      return Response.json({ error: "No summary available" }, { status: 400 });
    }

    // In production, this would use a proper email service
    // For now, we mark it as sent
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        settings: {
          ...settings,
          summaryEmailed: true,
          summaryEmailedAt: new Date().toISOString(),
        },
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
