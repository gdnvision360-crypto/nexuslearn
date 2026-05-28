import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/agenda - List agenda items
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.minutesAgendaItem.findMany({
      where: { minutesId: params.id },
      include: {
        presenter: { select: { id: true, name: true, email: true, image: true } },
        motions: true,
        actionItems: {
          include: { assignee: { select: { id: true, name: true } } },
        },
      },
      orderBy: { orderNumber: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching agenda items:', error);
    return NextResponse.json({ error: 'Failed to fetch agenda items' }, { status: 500 });
  }
}

// POST /api/minutes/[id]/agenda - Create agenda item
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, presenterId, duration, isConfidential } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const lastItem = await prisma.minutesAgendaItem.findFirst({
      where: { minutesId: params.id },
      orderBy: { orderNumber: 'desc' },
    });

    const item = await prisma.minutesAgendaItem.create({
      data: {
        minutesId: params.id,
        orderNumber: (lastItem?.orderNumber || 0) + 1,
        title,
        description,
        presenterId,
        duration,
        isConfidential: isConfidential || false,
      },
      include: { presenter: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating agenda item:', error);
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 });
  }
}

// PUT /api/minutes/[id]/agenda - Update agenda item
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, title, description, discussion, decision, presenterId, duration, status, isConfidential, orderNumber } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await prisma.minutesAgendaItem.update({
      where: { id: itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(discussion !== undefined && { discussion }),
        ...(decision !== undefined && { decision }),
        ...(presenterId !== undefined && { presenterId }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
        ...(isConfidential !== undefined && { isConfidential }),
        ...(orderNumber !== undefined && { orderNumber }),
      },
      include: { presenter: { select: { id: true, name: true, email: true, image: true } } },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating agenda item:', error);
    return NextResponse.json({ error: 'Failed to update agenda item' }, { status: 500 });
  }
}

// DELETE /api/minutes/[id]/agenda - Delete agenda item
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await prisma.minutesAgendaItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: 'Agenda item deleted' });
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 });
  }
}
