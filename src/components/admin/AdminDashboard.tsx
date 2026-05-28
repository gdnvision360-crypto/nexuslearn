'use client';

import { useState, useEffect } from 'react';

import { Bell, BookOpen, Calendar, CheckCircle, Clock, HardDrive, Users, Video } from 'lucide-react';;
interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  activeMeetings: number;
  totalCourses: number;
  storageUsed: string;
  todaysMeetings: number;
  pendingApprovals: number;
  systemHealth: string;
  userGrowth: Array<{ date: string; count: number }>;
  meetingFrequency: Array<{ day: string; count: number }>;
  courseCompletion: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    target?: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${timeRange}`);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overviewCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: <Users className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Active Meetings',
      value: stats.activeMeetings.toString(),
      change: `${stats.todaysMeetings} today`,
      positive: true,
      icon: <Video className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Total Courses',
      value: stats.totalCourses.toString(),
      change: 'Published',
      positive: true,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Storage Used',
      value: stats.storageUsed,
      change: 'of 100 GB',
      positive: false,
      icon: <HardDrive className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const quickStats = [
    { label: "Today's Meetings", value: stats.todaysMeetings, icon: <Calendar className="w-5 h-5" /> },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <Clock className="w-5 h-5" /> },
    { label: 'Active Users (24h)', value: stats.activeUsers, icon: <Users className="w-5 h-5" /> },
    { label: 'System Health', value: stats.systemHealth, icon: <CheckCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                <p className={`text-xs mt-1 ${card.positive ? 'text-green-400' : 'text-gray-500'}`}>
                  {card.change}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">User Growth</h3>
          <div className="h-48 flex items-end gap-1">
            {(stats.userGrowth.length > 0 ? stats.userGrowth : Array.from({ length: 7 }, (_, i) => ({
              date: `Day ${i + 1}`,
              count: Math.floor(Math.random() * 50) + 10,
            }))).map((point, index) => {
              const maxCount = Math.max(...stats.userGrowth.map((p) => p.count), 1);
              const height = (point.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm min-h-[4px] transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-gray-500 truncate w-full text-center">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meeting Frequency Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Meeting Frequency</h3>
          <div className="h-48 flex items-end gap-2">
            {(stats.meetingFrequency.length > 0 ? stats.meetingFrequency : [
              { day: 'Mon', count: 12 }, { day: 'Tue', count: 19 },
              { day: 'Wed', count: 15 }, { day: 'Thu', count: 22 },
              { day: 'Fri', count: 18 }, { day: 'Sat', count: 5 },
              { day: 'Sun', count: 3 },
            ]).map((point, index) => {
              const maxCount = Math.max(...stats.meetingFrequency.map((p) => p.count), 1);
              const height = Math.max((point.count / (maxCount || 1)) * 100, 4);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{point.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-500">{point.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Completion Pie */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Course Completion</h3>
          <div className="flex items-center gap-6">
            {/* Simple visual pie replacement */}
            <div className="w-32 h-32 rounded-full border-8 border-indigo-500 relative flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <p className="text-xl font-bold text-white">
                  {stats.courseCompletion.find((c) => c.status === 'completed')?.count || 0}
                </p>
                <p className="text-[10px] text-gray-400">Completed</p>
              </div>
            </div>
            <div className="space-y-2">
              {(stats.courseCompletion.length > 0 ? stats.courseCompletion : [
                { status: 'Completed', count: 45 },
                { status: 'In Progress', count: 32 },
                { status: 'Not Started', count: 23 },
              ]).map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status.toLowerCase().includes('completed') ? 'bg-green-500' :
                    item.status.toLowerCase().includes('progress') ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-gray-300">{item.status}</span>
                  <span className="text-sm font-medium text-white ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat) => (
              <div key={stat.label} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span>{stat.icon}</span>
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {(stats.recentActivity.length > 0 ? stats.recentActivity : []).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  <span className="text-white font-medium">{activity.user}</span>
                  {' '}{activity.action}
                  {activity.target && <span className="text-indigo-400"> {activity.target}</span>}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {stats.recentActivity.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
