import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Dataset',
  description: 'Upload CSV, Excel (XLSX), PDF, or Word documents. VizPilot ingests, cleans, and profiles your dataset with zero-trace client-first security.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
