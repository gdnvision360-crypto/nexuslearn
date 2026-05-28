import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPageClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin',
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Role gate: only ADMIN users can access
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminPageClient />;
}
