import { calcCartItemTotalAmount } from '@/lib/calc-cart-item-total-amount';
import { getCartToken } from '@/lib/get-cart-token';
import { getUserSession } from '@/lib/get-user-session';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

async function resolveUserId(sessionUserId: string | undefined): Promise<number | undefined> {
  if (!sessionUserId) return undefined;
  const id = Number(sessionUserId);
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? id : undefined;
}

async function updateCartTotalAmount(userId: number | undefined, cartToken: string | undefined) {
  const userCart = await prisma.cart.findFirst({
    where: userId
      ? { userId }
      : cartToken
        ? { tokenId: cartToken }
        : { id: -1 },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: {
          productItem: { include: { product: true } },
          ingredients: true,
        },
      },
    },
  });

  if (!userCart) return null;

  const totalAmount = userCart.items.reduce((acc, item) => acc + calcCartItemTotalAmount(item), 0);

  return await prisma.cart.update({
    where: { id: userCart.id },
    data: { totalAmount },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
        include: {
          productItem: { include: { product: true } },
          ingredients: true,
        },
      },
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cartToken = getCartToken(req);
    const currentUser = await getUserSession();
    const userId = await resolveUserId(currentUser?.id);

    if (!cartToken && !userId) {
      return NextResponse.json({ error: 'Cart token not found' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: Number(id) },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' });
    }

    const data = (await req.json()) as { quantity: number };

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: data.quantity },
    });

    const updatedCart = await updateCartTotalAmount(userId, cartToken);

    return NextResponse.json(updatedCart);
  } catch (err) {
    logger.error({ err }, '[CART_PATCH] failed');
    return NextResponse.json({ message: '[CART_PATCH] Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cartToken = getCartToken(req);
    const currentUser = await getUserSession();
    const userId = await resolveUserId(currentUser?.id);

    if (!cartToken && !userId) {
      return NextResponse.json({ error: 'Cart token not found' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: Number(id) },
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    const updatedCart = await updateCartTotalAmount(userId, cartToken);

    return NextResponse.json(updatedCart);
  } catch (err) {
    logger.error({ err }, '[CART_DELETE] failed');
    return NextResponse.json({ message: '[CART_DELETE] Server error' }, { status: 500 });
  }
}
