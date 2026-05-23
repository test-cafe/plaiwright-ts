import type { Metadata } from 'next';
import { Header } from '@/components/shared/header';

export const metadata: Metadata = {
  title: 'Next Pizza | Cart',
  description: 'Review your cart and place your order.',
};

export default async function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[#F4F1EE]">
      <Header hasCart={false} hasSearch={false} className="border-gray-200" />
      {children}
    </main>
  );
}
