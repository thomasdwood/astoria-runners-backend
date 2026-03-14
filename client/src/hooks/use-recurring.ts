import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RecurringTemplate, RecurringInstance } from '@/types';

export function useRecurringTemplates() {
  return useQuery({
    queryKey: ['recurring-templates'],
    queryFn: () => api.get<{ templates: RecurringTemplate[] }>('/api/recurring-templates'),
    select: (data) => data.templates,
  });
}

export function useRecurringTemplate(id: number) {
  return useQuery({
    queryKey: ['recurring-templates', id],
    queryFn: () => api.get<{ template: RecurringTemplate }>(`/api/recurring-templates/${id}`),
    select: (data) => data.template,
    enabled: id > 0,
  });
}

export function useRecurringInstances(id: number, start: string, end: string) {
  return useQuery({
    queryKey: ['recurring-templates', id, 'instances', start, end],
    queryFn: () =>
      api.get<{ instances: RecurringInstance[] }>(
        `/api/recurring-templates/${id}/instances?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      ),
    select: (data) => data.instances,
    enabled: id > 0,
  });
}

export interface RecurrencePatternInput {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number;
  bySetPos?: number | null;
  startTime: string;
  endDate?: string | null;
}

export function useRecurrencePreview(pattern: RecurrencePatternInput | null) {
  const isValid = pattern !== null && pattern.dayOfWeek >= 0 && pattern.startTime.length > 0;
  const params = pattern
    ? new URLSearchParams({
        frequency: pattern.frequency,
        dayOfWeek: String(pattern.dayOfWeek),
        startTime: pattern.startTime,
        ...(pattern.bySetPos != null ? { bySetPos: String(pattern.bySetPos) } : {}),
        ...(pattern.endDate ? { endDate: pattern.endDate } : {}),
      })
    : null;

  return useQuery({
    queryKey: ['recurrence-preview', pattern],
    queryFn: () =>
      api.get<{ text: string; nextDates: string[] }>(
        `/api/recurring-templates/preview?${params!.toString()}`
      ),
    enabled: isValid,
  });
}

export function useCreateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      routeId: number;
      frequency: 'weekly' | 'biweekly' | 'monthly';
      interval?: number;
      dayOfWeek: number;
      bySetPos?: number | null;
      startTime: string;
      endDate?: string | null;
      startLocation?: string;
      endLocation?: string;
      notes?: string;
      hostId?: number | null;
    }) => api.post<{ template: RecurringTemplate }>('/api/recurring-templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      version: number;
      routeId?: number;
      frequency?: 'weekly' | 'biweekly' | 'monthly';
      interval?: number;
      dayOfWeek?: number;
      bySetPos?: number | null;
      startTime?: string;
      endDate?: string | null;
      startLocation?: string;
      endLocation?: string;
      notes?: string;
      hostId?: number | null;
    }) => api.put<{ template: RecurringTemplate }>(`/api/recurring-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/recurring-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}
