import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/minutes/[id]/ai-generate - AI auto-generate from transcript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transcript, source, meetingId } = body;

    if (!transcript && !meetingId) {
      return NextResponse.json({ error: 'Either transcript text or meeting ID is required' }, { status: 400 });
    }

    let transcriptText = transcript;

    // If meetingId provided, fetch transcripts from the meeting
    if (meetingId && !transcript) {
      const transcripts = await prisma.meetingTranscript.findMany({
        where: { meetingId },
        include: { speaker: { select: { name: true } } },
        orderBy: { timestamp: 'asc' },
      });

      if (transcripts.length === 0) {
        return NextResponse.json({ error: 'No transcripts found for this meeting' }, { status: 404 });
      }

      transcriptText = transcripts
        .map(t => `[${t.speaker.name || 'Unknown'}]: ${t.content}`)
        .join('\n');
    }

    // Try to use OpenAI if available
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a professional meeting minutes secretary. Analyze the provided meeting transcript and generate structured meeting minutes in JSON format. Return ONLY valid JSON with this structure:
{
  "title": "Meeting title inferred from content",
  "openingRemarks": "Summary of opening",
  "agendaItems": [
    {
      "title": "Topic title",
      "discussion": "Summary of discussion",
      "decision": "Decision made if any",
      "status": "discussed"
    }
  ],
  "motions": [
    {
      "title": "Motion title",
      "text": "Full motion text",
      "result": "passed/failed/tabled",
      "isUnanimous": false
    }
  ],
  "actionItems": [
    {
      "description": "What needs to be done",
      "assigneeName": "Person responsible",
      "priority": "high/medium/low"
    }
  ],
  "closingRemarks": "Summary of closing",
  "confidence": {
    "overall": 0.85,
    "agendaItems": 0.9,
    "motions": 0.8,
    "actionItems": 0.85
  }
}`,
              },
              {
                role: 'user',
                content: `Generate meeting minutes from this transcript:\n\n${transcriptText}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content;
          const parsed = JSON.parse(content);

          // Update the minutes with AI-generated content
          const updated = await prisma.meetingMinutes.update({
            where: { id: params.id },
            data: {
              title: parsed.title || undefined,
              openingRemarks: parsed.openingRemarks,
              closingRemarks: parsed.closingRemarks,
              aiGenerated: true,
            },
          });

          // Create agenda items
          if (parsed.agendaItems?.length) {
            for (let i = 0; i < parsed.agendaItems.length; i++) {
              const item = parsed.agendaItems[i];
              await prisma.minutesAgendaItem.create({
                data: {
                  minutesId: params.id,
                  orderNumber: i + 1,
                  title: item.title,
                  discussion: item.discussion,
                  decision: item.decision,
                  status: item.status || 'discussed',
                },
              });
            }
          }

          // Create action items
          if (parsed.actionItems?.length) {
            for (const item of parsed.actionItems) {
              await prisma.minutesActionItem.create({
                data: {
                  minutesId: params.id,
                  description: item.description,
                  assigneeName: item.assigneeName,
                  priority: item.priority || 'medium',
                },
              });
            }
          }

          return NextResponse.json({
            success: true,
            generated: parsed,
            confidence: parsed.confidence || { overall: 0.85 },
          });
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
      }
    }

    // Fallback: basic parsing without AI
    const lines = transcriptText.split('\n').filter((l: string) => l.trim());
    const agendaItems: any[] = [];
    const actionItems: any[] = [];
    let currentTopic = '';
    let currentDiscussion = '';

    for (const line of lines) {
      const topicMatch = line.match(/(?:topic|agenda|item|discussing|next up)[:\s]+(.+)/i);
      const actionMatch = line.match(/(?:action item|todo|task|will do|needs to)[:\s]+(.+)/i);

      if (topicMatch) {
        if (currentTopic) {
          agendaItems.push({ title: currentTopic, discussion: currentDiscussion.trim(), status: 'discussed' });
        }
        currentTopic = topicMatch[1].trim();
        currentDiscussion = '';
      } else if (actionMatch) {
        actionItems.push({ description: actionMatch[1].trim(), priority: 'medium' });
      } else if (currentTopic) {
        currentDiscussion += line + ' ';
      }
    }

    if (currentTopic) {
      agendaItems.push({ title: currentTopic, discussion: currentDiscussion.trim(), status: 'discussed' });
    }

    // If no topics detected, create a single item with the whole transcript
    if (agendaItems.length === 0) {
      agendaItems.push({
        title: 'General Discussion',
        discussion: transcriptText.substring(0, 2000),
        status: 'discussed',
      });
    }

    // Save to database
    await prisma.meetingMinutes.update({
      where: { id: params.id },
      data: { aiGenerated: true },
    });

    for (let i = 0; i < agendaItems.length; i++) {
      await prisma.minutesAgendaItem.create({
        data: {
          minutesId: params.id,
          orderNumber: i + 1,
          title: agendaItems[i].title,
          discussion: agendaItems[i].discussion,
          status: 'discussed',
        },
      });
    }

    for (const item of actionItems) {
      await prisma.minutesActionItem.create({
        data: {
          minutesId: params.id,
          description: item.description,
          priority: item.priority,
        },
      });
    }

    return NextResponse.json({
      success: true,
      generated: { agendaItems, actionItems },
      confidence: { overall: 0.5, note: 'Basic parsing used (no AI API key configured)' },
    });
  } catch (error) {
    console.error('Error generating minutes:', error);
    return NextResponse.json({ error: 'Failed to generate minutes' }, { status: 500 });
  }
}
