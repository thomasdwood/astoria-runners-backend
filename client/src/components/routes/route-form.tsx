import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Route } from '@/types';

const routeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  distance: z.coerce.number().positive('Distance must be positive'),
  categoryId: z.number().int().positive('Category is required'),
  startLocation: z.string().max(200).optional(),
  endLocation: z.string().max(200).optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
  route?: Route;
  onSubmit: (data: RouteFormData) => void;
  isSubmitting: boolean;
}

export function RouteForm({ route, onSubmit, isSubmitting }: RouteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? { name: route.name, distance: route.distance, categoryId: route.categoryId, startLocation: route.startLocation ?? undefined, endLocation: route.endLocation ?? undefined }
      : {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="distance">Distance (miles)</Label>
        <Input id="distance" type="number" step="0.01" {...register('distance')} />
        {errors.distance && <p className="text-sm text-destructive">{errors.distance.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category ID</Label>
        <Input id="categoryId" type="number" {...register('categoryId', { valueAsNumber: true })} />
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startLocation">Start Location</Label>
        <Input id="startLocation" {...register('startLocation')} />
        {errors.startLocation && (
          <p className="text-sm text-destructive">{errors.startLocation.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endLocation">End Location</Label>
        <Input id="endLocation" {...register('endLocation')} />
        {errors.endLocation && (
          <p className="text-sm text-destructive">{errors.endLocation.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : route ? 'Update Route' : 'Create Route'}
        </Button>
      </div>
    </form>
  );
}
