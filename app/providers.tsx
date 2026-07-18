'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import NextTopLoader from 'nextjs-toploader';
import { SessionProvider } from 'next-auth/react';

const emptySubscribe = () => () => {};

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Render nothing during SSR/hydration to avoid mismatches from client-only children.
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <NextTopLoader />
      <Toaster />
    </>
  );
};
