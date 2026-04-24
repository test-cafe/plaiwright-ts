import React from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  onChange?: (value?: string) => void;
}

export const AdressInput: React.FC<Props> = ({ onChange }) => {
  return (
    <Input
      className="h-12 text-md"
      placeholder="Delivery address"
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
};
