import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LearningClient } from "./LearningClient";

export const metadata = { title: "Learning" };

export default async function LearningPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;

  const [allCourses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true, image: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, image: true } },
            _count: { select: { enrollments: true, modules: true } },
          },
        },
      },
    }),
  ]);

  return (
    <LearningClient
      allCourses={JSON.parse(JSON.stringify(allCourses))}
      enrollments={JSON.parse(JSON.stringify(enrollments))}
    />
  );
}
