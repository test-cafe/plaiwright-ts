import type { Metadata } from 'next';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export const metadata: Metadata = {
  title: 'Next Pizza | Home',
  description: 'Order pizza online — fast delivery, fresh ingredients, great taste.',
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header hasSearch />
      <div className="flex-1">
        {children}
        {modal}
      </div>
      <Footer />
    </main>
  );
}
