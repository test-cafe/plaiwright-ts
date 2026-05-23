import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CreateUserForm } from '@/components/shared/dashboard/forms/create-user-form/create-genre-form';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.user.findFirst({ where: { id: Number(id) } });
  if (!user) notFound();

  return (
    <div className="max-w-2xl">
      <CreateUserForm values={user} />
    </div>
  );
}
