import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
