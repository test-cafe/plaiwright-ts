import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

export async function cleanDb() {
  // Leaf tables first, root tables last — respects FK constraints
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storyItem.deleteMany();
  await prisma.story.deleteMany();
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
