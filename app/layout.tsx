import type { Metadata } from 'next';
import { Suspense } from 'react';
import SiteHeader, { HeaderContent } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Baby Name Recommendations',
  description: 'Discover meaningful names for your baby.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Suspense fallback={<HeaderContent />}><SiteHeader /></Suspense>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
