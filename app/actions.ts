'use server';

import { orderFormSchema, TFormOrderData } from '@/components/shared/schemas/order-form-schema';
import { getUserSession } from '@/lib/get-user-session';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';
import { OrderStatus, Prisma } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { randomBytes } from 'crypto';
import { createPayment } from '@/lib/create-payment';
import { sendVerificationEmail } from '@/lib/send-verification-email';
import { revalidatePath } from 'next/cache';
import { formatMoney } from '@/lib/utils';

export async function registerUser(body: Prisma.UserCreateInput) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      if (user.verified) {
        throw new Error('User already exists');
      }

      // Unverified duplicate signup: refresh the code so the user isn't stuck.
      await sendVerificationEmail(user);
      return;
    }

    const createdUser = await prisma.user.create({
      data: {
        ...body,
        password: hashSync(body.password, 10),
      },
    });

    await sendVerificationEmail(createdUser);
  } catch (error) {
    logger.error({ error }, '[ACTION] registerUser failed');
    throw error;
  }
}

export async function updateUserInfo(body: Prisma.UserCreateInput) {
  try {
    const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: {
        id: Number(currentUser.id),
      },
      data: {
        ...body,
        password: hashSync(body.password, 10),
      },
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateUserInfo failed');
    throw error;
  }
}

export async function createOrder(data: TFormOrderData) {
  try {
    orderFormSchema.parse(data);

    const currentUser = await getUserSession();
    if (!currentUser?.id) {
      throw new Error('Please sign in to place an order');
    }
    const userId = Number(currentUser.id);

    const userCart = await prisma.cart.findFirst({
      include: {
        user: true,
        items: {
          include: {
            ingredients: true,
            productItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      where: { userId },
    });

    if (!userCart) {
      throw new Error('Cart not found');
    }

    if (!userCart.totalAmount) {
      return;
    }

    const order = await prisma.order.create({
      data: {
        userId,
        fullName: data.firstName + ' ' + data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        comment: data.comment,
        totalAmount: userCart.totalAmount,
        status: OrderStatus.PENDING,
        items: JSON.parse(JSON.stringify(userCart.items)),
      },
      select: {
        id: true,
        totalAmount: true,
      },
    });

    await prisma.cart.update({
      where: { id: userCart.id },
      data: { totalAmount: 0 },
    });

    await prisma.cartItem.deleteMany({
      where: {
        cartId: userCart.id,
      },
    });

    const paymentData = await createPayment({
      orderId: order.id,
      amount: order.totalAmount,
      description: `Order #${order.id}`,
    });

    if (paymentData) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentId: paymentData.id,
        },
      });
    }

    const html = `
      <h1>Order #${order?.id}</h1>

      <p>Please pay for your order of ${formatMoney(order.totalAmount)}. Click <a href="${paymentData.confirmation.confirmation_url}">here</a> to complete the payment.</p>
    `;

    if (userCart.user?.email) {
      await sendEmail(userCart.user?.email, `Next Pizza / Pay for order #${order?.id}`, html);
    }

    return paymentData.confirmation.confirmation_url;
  } catch (error) {
    logger.error({ error }, '[ACTION] createOrder failed');
    throw error;
  }
}

/* Dashboard Actions */

export async function updateUser(id: number, data: Prisma.UserUpdateInput) {
  try {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...data,
        verified: new Date(),
        ...(data.password && { password: hashSync(String(data.password), 10) }),
      },
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateUser failed');
    throw error;
  }
}

export async function createUser(data: Prisma.UserCreateInput) {
  try {
    await prisma.user.create({
      data: {
        ...data,
        password: hashSync(data.password, 10),
      },
    });

    revalidatePath('/dashboard/users');
  } catch (error) {
    logger.error({ error }, '[ACTION] createUser failed');
    throw error;
  }
}

export async function deleteUser(id: number) {
  await prisma.user.delete({
    where: {
      id,
    },
  });

  revalidatePath('/dashboard/users');
}

export async function updateCategory(id: number, data: Prisma.CategoryUpdateInput) {
  try {
    await prisma.category.update({
      where: {
        id,
      },
      data,
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateCategory failed');
    throw error;
  }
}

export async function createCategory(data: Prisma.CategoryCreateInput) {
  try {
    await prisma.category.create({
      data,
    });

    revalidatePath('/dashboard/categories');
  } catch (error) {
    logger.error({ error }, '[ACTION] createCategory failed');
    throw error;
  }
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({
    where: {
      id,
    },
  });

  revalidatePath('/dashboard/categories');
}

export async function updateProduct(id: number, data: Prisma.ProductUpdateInput) {
  try {
    await prisma.product.update({
      where: {
        id,
      },
      data,
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateProduct failed');
    throw error;
  }
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  try {
    await prisma.product.create({
      data,
    });

    revalidatePath('/dashboard/products');
  } catch (error) {
    logger.error({ error }, '[ACTION] createProduct failed');
    throw error;
  }
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({
    where: {
      id,
    },
  });

  revalidatePath('/dashboard/products');
}

export async function updateIngredient(id: number, data: Prisma.IngredientUpdateInput) {
  try {
    await prisma.ingredient.update({
      where: {
        id,
      },
      data,
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateIngredient failed');
    throw error;
  }
}

export async function createIngredient(data: Prisma.IngredientCreateInput) {
  try {
    await prisma.ingredient.create({
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        price: data.price,
      },
    });

    revalidatePath('/dashboard/ingredients');
  } catch (error) {
    logger.error({ error }, '[ACTION] createIngredient failed');
    throw error;
  }
}

export async function deleteIngredient(id: number) {
  try {
    await prisma.ingredient.delete({
      where: {
        id,
      },
    });

    revalidatePath('/dashboard/ingredients');
  } catch (error) {
    logger.error({ error }, '[ACTION] deleteIngredient failed');
    throw error;
  }
}

export async function updateProductItem(id: number, data: Prisma.ProductItemUpdateInput) {
  try {
    await prisma.productItem.update({
      where: {
        id,
      },
      data,
    });
  } catch (error) {
    logger.error({ error }, '[ACTION] updateProductItem failed');
    throw error;
  }
}

export async function createProductItem(data: Prisma.ProductItemUncheckedCreateInput) {
  try {
    await prisma.productItem.create({
      data: {
        price: data.price,
        size: data.size,
        pizzaType: data.pizzaType,
        productId: data.productId,
      },
    });

    revalidatePath('/dashboard/product-items');
  } catch (error) {
    logger.error({ error }, '[ACTION] createProductItem failed');
    throw error;
  }
}

export async function deleteProductItem(id: number) {
  try {
    await prisma.productItem.delete({
      where: {
        id,
      },
    });

    revalidatePath('/dashboard/product-items');
  } catch (error) {
    logger.error({ error }, '[ACTION] deleteProductItem failed');
    throw error;
  }
}

export async function deleteOrder(id: number) {
  try {
    await prisma.order.delete({
      where: {
        id,
      },
    });

    revalidatePath('/dashboard/orders');
  } catch (error) {
    logger.error({ error }, '[ACTION] deleteOrder failed');
    throw error;
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return; // Don't reveal whether the email exists
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token, expiresAt },
      create: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendEmail(
      email,
      'Reset your Next Pizza password',
      `<p>Hi ${user.fullName},</p>
       <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
    );
  } catch (error) {
    logger.error({ error }, '[ACTION] requestPasswordReset failed');
    throw error;
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findFirst({ where: { token } });

    if (!resetToken) {
      throw new Error('Invalid or expired reset link');
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new Error('Reset link has expired. Please request a new one.');
    }

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashSync(password, 10) },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
  } catch (error) {
    logger.error({ error }, '[ACTION] resetPassword failed');
    throw error;
  }
}
