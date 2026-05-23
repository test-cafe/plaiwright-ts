import { InfoBlock } from '@/components/shared/info-block';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next Pizza | Access Denied',
  robots: 'noindex',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center mt-40">
      <InfoBlock
        title="Access Denied"
        text="This page is only accessible to authenticated users"
        imageUrl="/assets/images/lock.png"
      />
    </div>
  );
}
