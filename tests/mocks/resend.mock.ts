import { vi } from 'vitest';

export const sentEmails: Array<{ to: string; subject: string; html: string }> = [];

export const mockResend = {
  emails: {
    send: vi.fn().mockImplementation(async (payload: { to: string; subject: string; html: string }) => {
      sentEmails.push(payload);
      return { id: 'mock-email-id' };
    }),
  },
};

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => mockResend),
}));

export function resetEmailMock() {
  sentEmails.length = 0;
  vi.clearAllMocks();
}

export function getLastEmail() {
  return sentEmails[sentEmails.length - 1] ?? null;
}
