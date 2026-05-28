import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gradeItems = await prisma.gradeItem.findMany({
    where: { courseId: params.courseId },
    include: { grades: { include: { user: { select: { id: true, name: true } } } } },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: params.courseId },
    include: { user: { select: { id: true, name: true } } },
  });

  const LETTER_GRADES = [
    { min: 93, grade: "A" }, { min: 90, grade: "A-" }, { min: 87, grade: "B+" }, { min: 83, grade: "B" },
    { min: 80, grade: "B-" }, { min: 77, grade: "C+" }, { min: 73, grade: "C" }, { min: 70, grade: "C-" },
    { min: 67, grade: "D+" }, { min: 63, grade: "D" }, { min: 60, grade: "D-" }, { min: 0, grade: "F" },
  ];

  const students = enrollments.map(e => {
    const grades: Record<string, any> = {};
    let weightedSum = 0, totalWeight = 0;
    gradeItems.forEach(item => {
      const g = item.grades.find(g => g.userId === e.userId);
      grades[item.id] = { gradeItemId: item.id, score: g?.score ?? null, feedback: g?.feedback };
      if (g?.score !== null && g?.score !== undefined) {
        weightedSum += (g.score / item.maxScore) * 100 * item.weight;
        totalWeight += item.weight;
      }
    });
    const total = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const letterGrade = LETTER_GRADES.find(l => total >= l.min)?.grade || "F";
    return { userId: e.userId, name: e.user.name || "Student", grades, total, letterGrade };
  });

  return NextResponse.json({
    gradeItems: gradeItems.map(g => ({ id: g.id, name: g.name, category: g.category, weight: g.weight, maxScore: g.maxScore })),
    students,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, gradeItemId, score } = body;

  const grade = await prisma.studentGrade.upsert({
    where: { gradeItemId_userId: { gradeItemId, userId } },
    update: { score, gradedAt: new Date() },
    create: { gradeItemId, userId, score, gradedAt: new Date() },
  });

  return NextResponse.json({ grade });
}
