import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponseError } from '@/lib/api';
import { toast } from 'sonner';
import type { Category } from '@/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ categories: Category[] }>('/api/categories'),
    select: (data) => data.categories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string; icon: string }) =>
      api.post<{ category: Category }>('/api/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; color?: string; icon?: string }) =>
      api.put<{ category: Category }>(`/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => {
      if (err instanceof ApiResponseError && err.status === 409) {
        toast.error('Cannot delete category: it is in use by one or more routes.');
      } else if (err instanceof ApiResponseError) {
        toast.error(err.message);
      }
    },
  });
}
