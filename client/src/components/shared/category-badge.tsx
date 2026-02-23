import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { RouteCategory } from '@/types';

interface CategoryBadgeProps {
  category: RouteCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category];
  return (
    <Badge variant="outline" className={`${colors.badge} ${className ?? ''}`}>
      {category}
    </Badge>
  );
}
