'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import ReactStories from 'react-insta-stories';
import { Api } from '@/services/api-client';
import { IStory } from '@/services/stories';
import { X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  initialStories?: IStory[];
  className?: string;
}

export const Stories: React.FC<Props> = ({ initialStories, className }) => {
  const [stories, setStories] = React.useState<IStory[]>(initialStories ?? []);
  const [open, setOpen] = React.useState(false);
  const [selectedStory, setSelectedStory] = React.useState<IStory>();

  React.useEffect(() => {
    if (initialStories) return;

    async function fetchStories() {
      const data = await Api.stories.getAll();
      setStories(data);
    }

    fetchStories();
  }, []);

  const onClickStory = (story: IStory) => {
    setSelectedStory(story);

    if (story.items.length > 0) {
      setOpen(true);
    }
  };

  return (
    <>
      <div className={cn('overflow-x-auto my-6 md:my-10', className)}>
        <div className="flex items-center gap-4 px-4 sm:px-6 md:px-0 md:max-w-[1280px] md:mx-auto">
          {stories.length === 0 &&
            [...Array(6)].map((_, index) => (
              <div
                key={index}
                className="w-[90px] h-[120px] sm:w-[140px] sm:h-[180px] md:w-[200px] md:h-[250px] rounded-md flex-shrink-0 overflow-hidden relative"
                style={{ background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
              />
            ))}

          {stories.map((story, i) => (
            <button
              key={story.id}
              type="button"
              aria-label={`Open story ${i + 1}`}
              className="relative flex-shrink-0 rounded-md overflow-hidden w-[90px] h-[120px] sm:w-[140px] sm:h-[180px] md:w-[200px] md:h-[250px]"
              onClick={() => onClickStory(story)}
            >
              <Image
                fill
                sizes="(max-width: 640px) 90px, (max-width: 768px) 140px, 200px"
                className="object-cover"
                src={story.previewImageUrl}
                alt=""
                priority={i === 0}
              />
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="absolute left-0 top-0 w-full h-full bg-black/80 flex items-center justify-center z-20">
          <div className="relative" style={{ width: 520 }}>
            <button aria-label="Close stories" className="absolute -right-10 -top-5 z-30" onClick={() => setOpen(false)}>
              <X className="absolute top-0 right-0 w-8 h-8 text-white/50" />
            </button>
            <ReactStories
              onAllStoriesEnd={() => setOpen(false)}
              stories={selectedStory?.items.map((item) => ({ url: item.sourceUrl })) || []}
              defaultInterval={3000}
              width={520}
              height={800}
            />
          </div>
        </div>
      )}
    </>
  );
};
