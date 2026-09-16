import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { CustomCursor } from '@/src/components/ui/CustomCursor';
import { Navbar } from '@/src/components/navigation/Navbar';
import { IntroAnimation } from '@/src/components/cinematic/IntroAnimation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['500', '600', '700'],
});

import { AuthProvider } from '@/src/lib/auth/context';
import { getAuthenticatedUser } from '@/src/lib/auth/session';

export const metadata: Metadata = {
  title: {
    default: 'VizPilot — Cinematic Data Visualization & Intelligence',
    template: '%s · VizPilot',
  },
  description:
    'Turn unformatted business data into cinematic visualizations. Upload your CSV, XLSX, PDF, or DOCX and let VizPilot understand, recommend, and render your interactive dashboard.',
  keywords: ['cinematic data visualization', 'AI analytics', 'business intelligence', 'dashboard', 'zero-trace'],
  authors: [{ name: 'VizPilot' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    title: 'VizPilot — Cinematic Data Intelligence',
    description: "Your data has a story. We'll find the right way to show it.",
    siteName: 'VizPilot',
  },
};

export const viewport: Viewport = {
  themeColor: '#08080b',
  width: 'device-width',
  initialScale: 1,
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialUser = null;
  let initialWorkspace = null;

  try {
    const auth = await getAuthenticatedUser();
    if (auth) {
      initialUser = auth.user;
      initialWorkspace = auth.workspace;
    }
  } catch {
    // Graceful fallback if database connection is pending or outside request context
  }

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-[#08080b] text-[#f8f8fc] antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider initialUser={initialUser} initialWorkspace={initialWorkspace}>
          {/* Branded cinematic intro on initial visit */}
          <IntroAnimation />

          {/* Custom desktop cursor */}
          <CustomCursor />

          {/* Cinematic Navigation (Top-left hamburger, Top-center logo, Top-right CTA) */}
          <Navbar />

          {/* Page Content */}
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
