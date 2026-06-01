import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItem } from '@/components/shared/cart-item';

const defaultProps = {
  id: 1,
  name: 'Pepperoni Pizza',
  price: 899,
  imageUrl: 'https://example.com/pepperoni.png',
  quantity: 2,
  onClickRemove: vi.fn(),
  onClickCountButton: vi.fn(),
};

describe('CartItem', () => {
  it('renders product name', () => {
    render(<CartItem {...defaultProps} />);
    expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument();
  });

  it('renders quantity', () => {
    render(<CartItem {...defaultProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onClickRemove when X button is clicked', () => {
    const onClickRemove = vi.fn();
    render(<CartItem {...defaultProps} quantity={2} onClickRemove={onClickRemove} />);

    // buttons order: [minus, plus, remove-x]
    const buttons = screen.getAllByRole('button');
    const removeButton = buttons[buttons.length - 1];
    fireEvent.click(removeButton);

    expect(onClickRemove).toHaveBeenCalledOnce();
  });

  it('calls onClickCountButton with "plus" when + button is clicked', () => {
    const onClickCountButton = vi.fn();
    render(<CartItem {...defaultProps} quantity={2} onClickCountButton={onClickCountButton} />);

    // buttons order: [minus, plus, remove-x]
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons[1];
    fireEvent.click(plusButton);

    expect(onClickCountButton).toHaveBeenCalledWith('plus');
  });

  it('calls onClickCountButton with "minus" when - button is clicked', () => {
    const onClickCountButton = vi.fn();
    render(<CartItem {...defaultProps} quantity={2} onClickCountButton={onClickCountButton} />);

    const buttons = screen.getAllByRole('button');
    const minusButton = buttons[0];
    fireEvent.click(minusButton);

    expect(onClickCountButton).toHaveBeenCalledWith('minus');
  });

  it('disables minus button when quantity is 1', () => {
    render(<CartItem {...defaultProps} quantity={1} />);
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons[0];
    expect(minusButton).toBeDisabled();
  });
});
