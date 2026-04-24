import { InfoBlock } from '@/components/shared/info-block';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center mt-40">
      <InfoBlock
        title="Page Not Found"
        text="Please check the address you entered or try again later"
        imageUrl="/assets/images/not-found.png"
      />
    </div>
  );
}
