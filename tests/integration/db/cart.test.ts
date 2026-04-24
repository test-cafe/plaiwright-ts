import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma, cleanDb, disconnectDb } from '../../helpers/db';
import { makeUser, makeCategory, makeProduct, makePizzaItem, makeCart, makeCartItem, makeIngredient } from '../../factories';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function seedProductItem() {
  const category = await prisma.category.create({ data: makeCategory() });
  const product = await prisma.product.create({ data: makeProduct(category.id) });
  const productItem = await prisma.productItem.create({ data: makePizzaItem(product.id, { price: 599 }) });
  return productItem;
}

describe('Cart model', () => {
  it('creates an anonymous cart with a token', async () => {
    const data = makeCart({ tokenId: 'tok_abc123' });

    const cart = await prisma.cart.create({ data });

    expect(cart.id).toBeDefined();
    expect(cart.tokenId).toBe('tok_abc123');
    expect(cart.userId).toBeNull();
    expect(cart.totalAmount).toBe(0);
  });

  it('creates a user-linked cart', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    const data = makeCart({ userId: user.id, tokenId: null });

    const cart = await prisma.cart.create({ data });

    expect(cart.userId).toBe(user.id);
  });

  it('enforces one cart per user (unique userId)', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    await prisma.cart.create({ data: makeCart({ userId: user.id }) });

    await expect(
      prisma.cart.create({ data: makeCart({ userId: user.id }) })
    ).rejects.toThrow();
  });

  it('updates total amount', async () => {
    const cart = await prisma.cart.create({ data: makeCart() });

    const updated = await prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: 1198 },
    });

    expect(updated.totalAmount).toBe(1198);
  });

  it('fetches cart with user relation', async () => {
    const user = await prisma.user.create({ data: makeUser() });
    await prisma.cart.create({ data: makeCart({ userId: user.id }) });

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

    expect(cart!.user!.id).toBe(user.id);
  });
});

describe('CartItem model', () => {
  it('creates a cart item linked to cart and product item', async () => {
    const cart = await prisma.cart.create({ data: makeCart() });
    const productItem = await seedProductItem();
    const data = makeCartItem(cart.id, productItem.id, { quantity: 2 });

    const cartItem = await prisma.cartItem.create({ data });

    expect(cartItem.cartId).toBe(cart.id);
    expect(cartItem.productItemId).toBe(productItem.id);
    expect(cartItem.quantity).toBe(2);
  });

  it('creates a pizza cart item with size and type', async () => {
    const cart = await prisma.cart.create({ data: makeCart() });
    const productItem = await seedProductItem();
    const data = makeCartItem(cart.id, productItem.id, { pizzaSize: 30, type: 1 });

    const cartItem = await prisma.cartItem.create({ data });

    expect(cartItem.pizzaSize).toBe(30);
    expect(cartItem.type).toBe(1);
  });

  it('adds ingredients to a cart item', async () => {
    const cart = await prisma.cart.create({ data: makeCart() });
    const productItem = await seedProductItem();
    const ing = await prisma.ingredient.create({ data: makeIngredient() });
    const cartItem = await prisma.cartItem.create({
      data: makeCartItem(cart.id, productItem.id),
    });

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { ingredients: { connect: { id: ing.id } } },
    });

    const found = await prisma.cartItem.findUnique({
      where: { id: cartItem.id },
      include: { ingredients: true },
    });

    expect(found!.ingredients).toHaveLength(1);
    expect(found!.ingredients[0].id).toBe(ing.id);
  });

  it('fetches all items for a cart', async () => {
    const cart = await prisma.cart.create({ data: makeCart() });
    const productItem = await seedProductItem();

    await prisma.cartItem.createMany({
      data: [
        makeCartItem(cart.id, productItem.id, { quantity: 1 }),
        makeCartItem(cart.id, productItem.id, { quantity: 3 }),
      ],
    });

    const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });

    expect(items).toHaveLength(2);
  });
});
