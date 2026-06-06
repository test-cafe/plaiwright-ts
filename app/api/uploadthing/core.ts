import { getUserSession } from '@/lib/get-user-session';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export async function imageUploaderMiddleware() {
  const user = await getUserSession();
  if (!user) throw new UploadThingError('Unauthorized');
  return { userId: user.id };
}

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    .middleware(imageUploaderMiddleware)
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
