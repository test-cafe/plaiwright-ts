'use server';

import { TFormOrderData } from '@/components/shared/schemas/order-form-schema';
import { getUserSession } from '@/lib/get-user-session';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/send-email';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { cookies } from 'next/headers';
import { createPayment } from '@/lib/create-payment';
import { CreateUserFormValues } from '@/components/shared/dashboard/forms/create-user-form/constants';
import { revalidatePath } from 'next/cache';

export async function registerUser(body: Prisma.UserCreateInput) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new Error('User already exists');
    }

    await prisma.user.create({
      data: {
        ...body,
        password: hashSync(body.password, 10),
        verified: new Date(),
      },
    });
  } catch (error) {
    console.log('Error [CREATE_USER]', error);
    throw error;
  }
}

export async function updateUserInfo(body: Prisma.UserCreateInput) {
  try {
    const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('Пользователь не найден');
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
    console.log('Error [UPDATE_USER]', error);
    throw error;
  }
}

export async function createOrder(data: TFormOrderData) {
  try {
    const currentUser = await getUserSession();
    if (!currentUser?.id) {
      throw new Error('Please sign in to place an order');
    }
    const userId = Number(currentUser.id);
    const cookieStore = cookies();
    const cartToken = cookieStore.get('cartToken')?.value;

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
      where: {
        OR: [
          { userId },
          ...(cartToken ? [{ tokenId: cartToken }] : []),
        ],
      },
    });

    if (!userCart?.totalAmount) {
      return;
    }

    if (!userCart) {
      throw new Error('Cart not found');
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
        items: JSON.stringify(userCart.items),
      },
    });

    await prisma.cart.update({
      where: {
        id: userCart.id,
      },
      data: {
        totalAmount: 0,
      },
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

      <p>Please pay for your order of ${order?.totalAmount}. Click <a href="${paymentData.confirmation.confirmation_url}">here</a> to complete the payment.</p>
    `;

    if (userCart.user?.email) {
      await sendEmail(userCart.user?.email, `Next Pizza / Pay for order #${order?.id}`, html);
    }

    return paymentData.confirmation.confirmation_url;
  } catch (error) {
    console.log('[CART_CHECKOUT_POST] Server error', error);
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
    console.log('Error [UPDATE_USER]', error);
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
    console.log('Error [CREATE_USER]', error);
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
    console.log('Error [UPDATE_CATEGORY]', error);
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
    console.log('Error [CREATE_CATEGORY]', error);
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
    console.log('Error [UPDATE_PRODUCT]', error);
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
    console.log('Error [CREATE_PRODUCT]', error);
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
    console.log('Error [UPDATE_INGREDIENT]', error);
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
    console.log('Error [CREATE_INGREDIENT]', error);
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
    console.log('Error [DELETE_INGREDIENT]', error);
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
    console.log('Error [UPDATE_PRODUCT_ITEM]', error);
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
    console.log('Error [CREATE_PRODUCT_ITEM]', error);
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
    console.log('Error [DELETE_PRODUCT_ITEM]', error);
    throw error;
  }
}
