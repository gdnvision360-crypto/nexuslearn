import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role === "ADMIN") {
      // Admin dashboard: global analytics
      const [
        totalUsers,
        activeMeetings,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        recentActivity,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.meeting.count({ where: { status: "LIVE" } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { status: "COMPLETED" } }),
        prisma.activityLog.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        }),
      ]);

      const completionRate = totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

      return Response.json({
        role: "ADMIN",
        stats: {
          totalUsers,
          activeMeetings,
          totalCourses,
          totalEnrollments,
          completedEnrollments,
          completionRate,
        },
        recentActivity,
      });
    }

    if (user.role === "INSTRUCTOR") {
      // Instructor dashboard: their courses
      const [
        courses,
        activeMeetings,
        totalStudents,
        recentActivity,
      ] = await Promise.all([
        prisma.course.findMany({
          where: { instructorId: user.id },
          include: {
            _count: { select: { enrollments: true } },
            enrollments: {
              where: { status: "COMPLETED" },
              select: { id: true },
            },
          },
        }),
        prisma.meeting.count({
          where: { hostId: user.id, status: "LIVE" },
        }),
        prisma.enrollment.count({
          where: { course: { instructorId: user.id } },
        }),
        prisma.activityLog.findMany({
          where: { userId: user.id },
          take: 20,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalEnrollments = courses.reduce(
        (sum, c) => sum + c._count.enrollments,
        0
      );
      const completedEnrollments = courses.reduce(
        (sum, c) => sum + c.enrollments.length,
        0
      );
      const completionRate = totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

      return Response.json({
        role: "INSTRUCTOR",
        stats: {
          totalCourses: courses.length,
          activeMeetings,
          totalStudents,
          totalEnrollments,
          completedEnrollments,
          completionRate,
        },
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          enrollments: c._count.enrollments,
          completions: c.enrollments.length,
        })),
        recentActivity,
      });
    }

    // Student dashboard: their progress
    const [
      enrollments,
      activeMeetings,
      tasksAssigned,
      tasksDone,
      recentActivity,
    ] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            select: { id: true, title: true, thumbnail: true },
          },
        },
      }),
      prisma.meetingParticipant.count({
        where: {
          userId: user.id,
          meeting: { status: "LIVE" },
        },
      }),
      prisma.task.count({ where: { assigneeId: user.id } }),
      prisma.task.count({
        where: { assigneeId: user.id, status: "DONE" },
      }),
      prisma.activityLog.findMany({
        where: { userId: user.id },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const completedEnrollments = enrollments.filter(
      (e) => e.status === "COMPLETED"
    ).length;
    const completionRate = enrollments.length > 0
      ? Math.round((completedEnrollments / enrollments.length) * 100)
      : 0;

    return Response.json({
      role: "STUDENT",
      stats: {
        totalCourses: enrollments.length,
        completedCourses: completedEnrollments,
        completionRate,
        activeMeetings,
        tasksAssigned,
        tasksDone,
      },
      enrollments: enrollments.map((e) => ({
        id: e.id,
        course: e.course,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      })),
      recentActivity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
