import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteButton } from '@/components/shared/dashboard/delete-button';

export default async function IngredientsPage() {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ingredients</h1>
        <Button asChild>
          <Link href="/dashboard/ingredients/create">Create New</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[3rem]">#</TableHead>
            <TableHead className="min-w-[5rem]">Image</TableHead>
            <TableHead className="min-w-[14rem]">Name</TableHead>
            <TableHead className="min-w-[6rem]">Price</TableHead>
            <TableHead className="min-w-[8rem]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => (
            <TableRow key={ingredient.id}>
              <TableCell>{ingredient.id}</TableCell>
              <TableCell>
                <Image src={ingredient.imageUrl} width={40} height={40} className="w-10 h-10 rounded object-cover" alt={ingredient.name} />
              </TableCell>
              <TableCell>{ingredient.name}</TableCell>
              <TableCell>{ingredient.price}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/ingredients/${ingredient.id}`}>Edit</Link>
                  </Button>
                  <DeleteButton id={ingredient.id} type="ingredient" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
