import { cn } from '@/lib/utils';

interface Props {
  src: string;
  className?: string;
}

export const CartItemDetailsImage: React.FC<Props> = ({ src, className }) => {
  return <img className={cn('w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]', className)} src={src} />;
};
