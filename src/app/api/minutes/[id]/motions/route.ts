import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/motions
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const motions = await prisma.minutesMotion.findMany({
      where: { minutesId: params.id },
      include: {
        movedBy: { select: { id: true, name: true, email: true } },
        secondedBy: { select: { id: true, name: true, email: true } },
        agendaItem: { select: { id: true, title: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(motions);
  } catch (error) {
    console.error('Error fetching motions:', error);
    return NextResponse.json({ error: 'Failed to fetch motions' }, { status: 500 });
  }
}

// POST /api/minutes/[id]/motions
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, text, type, motionNumber, agendaItemId, movedById, secondedById, result, votesFor, votesAgainst, votesAbstain, isUnanimous, remarks } = body;

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and text are required' }, { status: 400 });
    }

    const motion = await prisma.minutesMotion.create({
      data: {
        minutesId: params.id,
        title,
        text,
        type: type || 'resolution',
        motionNumber,
        agendaItemId,
        movedById,
        secondedById,
        result: result || 'pending',
        votesFor: votesFor || 0,
        votesAgainst: votesAgainst || 0,
        votesAbstain: votesAbstain || 0,
        isUnanimous: isUnanimous || false,
        remarks,
      },
      include: {
        movedBy: { select: { id: true, name: true } },
        secondedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(motion, { status: 201 });
  } catch (error) {
    console.error('Error creating motion:', error);
    return NextResponse.json({ error: 'Failed to create motion' }, { status: 500 });
  }
}

// PUT /api/minutes/[id]/motions - Update motion (including voting)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { motionId, ...data } = body;

    if (!motionId) {
      return NextResponse.json({ error: 'Motion ID is required' }, { status: 400 });
    }

    const motion = await prisma.minutesMotion.update({
      where: { id: motionId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.motionNumber !== undefined && { motionNumber: data.motionNumber }),
        ...(data.movedById !== undefined && { movedById: data.movedById }),
        ...(data.secondedById !== undefined && { secondedById: data.secondedById }),
        ...(data.result !== undefined && { result: data.result }),
        ...(data.votesFor !== undefined && { votesFor: data.votesFor }),
        ...(data.votesAgainst !== undefined && { votesAgainst: data.votesAgainst }),
        ...(data.votesAbstain !== undefined && { votesAbstain: data.votesAbstain }),
        ...(data.isUnanimous !== undefined && { isUnanimous: data.isUnanimous }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      },
      include: {
        movedBy: { select: { id: true, name: true } },
        secondedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(motion);
  } catch (error) {
    console.error('Error updating motion:', error);
    return NextResponse.json({ error: 'Failed to update motion' }, { status: 500 });
  }
}

// DELETE /api/minutes/[id]/motions
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const motionId = searchParams.get('motionId');

    if (!motionId) {
      return NextResponse.json({ error: 'Motion ID is required' }, { status: 400 });
    }

    await prisma.minutesMotion.delete({ where: { id: motionId } });
    return NextResponse.json({ message: 'Motion deleted' });
  } catch (error) {
    console.error('Error deleting motion:', error);
    return NextResponse.json({ error: 'Failed to delete motion' }, { status: 500 });
  }
}
