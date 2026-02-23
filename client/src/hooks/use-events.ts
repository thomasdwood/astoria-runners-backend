import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Event } from '@/types';

interface ListEventsParams {
  category?: string;
  start?: string;
  end?: string;
}

export function useEvents(params?: ListEventsParams) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
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
    mutationFn: (data: { routeId: number; startDateTime: string; endLocation?: string; notes?: string }) =>
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
    mutationFn: ({ id, ...data }: { id: number; version: number; routeId?: number; startDateTime?: string; endLocation?: string; notes?: string }) =>
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

export function useUpdateMeetupStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postedToMeetup }: { id: number; postedToMeetup: boolean }) =>
      api.patch<{ event: Event }>(`/api/events/${id}/meetup-status`, { postedToMeetup }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useMeetupDescription(id: number) {
  return useQuery({
    queryKey: ['events', id, 'meetup-description'],
    queryFn: () => api.get<{ description: string }>(`/api/events/${id}/meetup-description`),
    select: (data) => data.description,
    enabled: false,
  });
}
