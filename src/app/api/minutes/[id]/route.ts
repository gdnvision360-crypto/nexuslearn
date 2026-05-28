import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id] - Get single minutes with all relations
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const minutes = await prisma.meetingMinutes.findUnique({
      where: { id: params.id },
      include: {
        meeting: { select: { id: true, title: true, scheduledStart: true, scheduledEnd: true } },
        chairperson: { select: { id: true, name: true, email: true, image: true } },
        secretary: { select: { id: true, name: true, email: true, image: true } },
        attendees: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { role: 'asc' },
        },
        agendaItems: {
          include: {
            presenter: { select: { id: true, name: true, email: true, image: true } },
            motions: {
              include: {
                movedBy: { select: { id: true, name: true } },
                secondedBy: { select: { id: true, name: true } },
              },
            },
            actionItems: {
              include: { assignee: { select: { id: true, name: true, email: true, image: true } } },
            },
          },
          orderBy: { orderNumber: 'asc' },
        },
        motions: {
          include: {
            movedBy: { select: { id: true, name: true } },
            secondedBy: { select: { id: true, name: true } },
            agendaItem: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        actionItems: {
          include: { assignee: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
        approvals: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
        amendments: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!minutes) {
      return NextResponse.json({ error: 'Minutes not found' }, { status: 404 });
    }

    return NextResponse.json(minutes);
  } catch (error) {
    console.error('Error fetching minutes:', error);
    return NextResponse.json({ error: 'Failed to fetch minutes' }, { status: 500 });
  }
}

// PUT /api/minutes/[id] - Update minutes
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, meetingType, meetingNumber, organization, location,
      callToOrder, adjournment, secretaryId, status,
      quorumRequired, quorumPresent, quorumMet,
      openingRemarks, closingRemarks,
      nextMeetingDate, nextMeetingLocation,
    } = body;

    const minutes = await prisma.meetingMinutes.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(meetingType !== undefined && { meetingType }),
        ...(meetingNumber !== undefined && { meetingNumber }),
        ...(organization !== undefined && { organization }),
        ...(location !== undefined && { location }),
        ...(callToOrder !== undefined && { callToOrder: callToOrder ? new Date(callToOrder) : null }),
        ...(adjournment !== undefined && { adjournment: adjournment ? new Date(adjournment) : null }),
        ...(secretaryId !== undefined && { secretaryId }),
        ...(status !== undefined && { status }),
        ...(quorumRequired !== undefined && { quorumRequired }),
        ...(quorumPresent !== undefined && { quorumPresent }),
        ...(quorumMet !== undefined && { quorumMet }),
        ...(openingRemarks !== undefined && { openingRemarks }),
        ...(closingRemarks !== undefined && { closingRemarks }),
        ...(nextMeetingDate !== undefined && { nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null }),
        ...(nextMeetingLocation !== undefined && { nextMeetingLocation }),
      },
      include: {
        chairperson: { select: { id: true, name: true, email: true, image: true } },
        secretary: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(minutes);
  } catch (error) {
    console.error('Error updating minutes:', error);
    return NextResponse.json({ error: 'Failed to update minutes' }, { status: 500 });
  }
}

// DELETE /api/minutes/[id] - Delete minutes
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const minutes = await prisma.meetingMinutes.findUnique({ where: { id: params.id } });
    if (!minutes) {
      return NextResponse.json({ error: 'Minutes not found' }, { status: 404 });
    }
    if (minutes.chairpersonId !== session.user.id) {
      return NextResponse.json({ error: 'Only the chairperson can delete minutes' }, { status: 403 });
    }

    await prisma.meetingMinutes.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Minutes deleted successfully' });
  } catch (error) {
    console.error('Error deleting minutes:', error);
    return NextResponse.json({ error: 'Failed to delete minutes' }, { status: 500 });
  }
}
