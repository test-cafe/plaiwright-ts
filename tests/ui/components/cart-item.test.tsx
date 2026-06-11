import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { CartItem } from '@/components/shared/cart-item';

type CartItemProps = ComponentProps<typeof CartItem>;

const ITEM_NAME = 'Pepperoni Pizza';
const ITEM_PRICE = 899;
const ITEM_IMAGE_URL = 'https://example.com/pepperoni.png';
const INITIAL_QUANTITY = 2;
const MIN_QUANTITY = 1;

const buildProps = (overrides: Partial<CartItemProps> = {}): CartItemProps => ({
  name: ITEM_NAME,
  price: ITEM_PRICE,
  imageUrl: ITEM_IMAGE_URL,
  quantity: INITIAL_QUANTITY,
  onClickRemove: vi.fn(),
  onClickCountButton: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CartItem', () => {
  describe('rendering', () => {
    it('shows the product name', () => {
      render(<CartItem {...buildProps()} />);

      expect(screen.getByText(ITEM_NAME)).toBeInTheDocument();
    });

    it('shows the current quantity', () => {
      render(<CartItem {...buildProps()} />);

      expect(screen.getByText(String(INITIAL_QUANTITY))).toBeInTheDocument();
    });
  });

  describe('remove control', () => {
    it('invokes onClickRemove when the X button is clicked', () => {
      const onClickRemove = vi.fn();
      render(<CartItem {...buildProps({ onClickRemove })} />);

      fireEvent.click(screen.getByTestId('remove-item'));

      expect(onClickRemove).toHaveBeenCalledOnce();
    });
  });

  describe('quantity controls', () => {
    it('invokes onClickCountButton with "plus" when the + button is clicked', () => {
      const onClickCountButton = vi.fn();
      render(<CartItem {...buildProps({ onClickCountButton })} />);

      fireEvent.click(screen.getByTestId('count-plus'));

      expect(onClickCountButton).toHaveBeenCalledWith('plus');
    });

    it('invokes onClickCountButton with "minus" when the − button is clicked', () => {
      const onClickCountButton = vi.fn();
      render(<CartItem {...buildProps({ onClickCountButton })} />);

      fireEvent.click(screen.getByTestId('count-minus'));

      expect(onClickCountButton).toHaveBeenCalledWith('minus');
    });

    it('disables the minus button at minimum quantity', () => {
      render(<CartItem {...buildProps({ quantity: MIN_QUANTITY })} />);

      expect(screen.getByTestId('count-minus')).toBeDisabled();
    });
  });
});
