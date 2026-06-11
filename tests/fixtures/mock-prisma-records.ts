import type { Prisma, User, CartItem, VerificationCode } from '@prisma/client';
import { OrderStatus, UserRole } from '@prisma/client';

export type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;

export type CartWithDeepItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        productItem: { include: { product: true } };
        ingredients: true;
      };
    };
  };
}>;

export type DeepCartItem = CartWithDeepItems['items'][number];

export const buildCartRecord = (overrides: Partial<CartWithItems> = {}): CartWithItems => ({
  id: 1,
  totalAmount: 0,
  tokenId: null,
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildCartItemRecord = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 1,
  cartId: 1,
  productItemId: 10,
  quantity: 2,
  type: null,
  pizzaSize: null,
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildUserRecord = (overrides: Partial<User> = {}): User => ({
  id: 1,
  fullName: 'Regular User',
  email: 'user@test.com',
  password: '',
  role: UserRole.USER,
  provider: null,
  providerId: null,
  verified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildDeepCartItem = (overrides: Partial<DeepCartItem> = {}): DeepCartItem => ({
  id: 1,
  cartId: 1,
  productItemId: 10,
  quantity: 1,
  type: null,
  pizzaSize: null,
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [],
  productItem: {
    id: 10,
    price: 549,
    size: null,
    pizzaType: null,
    productId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 1,
      name: 'Pepperoni',
      imageUrl: '',
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  ...overrides,
});

export const buildCartWithDeepItems = (
  overrides: Partial<CartWithDeepItems> = {},
): CartWithDeepItems => ({
  id: 1,
  totalAmount: 0,
  tokenId: null,
  userId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildVerificationCodeRecord = (
  overrides: Partial<VerificationCode> = {},
): VerificationCode => ({
  id: 1,
  userId: 1,
  code: 'abc123',
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export type OrderWithUser = Prisma.OrderGetPayload<{ include: { user: true } }>;

export const buildOrderRecord = (overrides: Partial<OrderWithUser> = {}): OrderWithUser => ({
  id: 1,
  userId: 1,
  items: [],
  status: OrderStatus.PENDING,
  totalAmount: 0,
  paymentId: null,
  fullName: '',
  address: '',
  email: '',
  phone: '',
  comment: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: buildUserRecord(),
  ...overrides,
});
