import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Event } from '@/types';

interface ListEventsParams {
  categoryId?: number;
  start?: string;
  end?: string;
}

export function useEvents(params?: ListEventsParams) {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
  if (params?.start) searchParams.set('start', params.start);
  if (params?.end) searchParams.set('end', params.end);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['events', params ?? 'all'],
    queryFn: () => api.get<{ events: Event[] }>(`/api/events${qs ? `?${qs}` : ''}`),
    select: (data) => data.events,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => api.get<{ event: Event }>(`/api/events/${id}`),
    select: (data) => data.event,
    enabled: id > 0,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { routeId: number; startDateTime: string; startLocation?: string; endLocation?: string; notes?: string; recurringTemplateId?: number; hostId?: number | null; meetupUrl?: string | null }) =>
      api.post<{ event: Event }>('/api/events', {
        ...data,
        startDateTime: new Date(data.startDateTime).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; version: number; routeId?: number; startDateTime?: string; startLocation?: string; endLocation?: string; notes?: string; hostId?: number | null; meetupUrl?: string | null }) =>
      api.put<{ event: Event }>(`/api/events/${id}`, {
        ...data,
        ...(data.startDateTime ? { startDateTime: new Date(data.startDateTime).toISOString().replace(/\.\d{3}Z$/, 'Z') } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateMeetupUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meetupUrl }: { id: number; meetupUrl: string | null }) =>
      api.patch<{ event: Event }>(`/api/events/${id}/meetup-url`, { meetupUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCancelOneOffEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<{ event: Event }>(`/api/events/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

// Alias for one-off event cancellation (same as useCancelOneOffEvent)
export function useCancelEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<{ event: Event }>(`/api/events/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useRestoreOneOffEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<{ event: Event }>(`/api/events/${id}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

// Alias for one-off event restoration (same as useRestoreOneOffEvent)
export function useRestoreEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<{ event: Event }>(`/api/events/${id}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCancelRecurringInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { routeId: number; startDateTime: string; recurringTemplateId: number; startLocation?: string | null; endLocation?: string | null; notes?: string | null }) =>
      api.post<{ event: Event }>('/api/events', {
        ...data,
        isCancelled: true,
        startDateTime: new Date(data.startDateTime).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useExcludeRecurringDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, date }: { templateId: number; date: string }) =>
      api.put(`/api/recurring-templates/${templateId}/exclude-date`, { date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] });
    },
  });
}

export function useRestoreCancelledInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useMeetupDescription(id: number, format: 'plain' | 'html' = 'plain') {
  return useQuery({
    queryKey: ['events', id, 'meetup-description', format],
    queryFn: () => api.get<{ description: string }>(`/api/events/${id}/meetup-description?format=${format}`),
    select: (data) => data.description,
    enabled: false,
  });
}
