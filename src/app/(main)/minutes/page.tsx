'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Clock, CheckCircle2, AlertTriangle, Archive,
  Sparkles, Calendar, ChevronRight, Filter, Users, Loader2,
  LayoutGrid, List as ListIcon
} from 'lucide-react';
import MinutesEditor from '@/components/minutes/MinutesEditor';
import MinutesTemplates from '@/components/minutes/MinutesTemplates';
import MinutesArchive from '@/components/minutes/MinutesArchive';
import MinutesApprovalPanel from '@/components/minutes/MinutesApprovalPanel';
import MinutesPDFPreview from '@/components/minutes/MinutesPDFPreview';
import MinutesAIGenerator from '@/components/minutes/MinutesAIGenerator';

type TabId = 'active' | 'archive' | 'templates' | 'action-items';

interface ActionItemSummary {
  id: string;
  description: string;
  assigneeName?: string;
  assignee?: { name: string };
  dueDate?: string;
  priority: string;
  status: string;
  minutes?: { id: string; title: string };
}

export default function MinutesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [showNewMinutes, setShowNewMinutes] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedMinutesId, setSelectedMinutesId] = useState<string | null>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const [recentMinutes, setRecentMinutes] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [overdueActions, setOverdueActions] = useState<ActionItemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'active') loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/minutes?limit=6');
      if (res.ok) {
        const data = await res.json();
        setRecentMinutes(data.minutes || []);
        setPendingApprovals(data.minutes?.filter((m: any) => m.status === 'in_review') || []);
        // Action items would need their own endpoint in production
        setOverdueActions([]);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    setShowNewMinutes(true);
  };

  const handleMinutesSelect = (minutesId: string) => {
    setSelectedMinutesId(minutesId);
    setShowNewMinutes(true);
  };

  const handleCloseEditor = () => {
    setShowNewMinutes(false);
    setSelectedMinutesId(null);
    setSelectedTemplate(null);
    loadDashboardData();
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'active', label: 'Active', icon: FileText },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
    { id: 'action-items', label: 'Action Items', icon: CheckCircle2 },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      signed: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Show full editor if selected
  if (showNewMinutes) {
    return (
      <div className="min-h-screen bg-white">
        <MinutesEditor
          minutesId={selectedMinutesId || undefined}
          templateId={selectedTemplate || undefined}
          onSave={() => {}}
          onClose={handleCloseEditor}
        />
      </div>
    );
  }

  // Show template picker
  if (showTemplates) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <MinutesTemplates
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Minutes</h1>
          <p className="text-gray-500 text-sm mt-1">Create, manage, and archive formal meeting proceedings</p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={18} /> New Minutes
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Alerts */}
          {pendingApprovals.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {pendingApprovals.length} minute{pendingApprovals.length > 1 ? 's' : ''} pending approval
                </p>
                <p className="text-xs text-blue-700">Review and approve to finalize meeting records</p>
              </div>
            </div>
          )}

          {overdueActions.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {overdueActions.length} overdue action item{overdueActions.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Recent Minutes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Minutes</h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : recentMinutes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No meeting minutes yet</p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Create Your First Minutes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentMinutes.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => handleMinutesSelect(m.id)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 capitalize">{m.meetingType}</span>
                      {getStatusBadge(m.status)}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-blue-700 line-clamp-2">{m.title}</h4>
                    {m.meetingNumber && <p className="text-xs text-gray-400 mb-2">{m.meetingNumber}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {m._count?.attendees || 0}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                      <span>{m._count?.agendaItems || 0} items • {m._count?.motions || 0} motions</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'archive' && (
        <MinutesArchive onSelect={handleMinutesSelect} />
      )}

      {activeTab === 'templates' && (
        <MinutesTemplates onSelect={handleTemplateSelect} />
      )}

      {activeTab === 'action-items' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Action Items Tracker</h3>
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Action items from all minutes will appear here</p>
            <p className="text-gray-400 text-sm mt-1">Create minutes with action items to start tracking</p>
          </div>
        </div>
      )}
    </div>
  );
}
