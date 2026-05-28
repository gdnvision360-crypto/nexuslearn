import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/action-items
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.minutesActionItem.findMany({
      where: { minutesId: params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        agendaItem: { select: { id: true, title: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching action items:', error);
    return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
  }
}

// POST /api/minutes/[id]/action-items
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { description, assigneeId, assigneeName, dueDate, priority, agendaItemId, notes } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const item = await prisma.minutesActionItem.create({
      data: {
        minutesId: params.id,
        description,
        assigneeId,
        assigneeName,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        agendaItemId,
        notes,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating action item:', error);
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
}

// PUT /api/minutes/[id]/action-items
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, ...data } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.assigneeName !== undefined) updateData.assigneeName = data.assigneeName;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'completed') updateData.completedAt = new Date();
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    const item = await prisma.minutesActionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
  }
}

// DELETE /api/minutes/[id]/action-items
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

    await prisma.minutesActionItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: 'Action item deleted' });
  } catch (error) {
    console.error('Error deleting action item:', error);
    return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 });
  }
}
