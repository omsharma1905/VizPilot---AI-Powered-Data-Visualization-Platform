import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Studio',
  description: 'Customize and interact with high-performance ECharts visualizations. Adjust themes, dimensions, aggregations, and export boardroom-ready graphics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
