'use client';

import React, { useState, useEffect } from 'react';
import {
  X, FileText, Plus, Save, Sparkles, Users, Clock,
  CheckCircle2, ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';

interface MinutesLivePanelProps {
  meetingId: string;
  meetingTitle: string;
  isHost: boolean;
  onClose: () => void;
}

interface AgendaItem {
  id?: string;
  orderNumber: number;
  title: string;
  discussion: string;
  decision: string;
  status: string;
}

interface ActionItem {
  id?: string;
  description: string;
  assigneeName: string;
  priority: string;
}

export function MinutesLivePanel({ meetingId, meetingTitle, isHost, onClose }: MinutesLivePanelProps) {
  const [minutesId, setMinutesId] = useState<string | null>(null);
  const [title, setTitle] = useState(meetingTitle ? `Minutes: ${meetingTitle}` : 'Meeting Minutes');
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { orderNumber: 1, title: '', discussion: '', decision: '', status: 'pending' }
  ]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [expandedAgenda, setExpandedAgenda] = useState<Set<number>>(new Set([0]));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Check if minutes already exist for this meeting
  useEffect(() => {
    checkExistingMinutes();
  }, [meetingId]);

  const checkExistingMinutes = async () => {
    try {
      const res = await fetch(`/api/minutes?meetingId=${meetingId}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.minutes && data.minutes.length > 0) {
          const existing = data.minutes[0];
          setMinutesId(existing.id);
          setTitle(existing.title);
          // Load full details
          const detailRes = await fetch(`/api/minutes/${existing.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.agendaItems?.length > 0) {
              setAgendaItems(detail.agendaItems.map((a: any) => ({
                id: a.id, orderNumber: a.orderNumber, title: a.title,
                discussion: a.discussion || '', decision: a.decision || '', status: a.status
              })));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking existing minutes:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (minutesId) {
        // Update existing
        await fetch(`/api/minutes/${minutesId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
      } else {
        // Create new
        const res = await fetch('/api/minutes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            meetingId,
            meetingType: 'general',
            agendaItems: agendaItems.filter(a => a.title.trim()),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setMinutesId(data.id);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to save minutes');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!minutesId) {
      await handleSave();
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/minutes/${minutesId}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, source: 'meeting' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.generated?.agendaItems) {
          setAgendaItems(data.generated.agendaItems.map((a: any, i: number) => ({
            orderNumber: i + 1, title: a.title,
            discussion: a.discussion || '', decision: a.decision || '', status: a.status || 'discussed'
          })));
        }
      }
    } catch (err) {
      setError('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const addAgendaItem = () => {
    setAgendaItems(prev => [...prev, {
      orderNumber: prev.length + 1, title: '', discussion: '', decision: '', status: 'pending'
    }]);
    setExpandedAgenda(prev => new Set(prev).add(agendaItems.length));
  };

  const updateAgendaItem = (index: number, field: string, value: string) => {
    setAgendaItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addActionItem = () => {
    setActionItems(prev => [...prev, { description: '', assigneeName: '', priority: 'medium' }]);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Live Minutes</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
          placeholder="Minutes title..."
        />

        {/* Agenda Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Agenda Items</span>
            <button onClick={addAgendaItem} className="text-blue-600 hover:text-blue-800">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {agendaItems.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setExpandedAgenda(prev => {
                      const next = new Set(prev);
                      if (next.has(idx)) next.delete(idx);
                      else next.add(idx);
                      return next;
                    });
                  }}
                >
                  <span className="text-xs text-gray-400 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => { e.stopPropagation(); updateAgendaItem(idx, 'title', e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-transparent text-sm font-medium outline-none"
                    placeholder="Agenda item title..."
                  />
                  {expandedAgenda.has(idx) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
                {expandedAgenda.has(idx) && (
                  <div className="px-3 py-2 space-y-2">
                    <textarea
                      value={item.discussion}
                      onChange={e => updateAgendaItem(idx, 'discussion', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs resize-y min-h-[60px]"
                      placeholder="Discussion notes..."
                    />
                    <textarea
                      value={item.decision}
                      onChange={e => updateAgendaItem(idx, 'decision', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-200 bg-blue-50 rounded text-xs resize-y min-h-[40px]"
                      placeholder="Decision/resolution..."
                    />
                    <select
                      value={item.status}
                      onChange={e => updateAgendaItem(idx, 'status', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="discussed">Discussed</option>
                      <option value="deferred">Deferred</option>
                      <option value="tabled">Tabled</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Action Items</span>
            <button onClick={addActionItem} className="text-blue-600 hover:text-blue-800">
              <Plus size={14} />
            </button>
          </div>
          {actionItems.map((item, idx) => (
            <div key={idx} className="mb-2 p-2 border border-gray-200 rounded-lg space-y-1">
              <input
                type="text"
                value={item.description}
                onChange={e => setActionItems(prev => prev.map((a, i) => i === idx ? { ...a, description: e.target.value } : a))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                placeholder="Action item..."
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={item.assigneeName}
                  onChange={e => setActionItems(prev => prev.map((a, i) => i === idx ? { ...a, assigneeName: e.target.value } : a))}
                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
                  placeholder="Assignee..."
                />
                <select
                  value={item.priority}
                  onChange={e => setActionItems(prev => prev.map((a, i) => i === idx ? { ...a, priority: e.target.value } : a))}
                  className="px-2 py-1 border border-gray-200 rounded text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        <button
          onClick={handleAIGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating...' : 'AI Generate from Transcript'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Minutes'}
        </button>
      </div>
    </div>
  );
}
