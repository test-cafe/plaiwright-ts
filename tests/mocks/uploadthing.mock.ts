import { vi } from 'vitest';

vi.mock('@uploadthing/react', () => ({
  generateUploadButton: vi.fn(() => () => null),
  generateUploadDropzone: vi.fn(() => () => null),
}));

vi.mock('uploadthing/next', () => ({
  createUploadthing: vi.fn(() => () => ({})),
  createRouteHandler: vi.fn(() => ({ GET: vi.fn(), POST: vi.fn() })),
}));
