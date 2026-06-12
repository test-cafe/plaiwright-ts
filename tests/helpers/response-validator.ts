import { expect } from 'vitest';
import { z } from 'zod';
import type { NextResponse } from 'next/server';

type AnyResponse = Response | NextResponse | { status: number; json(): Promise<unknown> };

export async function assertResponseShape<T extends z.ZodTypeAny>(
  response: AnyResponse,
  schema: T,
): Promise<z.infer<T>> {
  const body = await response.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Response body failed schema validation:\n${formatted}\n\nReceived:\n${JSON.stringify(body, null, 2)}`);
  }

  return result.data;
}

export async function assertOkResponse<T extends z.ZodTypeAny>(
  response: AnyResponse,
  schema: T,
): Promise<z.infer<T>> {
  expect(response.status).toBe(200);
  return assertResponseShape(response, schema);
}

/** Asserts only the HTTP status code — use when the response body is empty or irrelevant. */
export function assertStatus(response: AnyResponse, expectedStatus: number): void {
  expect(response.status).toBe(expectedStatus);
}

export async function assertErrorResponse(
  response: AnyResponse,
  expectedStatus: number,
  messageContains?: string,
): Promise<void> {
  expect(response.status).toBe(expectedStatus);

  if (messageContains) {
    const body = (await response.json()) as Record<string, unknown>;
    const text = String(body?.error ?? body?.message ?? '');
    expect(text.toLowerCase()).toContain(messageContains.toLowerCase());
  }
}

// Reusable response schemas for common API shapes
export const schemas = {
  cart: z.object({
    totalAmount: z.number().optional(),
    items: z.array(
      z.object({
        id: z.number(),
        productItemId: z.number(),
        quantity: z.number(),
        ingredients: z.array(z.unknown()),
      }),
    ),
  }),

  cartItem: z.object({
    id: z.number(),
    productItemId: z.number(),
    quantity: z.number().min(1),
  }),

  product: z.object({
    id: z.number(),
    name: z.string(),
    items: z.array(
      z.object({
        id: z.number(),
        price: z.number(),
      }),
    ),
  }),

  // Minimal product shape returned by search (no items relation)
  productSearchResult: z.object({
    id: z.number(),
    name: z.string(),
  }),

  order: z.object({
    id: z.number(),
    status: z.enum(['PENDING', 'SUCCEEDED', 'CANCELLED']),
    totalAmount: z.number(),
  }),

  // Registration success — returns the created user summary
  registerSuccess: z.object({
    user: z.object({
      id: z.number(),
      fullName: z.string(),
      email: z.string().email(),
    }),
  }),

  // Sign-in success — returns the authenticated user summary (same shape as register)
  signinSuccess: z.object({
    user: z.object({
      id: z.number(),
      fullName: z.string(),
      email: z.string().email(),
    }),
  }),

  // GET /api/auth/me — returns the authenticated user's name and email
  me: z.object({
    fullName: z.string(),
    email: z.string().email(),
  }),

  // Ingredient (GET /api/ingredients)
  ingredient: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    imageUrl: z.string(),
  }),

  // Story with nested items (GET /api/stories)
  story: z.object({
    id: z.number(),
    previewImageUrl: z.string(),
    items: z.array(
      z.object({
        id: z.number(),
        storyId: z.number(),
        sourceUrl: z.string(),
      }),
    ),
  }),

  // Stripe webhook acknowledgement
  webhookAck: z.object({
    received: z.boolean(),
  }),

  // Covers both { error } and { message } error shapes used across routes
  error: z.union([
    z.object({ error: z.string() }),
    z.object({ message: z.string() }),
  ]),
};
