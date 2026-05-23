"use client";

import { CartItem } from "@/components/shared/cart-item";
import { CartSidebar } from "@/components/shared/cart-sidebar";
import { Container } from "@/components/shared/container";
import { CartItemSkeleton } from "@/components/shared/skeletons/cart-item-skeleton";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { createOrder } from "@/app/actions";
import { AdressInput } from "@/components/shared/adress-input";
import { FormInput, FormTextarea } from "@/components/shared/form";
import {
  TFormOrderData,
  orderFormSchema,
} from "@/components/shared/schemas/order-form-schema";
import { Title } from "@/components/shared/title";
import { WhiteBlock } from "@/components/shared/white-block";
import { useCart } from "@/hooks/use-cart";
import { Api } from "@/services/api-client";
import { useCartStore } from "@/store/cart";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import React from "react";
import toast from "react-hot-toast";

const VAT = 15;
const DELIVERY_PRICE = 5;

export default function CartPage() {
  const { totalAmount, items, loading, updateItemQuantity, removeCartItem } =
    useCart(true);
  const fetchCartItems = useCartStore((state) => state.fetchCartItems);
  const [submitting, setSubmitting] = React.useState(false);
  const { data: session } = useSession();

  const form = useForm<TFormOrderData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      comment: "",
    },
  });

  React.useEffect(() => {
    async function fetchUserInfo() {
      try {
        const data = await Api.auth.getMe();
        const [firstName, lastName] = (data.fullName ?? '').split(' ');
        form.setValue('firstName', firstName ?? '');
        form.setValue('lastName', lastName ?? '');
        form.setValue('email', data.email ?? '');
      } catch {
        // user info not available, form stays empty
      }
    }

    if (session) {
      fetchUserInfo();
    }
  }, [session]);

  const onClickCountButton = (
    id: number,
    quantity: number,
    type: "plus" | "minus",
  ) => {
    const value = type === "plus" ? quantity + 1 : quantity - 1;
    updateItemQuantity(id, value);
  };

  const vatPrice = (totalAmount * VAT) / 100;
  const totalPrice = totalAmount + DELIVERY_PRICE + vatPrice;

  const onSubmit = async (data: TFormOrderData) => {
    try {
      setSubmitting(true);

      const url = await createOrder(data);

      toast.success("Order placed successfully! 📝", {
        icon: "✅",
      });

      await fetchCartItems();

      if (url) {
        location.href = url;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to place order";
      return toast.error(message, { icon: "❌" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-5">
      <Title text="Checkout" size="xl" className="font-extrabold mb-8" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            <div className="flex flex-col gap-6 lg:gap-10 flex-1 mb-20">
              <WhiteBlock
                title="1. Cart"
                endAdornment={
                  totalAmount > 0 && (
                    <button
                      type="button"
                      className="flex items-center gap-3 text-gray-400 hover:text-gray-600"
                      onClick={() => items.forEach((item) => removeCartItem(item.id))}
                    >
                      <Trash2 size={16} />
                      Clear cart
                    </button>
                  )
                }
              >
                <div className="flex flex-col gap-5">
                  {loading
                    ? [...Array(3)].map((_, index) => (
                        <CartItemSkeleton key={index} />
                      ))
                    : items.map((item) => (
                        <CartItem
                          key={item.id}
                          name={item.name}
                          imageUrl={item.imageUrl}
                          price={item.price}
                          quantity={item.quantity}
                          onClickRemove={() => removeCartItem(item.id)}
                          onClickCountButton={(type) =>
                            onClickCountButton(item.id, item.quantity, type)
                          }
                        />
                      ))}
                </div>

                {!totalAmount && (
                  <p className="text-center text-gray-400 p-10">
                    Cart is empty
                  </p>
                )}
              </WhiteBlock>

              <WhiteBlock
                title="2. Personal Information"
                className={!totalAmount ? "opacity-50 pointer-events-none" : ""}
                contentClassName="p-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    name="firstName"
                    className="text-base"
                    placeholder="First name"
                  />
                  <FormInput
                    name="lastName"
                    className="text-base"
                    placeholder="Last name"
                  />
                  <FormInput
                    name="email"
                    className="text-base"
                    placeholder="E-Mail"
                  />
                  <FormInput
                    name="phone"
                    className="text-base"
                    placeholder="Phone"
                  />
                </div>
              </WhiteBlock>

              <WhiteBlock
                className={!totalAmount ? "opacity-50 pointer-events-none" : ""}
                title="3. Delivery Address"
                contentClassName="p-8"
              >
                <div className="flex flex-col gap-5">
                  <Controller
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <AdressInput onChange={field.onChange} />
                    )}
                  />

                  <FormTextarea
                    name="comment"
                    className="text-base"
                    placeholder="Order comment"
                    rows={5}
                  />
                </div>
              </WhiteBlock>
            </div>
            <div className="w-full lg:w-2/5">
              <CartSidebar
                totalPrice={totalPrice}
                totalAmount={totalAmount}
                vatPrice={vatPrice}
                deliveryPrice={DELIVERY_PRICE}
                submitting={submitting}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </Container>
  );
}
