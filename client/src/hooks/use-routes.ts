import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Route, RouteCategory } from '@/types';

export function useRoutes(category?: RouteCategory) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const qs = params.toString();

  return useQuery({
    queryKey: ['routes', category ?? 'all'],
    queryFn: () => api.get<{ routes: Route[] }>(`/api/routes${qs ? `?${qs}` : ''}`),
    select: (data) => data.routes,
  });
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: () => api.get<{ route: Route }>(`/api/routes/${id}`),
    select: (data) => data.route,
    enabled: id > 0,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; distance: number; category: RouteCategory; endLocation: string }) =>
      api.post<{ route: Route }>('/api/routes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; version: number; name?: string; distance?: number; category?: RouteCategory; endLocation?: string }) =>
      api.put<{ route: Route }>(`/api/routes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}
