import { cn, formatMoney } from '@/lib/utils';

interface Props {
  value: number;
  className?: string;
}

export const CartItemDetailsPrice: React.FC<Props> = ({ value, className }) => {
  return <h2 className={cn('font-bold', className)}>{formatMoney(value)}</h2>;
};
