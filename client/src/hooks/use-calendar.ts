import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CalendarMonthResponse, CalendarListResponse } from '@/types';

interface UseCalendarMonthParams {
  year: number;
  month: number;
  categoryId?: number;
}

export function useCalendarMonth({ year, month, categoryId }: UseCalendarMonthParams) {
  const params = new URLSearchParams({ view: 'month', year: String(year), month: String(month) });
  if (categoryId) params.set('categoryId', String(categoryId));

  return useQuery({
    queryKey: ['calendar', 'month', year, month, categoryId ?? 'all'],
    queryFn: () => api.get<CalendarMonthResponse>(`/calendar?${params}`),
  });
}

interface UseCalendarListParams {
  start?: string;
  end?: string;
  categoryId?: number;
}

export function useCalendarList({ start, end, categoryId }: UseCalendarListParams) {
  const params = new URLSearchParams({ view: 'list' });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (categoryId) params.set('categoryId', String(categoryId));

  return useQuery({
    queryKey: ['calendar', 'list', start, end, categoryId ?? 'all'],
    queryFn: () => api.get<CalendarListResponse>(`/calendar?${params}`),
  });
}
