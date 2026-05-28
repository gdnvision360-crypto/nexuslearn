import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/approvals
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const approvals = await prisma.minutesApproval.findMany({
      where: { minutesId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// POST /api/minutes/[id]/approvals - Request or submit approval
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, status, comments, signatureUrl } = body;

    const targetUserId = userId || session.user.id;
    const approvalRole = role || 'board_member';

    const approval = await prisma.minutesApproval.upsert({
      where: {
        minutesId_userId: { minutesId: params.id, userId: targetUserId },
      },
      create: {
        minutesId: params.id,
        userId: targetUserId,
        role: approvalRole,
        status: status || 'pending',
        comments,
        signatureUrl,
        approvedAt: status === 'approved' ? new Date() : null,
      },
      update: {
        status: status || 'pending',
        comments,
        signatureUrl,
        approvedAt: status === 'approved' ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Check if all approvals are done - auto update minutes status
    if (status === 'approved') {
      const allApprovals = await prisma.minutesApproval.findMany({
        where: { minutesId: params.id },
      });
      const allApproved = allApprovals.every(a => a.status === 'approved');
      if (allApproved && allApprovals.length > 0) {
        await prisma.meetingMinutes.update({
          where: { id: params.id },
          data: { status: 'approved' },
        });
      }
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error('Error submitting approval:', error);
    return NextResponse.json({ error: 'Failed to submit approval' }, { status: 500 });
  }
}

// DELETE /api/minutes/[id]/approvals - Remove approval request
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const approvalId = searchParams.get('approvalId');

    if (!approvalId) {
      return NextResponse.json({ error: 'Approval ID is required' }, { status: 400 });
    }

    await prisma.minutesApproval.delete({ where: { id: approvalId } });
    return NextResponse.json({ message: 'Approval removed' });
  } catch (error) {
    console.error('Error removing approval:', error);
    return NextResponse.json({ error: 'Failed to remove approval' }, { status: 500 });
  }
}
