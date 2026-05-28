'use client';

import { useState } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import SystemSettings from '@/components/admin/SystemSettings';

import { BarChart3, Settings, Users } from 'lucide-react';
export default function AdminPageClient() {
  const [activeView, setActiveView] = useState('dashboard');

  const views = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-lg p-1 w-fit">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              activeView === v.key
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeView === 'dashboard' && <AdminDashboard />}
      {activeView === 'users' && <UserManagement />}
      {activeView === 'settings' && <SystemSettings />}
    </div>
  );
}
