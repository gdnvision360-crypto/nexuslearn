'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Clock, MessageSquare, Send,
  Shield, AlertTriangle, FileEdit, ChevronDown, ChevronUp,
  User, Calendar, Upload
} from 'lucide-react';

interface Approval {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; image?: string };
  role: string;
  status: string;
  comments?: string;
  signatureUrl?: string;
  approvedAt?: string;
  createdAt: string;
}

interface Amendment {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; image?: string };
  section: string;
  originalText: string;
  amendedText: string;
  reason?: string;
  status: string;
  createdAt: string;
}

interface MinutesApprovalPanelProps {
  minutesId: string;
  minutesStatus: string;
  currentUserId: string;
  isChairperson: boolean;
  onStatusChange?: (status: string) => void;
}

export default function MinutesApprovalPanel({
  minutesId, minutesStatus, currentUserId, isChairperson, onStatusChange
}: MinutesApprovalPanelProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [amendmentData, setAmendmentData] = useState({ section: '', originalText: '', amendedText: '', reason: '' });
  const [expandedAmendments, setExpandedAmendments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [minutesId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, amRes] = await Promise.all([
        fetch(`/api/minutes/${minutesId}/approvals`),
        fetch(`/api/minutes/${minutesId}/amendments`),
      ]);
      if (appRes.ok) setApprovals(await appRes.json());
      if (amRes.ok) setAmendments(await amRes.json());
    } catch (err) {
      console.error('Error loading approval data:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitApproval = async (status: string) => {
    try {
      const res = await fetch(`/api/minutes/${minutesId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments: comment, role: isChairperson ? 'chairperson' : 'board_member' }),
      });
      if (res.ok) {
        setComment('');
        loadData();
        if (status === 'approved') onStatusChange?.('approved');
      }
    } catch (err) {
      console.error('Error submitting approval:', err);
    }
  };

  const requestApproval = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/minutes/${minutesId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, status: 'pending' }),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Error requesting approval:', err);
    }
  };

  const submitAmendment = async () => {
    if (!amendmentData.section || !amendmentData.originalText || !amendmentData.amendedText) return;
    try {
      const res = await fetch(`/api/minutes/${minutesId}/amendments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amendmentData),
      });
      if (res.ok) {
        setAmendmentData({ section: '', originalText: '', amendedText: '', reason: '' });
        setShowAmendmentForm(false);
        loadData();
      }
    } catch (err) {
      console.error('Error submitting amendment:', err);
    }
  };

  const reviewAmendment = async (amendmentId: string, status: string) => {
    try {
      const res = await fetch(`/api/minutes/${minutesId}/amendments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendmentId, status }),
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Error reviewing amendment:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      case 'requested_changes': return <FileEdit size={16} className="text-yellow-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      signed: 'bg-purple-100 text-purple-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>;
  }

  const myApproval = approvals.find(a => a.userId === currentUserId);
  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Approval Status</h3>
        </div>
        {getStatusBadge(minutesStatus)}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{approvals.filter(a => a.status === 'approved').length} of {approvals.length} approved</span>
          <span>{pendingCount} pending</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: approvals.length ? `${(approvals.filter(a => a.status === 'approved').length / approvals.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Approvers List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Approvers</h4>
        {approvals.length === 0 ? (
          <p className="text-sm text-gray-500">No approvers assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {approvals.map(approval => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(approval.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{approval.user.name || approval.user.email}</div>
                    <div className="text-xs text-gray-500 capitalize">{approval.role.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium capitalize ${
                    approval.status === 'approved' ? 'text-green-600' :
                    approval.status === 'rejected' ? 'text-red-600' :
                    approval.status === 'requested_changes' ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {approval.status.replace('_', ' ')}
                  </span>
                  {approval.approvedAt && (
                    <div className="text-xs text-gray-400">{new Date(approval.approvedAt).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Approval Actions */}
      {(minutesStatus === 'in_review' || minutesStatus === 'draft') && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <h4 className="text-sm font-semibold text-blue-900">Your Review</h4>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Add comments (optional)..."
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={() => submitApproval('approved')}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <CheckCircle2 size={16} /> Approve
            </button>
            <button
              onClick={() => submitApproval('requested_changes')}
              className="flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
            >
              <FileEdit size={16} /> Request Changes
            </button>
            <button
              onClick={() => submitApproval('rejected')}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Submit for Review (chairperson) */}
      {isChairperson && minutesStatus === 'draft' && (
        <button
          onClick={() => onStatusChange?.('in_review')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Send size={16} /> Submit for Review
        </button>
      )}

      {/* Amendments Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Amendments</h4>
          <button
            onClick={() => setShowAmendmentForm(!showAmendmentForm)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAmendmentForm ? 'Cancel' : '+ Propose Amendment'}
          </button>
        </div>

        {showAmendmentForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <input
              type="text"
              value={amendmentData.section}
              onChange={e => setAmendmentData(prev => ({ ...prev, section: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Section (e.g., Agenda Item 3, Motion 2)"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Original Text</label>
                <textarea
                  value={amendmentData.originalText}
                  onChange={e => setAmendmentData(prev => ({ ...prev, originalText: e.target.value }))}
                  className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-sm"
                  rows={4}
                  placeholder="Current text..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amended Text</label>
                <textarea
                  value={amendmentData.amendedText}
                  onChange={e => setAmendmentData(prev => ({ ...prev, amendedText: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded-lg text-sm"
                  rows={4}
                  placeholder="Proposed new text..."
                />
              </div>
            </div>
            <textarea
              value={amendmentData.reason}
              onChange={e => setAmendmentData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Reason for amendment (optional)..."
              rows={2}
            />
            <button
              onClick={submitAmendment}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Send size={14} /> Submit Amendment
            </button>
          </div>
        )}

        {amendments.length === 0 ? (
          <p className="text-sm text-gray-500">No amendments proposed.</p>
        ) : (
          <div className="space-y-2">
            {amendments.map(amendment => (
              <div key={amendment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setExpandedAmendments(prev => {
                      const next = new Set(prev);
                      if (next.has(amendment.id)) next.delete(amendment.id);
                      else next.add(amendment.id);
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      amendment.status === 'accepted' ? 'bg-green-500' :
                      amendment.status === 'rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-medium">{amendment.section}</span>
                    <span className="text-xs text-gray-500">by {amendment.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium capitalize ${
                      amendment.status === 'accepted' ? 'text-green-600' :
                      amendment.status === 'rejected' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>{amendment.status}</span>
                    {expandedAmendments.has(amendment.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {expandedAmendments.has(amendment.id) && (
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-red-50 rounded text-sm">
                        <div className="text-xs font-medium text-red-700 mb-1">Original:</div>
                        <div className="line-through text-red-800">{amendment.originalText}</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-sm">
                        <div className="text-xs font-medium text-green-700 mb-1">Proposed:</div>
                        <div className="text-green-800">{amendment.amendedText}</div>
                      </div>
                    </div>
                    {amendment.reason && (
                      <p className="text-xs text-gray-600"><strong>Reason:</strong> {amendment.reason}</p>
                    )}
                    {isChairperson && amendment.status === 'proposed' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => reviewAmendment(amendment.id, 'accepted')} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Accept</button>
                        <button onClick={() => reviewAmendment(amendment.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">Reject</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
