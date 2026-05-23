import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteButton } from '@/components/shared/dashboard/delete-button';

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button asChild>
          <Link href="/dashboard/users/create">Create New</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[3rem]">#</TableHead>
            <TableHead className="min-w-[10rem]">Full Name</TableHead>
            <TableHead className="min-w-[16rem]">Email</TableHead>
            <TableHead className="min-w-[6rem]">Role</TableHead>
            <TableHead className="min-w-[6rem]">Verified</TableHead>
            <TableHead className="min-w-[8rem]">Created At</TableHead>
            <TableHead className="min-w-[8rem]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
              </TableCell>
              <TableCell>{user.verified ? 'Yes' : 'No'}</TableCell>
              <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/users/${user.id}`}>Edit</Link>
                  </Button>
                  <DeleteButton id={user.id} type="user" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
