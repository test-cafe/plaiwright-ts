import { Container } from '@/components/shared/container';
import { ProductSkeleton } from '@/components/shared/product-skeleton';
import { Title } from '@/components/shared/title';

export default function HomeLoading() {
  return (
    <>
      <Container className="mt-4 md:mt-10">
        <Title text="All Pizzas" size="lg" className="font-extrabold" />
      </Container>

      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[70px]" />

      <div className="my-6 md:my-10 h-[160px] sm:h-[200px] md:h-[250px]" />

      <Container className="mt-4 md:mt-10 pb-14 px-4 sm:px-6">
        <div className="flex gap-[80px]">
          <div className="w-[250px] hidden lg:block shrink-0">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          </div>

          <div className="flex-1">
            {[...Array(2)].map((_, groupIndex) => (
              <div key={groupIndex} className="mb-8 md:mb-16">
                <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-[50px]">
                  {[...Array(3)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
