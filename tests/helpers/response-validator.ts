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

export async function assertErrorResponse(
  response: AnyResponse,
  expectedStatus: number,
  messageContains?: string,
): Promise<void> {
  expect(response.status).toBe(expectedStatus);

  if (messageContains) {
    const body = await response.json() as Record<string, unknown>;
    const message = String(body?.error ?? body?.message ?? '');
    expect(message.toLowerCase()).toContain(messageContains.toLowerCase());
  }
}

// Reusable response schemas for common API shapes
export const schemas = {
  cart: z.object({
    totalAmount: z.number(),
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

  order: z.object({
    id: z.number(),
    status: z.enum(['PENDING', 'SUCCEEDED', 'CANCELLED']),
    totalAmount: z.number(),
  }),

  error: z.object({
    error: z.string(),
  }),
};
