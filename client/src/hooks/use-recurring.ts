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

export function useCreateRecurringTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      routeId: number;
      dayOfWeek: number;
      startTime: string;
      endLocation?: string;
      notes?: string;
      count?: number;
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
      dayOfWeek?: number;
      startTime?: string;
      endLocation?: string;
      notes?: string;
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
