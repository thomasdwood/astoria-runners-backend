import { cn } from '@/lib/utils';
import { CATEGORY_COLOR_MAP } from '@/lib/constants';
import type { Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  selected: number | undefined;
  onSelect: (categoryId: number | undefined) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
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
      {categories.map((category) => {
        const colors = CATEGORY_COLOR_MAP[category.color] ?? CATEGORY_COLOR_MAP['slate'];
        return (
          <button
            key={category.id}
            onClick={() => onSelect(selected === category.id ? undefined : category.id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium border transition-colors',
              selected === category.id
                ? colors.badge
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {category.icon ? `${category.icon} ` : ''}{category.name}
          </button>
        );
      })}
    </div>
  );
}
