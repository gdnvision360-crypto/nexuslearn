import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const LIMIT_PER_CATEGORY = 5;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || String(LIMIT_PER_CATEGORY), 10);

  if (!q) {
    return NextResponse.json({ results: [], counts: {} });
  }

  const searchTerm = `%${q}%`;

  interface SearchResult {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    url: string;
  }

  const results: SearchResult[] = [];
  const counts: Record<string, number> = {};

  const shouldSearch = (cat: string) => !category || category === cat;

  // Search Meetings
  if (shouldSearch('meetings')) {
    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
        OR: [
          { hostId: session.user.id },
          { participants: { some: { userId: session.user.id } } },
        ],
      } as Record<string, unknown>,
      take: limit,
      orderBy: { scheduledStart: 'desc' },
      select: { id: true, title: true, scheduledStart: true, status: true },
    });

    // Workaround: search with combined conditions
    const meetingResults = await prisma.meeting.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { hostId: session.user.id },
              { participants: { some: { userId: session.user.id } } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { scheduledStart: 'desc' },
      select: { id: true, title: true, scheduledStart: true, status: true },
    });

    counts.meetings = meetingResults.length;
    meetingResults.forEach((m) => {
      results.push({
        id: m.id,
        type: 'meetings',
        title: m.title,
        subtitle: `${m.status} · ${new Date(m.scheduledStart).toLocaleDateString()}`,
        url: `/meetings/${m.id}`,
      });
    });
  }

  // Search Messages
  if (shouldSearch('messages')) {
    const messages = await prisma.message.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
        channel: {
          members: { some: { userId: session.user.id } },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        channelId: true,
        createdAt: true,
        sender: { select: { name: true } },
        channel: { select: { name: true } },
      },
    });

    counts.messages = messages.length;
    messages.forEach((m) => {
      results.push({
        id: m.id,
        type: 'messages',
        title: m.content.substring(0, 100),
        subtitle: `${m.sender.name || 'Unknown'} in #${m.channel.name}`,
        url: `/chat?channel=${m.channelId}`,
      });
    });
  }

  // Search Documents
  if (shouldSearch('documents')) {
    const documents = await prisma.document.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
            ],
          },
          { ownerId: session.user.id },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, type: true, updatedAt: true },
    });

    counts.documents = documents.length;
    documents.forEach((d) => {
      results.push({
        id: d.id,
        type: 'documents',
        title: d.title,
        subtitle: `${d.type} · Updated ${new Date(d.updatedAt).toLocaleDateString()}`,
        url: `/documents/${d.id}`,
      });
    });
  }

  // Search Tasks
  if (shouldSearch('tasks')) {
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { assigneeId: session.user.id },
              { reporterId: session.user.id },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, priority: true, projectId: true },
    });

    counts.tasks = tasks.length;
    tasks.forEach((t) => {
      results.push({
        id: t.id,
        type: 'tasks',
        title: t.title,
        subtitle: `${t.status} · ${t.priority}`,
        url: `/tasks?project=${t.projectId}&task=${t.id}`,
      });
    });
  }

  // Search Courses
  if (shouldSearch('courses')) {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
        isPublished: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        instructor: { select: { name: true } },
      },
    });

    counts.courses = courses.length;
    courses.forEach((c) => {
      results.push({
        id: c.id,
        type: 'courses',
        title: c.title,
        subtitle: `${c.difficulty} · ${c.instructor.name || 'Unknown'}`,
        url: `/courses/${c.id}`,
      });
    });
  }

  // Search Files
  if (shouldSearch('files')) {
    const files = await prisma.file.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { originalName: { contains: q, mode: 'insensitive' } },
            ],
          },
          { uploadedById: session.user.id },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, mimeType: true, size: true },
    });

    counts.files = files.length;
    files.forEach((f) => {
      results.push({
        id: f.id,
        type: 'files',
        title: f.name,
        subtitle: f.mimeType,
        url: `/files?file=${f.id}`,
      });
    });
  }

  // Search People
  if (shouldSearch('people')) {
    const people = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      take: limit,
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    counts.people = people.length;
    people.forEach((p) => {
      results.push({
        id: p.id,
        type: 'people',
        title: p.name || p.email,
        subtitle: p.role,
        url: `/profile/${p.id}`,
      });
    });
  }

  // Save search to history
  if (q.length >= 2) {
    await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        query: q,
        category: category || 'all',
      },
    }).catch(() => {});
  }

  return NextResponse.json({ results, counts });
}
