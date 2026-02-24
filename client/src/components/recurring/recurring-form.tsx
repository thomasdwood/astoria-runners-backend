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
import { DAY_NAMES, ORDINALS } from '@/lib/constants';
import type { RecurringTemplate } from '@/types';

const recurringSchema = z.object({
  routeId: z.coerce.number().positive('Route is required'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.coerce.number().min(0).max(6),
  bySetPos: z.coerce.number().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  endDate: z.string().optional().nullable(),
  startLocation: z.string().max(200).optional(),
  endLocation: z.string().max(200).optional(),
  notes: z.string().optional(),
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface RecurringFormProps {
  template?: RecurringTemplate;
  onSubmit: (data: RecurringFormData) => void;
  isSubmitting: boolean;
}

export function RecurringForm({ template, onSubmit, isSubmitting }: RecurringFormProps) {
  const { data: routes } = useRoutes();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: template
      ? {
          routeId: template.routeId,
          frequency: template.frequency,
          dayOfWeek: template.dayOfWeek,
          bySetPos: template.bySetPos,
          startTime: template.startTime,
          endDate: template.endDate,
          startLocation: template.startLocation ?? '',
          endLocation: template.endLocation ?? '',
          notes: template.notes ?? '',
        }
      : { frequency: 'weekly', dayOfWeek: 2, startTime: '18:30' },
  });

  const routeIdValue = watch('routeId');
  const dayValue = watch('dayOfWeek');
  const frequencyValue = watch('frequency');

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
        <Label>Frequency</Label>
        <Select
          value={frequencyValue ?? 'weekly'}
          onValueChange={(val) => setValue('frequency', val as 'weekly' | 'biweekly' | 'monthly')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">Every other week</SelectItem>
            <SelectItem value="monthly">Monthly (nth weekday)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Day of Week</Label>
        <Select
          value={String(dayValue ?? 2)}
          onValueChange={(val) => setValue('dayOfWeek', Number(val))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_NAMES.map((day, i) => (
              <SelectItem key={i} value={String(i)}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.dayOfWeek && <p className="text-sm text-destructive">{errors.dayOfWeek.message}</p>}
      </div>

      {frequencyValue === 'monthly' && (
        <div className="space-y-2">
          <Label>Week of Month</Label>
          <Select
            value={String(watch('bySetPos') ?? '')}
            onValueChange={(val) => setValue('bySetPos', val ? Number(val) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDINALS).map(([pos, label]) => (
                <SelectItem key={pos} value={pos}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="startTime">Start Time</Label>
        <Input id="startTime" type="time" {...register('startTime')} />
        {errors.startTime && (
          <p className="text-sm text-destructive">{errors.startTime.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date (optional)</Label>
        <Input id="endDate" type="date" {...register('endDate')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startLocation">Start Location (optional)</Label>
        <Input id="startLocation" {...register('startLocation')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endLocation">End Location (optional)</Label>
        <Input id="endLocation" {...register('endLocation')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
