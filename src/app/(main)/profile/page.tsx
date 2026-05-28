import { Metadata } from 'next';
import UserProfile from '@/components/profile/UserProfile';

export const metadata: Metadata = {
  title: 'My Profile',
};

export default function ProfilePage() {
  return (
    <div className="p-6">
      <UserProfile />
    </div>
  );
}
