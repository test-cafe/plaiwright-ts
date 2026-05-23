import { CreateProductForm } from '@/components/shared/dashboard/forms/create-product-form/create-product-form';

export default async function CreateProductPage() {
  return (
    <div className="max-w-2xl">
      <CreateProductForm />
    </div>
  );
}
