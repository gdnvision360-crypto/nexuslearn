import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TasksClient } from "./TasksClient";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { reporterId: userId },
          { project: { members: { some: { userId } } } },
        ],
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        reporter: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true, name: true, color: true, currentSprint: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TasksClient
      tasks={JSON.parse(JSON.stringify(tasks))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  );
}
