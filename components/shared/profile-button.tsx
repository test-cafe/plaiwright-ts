'use client';

import { useSession, signOut } from 'next-auth/react';
import React from 'react';
import { Button } from '../ui/button';
import { CircleUser, LayoutDashboard, LogOut, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface Props {
  onClickOpenModal?: VoidFunction;
  className?: string;
  mobile?: boolean;
  testId?: string;
}

export const ProfileButton: React.FC<Props> = ({ className, onClickOpenModal, mobile, testId }) => {
  const { data: session } = useSession();

  return (
    <div className={className}>
      {session ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={mobile ? 'ghost' : 'secondary'}
              aria-label="Open profile menu"
              className="flex items-center gap-2">
              <CircleUser size={18} />
              {session.user?.name?.split(' ')[0] ?? 'Profile'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2">
            {session.user?.role === 'ADMIN' && (
              <Link href="/dashboard">
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-secondary cursor-pointer">
                  <LayoutDashboard size={16} />
                  Dashboard
                </button>
              </Link>
            )}
            <Link href="/profile">
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-secondary cursor-pointer">
                <CircleUser size={16} />
                Profile
              </button>
            </Link>
            <Link href="/orders">
              <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-secondary cursor-pointer">
                <ShoppingBag size={16} />
                My Orders
              </button>
            </Link>
            <hr className="my-1" />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-secondary cursor-pointer text-red-500">
              <LogOut size={16} />
              Sign out
            </button>
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          onClick={onClickOpenModal}
          variant={mobile ? 'ghost' : 'outline'}
          {...(testId && { 'data-testid': testId })}
          className="flex items-center gap-2"
        >
          <CircleUser size={18} />
          Sign in
        </Button>
      )}
    </div>
  );
};
