import type { PrismaClient } from '@prisma/client';

export function createProductFactory(prisma: PrismaClient) {
  return {
    async buildCategory(name = 'Pizza') {
      return prisma.category.create({ data: { name } });
    },

    async buildIngredient(overrides: { name?: string; price?: number; imageUrl?: string } = {}) {
      return prisma.ingredient.create({
        data: {
          name: overrides.name ?? 'Extra Cheese',
          price: overrides.price ?? 100,
          imageUrl: overrides.imageUrl ?? 'https://example.com/cheese.png',
        },
      });
    },

    async buildProduct(categoryId: number, overrides: { name?: string; imageUrl?: string } = {}) {
      return prisma.product.create({
        data: {
          name: overrides.name ?? 'Margherita',
          imageUrl: overrides.imageUrl ?? 'https://example.com/pizza.png',
          categoryId,
        },
      });
    },

    async buildProductItem(
      productId: number,
      overrides: { price?: number; size?: number; pizzaType?: number } = {},
    ) {
      return prisma.productItem.create({
        data: {
          productId,
          price: overrides.price ?? 599,
          size: overrides.size ?? 30,
          pizzaType: overrides.pizzaType ?? 1,
        },
      });
    },

    async buildFullPizza(categoryId?: number) {
      const cat = categoryId
        ? { id: categoryId }
        : await this.buildCategory('Pizza');

      const product = await this.buildProduct(cat.id, { name: 'Pepperoni' });
      const small = await this.buildProductItem(product.id, { price: 599, size: 25, pizzaType: 1 });
      const large = await this.buildProductItem(product.id, { price: 899, size: 30, pizzaType: 1 });
      const cheese = await this.buildIngredient({ name: 'Extra Cheese', price: 100 });
      const mushrooms = await this.buildIngredient({ name: 'Mushrooms', price: 80 });

      await prisma.product.update({
        where: { id: product.id },
        data: { ingredients: { connect: [{ id: cheese.id }, { id: mushrooms.id }] } },
      });

      return { product, items: [small, large], ingredients: [cheese, mushrooms], category: cat };
    },
  };
}
