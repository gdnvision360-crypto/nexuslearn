import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes - List all minutes with filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const meetingType = searchParams.get('meetingType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (meetingType) where.meetingType = meetingType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { meetingNumber: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [minutes, total] = await Promise.all([
      prisma.meetingMinutes.findMany({
        where,
        include: {
          chairperson: { select: { id: true, name: true, email: true, image: true } },
          secretary: { select: { id: true, name: true, email: true, image: true } },
          _count: { select: { agendaItems: true, motions: true, actionItems: true, attendees: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meetingMinutes.count({ where }),
    ]);

    return NextResponse.json({ minutes, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching minutes:', error);
    return NextResponse.json({ error: 'Failed to fetch minutes' }, { status: 500 });
  }
}

// POST /api/minutes - Create new minutes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, meetingType, meetingNumber, organization, location,
      callToOrder, adjournment, meetingId, secretaryId,
      quorumRequired, openingRemarks, closingRemarks,
      nextMeetingDate, nextMeetingLocation, attendees, agendaItems,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const minutes = await prisma.meetingMinutes.create({
      data: {
        title,
        meetingType: meetingType || 'general',
        meetingNumber,
        organization,
        location,
        callToOrder: callToOrder ? new Date(callToOrder) : null,
        adjournment: adjournment ? new Date(adjournment) : null,
        chairpersonId: session.user.id,
        secretaryId,
        meetingId,
        quorumRequired,
        openingRemarks,
        closingRemarks,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
        nextMeetingLocation,
        attendees: attendees?.length ? {
          create: attendees.map((a: any) => ({
            name: a.name,
            userId: a.userId || null,
            role: a.role || 'member',
            designation: a.designation,
            organization: a.organization,
            status: a.status || 'present',
          })),
        } : undefined,
        agendaItems: agendaItems?.length ? {
          create: agendaItems.map((item: any, idx: number) => ({
            orderNumber: idx + 1,
            title: item.title,
            description: item.description,
            presenterId: item.presenterId,
            duration: item.duration,
          })),
        } : undefined,
      },
      include: {
        chairperson: { select: { id: true, name: true, email: true, image: true } },
        secretary: { select: { id: true, name: true, email: true, image: true } },
        attendees: true,
        agendaItems: true,
      },
    });

    return NextResponse.json(minutes, { status: 201 });
  } catch (error) {
    console.error('Error creating minutes:', error);
    return NextResponse.json({ error: 'Failed to create minutes' }, { status: 500 });
  }
}
