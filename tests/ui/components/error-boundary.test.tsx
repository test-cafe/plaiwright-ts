import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/(cart)/error';

describe('Error boundary page', () => {
  it('renders "Something went wrong" heading', () => {
    render(<ErrorPage error={new Error('test')} reset={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders "Try again" button', () => {
    render(<ErrorPage error={new Error('test')} reset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('test')} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('does not show error details to user', () => {
    const sensitiveError = new Error('Database connection failed at postgres://...');
    render(<ErrorPage error={sensitiveError} reset={vi.fn()} />);

    expect(screen.queryByText(/postgres/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Database connection/i)).not.toBeInTheDocument();
  });
});
