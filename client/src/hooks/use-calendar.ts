import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CalendarMonthResponse, CalendarListResponse, RouteCategory } from '@/types';

interface UseCalendarMonthParams {
  year: number;
  month: number;
  category?: RouteCategory;
}

export function useCalendarMonth({ year, month, category }: UseCalendarMonthParams) {
  const params = new URLSearchParams({ view: 'month', year: String(year), month: String(month) });
  if (category) params.set('category', category);

  return useQuery({
    queryKey: ['calendar', 'month', year, month, category ?? 'all'],
    queryFn: () => api.get<CalendarMonthResponse>(`/calendar?${params}`),
  });
}

interface UseCalendarListParams {
  start?: string;
  end?: string;
  category?: RouteCategory;
}

export function useCalendarList({ start, end, category }: UseCalendarListParams) {
  const params = new URLSearchParams({ view: 'list' });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (category) params.set('category', category);

  return useQuery({
    queryKey: ['calendar', 'list', start, end, category ?? 'all'],
    queryFn: () => api.get<CalendarListResponse>(`/calendar?${params}`),
  });
}
