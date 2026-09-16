import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your VizPilot account to build cinematic charts, explore AI recommendations, and turn unformatted business data into boardroom-ready dashboards.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
