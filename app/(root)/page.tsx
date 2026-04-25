import { Container } from '@/components/shared/container';
import { Filters } from '@/components/shared/filters';

import { Pagination } from '@/components/shared/pagination';
import { ProductsGroupList } from '@/components/shared/products-group-list';
import { Stories } from '@/components/shared/stories';
import { Title } from '@/components/shared/title';
import { TopBar } from '@/components/shared/top-bar';
import { GetSearchParams, findPizzas } from '@/lib/find-pizzas';

export default async function HomePage({ searchParams }: { searchParams: Promise<GetSearchParams> }) {
  const resolvedParams = await searchParams;
  const [categoryProducts, meta] = await findPizzas(resolvedParams);

  return (
    <>
      <Container className="mt-4 md:mt-10">
        <Title text="All Pizzas" size="lg" className="font-extrabold" />
      </Container>

      <TopBar categories={categoryProducts.filter((c) => c.products.length > 0)} />

      <Stories />

      <Container className="mt-4 md:mt-10 pb-14 px-4 sm:px-6">
        <div className="flex gap-[80px]">
          <div className="w-[250px] hidden lg:block">
            <Filters />
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-8 md:gap-16">
              {categoryProducts.map(
                (category) =>
                  category.products.length > 0 && (
                    <ProductsGroupList
                      key={category.id}
                      title={category.name}
                      products={category.products}
                      categoryId={category.id}
                    />
                  ),
              )}
            </div>

            <div className="flex items-center gap-6 mt-12">
              <Pagination pageCount={meta.pageCount} currentPage={meta.currentPage} />
              <span className="text-sm text-gray-400">5 из 65</span>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
