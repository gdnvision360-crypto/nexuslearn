import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/minutes/[id]/export-pdf - Generate formal PDF HTML
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const template = searchParams.get('template') || 'formal';

    const minutes = await prisma.meetingMinutes.findUnique({
      where: { id: params.id },
      include: {
        chairperson: { select: { name: true, email: true } },
        secretary: { select: { name: true, email: true } },
        attendees: { orderBy: { role: 'asc' } },
        agendaItems: {
          include: {
            presenter: { select: { name: true } },
            motions: {
              include: {
                movedBy: { select: { name: true } },
                secondedBy: { select: { name: true } },
              },
            },
            actionItems: {
              include: { assignee: { select: { name: true } } },
            },
          },
          orderBy: { orderNumber: 'asc' },
        },
        motions: {
          include: {
            movedBy: { select: { name: true } },
            secondedBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        actionItems: {
          include: { assignee: { select: { name: true } } },
        },
        approvals: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!minutes) {
      return NextResponse.json({ error: 'Minutes not found' }, { status: 404 });
    }

    const isDraft = minutes.status === 'draft';
    const watermark = isDraft ? '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:120px;color:rgba(200,200,200,0.3);z-index:0;pointer-events:none;">DRAFT</div>' : '';

    const presentAttendees = minutes.attendees.filter(a => a.status === 'present');
    const absentAttendees = minutes.attendees.filter(a => a.status !== 'present');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${minutes.title}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: 'Times New Roman', Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; position: relative; }
    .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 2px; }
    .header h2 { font-size: 18px; margin: 0 0 5px; font-weight: normal; }
    .header .meeting-number { font-size: 14px; color: #666; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .meta-table td { padding: 6px 12px; border: 1px solid #ddd; font-size: 14px; }
    .meta-table td:first-child { font-weight: bold; width: 200px; background: #f8f8f8; }
    .section { margin-bottom: 25px; }
    .section h3 { font-size: 16px; text-transform: uppercase; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
    .attendee-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
    .attendee-table th, .attendee-table td { padding: 6px 10px; border: 1px solid #ddd; text-align: left; }
    .attendee-table th { background: #f0f0f0; font-weight: bold; }
    .agenda-item { margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #ddd; }
    .agenda-item h4 { margin: 0 0 8px; font-size: 15px; }
    .agenda-item .label { font-weight: bold; font-size: 13px; color: #555; margin-top: 8px; }
    .motion-box { background: #f9f9f9; border: 1px solid #ddd; padding: 12px; margin: 10px 0; border-radius: 4px; }
    .motion-box .result { font-weight: bold; text-transform: uppercase; }
    .result-passed { color: #16a34a; }
    .result-failed { color: #dc2626; }
    .action-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .action-table th, .action-table td { padding: 6px 10px; border: 1px solid #ddd; text-align: left; }
    .action-table th { background: #f0f0f0; }
    .signature-block { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-line { width: 45%; text-align: center; }
    .signature-line .line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  ${watermark}
  <div class="header">
    ${minutes.organization ? `<h2>${minutes.organization}</h2>` : ''}
    <h1>${minutes.title}</h1>
    ${minutes.meetingNumber ? `<div class="meeting-number">Reference: ${minutes.meetingNumber}</div>` : ''}
  </div>

  <table class="meta-table">
    <tr><td>Meeting Type</td><td>${minutes.meetingType.charAt(0).toUpperCase() + minutes.meetingType.slice(1)} Meeting</td></tr>
    <tr><td>Date & Time</td><td>${minutes.callToOrder ? new Date(minutes.callToOrder).toLocaleString() : 'Not specified'}${minutes.adjournment ? ` — ${new Date(minutes.adjournment).toLocaleString()}` : ''}</td></tr>
    ${minutes.location ? `<tr><td>Location</td><td>${minutes.location}</td></tr>` : ''}
    <tr><td>Chairperson</td><td>${minutes.chairperson?.name || 'N/A'}</td></tr>
    ${minutes.secretary ? `<tr><td>Secretary</td><td>${minutes.secretary.name}</td></tr>` : ''}
    ${minutes.quorumRequired ? `<tr><td>Quorum</td><td>Required: ${minutes.quorumRequired} | Present: ${minutes.quorumPresent || 0} | ${minutes.quorumMet ? '✓ Met' : '✗ Not Met'}</td></tr>` : ''}
  </table>

  ${minutes.attendees.length > 0 ? `
  <div class="section">
    <h3>Attendance</h3>
    <table class="attendee-table">
      <thead><tr><th>Name</th><th>Role</th><th>Designation</th><th>Status</th></tr></thead>
      <tbody>
        ${minutes.attendees.map(a => `<tr><td>${a.name}${a.proxy ? ` (Proxy for: ${a.proxy})` : ''}</td><td>${a.role}</td><td>${a.designation || '—'}</td><td>${a.status}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${minutes.openingRemarks ? `
  <div class="section">
    <h3>Opening Remarks</h3>
    <p>${minutes.openingRemarks}</p>
  </div>` : ''}

  ${minutes.agendaItems.length > 0 ? `
  <div class="section">
    <h3>Agenda & Proceedings</h3>
    ${minutes.agendaItems.map(item => `
    <div class="agenda-item">
      <h4>${item.orderNumber}. ${item.title}${item.isConfidential ? ' [CONFIDENTIAL]' : ''}</h4>
      ${item.presenter ? `<div class="label">Presented by: ${item.presenter.name}</div>` : ''}
      ${item.description ? `<div class="label">Description:</div><p>${item.description}</p>` : ''}
      ${item.discussion ? `<div class="label">Discussion:</div><p>${item.discussion}</p>` : ''}
      ${item.decision ? `<div class="label">Decision:</div><p><strong>${item.decision}</strong></p>` : ''}
      ${item.motions.map(m => `
      <div class="motion-box">
        <strong>${m.motionNumber ? m.motionNumber + ': ' : ''}${m.title}</strong>
        <p>${m.text}</p>
        ${m.movedBy ? `<div>Moved by: ${m.movedBy.name}</div>` : ''}
        ${m.secondedBy ? `<div>Seconded by: ${m.secondedBy.name}</div>` : ''}
        <div>Vote: For: ${m.votesFor} | Against: ${m.votesAgainst} | Abstain: ${m.votesAbstain}${m.isUnanimous ? ' (Unanimous)' : ''}</div>
        <div class="result ${m.result === 'passed' ? 'result-passed' : m.result === 'failed' ? 'result-failed' : ''}">Result: ${m.result.toUpperCase()}</div>
      </div>`).join('')}
      <div class="label">Status: ${item.status}</div>
    </div>`).join('')}
  </div>` : ''}

  ${minutes.actionItems.length > 0 ? `
  <div class="section">
    <h3>Action Items</h3>
    <table class="action-table">
      <thead><tr><th>#</th><th>Description</th><th>Assignee</th><th>Due Date</th><th>Priority</th><th>Status</th></tr></thead>
      <tbody>
        ${minutes.actionItems.map((item, i) => `<tr><td>${i + 1}</td><td>${item.description}</td><td>${item.assignee?.name || item.assigneeName || '—'}</td><td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</td><td>${item.priority}</td><td>${item.status}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${minutes.closingRemarks ? `
  <div class="section">
    <h3>Closing Remarks</h3>
    <p>${minutes.closingRemarks}</p>
  </div>` : ''}

  ${minutes.nextMeetingDate ? `
  <div class="section">
    <h3>Next Meeting</h3>
    <p>Date: ${new Date(minutes.nextMeetingDate).toLocaleDateString()}${minutes.nextMeetingLocation ? ` | Location: ${minutes.nextMeetingLocation}` : ''}</p>
  </div>` : ''}

  <div class="signature-block">
    <div class="signature-line">
      <div class="line">${minutes.chairperson?.name || 'Chairperson'}<br/>Chairperson</div>
    </div>
    ${minutes.secretary ? `
    <div class="signature-line">
      <div class="line">${minutes.secretary.name}<br/>Secretary</div>
    </div>` : ''}
  </div>

  <div class="footer">
    <p>These minutes were ${minutes.aiGenerated ? 'AI-generated and ' : ''}${minutes.status === 'approved' ? 'approved' : 'prepared'} on ${new Date(minutes.updatedAt).toLocaleDateString()}</p>
    <p>Page 1 of 1</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
