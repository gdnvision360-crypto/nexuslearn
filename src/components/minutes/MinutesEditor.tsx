'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Clock, MapPin, Building2, Hash, Users, FileText, AlertCircle,
  CheckCircle2, XCircle, Lock, Unlock, User
} from 'lucide-react';

interface Attendee {
  id?: string;
  name: string;
  userId?: string;
  role: string;
  designation?: string;
  organization?: string;
  status: string;
  arrivalTime?: string;
  departureTime?: string;
  proxy?: string;
}

interface AgendaItem {
  id?: string;
  orderNumber: number;
  title: string;
  description?: string;
  discussion?: string;
  decision?: string;
  presenterId?: string;
  presenterName?: string;
  duration?: number;
  status: string;
  isConfidential: boolean;
}

interface MotionData {
  id?: string;
  title: string;
  text: string;
  type: string;
  motionNumber?: string;
  agendaItemId?: string;
  movedById?: string;
  movedByName?: string;
  secondedById?: string;
  secondedByName?: string;
  result: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  isUnanimous: boolean;
  remarks?: string;
}

interface ActionItem {
  id?: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: string;
  status: string;
  agendaItemId?: string;
  notes?: string;
}

interface MinutesData {
  id?: string;
  title: string;
  meetingType: string;
  meetingNumber?: string;
  organization?: string;
  location?: string;
  callToOrder?: string;
  adjournment?: string;
  meetingId?: string;
  secretaryId?: string;
  status: string;
  quorumRequired?: number;
  quorumPresent?: number;
  quorumMet: boolean;
  openingRemarks?: string;
  closingRemarks?: string;
  nextMeetingDate?: string;
  nextMeetingLocation?: string;
}

interface MinutesEditorProps {
  minutesId?: string;
  templateId?: string;
  meetingId?: string;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

const MEETING_TYPES = [
  { value: 'board', label: 'Board Meeting' },
  { value: 'general', label: 'General Meeting' },
  { value: 'agm', label: 'Annual General Meeting' },
  { value: 'egm', label: 'Extraordinary General Meeting' },
  { value: 'committee', label: 'Committee Meeting' },
  { value: 'departmental', label: 'Department Meeting' },
  { value: 'standup', label: 'Standup / Scrum' },
];

const ATTENDEE_ROLES = ['chairperson', 'secretary', 'member', 'guest', 'observer'];
const ATTENDEE_STATUSES = ['present', 'absent', 'excused', 'late'];
const MOTION_TYPES = ['resolution', 'motion', 'amendment', 'procedural'];
const MOTION_RESULTS = ['pending', 'passed', 'failed', 'tabled', 'withdrawn'];
const PRIORITIES = ['high', 'medium', 'low'];
const ACTION_STATUSES = ['pending', 'in_progress', 'completed', 'overdue'];

export default function MinutesEditor({ minutesId, templateId, meetingId, onSave, onClose }: MinutesEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('header');

  const [minutesData, setMinutesData] = useState<MinutesData>({
    title: '',
    meetingType: 'general',
    status: 'draft',
    quorumMet: false,
  });

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [motions, setMotions] = useState<MotionData[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  const [expandedAgenda, setExpandedAgenda] = useState<Set<number>>(new Set([0]));

  // Load existing minutes or template
  useEffect(() => {
    if (minutesId) {
      loadMinutes(minutesId);
    } else if (templateId) {
      loadTemplate(templateId);
    }
  }, [minutesId, templateId]);

  const loadMinutes = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/minutes/${id}`);
      if (!res.ok) throw new Error('Failed to load minutes');
      const data = await res.json();
      setMinutesData({
        id: data.id,
        title: data.title,
        meetingType: data.meetingType,
        meetingNumber: data.meetingNumber,
        organization: data.organization,
        location: data.location,
        callToOrder: data.callToOrder ? new Date(data.callToOrder).toISOString().slice(0, 16) : undefined,
        adjournment: data.adjournment ? new Date(data.adjournment).toISOString().slice(0, 16) : undefined,
        meetingId: data.meetingId,
        secretaryId: data.secretaryId,
        status: data.status,
        quorumRequired: data.quorumRequired,
        quorumPresent: data.quorumPresent,
        quorumMet: data.quorumMet,
        openingRemarks: data.openingRemarks,
        closingRemarks: data.closingRemarks,
        nextMeetingDate: data.nextMeetingDate ? new Date(data.nextMeetingDate).toISOString().slice(0, 10) : undefined,
        nextMeetingLocation: data.nextMeetingLocation,
      });
      setAttendees(data.attendees || []);
      setAgendaItems((data.agendaItems || []).map((item: any) => ({
        ...item,
        presenterName: item.presenter?.name,
      })));
      setMotions((data.motions || []).map((m: any) => ({
        ...m,
        movedByName: m.movedBy?.name,
        secondedByName: m.secondedBy?.name,
      })));
      setActionItems((data.actionItems || []).map((item: any) => ({
        ...item,
        assigneeName: item.assignee?.name || item.assigneeName,
        dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : undefined,
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const res = await fetch('/api/minutes/templates');
      if (!res.ok) return;
      const templates = await res.json();
      const template = templates.find((t: any) => t.id === id);
      if (template) {
        setMinutesData(prev => ({
          ...prev,
          meetingType: template.meetingType,
          title: `${template.name} - ${new Date().toLocaleDateString()}`,
        }));
        setAgendaItems(
          template.defaultAgendaItems.map((item: any, idx: number) => ({
            orderNumber: idx + 1,
            title: item.title,
            description: item.description || '',
            discussion: '',
            decision: '',
            status: 'pending',
            isConfidential: false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  // Save minutes
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const url = minutesData.id ? `/api/minutes/${minutesData.id}` : '/api/minutes';
      const method = minutesData.id ? 'PUT' : 'POST';

      const payload: any = {
        ...minutesData,
        meetingId: meetingId || minutesData.meetingId,
      };

      if (!minutesData.id) {
        payload.attendees = attendees;
        payload.agendaItems = agendaItems;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      const saved = await res.json();

      if (!minutesData.id) {
        setMinutesData(prev => ({ ...prev, id: saved.id }));
      }

      // Save agenda items, motions, action items for existing minutes
      if (minutesData.id) {
        for (const item of agendaItems) {
          if (item.id) {
            await fetch(`/api/minutes/${minutesData.id}/agenda`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId: item.id, ...item }),
            });
          } else {
            const agendaRes = await fetch(`/api/minutes/${minutesData.id}/agenda`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
            if (agendaRes.ok) {
              const created = await agendaRes.json();
              item.id = created.id;
            }
          }
        }
      }

      setSuccess('Minutes saved successfully!');
      onSave?.(saved);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quorum calculation
  const calculateQuorum = useCallback(() => {
    const presentCount = attendees.filter(a => a.status === 'present' || a.status === 'late').length;
    setMinutesData(prev => ({
      ...prev,
      quorumPresent: presentCount,
      quorumMet: prev.quorumRequired ? presentCount >= prev.quorumRequired : false,
    }));
  }, [attendees]);

  useEffect(() => { calculateQuorum(); }, [attendees, calculateQuorum]);

  // Attendee management
  const addAttendee = () => {
    setAttendees(prev => [...prev, { name: '', role: 'member', status: 'present' }]);
  };

  const updateAttendee = (index: number, field: string, value: string) => {
    setAttendees(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeAttendee = (index: number) => {
    setAttendees(prev => prev.filter((_, i) => i !== index));
  };

  // Agenda management
  const addAgendaItem = () => {
    setAgendaItems(prev => [...prev, {
      orderNumber: prev.length + 1,
      title: '',
      description: '',
      discussion: '',
      decision: '',
      status: 'pending',
      isConfidential: false,
    }]);
    setExpandedAgenda(prev => new Set([...prev, agendaItems.length]));
  };

  const updateAgendaItem = (index: number, field: string, value: any) => {
    setAgendaItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, orderNumber: i + 1 })));
  };

  // Motion management
  const addMotion = (agendaItemId?: string) => {
    setMotions(prev => [...prev, {
      title: '',
      text: '',
      type: 'resolution',
      agendaItemId,
      result: 'pending',
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      isUnanimous: false,
    }]);
  };

  const updateMotion = (index: number, field: string, value: any) => {
    setMotions(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const removeMotion = (index: number) => {
    setMotions(prev => prev.filter((_, i) => i !== index));
  };

  // Action item management
  const addActionItem = (agendaItemId?: string) => {
    setActionItems(prev => [...prev, {
      description: '',
      priority: 'medium',
      status: 'pending',
      agendaItemId,
    }]);
  };

  const updateActionItem = (index: number, field: string, value: any) => {
    setActionItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeActionItem = (index: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAgendaExpand = (index: number) => {
    setExpandedAgenda(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const sections = [
    { id: 'header', label: 'Meeting Details', icon: FileText },
    { id: 'attendees', label: 'Attendees', icon: Users },
    { id: 'agenda', label: 'Agenda & Proceedings', icon: FileText },
    { id: 'motions', label: 'Motions & Resolutions', icon: CheckCircle2 },
    { id: 'actions', label: 'Action Items', icon: AlertCircle },
    { id: 'remarks', label: 'Remarks & Next Meeting', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Status & Save Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            minutesData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            minutesData.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
            minutesData.status === 'approved' ? 'bg-green-100 text-green-800' :
            minutesData.status === 'signed' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {minutesData.status.replace('_', ' ').toUpperCase()}
          </span>
          {minutesData.meetingNumber && (
            <span className="text-sm text-gray-500">{minutesData.meetingNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-600">{error}</span>}
          {success && <span className="text-sm text-green-600">{success}</span>}
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Minutes'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Section Nav */}
        <div className="w-56 border-r border-gray-200 bg-gray-50 min-h-[calc(100vh-120px)] p-4">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <section.icon size={16} />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Meeting Details */}
          {activeSection === 'header' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Meeting Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                  <input
                    type="text"
                    value={minutesData.title}
                    onChange={e => setMinutesData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Board of Directors Meeting - Q1 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                  <select
                    value={minutesData.meetingType}
                    onChange={e => setMinutesData(prev => ({ ...prev, meetingType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {MEETING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Number</label>
                  <input
                    type="text"
                    value={minutesData.meetingNumber || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, meetingNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., BM-2026-005"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={minutesData.organization || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={minutesData.location || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Meeting location or virtual link"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call to Order</label>
                  <input
                    type="datetime-local"
                    value={minutesData.callToOrder || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, callToOrder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjournment</label>
                  <input
                    type="datetime-local"
                    value={minutesData.adjournment || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, adjournment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quorum Required</label>
                  <input
                    type="number"
                    value={minutesData.quorumRequired || ''}
                    onChange={e => setMinutesData(prev => ({ ...prev, quorumRequired: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                </div>

                <div className="flex items-end">
                  {minutesData.quorumRequired && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      minutesData.quorumMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {minutesData.quorumMet ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      Quorum: {minutesData.quorumPresent || 0} / {minutesData.quorumRequired}
                      {minutesData.quorumMet ? ' (Met)' : ' (Not Met)'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendees */}
          {activeSection === 'attendees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Attendees</h2>
                <button onClick={addAttendee} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Plus size={16} /> Add Attendee
                </button>
              </div>

              {attendees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attendees added yet. Click &quot;Add Attendee&quot; to begin.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Proxy</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendees.map((attendee, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.name}
                              onChange={e => updateAttendee(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="Full name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={attendee.role}
                              onChange={e => updateAttendee(idx, 'role', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {ATTENDEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.designation || ''}
                              onChange={e => updateAttendee(idx, 'designation', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Title"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={attendee.status}
                              onChange={e => updateAttendee(idx, 'status', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-sm ${
                                attendee.status === 'present' ? 'border-green-300 bg-green-50' :
                                attendee.status === 'absent' ? 'border-red-300 bg-red-50' :
                                attendee.status === 'excused' ? 'border-yellow-300 bg-yellow-50' :
                                'border-blue-300 bg-blue-50'
                              }`}
                            >
                              {ATTENDEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={attendee.proxy || ''}
                              onChange={e => updateAttendee(idx, 'proxy', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Proxy for..."
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeAttendee(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {minutesData.quorumRequired && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  minutesData.quorumMet ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {minutesData.quorumMet ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span className="font-medium">
                    Quorum: {attendees.filter(a => a.status === 'present' || a.status === 'late').length} present out of {minutesData.quorumRequired} required
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Agenda & Proceedings */}
          {activeSection === 'agenda' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Agenda & Proceedings</h2>
                <button onClick={addAgendaItem} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {agendaItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No agenda items. Add items or load a template.</div>
              ) : (
                <div className="space-y-3">
                  {agendaItems.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleAgendaExpand(idx)}
                      >
                        <GripVertical size={16} className="text-gray-400" />
                        <span className="font-mono text-sm text-gray-500 w-8">{item.orderNumber}.</span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => { e.stopPropagation(); updateAgendaItem(idx, 'title', e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:ring-1 focus:ring-blue-500"
                          placeholder="Agenda item title"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={item.status}
                            onChange={e => { e.stopPropagation(); updateAgendaItem(idx, 'status', e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="discussed">Discussed</option>
                            <option value="deferred">Deferred</option>
                            <option value="tabled">Tabled</option>
                          </select>
                          <button
                            onClick={e => { e.stopPropagation(); updateAgendaItem(idx, 'isConfidential', !item.isConfidential); }}
                            className={`p-1 rounded ${item.isConfidential ? 'text-red-600' : 'text-gray-400'}`}
                            title={item.isConfidential ? 'Confidential' : 'Not confidential'}
                          >
                            {item.isConfidential ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); removeAgendaItem(idx); }} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                          {expandedAgenda.has(idx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {expandedAgenda.has(idx) && (
                        <div className="p-4 space-y-4 bg-white">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={item.duration || ''}
                                onChange={e => updateAgendaItem(idx, 'duration', parseInt(e.target.value) || undefined)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                min={0}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Presenter</label>
                              <input
                                type="text"
                                value={item.presenterName || ''}
                                onChange={e => updateAgendaItem(idx, 'presenterName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Presenter name"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                            <textarea
                              value={item.description || ''}
                              onChange={e => updateAgendaItem(idx, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[60px]"
                              placeholder="Brief description of the agenda item..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Discussion Notes</label>
                            <textarea
                              value={item.discussion || ''}
                              onChange={e => updateAgendaItem(idx, 'discussion', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[100px]"
                              placeholder="Record the discussion points here..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Decision / Resolution</label>
                            <textarea
                              value={item.decision || ''}
                              onChange={e => updateAgendaItem(idx, 'decision', e.target.value)}
                              className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm resize-y min-h-[60px]"
                              placeholder="Record the decision or resolution made..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Motions & Resolutions */}
          {activeSection === 'motions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Motions & Resolutions</h2>
                <button onClick={() => addMotion()} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Plus size={16} /> Add Motion
                </button>
              </div>

              {motions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No motions recorded.</div>
              ) : (
                <div className="space-y-4">
                  {motions.map((motion, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={motion.title}
                              onChange={e => updateMotion(idx, 'title', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Motion title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                            <select value={motion.type} onChange={e => updateMotion(idx, 'type', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                              {MOTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                        <button onClick={() => removeMotion(idx)} className="ml-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Motion Text</label>
                        <textarea
                          value={motion.text}
                          onChange={e => updateMotion(idx, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[80px]"
                          placeholder="Full text of the motion or resolution..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Moved By</label>
                          <input type="text" value={motion.movedByName || ''} onChange={e => updateMotion(idx, 'movedByName', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Seconded By</label>
                          <input type="text" value={motion.secondedByName || ''} onChange={e => updateMotion(idx, 'secondedByName', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Name" />
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">For</label>
                          <input type="number" value={motion.votesFor} onChange={e => updateMotion(idx, 'votesFor', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-green-300 bg-green-50 rounded text-sm text-center" min={0} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Against</label>
                          <input type="number" value={motion.votesAgainst} onChange={e => updateMotion(idx, 'votesAgainst', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-red-300 bg-red-50 rounded text-sm text-center" min={0} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Abstain</label>
                          <input type="number" value={motion.votesAbstain} onChange={e => updateMotion(idx, 'votesAbstain', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 bg-gray-50 rounded text-sm text-center" min={0} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Result</label>
                          <select value={motion.result} onChange={e => updateMotion(idx, 'result', e.target.value)} className={`w-full px-2 py-1 border rounded text-sm font-medium ${
                            motion.result === 'passed' ? 'border-green-400 bg-green-100 text-green-800' :
                            motion.result === 'failed' ? 'border-red-400 bg-red-100 text-red-800' :
                            'border-gray-300'
                          }`}>
                            {MOTION_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={motion.isUnanimous} onChange={e => updateMotion(idx, 'isUnanimous', e.target.checked)} id={`unanimous-${idx}`} className="rounded" />
                          <label htmlFor={`unanimous-${idx}`} className="text-xs text-gray-600">Unanimous</label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                        <input type="text" value={motion.remarks || ''} onChange={e => updateMotion(idx, 'remarks', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Additional remarks..." />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Items */}
          {activeSection === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
                <button onClick={() => addActionItem()} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Plus size={16} /> Add Action Item
                </button>
              </div>

              {actionItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No action items. Add items to track follow-ups.</div>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-1">{idx + 1}</span>
                        <div className="flex-1 space-y-3">
                          <textarea
                            value={item.description}
                            onChange={e => updateActionItem(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[60px]"
                            placeholder="Describe the action item..."
                          />
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Assignee</label>
                              <input type="text" value={item.assigneeName || ''} onChange={e => updateActionItem(idx, 'assigneeName', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="Name" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                              <input type="date" value={item.dueDate || ''} onChange={e => updateActionItem(idx, 'dueDate', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                              <select value={item.priority} onChange={e => updateActionItem(idx, 'priority', e.target.value)} className={`w-full px-2 py-1 border rounded text-sm ${
                                item.priority === 'high' ? 'border-red-300 bg-red-50' :
                                item.priority === 'low' ? 'border-green-300 bg-green-50' :
                                'border-gray-300'
                              }`}>
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                              <select value={item.status} onChange={e => updateActionItem(idx, 'status', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                {ACTION_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeActionItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Remarks & Next Meeting */}
          {activeSection === 'remarks' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Remarks & Next Meeting</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Remarks</label>
                <textarea
                  value={minutesData.openingRemarks || ''}
                  onChange={e => setMinutesData(prev => ({ ...prev, openingRemarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[100px]"
                  placeholder="Chairperson's opening remarks, welcome notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Remarks</label>
                <textarea
                  value={minutesData.closingRemarks || ''}
                  onChange={e => setMinutesData(prev => ({ ...prev, closingRemarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y min-h-[100px]"
                  placeholder="Closing remarks, summary, vote of thanks..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Next Meeting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={minutesData.nextMeetingDate || ''}
                      onChange={e => setMinutesData(prev => ({ ...prev, nextMeetingDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={minutesData.nextMeetingLocation || ''}
                      onChange={e => setMinutesData(prev => ({ ...prev, nextMeetingLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Next meeting location"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
