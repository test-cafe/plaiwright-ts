// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { GET } from '@/app/api/stories/route';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeStory, makeStoryItem } from '../../factories';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe('GET /api/stories', () => {
  it('returns empty array when no stories exist', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns stories with their items', async () => {
    const story = await prisma.story.create({ data: makeStory() });
    await prisma.storyItem.createMany({
      data: [makeStoryItem(story.id), makeStoryItem(story.id)],
    });

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].items).toHaveLength(2);
    expect(body[0].previewImageUrl).toBeDefined();
  });

  it('returns multiple stories', async () => {
    const s1 = await prisma.story.create({ data: makeStory() });
    const s2 = await prisma.story.create({ data: makeStory() });
    await prisma.storyItem.create({ data: makeStoryItem(s1.id) });
    await prisma.storyItem.create({ data: makeStoryItem(s2.id) });

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(2);
  });
});
