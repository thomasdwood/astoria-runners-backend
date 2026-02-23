import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, ALL_CATEGORIES } from '@/lib/constants';
import type { RouteCategory } from '@/types';

interface CategoryFilterProps {
  selected: RouteCategory | undefined;
  onSelect: (category: RouteCategory | undefined) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
          !selected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-muted-foreground border-border hover:bg-muted'
        )}
      >
        All
      </button>
      {ALL_CATEGORIES.map((category) => {
        const colors = CATEGORY_COLORS[category];
        return (
          <button
            key={category}
            onClick={() => onSelect(selected === category ? undefined : category)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
              selected === category
                ? colors.badge
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
