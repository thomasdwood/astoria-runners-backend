import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_CATEGORIES } from '@/lib/constants';
import type { Route, RouteCategory } from '@/types';

const routeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  distance: z.coerce.number().positive('Distance must be positive'),
  category: z.enum(['Brewery Run', 'Coffee Run', 'Brunch Run', 'Weekend'] as const),
  endLocation: z.string().min(1, 'End location is required').max(200),
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? { name: route.name, distance: route.distance, category: route.category, endLocation: route.endLocation }
      : { category: 'Brewery Run' as RouteCategory },
  });

  const categoryValue = watch('category');

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
        <Label>Category</Label>
        <Select
          value={categoryValue}
          onValueChange={(val) => setValue('category', val as RouteCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
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
