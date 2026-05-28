import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/amendments
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const amendments = await prisma.minutesAmendment.findMany({
      where: { minutesId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(amendments);
  } catch (error) {
    console.error('Error fetching amendments:', error);
    return NextResponse.json({ error: 'Failed to fetch amendments' }, { status: 500 });
  }
}

// POST /api/minutes/[id]/amendments - Propose amendment
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { section, originalText, amendedText, reason } = body;

    if (!section || !originalText || !amendedText) {
      return NextResponse.json({ error: 'Section, original text, and amended text are required' }, { status: 400 });
    }

    const amendment = await prisma.minutesAmendment.create({
      data: {
        minutesId: params.id,
        userId: session.user.id,
        section,
        originalText,
        amendedText,
        reason,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(amendment, { status: 201 });
  } catch (error) {
    console.error('Error creating amendment:', error);
    return NextResponse.json({ error: 'Failed to create amendment' }, { status: 500 });
  }
}

// PUT /api/minutes/[id]/amendments - Review amendment
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amendmentId, status } = body;

    if (!amendmentId || !status) {
      return NextResponse.json({ error: 'Amendment ID and status are required' }, { status: 400 });
    }

    const amendment = await prisma.minutesAmendment.update({
      where: { id: amendmentId },
      data: {
        status,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(amendment);
  } catch (error) {
    console.error('Error reviewing amendment:', error);
    return NextResponse.json({ error: 'Failed to review amendment' }, { status: 500 });
  }
}
