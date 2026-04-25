import React from 'react';
import { Title } from './title';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  contentClassName?: string;
  title?: string;
  endAdornment?: React.ReactNode;
}

export const WhiteBlock: React.FC<React.PropsWithChildren<Props>> = ({
  title,
  endAdornment,
  className,
  contentClassName,
  children,
}) => {
  return (
    <div className={cn('bg-white rounded-3xl', className)}>
      {title && (
        <div className="flex items-center justify-between p-4 px-4 sm:p-5 sm:px-7 border-b border-gray-100">
          <Title text={title} size="sm" className="font-bold" />
          {endAdornment}
        </div>
      )}

      <div className={cn('px-3 py-3 sm:px-5 sm:py-4', contentClassName)}>{children}</div>
    </div>
  );
};
