import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoutes } from '@/hooks/use-routes';
import type { Event } from '@/types';
import { format } from 'date-fns';

const eventSchema = z.object({
  routeId: z.coerce.number().positive('Route is required'),
  startDateTime: z.string().min(1, 'Date/time is required'),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
}

export function EventForm({ event, onSubmit, isSubmitting }: EventFormProps) {
  const { data: routes } = useRoutes();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          routeId: event.routeId,
          startDateTime: format(new Date(event.startDateTime), "yyyy-MM-dd'T'HH:mm"),
          notes: event.notes ?? '',
        }
      : {},
  });

  const routeIdValue = watch('routeId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Route</Label>
        <Select
          value={routeIdValue ? String(routeIdValue) : ''}
          onValueChange={(val) => setValue('routeId', Number(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a route" />
          </SelectTrigger>
          <SelectContent>
            {routes?.map((route) => (
              <SelectItem key={route.id} value={String(route.id)}>
                {route.name} ({route.distance} mi)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.routeId && <p className="text-sm text-destructive">{errors.routeId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDateTime">Date & Time</Label>
        <Input id="startDateTime" type="datetime-local" {...register('startDateTime')} />
        {errors.startDateTime && (
          <p className="text-sm text-destructive">{errors.startDateTime.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
