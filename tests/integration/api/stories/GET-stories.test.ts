import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { GET } from '@/app/api/stories/route';
import { prisma } from '@/lib/prisma';
import { assertOkResponse, schemas } from '@/tests/helpers/response-validator';
import { buildStoryRecord } from '@/tests/fixtures/mock-prisma-records';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    story: {
      findMany: vi.fn(),
    },
  },
}));

const STORY_ID = 1;
const STORY_ITEM_ID = 10;
const STORY_PREVIEW_URL = 'https://example.com/story-preview.png';
const STORY_ITEM_SOURCE_URL = 'https://example.com/slide1.png';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.story.findMany).mockResolvedValue([]);
});

describe('GET /api/stories', () => {
  describe('when no stories exist', () => {
    it('returns an empty array', async () => {
      const response = await GET();

      const body = await assertOkResponse(response, z.array(schemas.story));
      expect(body).toHaveLength(0);
    });
  });

  describe('when stories exist', () => {
    beforeEach(() => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([
        buildStoryRecord({
          id: STORY_ID,
          previewImageUrl: STORY_PREVIEW_URL,
          items: [
            {
              id: STORY_ITEM_ID,
              storyId: STORY_ID,
              sourceUrl: STORY_ITEM_SOURCE_URL,
              createdAt: new Date(),
            },
          ],
        }),
      ]);
    });

    it('returns each story with its nested items', async () => {
      const response = await GET();

      const body = await assertOkResponse(response, z.array(schemas.story));
      expect(body).toHaveLength(1);
      expect(body[0].items).toEqual([
        expect.objectContaining({
          id: STORY_ITEM_ID,
          storyId: STORY_ID,
          sourceUrl: STORY_ITEM_SOURCE_URL,
        }),
      ]);
    });
  });

  describe('query shape', () => {
    it('includes the items relation', async () => {
      await GET();

      expect(prisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: expect.objectContaining({ items: true }) }),
      );
    });
  });
});
