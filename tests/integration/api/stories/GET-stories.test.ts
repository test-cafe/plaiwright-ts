import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/stories/route';
import { assertOkResponse } from '@/tests/helpers/response-validator';
import { z } from 'zod';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    story: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const storyItemSchema = z.object({
  id: z.number(),
  url: z.string(),
});

const storiesSchema = z.array(
  z.object({
    id: z.number(),
    previewImageUrl: z.string(),
    items: z.array(storyItemSchema),
  }),
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/stories', () => {
  it('returns an empty array when no stories exist', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    const response = await GET();

    const body = await assertOkResponse(response, z.array(z.unknown()));
    expect(body).toHaveLength(0);
  });

  it('returns stories with nested items', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([
      {
        id: 1,
        previewImageUrl: 'https://example.com/story1.png',
        createdAt: new Date(),
        items: [
          { id: 10, storyId: 1, url: 'https://example.com/slide1.png', createdAt: new Date() },
        ],
      },
    ] as any);

    const response = await GET();

    const body = await assertOkResponse(response, storiesSchema);
    expect(body).toHaveLength(1);
    expect(body[0].items).toHaveLength(1);
    expect(body[0].items[0].url).toBe('https://example.com/slide1.png');
  });

  it('includes items relation in the Prisma query', async () => {
    vi.mocked(prisma.story.findMany).mockResolvedValue([]);

    await GET();

    expect(prisma.story.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.objectContaining({ items: true }) }),
    );
  });
});
