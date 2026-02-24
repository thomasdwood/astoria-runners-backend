import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLOR_MAP } from '@/lib/constants';
import type { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category | { name: string; color: string; icon?: string };
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colors = CATEGORY_COLOR_MAP[category.color] ?? CATEGORY_COLOR_MAP['slate'];
  return (
    <Badge variant="outline" className={`${colors.badge} ${className ?? ''}`}>
      {'icon' in category && category.icon ? `${category.icon} ` : ''}{category.name}
    </Badge>
  );
}
