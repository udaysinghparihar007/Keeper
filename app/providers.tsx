'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import ThemeRegistry from './ThemeRegistry';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeRegistry>{children}</ThemeRegistry>
    </SessionProvider>
  );
}
