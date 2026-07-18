'use client';

import React from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useClickAway } from 'react-use';

import { Container } from './container';
import { SearchInput } from './search-input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CartButton } from './cart-button';
import { AuthModal } from './modals/auth-modal';
import { ProfileButton } from './profile-button';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface Props {
  hasSearch?: boolean;
  hasCart?: boolean;
  className?: string;
}

export const Header: React.FC<Props> = ({ className, hasSearch = true, hasCart = true }) => {
  const [openAuthModal, setOpenAuthModal] = React.useState(false);
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

    if (toastMessage) {
      const timeoutId = setTimeout(() => {
        router.replace('/');
        toast.success(toastMessage, { duration: 3000 });
      }, 1000);
      return () => clearTimeout(timeoutId);
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
              <p className="text-sm text-gray-600 leading-3 hidden sm:block">it doesn&apos;t get any tastier</p>
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
                  onClick={() => { setMobileSearchOpen(true); }}
                >
                  <Search className="w-6 h-6 text-gray-700" />
                </button>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-1">
          <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

          {/* Desktop */}
          <ProfileButton className="hidden md:flex" onClickOpenModal={onClickOpenAuthModal} testId="sign-in-button" />
          {hasCart && <CartButton className="hidden md:flex" />}

          {/* Mobile — always visible icons */}
          <ProfileButton iconOnly className={cn('md:hidden', mobileSearchOpen && 'hidden')} onClickOpenModal={onClickOpenAuthModal} />
          {hasCart && <CartButton compact className={cn('md:hidden', mobileSearchOpen && 'hidden')} />}
        </div>
      </Container>
    </header>
  );
};
