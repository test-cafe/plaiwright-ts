import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  makeCategory,
  makeIngredient,
  makePizzaItem,
  makeProduct,
  makeProductItem,
} from "../../factories";
import { cleanDb, disconnectDb, prisma } from "../../helpers/db";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe("Category model", () => {
  it("creates a category", async () => {
    const data = makeCategory({ name: "Pizzas" });

    const category = await prisma.category.create({ data });

    expect(category.id).toBeDefined();
    expect(category.name).toBe("Pizzas");
  });

  it("creates multiple categories", async () => {
    await prisma.category.createMany({
      data: [
        makeCategory({ name: "Pizzas" }),
        makeCategory({ name: "Drinks" }),
        makeCategory({ name: "Snacks" }),
      ],
    });

    const count = await prisma.category.count();
    expect(count).toBe(3);
  });
});

describe("Product model", () => {
  it("creates a product linked to a category", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    const data = makeProduct(category.id, { name: "Margherita" });

    const product = await prisma.product.create({ data });

    expect(product.id).toBeDefined();
    expect(product.name).toBe("Margherita");
    expect(product.categoryId).toBe(category.id);
  });

  it("fetches product with its category", async () => {
    const category = await prisma.category.create({
      data: makeCategory({ name: "Pizzas" }),
    });
    const product = await prisma.product.create({
      data: makeProduct(category.id),
    });

    const found = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true },
    });

    expect(found!.category.name).toBe("Pizzas");
  });

  it("fetches all products in a category", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    await prisma.product.createMany({
      data: [
        makeProduct(category.id),
        makeProduct(category.id),
        makeProduct(category.id),
      ],
    });

    const products = await prisma.product.findMany({
      where: { categoryId: category.id },
    });

    expect(products).toHaveLength(3);
  });
});

describe("ProductItem model", () => {
  it("creates a plain product item", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    const product = await prisma.product.create({
      data: makeProduct(category.id),
    });
    const data = makeProductItem(product.id, { price: 599 });

    const item = await prisma.productItem.create({ data });

    expect(item.price).toBe(599);
    expect(item.size).toBeNull();
    expect(item.pizzaType).toBeNull();
  });

  it("creates a pizza item with size and type", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    const product = await prisma.product.create({
      data: makeProduct(category.id),
    });
    const data = makePizzaItem(product.id, { size: 30, pizzaType: 1 });

    const item = await prisma.productItem.create({ data });

    expect(item.size).toBe(30);
    expect(item.pizzaType).toBe(1);
  });

  it("fetches product items for a product", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    const product = await prisma.product.create({
      data: makeProduct(category.id),
    });

    await prisma.productItem.createMany({
      data: [
        makePizzaItem(product.id, { size: 25, pizzaType: 1 }),
        makePizzaItem(product.id, { size: 30, pizzaType: 1 }),
        makePizzaItem(product.id, { size: 40, pizzaType: 2 }),
      ],
    });

    const items = await prisma.productItem.findMany({
      where: { productId: product.id },
    });

    expect(items).toHaveLength(3);
  });
});

describe("Ingredient model", () => {
  it("creates an ingredient", async () => {
    const data = makeIngredient({ name: "Mozzarella", price: 99 });

    const ingredient = await prisma.ingredient.create({ data });

    expect(ingredient.name).toBe("Mozzarella");
    expect(ingredient.price).toBe(99);
  });

  it("links ingredients to a product", async () => {
    const category = await prisma.category.create({ data: makeCategory() });
    const product = await prisma.product.create({
      data: makeProduct(category.id),
    });
    const ing1 = await prisma.ingredient.create({ data: makeIngredient() });
    const ing2 = await prisma.ingredient.create({ data: makeIngredient() });

    await prisma.product.update({
      where: { id: product.id },
      data: { ingredients: { connect: [{ id: ing1.id }, { id: ing2.id }] } },
    });

    const found = await prisma.product.findUnique({
      where: { id: product.id },
      include: { ingredients: true },
    });

    expect(found!.ingredients).toHaveLength(2);
  });

  it("cannot create a product without a valid category", async () => {
    // ARRANGE
    const data = makeProduct(99999); // 99999 — fake category ID that doesn't exist

    // ACT + ASSERT
    await expect(prisma.product.create({ data })).rejects.toThrow(); // must fail — foreign key violation
  });
});
