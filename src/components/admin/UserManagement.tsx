'use client';

import { useState, useEffect } from 'react';

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type RoleFilter = 'all' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
type StatusFilter = 'all' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STUDENT');
  const [showUserDetail, setShowUserDetail] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;
    const ids = Array.from(selectedUsers);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    });
    setSelectedUsers(new Set());
    fetchUsers();
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setInviteEmail('');
    setShowInviteModal(false);
    fetchUsers();
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
    const rows = users.map((u) => [
      u.name || '', u.email, u.role, u.status, new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-400',
    INSTRUCTOR: 'bg-blue-500/10 text-blue-400',
    STUDENT: 'bg-green-500/10 text-green-400',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/10 text-green-400',
    SUSPENDED: 'bg-yellow-500/10 text-yellow-400',
    DEACTIVATED: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as RoleFilter); setPage(1); }}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>

        {/* Actions */}
        <button onClick={() => setShowInviteModal(true)}
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
          Invite User
        </button>
        <button onClick={handleExportCSV}
          className="px-3 py-2 text-sm text-gray-400 hover:text-white bg-slate-700 rounded-lg transition-colors">
          Export CSV
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2">
          <span className="text-sm text-indigo-400">{selectedUsers.size} selected</span>
          <button onClick={() => handleBulkAction('activate')}
            className="text-xs text-green-400 hover:text-green-300">Activate</button>
          <button onClick={() => handleBulkAction('deactivate')}
            className="text-xs text-red-400 hover:text-red-300">Deactivate</button>
          <button onClick={() => handleBulkAction('change_role')}
            className="text-xs text-yellow-400 hover:text-yellow-300">Change Role</button>
          <button onClick={() => setSelectedUsers(new Set())}
            className="text-xs text-gray-400 hover:text-white ml-auto">Clear</button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-700 text-indigo-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-gray-300 overflow-hidden">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || '?'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${roleColors[user.role] || ''}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[user.status] || ''}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setShowUserDetail(user.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-slate-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-slate-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Invite User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleInvite}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">User Details</h3>
              <button onClick={() => setShowUserDetail(null)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {(() => {
              const user = users.find((u) => u.id === showUserDetail);
              if (!user) return <p className="text-gray-400">User not found</p>;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-xl font-bold text-gray-300">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        user.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">{user.name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Role</p>
                      <p className="text-sm text-white font-medium">{user.role}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-sm text-white font-medium">{user.status}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Joined</p>
                      <p className="text-sm text-white font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400">Last Updated</p>
                      <p className="text-sm text-white font-medium">{new Date(user.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
