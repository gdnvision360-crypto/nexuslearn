'use client';

import { useState, useEffect, useRef } from 'react';

import { Award, CheckCircle, Clock, GraduationCap, Video } from 'lucide-react';
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  bio?: string;
  timezone: string;
  createdAt: string;
  stats: {
    meetingsAttended: number;
    coursesCompleted: number;
    tasksDone: number;
    badgesEarned: number;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}

type StatusType = 'online' | 'away' | 'busy' | 'dnd';

const STATUS_CONFIG: Record<StatusType, { color: string; label: string }> = {
  online: { color: 'bg-green-500', label: 'Online' },
  away: { color: 'bg-yellow-500', label: 'Away' },
  busy: { color: 'bg-orange-500', label: 'Busy' },
  dnd: { color: 'bg-red-500', label: 'Do Not Disturb' },
};

export default function UserProfile({ userId }: { userId?: string }) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<StatusType>('online');
  const [statusMessage, setStatusMessage] = useState('');
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    timezone: '',
    linkedin: '',
    twitter: '',
    github: '',
    website: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const url = userId ? `/api/users/profile?userId=${userId}` : '/api/users/profile';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);
      setEditData({
        name: data.name || '',
        bio: data.bio || '',
        timezone: data.timezone || 'UTC',
        linkedin: data.socialLinks?.linkedin || '',
        twitter: data.socialLinks?.twitter || '',
        github: data.socialLinks?.github || '',
        website: data.socialLinks?.website || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          bio: editData.bio,
          timezone: editData.timezone,
          socialLinks: {
            linkedin: editData.linkedin,
            twitter: editData.twitter,
            github: editData.github,
            website: editData.website,
          },
        }),
      });
      if (res.ok) {
        await fetchProfile();
        setIsEditing(false);
      }
    } catch {
      // handle error
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });
      if (res.ok) await fetchProfile();
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = !userId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

        <div className="px-6 pb-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <div className="relative group">
              <div className="w-24 h-24 rounded-xl border-4 border-slate-800 overflow-hidden bg-slate-700">
                {profile.image ? (
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50
                             opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}

              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800
                             ${STATUS_CONFIG[status].color}`} />
            </div>

            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-xl font-bold text-white bg-slate-700 border border-slate-600
                           rounded-lg px-3 py-1 outline-none focus:border-indigo-500"
                />
              ) : (
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
              )}
              <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-indigo-400 font-medium px-2 py-0.5 bg-indigo-500/10 rounded-full">
                  {profile.role}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {profile.timezone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600
                               hover:bg-indigo-700 rounded-lg transition-colors">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-400
                               hover:text-white bg-slate-700 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-700
                             hover:bg-slate-600 rounded-lg transition-colors">
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Selection */}
          {isOwnProfile && isEditing && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-gray-400">Status:</span>
              {(Object.keys(STATUS_CONFIG) as StatusType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-colors
                    ${status === s ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].color}`} />
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}

          {/* Bio */}
          <div className="mt-4">
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2
                         text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-300">{profile.bio || 'No bio yet'}</p>
            )}
          </div>

          {/* Social Links */}
          {isEditing ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(['linkedin', 'twitter', 'github', 'website'] as const).map((key) => (
                <input
                  key={key}
                  type="text"
                  value={editData[key]}
                  onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1) + ' URL'}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5
                           text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 flex gap-3">
              {profile.socialLinks?.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              )}
              {profile.socialLinks?.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                </a>
              )}
              {profile.socialLinks?.twitter && (
                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-sky-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              )}
              {profile.socialLinks?.website && (
                <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Meetings Attended', value: profile.stats.meetingsAttended, icon: <Video className="w-5 h-5" /> },
          { label: 'Courses Completed', value: profile.stats.coursesCompleted, icon: <GraduationCap className="w-5 h-5" /> },
          { label: 'Tasks Completed', value: profile.stats.tasksDone, icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Badges Earned', value: profile.stats.badgesEarned, icon: <Award className="w-5 h-5" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
        {profile.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {profile.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">{activity.action}</span>
                    {' '}
                    <span className="text-gray-500">{activity.entityType}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
