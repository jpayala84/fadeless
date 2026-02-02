import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';

import './globals.css';

export const metadata: Metadata = {
  title: 'Fadeless',
  description:
    'Track the songs Spotify silently removes from your playlists and Liked Songs.'
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = async ({ children }: RootLayoutProps) => {
  const cookieStore = await cookies();
  const theme =
    cookieStore.get('theme')?.value === 'light' ? 'theme-light' : 'theme-dark';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={theme}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
};

export default RootLayout;
