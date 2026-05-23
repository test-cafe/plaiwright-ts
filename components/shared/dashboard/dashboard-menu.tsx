'use client';

import React from 'react';
import { ArrowLeft, Folder, LayoutDashboard, Leaf, Package, ShoppingCart, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface Props {
  className?: string;
}

function isSubPath(subPath: string, parentPath: string) {
  if (subPath === '/dashboard' && parentPath === '/dashboard') {
    return true;
  }

  return subPath !== '/dashboard' && (subPath === parentPath || parentPath.startsWith(subPath));
}

const items = [
  {
    text: 'Users',
    icon: <Users size={16} />,
    href: '/dashboard/users',
  },
  {
    text: 'Categories',
    icon: <Folder size={16} />,
    href: '/dashboard/categories',
  },
  {
    text: 'Products',
    icon: <Package size={16} />,
    href: '/dashboard/products',
  },
  {
    text: 'Variations',
    icon: <LayoutDashboard size={16} />,
    href: '/dashboard/product-items',
  },
  {
    text: 'Ingredients',
    icon: <Leaf size={16} />,
    href: '/dashboard/ingredients',
  },
  {
    text: 'Orders',
    icon: <ShoppingCart size={16} />,
    href: '/dashboard/orders',
  },
];

export const DashboardMenu: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();

  return (
    <nav className={cn('grid items-start px-4 font-medium text-sm', className)}>
      <Link
        href="/"
        className="flex gap-3 rounded-[8px] px-3 py-2 text-gray-500 transition-all hover:text-gray-900 mb-2">
        <ArrowLeft size={16} />
        Back to store
      </Link>
      <hr className="mb-2" />
      {items.map((item) => (
        <Link
          key={item.text}
          className={cn(
            'flex gap-3 rounded-[8px] px-3 py-2 text-gray-900 transition-all hover:text-gray-900',
            {
              'bg-gray-200': isSubPath(item.href, pathname),
            },
          )}
          href={item.href}>
          {item.icon}
          {item.text}
        </Link>
      ))}
    </nav>
  );
};
