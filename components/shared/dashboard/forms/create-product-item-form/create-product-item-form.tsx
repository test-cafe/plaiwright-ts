'use client';

import React from 'react';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormInput } from '@/components/shared/form/form-input';
import type { Product, ProductItem } from '@prisma/client';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createProductItem, updateProductItem } from '@/app/actions';
import { DashboardFormHeader } from '../../dashboard-form-header';
import { CreateProductItemFormSchema, CreateProductItemFormValues } from './constants';
import { FormSelect } from '@/components/shared/form/form-select';

interface Props {
  values?: ProductItem;
  products: Product[];
}

export const CreateProductItemForm: React.FC<Props> = ({ values, products }) => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<CreateProductItemFormValues>({
    defaultValues: {
      price: values?.price ? String(values?.price) : '',
      size: values?.size ? String(values?.size) : '',
      pizzaType: values?.pizzaType ? String(values?.pizzaType) : '',
      productId: values?.productId ? String(values?.productId) : '',
    },
    resolver: zodResolver(CreateProductItemFormSchema),
  });

  const onSubmit: SubmitHandler<CreateProductItemFormValues> = async (data) => {
    try {
      setLoading(true);

      const fields = {
        price: Number(data.price),
        size: Number(data.size),
        pizzaType: Number(data.pizzaType),
        productId: Number(data.productId),
      };

      if (params.id) {
        await updateProductItem(+params.id, fields);
      } else {
        await createProductItem(fields);
        router.push('/dashboard/product-items');
      }

    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DashboardFormHeader isEdit={!!values} loading={loading} />
        <div className="border shadow-sm rounded-lg grid grid-cols-2 gap-5 p-5">
          <FormInput name="price" label="Price" required />
          <FormSelect
            name="size"
            label="Size"
            placeholder="Select size..."
            items={[
              {
                value: '20',
                label: '20',
              },
              {
                value: '30',
                label: '30',
              },
              {
                value: '40',
                label: '40',
              },
            ]}
          />
          <FormSelect
            name="pizzaType"
            label="Pizza type"
            placeholder="Select pizza type..."
            items={[
              {
                value: '1',
                label: 'Traditional',
              },
              {
                value: '2',
                label: 'Thin',
              },
            ]}
          />
          <FormSelect
            name="productId"
            label="Product"
            placeholder="Select product..."
            items={products.map((product) => ({
              value: product.id.toString(),
              label: product.name,
            }))}
          />
        </div>
      </form>
    </FormProvider>
  );
};
