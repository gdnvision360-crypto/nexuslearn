import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Handles both forum details AND threads (via ?action=threads)
export async function GET(req: NextRequest, { params }: { params: { courseId: string; forumId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const threadId = searchParams.get("threadId");
  const sort = searchParams.get("sort") || "recent";
  const search = searchParams.get("search") || "";

  // Get posts for a specific thread
  if (threadId) {
    const posts = await prisma.forumPost.findMany({
      where: { threadId },
      include: { author: { select: { name: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      posts: posts.map(p => ({
        id: p.id, content: p.content, authorName: p.author.name || "User",
        authorImage: p.author.image, isAnswer: p.isAnswer, likes: p.likes,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  }

  // List threads
  const orderBy: any = sort === "popular" ? { views: "desc" as const } : { createdAt: "desc" as const };
  const where: any = { forumId: params.forumId };
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (sort === "unanswered") where.isResolved = false;

  const threads = await prisma.forumThread.findMany({
    where,
    include: { author: { select: { name: true, image: true } }, _count: { select: { posts: true } } },
    orderBy: [{ isPinned: "desc" }, orderBy],
  });

  return NextResponse.json({
    threads: threads.map(t => ({
      id: t.id, title: t.title, content: t.content, authorName: t.author.name || "User",
      isPinned: t.isPinned, isResolved: t.isResolved, views: t.views,
      postCount: t._count.posts, createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string; forumId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Create a post reply in a thread
  if (body.threadId) {
    const post = await prisma.forumPost.create({
      data: { threadId: body.threadId, authorId: session.user.id, content: body.content },
    });
    return NextResponse.json({ post }, { status: 201 });
  }

  // Create a new thread
  const thread = await prisma.forumThread.create({
    data: { forumId: params.forumId, authorId: session.user.id, title: body.title, content: body.content },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
