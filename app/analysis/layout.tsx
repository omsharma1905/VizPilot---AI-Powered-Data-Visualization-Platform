import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Profiling & Analysis',
  description: 'Explore deep data profiling, statistical summaries, data health scores, and column anomaly detection across your ingested dataset.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
