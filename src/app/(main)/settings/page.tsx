import { Metadata } from 'next';
import UserSettings from '@/components/profile/UserSettings';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your account preferences and configuration
        </p>
      </div>
      <UserSettings />
    </div>
  );
}
