'use client';

import React from 'react';
import Image from 'next/image';

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
  const searchParams = useSearchParams();
  const router = useRouter();

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
        toast.success(toastMessage, {
          duration: 3000,
        });
      }, 1000);
    }
  }, []);

  const onClickOpenAuthModal = () => setOpenAuthModal(true);

  return (
    <header className={cn('border-b border-gray-100', className)}>
      <Container className="flex items-center justify-between py-8">
        <Link href="/">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" width={35} height={35} alt="Logo" />
            <div>
              <h1 className="text-2xl uppercase font-black">Next Pizza</h1>
              <p className="text-sm text-gray-400 leading-3">it doesn't get any tastier</p>
            </div>
          </div>
        </Link>

        {hasSearch && (
          <div className="mx-10 flex-1">
            <SearchInput />
          </div>
        )}

        <div className="flex items-center gap-3">
          <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

          <ProfileButton onClickOpenModal={onClickOpenAuthModal} />

          {hasCart && <CartButton />}
        </div>
      </Container>
    </header>
  );
};
