import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Setting } from '@/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ settings: Setting[] }>('/api/settings'),
    select: (data) => data.settings,
  });
}

export function useDefaultStartLocation() {
  const { data: settings, ...rest } = useSettings();
  const defaultStartLocation = settings?.find((s) => s.key === 'default_start_location')?.value ?? null;
  return { data: defaultStartLocation, ...rest };
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put<{ setting: Setting }>(`/api/settings/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useLocationSuggestions() {
  return useQuery({
    queryKey: ['location-suggestions'],
    queryFn: () => api.get<{ locations: string[] }>('/api/settings/locations'),
    select: (data) => data.locations,
  });
}
