import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your VizPilot corporate profile, verified email, security credentials, and workspace configuration.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
