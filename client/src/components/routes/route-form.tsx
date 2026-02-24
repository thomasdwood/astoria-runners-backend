import { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories } from '@/hooks/use-categories';
import { useLocationSuggestions, useDefaultStartLocation } from '@/hooks/use-settings';
import type { Route } from '@/types';

const routeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  distance: z.coerce.number().positive('Distance must be positive'),
  categoryId: z.number().int().positive('Category is required'),
  startLocation: z.string().max(200).optional(),
  endLocation: z.string().max(200).optional(),
  stravaUrl: z.string().url('Must be a valid URL').max(500).optional().or(z.literal('')),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
  route?: Route;
  onSubmit: (data: RouteFormData) => void;
  isSubmitting: boolean;
}

export function RouteForm({ route, onSubmit, isSubmitting }: RouteFormProps) {
  const { data: categories } = useCategories();
  const { data: locationSuggestions } = useLocationSuggestions();
  const { data: defaultStartLocation } = useDefaultStartLocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? {
          name: route.name,
          distance: route.distance,
          categoryId: route.categoryId,
          startLocation: route.startLocation ?? undefined,
          endLocation: route.endLocation ?? undefined,
          stravaUrl: route.stravaUrl ?? undefined,
        }
      : {
          startLocation: defaultStartLocation ?? undefined,
        },
  });

  // Set default start location once it loads (async from API)
  useEffect(() => {
    if (!route && defaultStartLocation && !watch('startLocation')) {
      setValue('startLocation', defaultStartLocation);
    }
  }, [defaultStartLocation]);

  const categoryIdValue = watch('categoryId');
  const startLocationValue = watch('startLocation') ?? '';

  const [startLocOpen, setStartLocOpen] = useState(false);

  const filteredSuggestions = (locationSuggestions ?? []).filter(
    (s) => s.toLowerCase().includes(startLocationValue.toLowerCase()) && s !== startLocationValue
  );

  const handleFormSubmit = (data: RouteFormData) => {
    onSubmit({
      ...data,
      stravaUrl: data.stravaUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
          value={categoryIdValue ? String(categoryIdValue) : ''}
          onValueChange={(val) => setValue('categoryId', Number(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-2 relative">
        <Label htmlFor="startLocation">Start Location</Label>
        <Input
          id="startLocation"
          {...register('startLocation')}
          onFocus={() => setStartLocOpen(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setStartLocOpen(false), 150);
          }}
          onChange={(e) => {
            register('startLocation').onChange(e);
            setStartLocOpen(true);
          }}
          autoComplete="off"
        />
        {startLocOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue('startLocation', s);
                  setStartLocOpen(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {errors.startLocation && (
          <p className="text-sm text-destructive">{errors.startLocation.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endLocation">End Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input id="endLocation" {...register('endLocation')} />
        {errors.endLocation && (
          <p className="text-sm text-destructive">{errors.endLocation.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stravaUrl">Strava Route URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input id="stravaUrl" type="url" placeholder="https://www.strava.com/routes/..." {...register('stravaUrl')} />
        {errors.stravaUrl && (
          <p className="text-sm text-destructive">{errors.stravaUrl.message}</p>
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
