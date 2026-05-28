'use client';

import { useState, useEffect, useCallback } from 'react';

import { Bell, Calendar, Eye, Globe, Key, Link, Lock, MessageSquare, Mic, Monitor, Palette, Settings, Shield, Video } from 'lucide-react';;
type SettingsTab = 'general' | 'notifications' | 'audio-video' | 'appearance' | 'privacy' | 'security' | 'integrations' | 'accessibility';

interface SettingsData {
  // General
  displayName: string;
  email: string;
  timezone: string;
  language: string;
  dateFormat: string;
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  // Audio/Video
  defaultCamera: string;
  defaultMic: string;
  defaultSpeaker: string;
  autoVirtualBg: boolean;
  autoEyeContact: boolean;
  // Appearance
  theme: string;
  accentColor: string;
  fontSize: string;
  compactMode: boolean;
  // Privacy
  profileVisibility: string;
  showActivityStatus: boolean;
  showReadReceipts: boolean;
  // Security
  twoFactorEnabled: boolean;
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  displayName: '',
  email: '',
  timezone: 'UTC',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  defaultCamera: '',
  defaultMic: '',
  defaultSpeaker: '',
  autoVirtualBg: false,
  autoEyeContact: false,
  theme: 'system',
  accentColor: '#6366f1',
  fontSize: 'medium',
  compactMode: false,
  profileVisibility: 'public',
  showActivityStatus: true,
  showReadReceipts: true,
  twoFactorEnabled: false,
  reducedMotion: false,
  highContrast: false,
};

const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { key: 'audio-video', label: 'Audio/Video', icon: <Mic className="w-5 h-5" /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  { key: 'privacy', label: 'Privacy', icon: <Lock className="w-5 h-5" /> },
  { key: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  { key: 'integrations', label: 'Integrations', icon: <Link className="w-5 h-5" /> },
  { key: 'accessibility', label: 'Accessibility', icon: <Eye className="w-5 h-5" /> },
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b',
];

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/settings');
      if (!res.ok) return;
      const data = await res.json();
      const merged = { ...DEFAULT_SETTINGS, ...data };
      setSettings(merged);
      setOriginalSettings(merged);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setOriginalSettings({ ...settings });
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings({ ...originalSettings });
    setHasChanges(false);
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-slate-600'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );

  const SelectField = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[] | string[];
  }) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors
                  ${activeTab === tab.key
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">General Settings</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Display Name</label>
                  <input
                    type="text"
                    value={settings.displayName}
                    onChange={(e) => updateSetting('displayName', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <SelectField label="Timezone" value={settings.timezone} onChange={(v) => updateSetting('timezone', v)} options={TIMEZONES} />
                <SelectField label="Language" value={settings.language} onChange={(v) => updateSetting('language', v)} options={LANGUAGES} />
                <SelectField label="Date Format" value={settings.dateFormat} onChange={(v) => updateSetting('dateFormat', v)} options={DATE_FORMATS} />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              <div className="space-y-2">
                <ToggleSwitch checked={settings.emailNotifications} onChange={(v) => updateSetting('emailNotifications', v)} label="Email Notifications" />
                <ToggleSwitch checked={settings.pushNotifications} onChange={(v) => updateSetting('pushNotifications', v)} label="Push Notifications" />
                <ToggleSwitch checked={settings.inAppNotifications} onChange={(v) => updateSetting('inAppNotifications', v)} label="In-App Notifications" />
              </div>
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-white mb-3">Per-Type Preferences</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Meeting Invites', desc: 'When someone invites you to a meeting' },
                    { type: 'Chat Messages', desc: 'New messages in your channels' },
                    { type: 'Task Assignments', desc: 'When a task is assigned to you' },
                    { type: 'Task Due Dates', desc: 'Reminders for upcoming deadlines' },
                    { type: 'Course Updates', desc: 'New content in enrolled courses' },
                    { type: 'Quiz Graded', desc: 'When your quiz is graded' },
                    { type: 'Certificates', desc: 'When you earn a certificate' },
                    { type: 'System Alerts', desc: 'Important system notifications' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-300">{item.type}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="flex gap-3">
                        {['Email', 'Push', 'App'].map((ch) => (
                          <label key={ch} className="flex items-center gap-1 text-xs text-gray-400">
                            <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500" />
                            {ch}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audio/Video Tab */}
          {activeTab === 'audio-video' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Audio & Video Settings</h2>
              <div className="space-y-4">
                <SelectField label="Default Camera" value={settings.defaultCamera} onChange={(v) => updateSetting('defaultCamera', v)}
                  options={[{ value: '', label: 'System Default' }]} />
                <SelectField label="Default Microphone" value={settings.defaultMic} onChange={(v) => updateSetting('defaultMic', v)}
                  options={[{ value: '', label: 'System Default' }]} />
                <SelectField label="Default Speaker" value={settings.defaultSpeaker} onChange={(v) => updateSetting('defaultSpeaker', v)}
                  options={[{ value: '', label: 'System Default' }]} />
                <div className="border-t border-slate-700 pt-4">
                  <ToggleSwitch checked={settings.autoVirtualBg} onChange={(v) => updateSetting('autoVirtualBg', v)} label="Auto-enable virtual background" />
                  <ToggleSwitch checked={settings.autoEyeContact} onChange={(v) => updateSetting('autoEyeContact', v)} label="Auto-enable eye contact correction" />
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400">Theme</label>
                  <div className="flex gap-3 mt-2">
                    {[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'system', label: 'System' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => updateSetting('theme', t.value)}
                        className={`px-4 py-2 text-sm rounded-lg border transition-colors
                          ${settings.theme === t.value
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                            : 'border-slate-600 text-gray-400 hover:border-slate-500'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Accent Color</label>
                  <div className="flex gap-2 mt-2">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSetting('accentColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform
                          ${settings.accentColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <SelectField label="Font Size" value={settings.fontSize} onChange={(v) => updateSetting('fontSize', v)}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium (Default)' },
                    { value: 'large', label: 'Large' },
                  ]} />
                <ToggleSwitch checked={settings.compactMode} onChange={(v) => updateSetting('compactMode', v)} label="Compact Mode" />
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Privacy Settings</h2>
              <div className="space-y-4">
                <SelectField label="Profile Visibility" value={settings.profileVisibility} onChange={(v) => updateSetting('profileVisibility', v)}
                  options={[
                    { value: 'public', label: 'Public - Anyone can view' },
                    { value: 'members', label: 'Members Only' },
                    { value: 'private', label: 'Private - Only you' },
                  ]} />
                <ToggleSwitch checked={settings.showActivityStatus} onChange={(v) => updateSetting('showActivityStatus', v)} label="Show Activity Status" />
                <ToggleSwitch checked={settings.showReadReceipts} onChange={(v) => updateSetting('showReadReceipts', v)} label="Show Read Receipts" />
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Security</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {settings.twoFactorEnabled ? 'Enabled - Your account is protected' : 'Add extra security to your account'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      settings.twoFactorEnabled ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {settings.twoFactorEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <a href="/settings?setup2fa=true" className="inline-block mt-3 text-sm text-indigo-400 hover:text-indigo-300">
                    {settings.twoFactorEnabled ? 'Manage 2FA →' : 'Setup 2FA →'}
                  </a>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h3 className="text-sm font-medium text-white">Change Password</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Update your password regularly for security</p>
                  <button className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">
                    Change Password →
                  </button>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <h3 className="text-sm font-medium text-white">Active Sessions</h3>
                  <p className="text-xs text-gray-400 mt-0.5">View and manage your active sessions</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">●</span>
                        <span className="text-gray-300">Current Session</span>
                      </div>
                      <span className="text-xs text-gray-500">Active now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Connected Apps</h2>
              <div className="space-y-3">
                {[
                  { name: 'Google Calendar', desc: 'Sync meetings with Google Calendar', icon: <Calendar className="w-5 h-5" />, connected: false },
                  { name: 'Slack', desc: 'Get notifications in Slack', icon: <MessageSquare className="w-5 h-5" />, connected: false },
                  { name: 'Microsoft Teams', desc: 'Integration with Teams', icon: <Monitor className="w-5 h-5" />, connected: false },
                  { name: 'Zoom', desc: 'Import meetings from Zoom', icon: <Video className="w-5 h-5" />, connected: false },
                  { name: 'GitHub', desc: 'Link repositories', icon: <Globe className="w-5 h-5" />, connected: false },
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <h3 className="text-sm font-medium text-white">{app.name}</h3>
                        <p className="text-xs text-gray-400">{app.desc}</p>
                      </div>
                    </div>
                    <button className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      app.connected
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                    }`}>
                      {app.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Accessibility</h2>
              <div className="space-y-2">
                <ToggleSwitch checked={settings.reducedMotion} onChange={(v) => updateSetting('reducedMotion', v)} label="Reduced Motion" />
                <ToggleSwitch checked={settings.highContrast} onChange={(v) => updateSetting('highContrast', v)} label="High Contrast Mode" />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-gray-400 border border-slate-600">?</kbd> anywhere to view keyboard shortcuts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save/Cancel Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-t border-slate-700 px-6 py-3 flex items-center justify-end gap-3 z-50">
          <p className="text-sm text-yellow-400 mr-auto">You have unsaved changes</p>
          <button onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                     rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
