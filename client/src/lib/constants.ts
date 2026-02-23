import type { RouteCategory } from '@/types';

export const CATEGORY_COLORS: Record<RouteCategory, { bg: string; text: string; badge: string }> = {
  'Brewery Run': {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  'Coffee Run': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'Brunch Run': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  Weekend: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export const CATEGORY_DOT_COLORS: Record<RouteCategory, string> = {
  'Brewery Run': 'bg-amber-500',
  'Coffee Run': 'bg-orange-500',
  'Brunch Run': 'bg-emerald-500',
  Weekend: 'bg-blue-500',
};

export const ALL_CATEGORIES: RouteCategory[] = [
  'Brewery Run',
  'Coffee Run',
  'Brunch Run',
  'Weekend',
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
