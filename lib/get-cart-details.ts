import { calcCartItemTotalAmount } from './calc-cart-item-total-amount';
import { ICartItem } from '@/store/cart';

export type CartDetailsItem = {
  id: number;
  quantity: number;
  pizzaSize: number | null;
  type: number | null;
  productItem: {
    price: number;
    product: { name: string; imageUrl: string };
  };
  ingredients: { name: string; price: number }[];
};

export type CartDetailsInput = {
  totalAmount: number;
  items: CartDetailsItem[];
};

type ReturnProps = {
  items: ICartItem[];
  totalAmount: number;
};

export const getCartDetails = (data: CartDetailsInput | null): ReturnProps => {
  if (!data || !Array.isArray(data.items)) return { items: [], totalAmount: 0 };

  const items = data.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    name: item.productItem.product.name,
    imageUrl: item.productItem.product.imageUrl,
    price: calcCartItemTotalAmount(item),
    pizzaSize: item.pizzaSize,
    type: item.type,
    ingredients: item.ingredients.map((ingredient) => ({
      name: ingredient.name,
      price: ingredient.price,
    })),
  }));

  return { items, totalAmount: data.totalAmount || 0 };
};
