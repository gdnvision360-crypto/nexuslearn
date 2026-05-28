import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bankOnly = searchParams.get("bankOnly");

  if (bankOnly) {
    const questions = await prisma.quizQuestion.findMany({
      where: { quiz: { lesson: { module: { courseId: params.courseId } } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ questions });
  }

  const quizzes = await prisma.quiz.findMany({
    where: { lesson: { module: { courseId: params.courseId } } },
    include: { questions: { orderBy: { sortOrder: "asc" } }, _count: { select: { attempts_rel: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quizzes });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, lessonId, timeLimit, attempts, passingScore, shuffleQuestions, showResults, questions } = body;

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      lessonId,
      timeLimit,
      attempts: attempts || 1,
      passingScore: passingScore || 70,
      shuffleQuestions: shuffleQuestions || false,
      showResults: showResults !== false,
      questions: {
        create: (questions || []).map((q: any, idx: number) => ({
          type: q.type || "MULTIPLE_CHOICE",
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
          explanation: q.explanation || null,
          points: q.points || 1,
          sortOrder: q.sortOrder ?? idx,
          tags: q.tags || [],
          difficulty: q.difficulty || "BEGINNER",
        })),
      },
    },
    include: { questions: true },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
