import { Search } from 'lucide-react';
import { PostType } from '@rootshare/shared-types';
import { cn } from '@/lib/utils';

type FilterType = PostType | 'all';

interface FilterPill {
  value: FilterType;
  label: string;
}

const FILTER_PILLS: FilterPill[] = [
  { value: 'all', label: 'All' },
  { value: PostType.UPDATE, label: 'Update' },
  { value: PostType.SWAP, label: 'Swap' },
  { value: PostType.GIVEAWAY, label: 'Giveaway' },
];

interface FeedFiltersProps {
  activeType: FilterType;
  onTypeChange: (type: FilterType) => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function FeedFilters({
  activeType,
  onTypeChange,
  search,
  onSearchChange,
}: FeedFiltersProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeType === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-bg-subtle text-text-muted hover:bg-bg-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative flex-shrink-0 w-full sm:w-56">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search posts..."
          className={cn(
            'w-full h-9 pl-9 pr-3 rounded-full text-sm',
            'bg-bg-subtle border border-border-default text-text-base',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-colors',
          )}
        />
      </div>
    </div>
  );
}
