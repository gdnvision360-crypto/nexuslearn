import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string; quizId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { sortOrder: "asc" }, select: { id: true, type: true, question: true, options: true, points: true, sortOrder: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attemptsUsed = await prisma.quizAttempt.count({ where: { quizId: params.quizId, userId: session.user.id } });

  return NextResponse.json({ quiz, attemptsUsed });
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string; quizId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, timeLimit, attempts, passingScore, shuffleQuestions, showResults, questions } = body;

  await prisma.quizQuestion.deleteMany({ where: { quizId: params.quizId } });

  const quiz = await prisma.quiz.update({
    where: { id: params.quizId },
    data: {
      title, description, timeLimit, attempts, passingScore, shuffleQuestions, showResults,
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

  return NextResponse.json({ quiz });
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string; quizId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.quiz.delete({ where: { id: params.quizId } });
  return NextResponse.json({ success: true });
}

// POST handles quiz attempt submission (action: "attempt")
export async function POST(req: NextRequest, { params }: { params: { courseId: string; quizId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers, timeSpent } = body;

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: { questions: true },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const existingAttempts = await prisma.quizAttempt.count({ where: { quizId: params.quizId, userId: session.user.id } });
  if (existingAttempts >= quiz.attempts) return NextResponse.json({ error: "No attempts remaining" }, { status: 400 });

  let totalPoints = 0;
  let earnedPoints = 0;
  const answerResults = quiz.questions.map((q) => {
    totalPoints += q.points;
    const userAnswer = answers.find((a: any) => a.questionId === q.id);
    let correct = false;

    if (userAnswer) {
      const correctAnswer = q.correctAnswer;
      if (typeof correctAnswer === "string") {
        correct = String(userAnswer.answer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      } else {
        correct = JSON.stringify(userAnswer.answer) === JSON.stringify(correctAnswer);
      }
    }

    if (correct) earnedPoints += q.points;

    return {
      questionId: q.id,
      correct,
      correctAnswer: quiz.showResults ? q.correctAnswer : undefined,
      explanation: quiz.showResults ? q.explanation : undefined,
    };
  });

  const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = score >= quiz.passingScore;

  await prisma.quizAttempt.create({
    data: {
      quizId: params.quizId,
      userId: session.user.id,
      answers: answers,
      score,
      passed,
      timeSpent: timeSpent || 0,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ score, passed, totalPoints, answers: answerResults });
}
