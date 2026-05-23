import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from './container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <Container className="py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-8">

          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image src="/logo.png" width={32} height={32} alt="Next Pizza logo" />
            <div>
              <p className="text-lg uppercase font-black leading-none">Next Pizza</p>
              <p className="text-xs text-gray-400">it doesn't get any tastier</p>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="mailto:support@nextpizza.com" className="hover:text-primary transition-colors">Contact</Link>
          </nav>

          <p className="text-sm text-gray-400 shrink-0">
            © {new Date().getFullYear()} Next Pizza. All rights reserved.
          </p>

        </div>
      </Container>
    </footer>
  );
};
