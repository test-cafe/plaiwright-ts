'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Search, X } from 'lucide-react';
import { useClickAway } from 'react-use';

import { Container } from './container';
import { SearchInput } from './search-input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CartButton } from './cart-button';
import { AuthModal } from './modals/auth-modal';
import { ProfileButton } from './profile-button';
import { MobileCartMenuItem } from './mobile-cart-menu-item';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Props {
  hasSearch?: boolean;
  hasCart?: boolean;
  className?: string;
}

export const Header: React.FC<Props> = ({ className, hasSearch = true, hasCart = true }) => {
  const [openAuthModal, setOpenAuthModal] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const mobileSearchRef = React.useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useClickAway(mobileSearchRef, () => setMobileSearchOpen(false));

  React.useEffect(() => {
    let toastMessage = '';

    if (searchParams.has('verified')) {
      toastMessage = 'Email confirmed successfully!';
    }

    if (searchParams.has('paid')) {
      toastMessage = 'Order paid successfully! Confirmation sent to your email.';
    }

    if (toastMessage) {
      setTimeout(() => {
        router.replace('/');
        toast.success(toastMessage, { duration: 3000 });
      }, 1000);
    }
  }, []);

  const onClickOpenAuthModal = () => setOpenAuthModal(true);

  return (
    <header className={cn('border-b border-gray-100 relative z-20', className)}>
      <Container className="flex items-center justify-between py-4 md:py-8">
        <Link href="/" className={cn(mobileSearchOpen && 'hidden md:flex')}>
          <div className="flex items-center gap-4">
            <Image src="/logo.png" width={35} height={35} alt="Logo" />
            <div>
              <h1 className="text-2xl uppercase font-black">Next Pizza</h1>
              <p className="text-sm text-gray-400 leading-3 hidden sm:block">it doesn't get any tastier</p>
            </div>
          </div>
        </Link>

        {hasSearch && (
          <>
            {/* Desktop search */}
            <div className="hidden md:flex mx-10 flex-1">
              <SearchInput />
            </div>

            {/* Mobile search — icon collapsed, expands on click */}
            <div
              ref={mobileSearchRef}
              className={cn(
                'md:hidden flex items-center transition-all duration-300 ease-in-out',
                mobileSearchOpen ? 'flex-1 mx-2' : 'w-auto',
              )}
            >
              {mobileSearchOpen ? (
                <SearchInput />
              ) : (
                <button
                  aria-label="Open search"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => { setMobileMenuOpen(false); setMobileSearchOpen(true); }}
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-3">
          <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

          <ProfileButton className="hidden md:flex" onClickOpenModal={onClickOpenAuthModal} testId="sign-in-button" />
          {hasCart && <CartButton className="hidden md:flex" />}

          <button
            className={cn('md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors', mobileSearchOpen && 'hidden')}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>

      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'max-h-[12rem] opacity-100 pb-4' : 'max-h-0 opacity-0',
        )}
      >
        <Container className="flex flex-col items-end gap-3 pt-2">
          <ProfileButton mobile onClickOpenModal={() => { onClickOpenAuthModal(); setMobileMenuOpen(false); }} />
          {hasCart && <MobileCartMenuItem />}
        </Container>
      </div>
    </header>
  );
};
