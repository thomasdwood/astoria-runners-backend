import { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRoutes } from '@/hooks/use-routes';
import { useLocationSuggestions } from '@/hooks/use-settings';
import { useRecurrencePreview } from '@/hooks/use-recurring';
import { DAY_NAMES, ORDINALS } from '@/lib/constants';
import { format } from 'date-fns';
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
  const { data: locationSuggestions } = useLocationSuggestions();

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
  const bySetPosValue = watch('bySetPos');
  const startTimeValue = watch('startTime');
  const endDateValue = watch('endDate');
  const startLocationValue = watch('startLocation') ?? '';

  const [startLocOpen, setStartLocOpen] = useState(false);

  const filteredSuggestions = (locationSuggestions ?? []).filter(
    (s) => s.toLowerCase().includes(startLocationValue.toLowerCase()) && s !== startLocationValue
  );

  // Build preview pattern when we have enough data
  const previewPattern =
    frequencyValue && dayValue !== undefined && startTimeValue
      ? {
          frequency: frequencyValue,
          dayOfWeek: Number(dayValue),
          bySetPos: frequencyValue === 'monthly' ? (bySetPosValue ?? null) : null,
          startTime: startTimeValue,
          endDate: endDateValue ?? null,
        }
      : null;

  const { data: preview } = useRecurrencePreview(previewPattern);

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
            <SelectItem value="biweekly">Every Other Week (Biweekly)</SelectItem>
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
            value={String(bySetPosValue ?? '')}
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

      {/* Natural language preview */}
      {preview && (
        <div className="rounded-md bg-muted px-4 py-3 space-y-2">
          <p className="text-sm font-semibold">{preview.text}</p>
          {preview.nextDates.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium">Next dates:</p>
              {preview.nextDates.map((d) => (
                <p key={d}>{format(new Date(d), 'EEEE, MMMM d, yyyy')}</p>
              ))}
            </div>
          )}
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
        <Popover open={startLocOpen && filteredSuggestions.length > 0} onOpenChange={setStartLocOpen}>
          <PopoverTrigger asChild>
            <Input
              id="startLocation"
              {...register('startLocation')}
              onFocus={() => setStartLocOpen(true)}
              onChange={(e) => {
                register('startLocation').onChange(e);
                setStartLocOpen(true);
              }}
              autoComplete="off"
            />
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[var(--radix-popover-trigger-width)]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  setValue('startLocation', s);
                  setStartLocOpen(false);
                }}
              >
                {s}
              </button>
            ))}
          </PopoverContent>
        </Popover>
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
