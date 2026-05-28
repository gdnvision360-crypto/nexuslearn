'use client';

import { useState, useEffect } from 'react';

import { AlertTriangle, Bell, Flag, HardDrive, Lock, Mail, Settings, Video, Wrench } from 'lucide-react';
interface PlatformConfig {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  maxParticipants: number;
  recordingPolicy: string;
  waitingRoom: boolean;
  storageQuotaStudent: number;
  storageQuotaInstructor: number;
  storageQuotaAdmin: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  maintenanceMode: boolean;
  features: Record<string, boolean>;
}

const DEFAULT_CONFIG: PlatformConfig = {
  platformName: 'NexusLearn',
  logoUrl: '',
  faviconUrl: '',
  maxParticipants: 100,
  recordingPolicy: 'optional',
  waitingRoom: false,
  storageQuotaStudent: 5120,
  storageQuotaInstructor: 20480,
  storageQuotaAdmin: 102400,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpFrom: '',
  maintenanceMode: false,
  features: {
    chat: true,
    video_conferencing: true,
    courses: true,
    tasks: true,
    documents: true,
    ai_features: true,
    file_sharing: true,
    analytics: true,
  },
};

export default function SystemSettings() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) return;
      const data = await res.json();
      setConfig({ ...DEFAULT_CONFIG, ...data });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <K extends keyof PlatformConfig>(key: K, value: PlatformConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setConfig((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] },
    }));
  };

  const ToggleSwitch = ({ checked, onChange, label, description }: {
    checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-gray-300">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const sections = [
    { key: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
    { key: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
    { key: 'storage', label: 'Storage', icon: <HardDrive className="w-5 h-5" /> },
    { key: 'email', label: 'Email / SMTP', icon: <Mail className="w-5 h-5" /> },
    { key: 'features', label: 'Feature Flags', icon: <Flag className="w-5 h-5" /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Section Nav */}
      <div className="md:w-48 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                activeSection === s.key
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6">
        {activeSection === 'general' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Platform Name</label>
                <input
                  type="text"
                  value={config.platformName}
                  onChange={(e) => updateConfig('platformName', e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Logo URL</label>
                <input
                  type="text"
                  value={config.logoUrl}
                  onChange={(e) => updateConfig('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Favicon URL</label>
                <input
                  type="text"
                  value={config.faviconUrl}
                  onChange={(e) => updateConfig('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'meetings' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Meeting Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Max Participants</label>
                <input
                  type="number"
                  value={config.maxParticipants}
                  onChange={(e) => updateConfig('maxParticipants', parseInt(e.target.value) || 100)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Recording Policy</label>
                <select
                  value={config.recordingPolicy}
                  onChange={(e) => updateConfig('recordingPolicy', e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="disabled">Disabled</option>
                  <option value="optional">Optional (Host decides)</option>
                  <option value="always">Always Record</option>
                </select>
              </div>
              <ToggleSwitch
                checked={config.waitingRoom}
                onChange={(v) => updateConfig('waitingRoom', v)}
                label="Waiting Room"
                description="Require host approval before joining"
              />
            </div>
          </div>
        )}

        {activeSection === 'storage' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Storage Quotas</h2>
            <div className="space-y-4">
              {[
                { key: 'storageQuotaStudent' as const, label: 'Student Quota (MB)' },
                { key: 'storageQuotaInstructor' as const, label: 'Instructor Quota (MB)' },
                { key: 'storageQuotaAdmin' as const, label: 'Admin Quota (MB)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400">{label}</label>
                  <input
                    type="number"
                    value={config[key]}
                    onChange={(e) => updateConfig(key, parseInt(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'email' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">SMTP Configuration</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">SMTP Host</label>
                  <input
                    type="text"
                    value={config.smtpHost}
                    onChange={(e) => updateConfig('smtpHost', e.target.value)}
                    placeholder="smtp.example.com"
                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Port</label>
                  <input
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => updateConfig('smtpPort', parseInt(e.target.value) || 587)}
                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">SMTP Username</label>
                <input
                  type="text"
                  value={config.smtpUser}
                  onChange={(e) => updateConfig('smtpUser', e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">From Address</label>
                <input
                  type="email"
                  value={config.smtpFrom}
                  onChange={(e) => updateConfig('smtpFrom', e.target.value)}
                  placeholder="noreply@nexuslearn.com"
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Feature Flags</h2>
            <p className="text-xs text-gray-400">Enable or disable platform features</p>
            <div className="space-y-1">
              {Object.entries(config.features).map(([key, enabled]) => (
                <ToggleSwitch
                  key={key}
                  checked={enabled}
                  onChange={() => toggleFeature(key)}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                />
              ))}
            </div>
          </div>
        )}

        {activeSection === 'maintenance' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Maintenance</h2>
            <div className={`p-4 rounded-lg border ${
              config.maintenanceMode
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-slate-700/30 border-slate-600'
            }`}>
              <ToggleSwitch
                checked={config.maintenanceMode}
                onChange={(v) => updateConfig('maintenanceMode', v)}
                label="Maintenance Mode"
                description="When enabled, only admins can access the platform"
              />
              {config.maintenanceMode && (
                <p className="text-xs text-red-400 mt-2">
                  <AlertTriangle className="w-4 h-4 inline" /> Platform is currently in maintenance mode. Users will see a maintenance page.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                     rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
