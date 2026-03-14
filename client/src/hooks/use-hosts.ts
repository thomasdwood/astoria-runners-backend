import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Host } from '@/types';

export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: () => api.get<{ hosts: Host[] }>('/api/hosts'),
    select: (data) => data.hosts,
  });
}

export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string | null }) =>
      api.post<{ host: Host }>('/api/hosts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useUpdateHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; email?: string | null } }) =>
      api.put<{ host: Host }>(`/api/hosts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useDeleteHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/hosts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}
