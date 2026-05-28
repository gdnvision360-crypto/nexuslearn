import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TEMPLATES = [
  {
    id: 'board',
    name: 'Board Meeting',
    description: 'Formal board meeting minutes with resolutions, quorum tracking, and signature blocks',
    meetingType: 'board',
    icon: 'Building2',
    color: '#1e40af',
    sections: ['attendance', 'quorum', 'agenda', 'motions', 'resolutions', 'action_items', 'signatures'],
    defaultAgendaItems: [
      { title: 'Call to Order', description: 'Opening of the meeting by the Chairperson' },
      { title: 'Approval of Previous Minutes', description: 'Review and approval of minutes from the last board meeting' },
      { title: 'Chairperson\'s Report', description: '' },
      { title: 'Financial Report', description: 'Review of financial statements and budget updates' },
      { title: 'Committee Reports', description: '' },
      { title: 'Old Business', description: 'Follow-up on previously discussed items' },
      { title: 'New Business', description: '' },
      { title: 'Next Meeting Date', description: '' },
      { title: 'Adjournment', description: '' },
    ],
    quorumRequired: true,
  },
  {
    id: 'agm',
    name: 'Annual General Meeting (AGM)',
    description: 'Annual general meeting with formal proceedings, elections, and shareholder resolutions',
    meetingType: 'agm',
    icon: 'Users',
    color: '#7c3aed',
    sections: ['attendance', 'quorum', 'agenda', 'motions', 'elections', 'resolutions', 'action_items', 'signatures'],
    defaultAgendaItems: [
      { title: 'Call to Order & Welcome', description: '' },
      { title: 'Proof of Notice & Quorum', description: '' },
      { title: 'Approval of Previous AGM Minutes', description: '' },
      { title: 'Annual Report Presentation', description: '' },
      { title: 'Financial Statements', description: 'Presentation and approval of audited financial statements' },
      { title: 'Appointment of Auditors', description: '' },
      { title: 'Election of Directors/Officers', description: '' },
      { title: 'Special Resolutions', description: '' },
      { title: 'General Business', description: '' },
      { title: 'Adjournment', description: '' },
    ],
    quorumRequired: true,
  },
  {
    id: 'committee',
    name: 'Committee Meeting',
    description: 'Committee meeting with focused agenda, recommendations, and follow-up items',
    meetingType: 'committee',
    icon: 'UserCheck',
    color: '#059669',
    sections: ['attendance', 'agenda', 'recommendations', 'action_items'],
    defaultAgendaItems: [
      { title: 'Call to Order', description: '' },
      { title: 'Approval of Previous Minutes', description: '' },
      { title: 'Committee Business', description: '' },
      { title: 'Discussion Items', description: '' },
      { title: 'Recommendations to Board', description: '' },
      { title: 'Next Meeting', description: '' },
      { title: 'Adjournment', description: '' },
    ],
    quorumRequired: false,
  },
  {
    id: 'departmental',
    name: 'Department Meeting',
    description: 'Internal department meeting with updates, discussions, and task assignments',
    meetingType: 'departmental',
    icon: 'Briefcase',
    color: '#d97706',
    sections: ['attendance', 'agenda', 'action_items'],
    defaultAgendaItems: [
      { title: 'Welcome & Announcements', description: '' },
      { title: 'Review of Action Items from Last Meeting', description: '' },
      { title: 'Department Updates', description: '' },
      { title: 'Current Projects Status', description: '' },
      { title: 'Upcoming Deadlines & Events', description: '' },
      { title: 'Open Discussion', description: '' },
      { title: 'Action Items & Next Steps', description: '' },
    ],
    quorumRequired: false,
  },
  {
    id: 'standup',
    name: 'Standup / Scrum',
    description: 'Quick daily standup with what was done, what\'s planned, and blockers',
    meetingType: 'standup',
    icon: 'Zap',
    color: '#dc2626',
    sections: ['attendance', 'updates', 'blockers', 'action_items'],
    defaultAgendaItems: [
      { title: 'Yesterday\'s Progress', description: 'What was accomplished since the last standup' },
      { title: 'Today\'s Plan', description: 'What each team member plans to work on today' },
      { title: 'Blockers & Impediments', description: 'Any obstacles preventing progress' },
      { title: 'Announcements', description: '' },
    ],
    quorumRequired: false,
  },
  {
    id: 'general',
    name: 'General Meeting',
    description: 'Flexible general-purpose meeting minutes template',
    meetingType: 'general',
    icon: 'FileText',
    color: '#6b7280',
    sections: ['attendance', 'agenda', 'action_items'],
    defaultAgendaItems: [
      { title: 'Opening', description: '' },
      { title: 'Discussion', description: '' },
      { title: 'Action Items', description: '' },
      { title: 'Closing', description: '' },
    ],
    quorumRequired: false,
  },
];

// GET /api/minutes/templates
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(TEMPLATES);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
