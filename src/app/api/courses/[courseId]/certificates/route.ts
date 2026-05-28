import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id, ...(params.courseId !== "all" ? { courseId: params.courseId } : {}) },
    include: { course: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({
    certificates: certificates.map(c => ({
      id: c.id, certificateNo: c.certificateNo, studentName: c.user.name || "Student",
      courseName: c.course.title, issuedAt: c.issuedAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString(), pdfUrl: c.pdfUrl, metadata: c.metadata,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId: params.courseId, userId: session.user.id } },
  });

  if (!enrollment || enrollment.status !== "COMPLETED") {
    return NextResponse.json({ error: "Course not completed" }, { status: 400 });
  }

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } },
  });
  if (existing) return NextResponse.json({ certificate: existing });

  const certNo = `NL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const certificate = await prisma.certificate.create({
    data: { userId: session.user.id, courseId: params.courseId, certificateNo: certNo },
    include: { course: { select: { title: true } }, user: { select: { name: true } } },
  });

  return NextResponse.json({ certificate }, { status: 201 });
}
