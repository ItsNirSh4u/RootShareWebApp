import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import type { IPlant } from '@rootshare/shared-types';
import { PlantStatus } from '@rootshare/shared-types';
import { cn } from '@/lib/utils';

interface FeaturedPlantsCarouselProps {
  plants: IPlant[];
  isLoading: boolean;
}

function PlantCardSkeleton(): JSX.Element {
  return (
    <div className="flex-shrink-0 w-44 rounded-lg overflow-hidden bg-bg-card border border-border-default shadow-soft animate-pulse">
      <div className="w-full h-28 bg-bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-bg-muted rounded w-3/4" />
        <div className="h-3 bg-bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedPlantsCarousel({ plants, isLoading }: FeaturedPlantsCarouselProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = (): void => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateScrollState();
  }, [plants]);

  const scroll = (direction: 'left' | 'right'): void => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 220;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="bg-bg-card rounded-lg shadow-soft-md border border-border-default p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-base">
          <Leaf size={18} className="text-primary" aria-hidden />
          Featured Plants
        </h2>

        {!isLoading && plants.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center transition-colors border border-border-default',
                canScrollLeft
                  ? 'bg-bg-subtle text-text-base hover:bg-bg-muted'
                  : 'bg-bg-subtle text-text-muted opacity-40 cursor-default',
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center transition-colors border border-border-default',
                canScrollRight
                  ? 'bg-bg-subtle text-text-base hover:bg-bg-muted'
                  : 'bg-bg-subtle text-text-muted opacity-40 cursor-default',
              )}
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      ) : plants.length === 0 ? (
        <p className="text-sm text-text-muted py-2">No featured plants yet.</p>
      ) : (
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="flex-shrink-0 w-44 rounded-lg overflow-hidden bg-bg-subtle border border-border-default shadow-soft hover:shadow-soft-md transition-shadow"
            >
              <div className="w-full h-28 bg-bg-muted overflow-hidden">
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-text-base truncate">{plant.name}</p>
                <p className="text-xs text-text-muted truncate mt-0.5">{plant.species}</p>
                {plant.status === PlantStatus.ACTIVE && (
                  <span className="inline-block mt-2 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
