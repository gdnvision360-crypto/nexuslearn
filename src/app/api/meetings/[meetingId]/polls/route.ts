import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

type RouteContext = { params: { meetingId: string } };

function getMeetingSettings(meeting: { settings: any }): Record<string, any> {
  return (meeting.settings as Record<string, any>) || {};
}

// GET: List polls and Q&A for a meeting
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

    const settings = getMeetingSettings(meeting);

    return Response.json({
      polls: settings.polls || [],
      questions: settings.questions || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create a poll
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

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { question, type, options, maxRating } = body;

    if (!question || !type) {
      return Response.json({ error: "Question and type required" }, { status: 400 });
    }

    const settings = getMeetingSettings(meeting);
    const polls = settings.polls || [];

    const pollId = `poll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newPoll = {
      id: pollId,
      question,
      type,
      options:
        type === "rating"
          ? Array.from({ length: maxRating || 5 }, (_, i) => ({
              id: `opt_${i}`,
              text: `${i + 1}`,
              votes: 0,
              voters: [],
            }))
          : type === "word_cloud"
            ? []
            : (options || []).map((text: string, i: number) => ({
                id: `opt_${i}`,
                text,
                votes: 0,
                voters: [],
              })),
      status: "draft",
      createdAt: Date.now(),
      totalVotes: 0,
      maxRating: type === "rating" ? maxRating || 5 : undefined,
      averageRating: type === "rating" ? 0 : undefined,
      wordCloudEntries: type === "word_cloud" ? [] : undefined,
    };

    polls.push(newPoll);

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { settings: { ...settings, polls } },
    });

    return Response.json({ poll: newPoll }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Launch/end/vote on poll or manage Q&A
export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const { action } = body;
    const settings = getMeetingSettings(meeting);
    const polls = settings.polls || [];
    const questions = settings.questions || [];

    switch (action) {
      case "launch": {
        const { pollId } = body;
        const poll = polls.find((p: any) => p.id === pollId);
        if (poll) poll.status = "active";
        break;
      }

      case "end": {
        const { pollId } = body;
        const poll = polls.find((p: any) => p.id === pollId);
        if (poll) poll.status = "ended";
        break;
      }

      case "vote": {
        const { pollId, optionId } = body;
        const poll = polls.find((p: any) => p.id === pollId);
        if (!poll || poll.status !== "active") {
          return Response.json({ error: "Poll not active" }, { status: 400 });
        }

        // Check if already voted (for single answer)
        const alreadyVoted = poll.options.some((o: any) =>
          o.voters.includes(user.id)
        );

        if (poll.type === "single_answer" && alreadyVoted) {
          return Response.json({ error: "Already voted" }, { status: 400 });
        }

        const option = poll.options.find((o: any) => o.id === optionId);
        if (option && !option.voters.includes(user.id)) {
          option.votes += 1;
          option.voters.push(user.id);
          poll.totalVotes = poll.options.reduce(
            (sum: number, o: any) => sum + o.votes,
            0
          );
        }
        break;
      }

      case "ask": {
        const { text } = body;
        const questionId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        questions.push({
          id: questionId,
          text,
          askedBy: user.id,
          askedByName: user.name || user.email,
          timestamp: Date.now(),
          upvotes: 0,
          upvoters: [],
          isAnswered: false,
          answer: null,
          isHighlighted: false,
          isDismissed: false,
        });
        break;
      }

      case "upvote": {
        const { questionId } = body;
        const question = questions.find((q: any) => q.id === questionId);
        if (question) {
          if (question.upvoters.includes(user.id)) {
            question.upvoters = question.upvoters.filter(
              (id: string) => id !== user.id
            );
            question.upvotes -= 1;
          } else {
            question.upvoters.push(user.id);
            question.upvotes += 1;
          }
        }
        break;
      }

      case "answer": {
        if (meeting.hostId !== user.id && user.role !== "ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const { questionId, answer } = body;
        const question = questions.find((q: any) => q.id === questionId);
        if (question) {
          question.isAnswered = true;
          question.answer = answer;
        }
        break;
      }

      case "dismiss": {
        if (meeting.hostId !== user.id && user.role !== "ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const { questionId } = body;
        const question = questions.find((q: any) => q.id === questionId);
        if (question) question.isDismissed = true;
        break;
      }

      case "highlight": {
        if (meeting.hostId !== user.id && user.role !== "ADMIN") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        const { questionId } = body;
        const question = questions.find((q: any) => q.id === questionId);
        if (question) question.isHighlighted = !question.isHighlighted;
        break;
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { settings: { ...settings, polls, questions } },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
