import React from 'react';
import './globals.css';
import { Providers } from './providers';
import { Nunito } from 'next/font/google';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza',
  description: 'Order pizza online — fast delivery, fresh ingredients, great taste.',
};

const nunito = Nunito({
  subsets: ['cyrillic'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: false,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={nunito.variable} lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link data-rh="true" rel="icon" href="/logo.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
