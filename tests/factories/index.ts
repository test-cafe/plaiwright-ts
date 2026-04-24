import { faker } from '@faker-js/faker';
import { OrderStatus, UserRole } from '@prisma/client';

// ─── User ────────────────────────────────────────────────────────────────────

export function makeUser(overrides?: Partial<{
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  provider: string | null;
  providerId: string | null;
  verified: Date | null;
}>) {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    role: UserRole.USER,
    provider: null,
    providerId: null,
    verified: null,
    ...overrides,
  };
}

export function makeVerifiedUser(overrides?: Parameters<typeof makeUser>[0]) {
  return makeUser({ verified: new Date(), ...overrides });
}

export function makeAdminUser(overrides?: Parameters<typeof makeUser>[0]) {
  return makeUser({ role: UserRole.ADMIN, verified: new Date(), ...overrides });
}

// ─── Category ────────────────────────────────────────────────────────────────

export function makeCategory(overrides?: Partial<{ name: string }>) {
  return {
    name: faker.commerce.department(),
    ...overrides,
  };
}

// ─── Ingredient ──────────────────────────────────────────────────────────────

export function makeIngredient(overrides?: Partial<{
  name: string;
  price: number;
  imageUrl: string;
}>) {
  return {
    name: faker.commerce.productName(),
    price: faker.number.int({ min: 50, max: 300 }),
    imageUrl: faker.image.url(),
    ...overrides,
  };
}

// ─── Product ─────────────────────────────────────────────────────────────────

export function makeProduct(categoryId: number, overrides?: Partial<{
  name: string;
  imageUrl: string;
}>) {
  return {
    name: faker.commerce.productName(),
    imageUrl: faker.image.url(),
    categoryId,
    ...overrides,
  };
}

// ─── ProductItem ─────────────────────────────────────────────────────────────

export function makeProductItem(productId: number, overrides?: Partial<{
  price: number;
  size: number | null;
  pizzaType: number | null;
}>) {
  return {
    price: faker.number.int({ min: 299, max: 1299 }),
    size: null,
    pizzaType: null,
    productId,
    ...overrides,
  };
}

export function makePizzaItem(productId: number, overrides?: Parameters<typeof makeProductItem>[1]) {
  const size = faker.helpers.arrayElement([25, 30, 40]);
  const pizzaType = faker.helpers.arrayElement([1, 2]);
  return makeProductItem(productId, { size, pizzaType, ...overrides });
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export function makeCart(overrides?: Partial<{
  userId: number | null;
  tokenId: string | null;
  totalAmount: number;
}>) {
  return {
    userId: null,
    tokenId: faker.string.uuid(),
    totalAmount: 0,
    ...overrides,
  };
}

// ─── CartItem ────────────────────────────────────────────────────────────────

export function makeCartItem(cartId: number, productItemId: number, overrides?: Partial<{
  quantity: number;
  pizzaSize: number | null;
  type: number | null;
  userId: number | null;
}>) {
  return {
    cartId,
    productItemId,
    quantity: faker.number.int({ min: 1, max: 5 }),
    pizzaSize: null,
    type: null,
    userId: null,
    ...overrides,
  };
}

// ─── Order ───────────────────────────────────────────────────────────────────

export function makeOrder(userId: number, overrides?: Partial<{
  status: OrderStatus;
  totalAmount: number;
  paymentId: string | null;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  comment: string | null;
  items: object;
}>) {
  return {
    userId,
    status: OrderStatus.PENDING,
    totalAmount: faker.number.int({ min: 500, max: 5000 }),
    paymentId: null,
    fullName: faker.person.fullName(),
    address: faker.location.streetAddress(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    comment: null,
    items: {},
    ...overrides,
  };
}

// ─── VerificationCode ────────────────────────────────────────────────────────

export function makeVerificationCode(userId: number, overrides?: Partial<{
  code: string;
  expiresAt: Date;
}>) {
  return {
    userId,
    code: faker.string.numeric(6),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

export function makeExpiredVerificationCode(userId: number) {
  return makeVerificationCode(userId, {
    expiresAt: new Date(Date.now() - 1000),
  });
}

// ─── Story ───────────────────────────────────────────────────────────────────

export function makeStory(overrides?: Partial<{ previewImageUrl: string }>) {
  return {
    previewImageUrl: faker.image.url(),
    ...overrides,
  };
}

export function makeStoryItem(storyId: number, overrides?: Partial<{ sourceUrl: string }>) {
  return {
    storyId,
    sourceUrl: faker.image.url(),
    ...overrides,
  };
}
