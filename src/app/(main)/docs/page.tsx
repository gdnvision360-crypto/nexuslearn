import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocsClient } from "./DocsClient";

export const metadata = { title: "Documents" };

export default async function DocsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;

  const [documents, folders] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      include: { owner: { select: { id: true, name: true, image: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.documentFolder.findMany({
      where: { ownerId: userId, parentId: null },
      include: { _count: { select: { documents: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DocsClient
      documents={JSON.parse(JSON.stringify(documents))}
      folders={JSON.parse(JSON.stringify(folders))}
    />
  );
}
