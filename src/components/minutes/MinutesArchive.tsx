'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, FileText, ChevronRight, Clock,
  User, Building2, Tag, Download, Eye, Loader2, ChevronLeft,
  CheckCircle2, AlertCircle, Archive
} from 'lucide-react';

interface MinutesSummary {
  id: string;
  title: string;
  meetingType: string;
  meetingNumber?: string;
  organization?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  chairperson: { id: string; name: string; email: string; image?: string };
  secretary?: { id: string; name: string; email: string; image?: string };
  _count: { agendaItems: number; motions: number; actionItems: number; attendees: number };
}

interface MinutesArchiveProps {
  onSelect?: (minutesId: string) => void;
}

export default function MinutesArchive({ onSelect }: MinutesArchiveProps) {
  const [minutes, setMinutes] = useState<MinutesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadMinutes();
  }, [search, statusFilter, typeFilter, page]);

  const loadMinutes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '12' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('meetingType', typeFilter);

      const res = await fetch(`/api/minutes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMinutes(data.minutes);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error loading minutes:', err);
    } finally {
      setLoading(false);
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      board: 'bg-blue-500', agm: 'bg-purple-500', egm: 'bg-indigo-500',
      committee: 'bg-green-500', departmental: 'bg-yellow-500', standup: 'bg-red-500',
      general: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Search minutes by title, number, or organization..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="signed">Signed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          <option value="board">Board</option>
          <option value="agm">AGM</option>
          <option value="committee">Committee</option>
          <option value="departmental">Department</option>
          <option value="standup">Standup</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total} minutes found</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Minutes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : minutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Archive size={48} className="text-gray-300 mb-3" />
          <p>No minutes found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {minutes.map(m => (
            <div
              key={m.id}
              onClick={() => onSelect?.(m.id)}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getTypeColor(m.meetingType)}`} />
                  <span className="text-xs text-gray-500 capitalize">{m.meetingType}</span>
                </div>
                {getStatusBadge(m.status)}
              </div>

              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-700">
                {m.title}
              </h4>

              {m.meetingNumber && (
                <div className="text-xs text-gray-400 mb-2">{m.meetingNumber}</div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {new Date(m.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <User size={12} /> {m.chairperson?.name || 'Unknown'}
                </span>
              </div>

              <div className="flex gap-3 text-xs text-gray-400">
                <span>{m._count.attendees} attendees</span>
                <span>{m._count.agendaItems} agenda items</span>
                <span>{m._count.motions} motions</span>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Updated {new Date(m.updatedAt).toLocaleDateString()}
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1.5 border rounded-lg text-sm ${
                  page === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
