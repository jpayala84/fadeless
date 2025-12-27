import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import './globals.css';

export const metadata: Metadata = {
  title: 'Spotify Gone Songs',
  description:
    'Track the songs Spotify silently removes from your playlists and Liked Songs.'
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body>
      {children}
      <Toaster position="bottom-right" richColors />
    </body>
  </html>
);

export default RootLayout;
