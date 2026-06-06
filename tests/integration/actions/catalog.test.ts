import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestDb, cleanDb } from '@/tests/helpers/db-setup';
import { createProductFactory } from '@/tests/fixtures/db/products';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => ({ get: vi.fn(() => undefined) })) }));
vi.mock('@/lib/send-email', () => ({ sendEmail: vi.fn() }));
vi.mock('@/lib/create-payment', () => ({ createPayment: vi.fn() }));
vi.mock('@/lib/get-user-session');

import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  createProductItem,
  updateProductItem,
  deleteProductItem,
} from '@/app/actions';
import { revalidatePath } from 'next/cache';

const prisma = useTestDb();
const productFactory = createProductFactory(prisma as any);

beforeEach(async () => {
  await cleanDb();
  vi.clearAllMocks();
});

describe('Category actions', () => {
  it('createCategory persists record and revalidates', async () => {
    await createCategory({ name: 'Burgers' });

    const cat = await prisma.category.findFirst({ where: { name: 'Burgers' } });
    expect(cat).not.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/categories');
  });

  it('updateCategory changes name in DB', async () => {
    const cat = await productFactory.buildCategory('OldName');

    await updateCategory(cat.id, { name: 'NewName' });

    const updated = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(updated?.name).toBe('NewName');
  });

  it('deleteCategory removes record and revalidates', async () => {
    const cat = await productFactory.buildCategory('ToDelete');

    await deleteCategory(cat.id);

    const found = await prisma.category.findUnique({ where: { id: cat.id } });
    expect(found).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/categories');
  });
});

describe('Product actions', () => {
  it('createProduct persists record and revalidates', async () => {
    const cat = await productFactory.buildCategory();

    await createProduct({
      name: 'Veggie',
      imageUrl: 'https://example.com/veggie.png',
      category: { connect: { id: cat.id } },
    });

    const product = await prisma.product.findFirst({ where: { name: 'Veggie' } });
    expect(product).not.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/products');
  });

  it('updateProduct changes name in DB', async () => {
    const cat = await productFactory.buildCategory();
    const product = await productFactory.buildProduct(cat.id, { name: 'OldPizza' });

    await updateProduct(product.id, { name: 'NewPizza' });

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.name).toBe('NewPizza');
  });

  it('deleteProduct removes record and revalidates', async () => {
    const cat = await productFactory.buildCategory();
    const product = await productFactory.buildProduct(cat.id);

    await deleteProduct(product.id);

    const found = await prisma.product.findUnique({ where: { id: product.id } });
    expect(found).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/products');
  });
});

describe('Ingredient actions', () => {
  it('createIngredient persists record with correct price and revalidates', async () => {
    await createIngredient({ name: 'Olives', price: 50, imageUrl: 'https://example.com/olives.png' });

    const ing = await prisma.ingredient.findFirst({ where: { name: 'Olives' } });
    expect(ing).not.toBeNull();
    expect(ing?.price).toBe(50);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/ingredients');
  });

  it('updateIngredient changes price in DB', async () => {
    const ing = await productFactory.buildIngredient({ name: 'Basil', price: 30 });

    await updateIngredient(ing.id, { price: 60 });

    const updated = await prisma.ingredient.findUnique({ where: { id: ing.id } });
    expect(updated?.price).toBe(60);
  });

  it('deleteIngredient removes record and revalidates', async () => {
    const ing = await productFactory.buildIngredient();

    await deleteIngredient(ing.id);

    const found = await prisma.ingredient.findUnique({ where: { id: ing.id } });
    expect(found).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/ingredients');
  });
});

describe('ProductItem actions', () => {
  it('createProductItem persists record with correct fields and revalidates', async () => {
    const cat = await productFactory.buildCategory();
    const product = await productFactory.buildProduct(cat.id);

    await createProductItem({ productId: product.id, price: 799, size: 35, pizzaType: 2 });

    const item = await prisma.productItem.findFirst({
      where: { productId: product.id, size: 35 },
    });
    expect(item).not.toBeNull();
    expect(item?.price).toBe(799);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/product-items');
  });

  it('updateProductItem changes price in DB', async () => {
    const cat = await productFactory.buildCategory();
    const product = await productFactory.buildProduct(cat.id);
    const item = await productFactory.buildProductItem(product.id, { price: 599 });

    await updateProductItem(item.id, { price: 699 });

    const updated = await prisma.productItem.findUnique({ where: { id: item.id } });
    expect(updated?.price).toBe(699);
  });

  it('deleteProductItem removes record and revalidates', async () => {
    const cat = await productFactory.buildCategory();
    const product = await productFactory.buildProduct(cat.id);
    const item = await productFactory.buildProductItem(product.id);

    await deleteProductItem(item.id);

    const found = await prisma.productItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/product-items');
  });
});
