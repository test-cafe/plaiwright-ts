import { InfoBlock } from '@/components/shared/info-block';

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
