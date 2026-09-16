import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Comprehensive multi-chart dashboard summarizing key metrics, correlation distributions, and interactive analytics for your dataset.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
