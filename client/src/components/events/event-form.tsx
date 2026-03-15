import { useState, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRoutes } from '@/hooks/use-routes';
import { useHosts } from '@/hooks/use-hosts';
import { useCategories } from '@/hooks/use-categories';
import { useLocationSuggestions, useDefaultStartLocation } from '@/hooks/use-settings';
import { useCalendarList } from '@/hooks/use-calendar';
import { useExcludeRecurringDate } from '@/hooks/use-events';
import type { Event, CalendarEvent } from '@/types';
import { format, startOfDay, endOfDay } from 'date-fns';

const eventSchema = z.object({
  routeId: z.coerce.number().positive('Route is required'),
  startDateTime: z.string().min(1, 'Date/time is required'),
  startLocation: z.string().max(200).optional(),
  endLocation: z.string().max(200).optional(),
  notes: z.string().optional(),
  hostId: z.coerce.number().int().nullable().optional(),
  meetupUrl: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
});

type EventFormData = z.infer<typeof eventSchema>;

function getTimeOfDayWindow(dateTime: string): 'morning' | 'afternoon' | 'evening' {
  const hours = new Date(dateTime).getHours();
  if (hours < 12) return 'morning';
  if (hours < 17) return 'afternoon';
  return 'evening';
}

interface InstanceDefaults {
  routeId?: number;
  startDateTime?: string;
  notes?: string;
  endLocation?: string;
  startLocation?: string;
}

interface EventFormProps {
  event?: Event;
  instanceDefaults?: InstanceDefaults;
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
}

export function EventForm({ event, instanceDefaults, onSubmit, isSubmitting }: EventFormProps) {
  const { data: routes } = useRoutes();
  const { data: hosts } = useHosts();
  const { data: categories } = useCategories();
  const [categoryFilter, setCategoryFilter] = useState<number | null>(event?.route?.categoryId ?? null);
  const filteredRoutes = categoryFilter
    ? routes?.filter((r) => r.categoryId === categoryFilter)
    : routes;
  const { data: locationSuggestions } = useLocationSuggestions();
  const { data: defaultStartLocation } = useDefaultStartLocation();
  const excludeDate = useExcludeRecurringDate();

  // Build default values: editing event > instance defaults > empty
  const defaultValues: Partial<EventFormData> = event
    ? {
        routeId: event.routeId,
        startDateTime: format(new Date(event.startDateTime), "yyyy-MM-dd'T'HH:mm"),
        startLocation: event.startLocation ?? undefined,
        endLocation: event.endLocation ?? undefined,
        notes: event.notes ?? '',
        hostId: event.hostId ?? null,
        meetupUrl: event.meetupUrl ?? '',
      }
    : instanceDefaults
    ? {
        routeId: instanceDefaults.routeId,
        startDateTime: instanceDefaults.startDateTime,
        startLocation: instanceDefaults.startLocation ?? undefined,
        endLocation: instanceDefaults.endLocation ?? undefined,
        notes: instanceDefaults.notes ?? '',
        hostId: null,
        meetupUrl: '',
      }
    : {
        startLocation: defaultStartLocation ?? undefined,
        hostId: null,
        meetupUrl: '',
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const routeIdValue = watch('routeId');
  const startDateTimeValue = watch('startDateTime');
  const startLocationValue = watch('startLocation') ?? '';

  // Inherit start/end location from selected route
  useEffect(() => {
    if (!event && routeIdValue && routes) {
      const route = routes.find((r) => r.id === routeIdValue);
      if (route) {
        if (route.startLocation && !watch('startLocation')) {
          setValue('startLocation', route.startLocation);
        }
        if (route.endLocation && !watch('endLocation')) {
          setValue('endLocation', route.endLocation);
        }
      }
    }
  }, [routeIdValue]);

  const [startLocOpen, setStartLocOpen] = useState(false);

  // Conflict detection state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictInstance, setConflictInstance] = useState<CalendarEvent | null>(null);
  const [pendingFormData, setPendingFormData] = useState<EventFormData | null>(null);

  // Date range for conflict check (single day based on selected datetime)
  const [conflictCheckDate, setConflictCheckDate] = useState<{ start: string; end: string } | null>(null);

  // Fetch calendar data for conflict check date (only when we have a date and it's a new event)
  const { data: conflictCalendarData } = useCalendarList(
    conflictCheckDate
      ? { start: conflictCheckDate.start, end: conflictCheckDate.end }
      : { start: undefined, end: undefined }
  );

  // Update conflict check date whenever startDateTime changes (only for new events)
  useEffect(() => {
    if (!event && startDateTimeValue) {
      const dt = new Date(startDateTimeValue);
      if (!isNaN(dt.getTime())) {
        setConflictCheckDate({
          start: startOfDay(dt).toISOString(),
          end: endOfDay(dt).toISOString(),
        });
      }
    }
  }, [startDateTimeValue, event]);

  const filteredSuggestions = (locationSuggestions ?? []).filter(
    (s) => s.toLowerCase().includes(startLocationValue.toLowerCase()) && s !== startLocationValue
  );

  function buildFinalData(data: EventFormData): EventFormData {
    return {
      ...data,
      endLocation: data.endLocation || data.startLocation || undefined,
    };
  }

  function findConflict(data: EventFormData): CalendarEvent | null {
    if (!conflictCalendarData?.events || event) return null;

    const window = getTimeOfDayWindow(data.startDateTime);
    const conflicts = conflictCalendarData.events.filter((ce) => {
      if (!ce.isRecurring || ce.isCancelled) return false;
      return getTimeOfDayWindow(ce.startDateTime) === window;
    });

    return conflicts[0] ?? null;
  }

  function handleFormSubmit(data: EventFormData) {
    const finalData = buildFinalData(data);

    // Only check conflicts for new events (not edits or instance edits)
    if (!event && !instanceDefaults) {
      const conflict = findConflict(finalData);
      if (conflict) {
        setConflictInstance(conflict);
        setPendingFormData(finalData);
        setConflictDialogOpen(true);
        return;
      }
    }

    onSubmit(finalData);
  }

  async function handleConflictReplace() {
    if (!conflictInstance || !pendingFormData) return;
    setConflictDialogOpen(false);

    try {
      if (conflictInstance.recurringTemplateId) {
        const dateStr = format(new Date(conflictInstance.startDateTime), 'yyyy-MM-dd');
        await excludeDate.mutateAsync({ templateId: conflictInstance.recurringTemplateId, date: dateStr });
      }
    } catch {
      // Non-blocking: continue with event creation even if exclude fails
    }

    onSubmit(pendingFormData);
    setPendingFormData(null);
    setConflictInstance(null);
  }

  function handleConflictKeepBoth() {
    setConflictDialogOpen(false);
    if (pendingFormData) {
      onSubmit(pendingFormData);
    }
    setPendingFormData(null);
    setConflictInstance(null);
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Filter routes by category</Label>
          <Select
            value={categoryFilter ? String(categoryFilter) : 'all'}
            onValueChange={(v) => setCategoryFilter(v === 'all' ? null : parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              {filteredRoutes?.map((route) => (
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

        <div className="space-y-2 relative">
          <Label htmlFor="startLocation">Start Location</Label>
          <Input
            id="startLocation"
            {...register('startLocation')}
            onFocus={() => setStartLocOpen(true)}
            onBlur={() => {
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
          <Label htmlFor="endLocation">End Location <span className="text-muted-foreground text-xs">(optional — defaults to start location)</span></Label>
          <Input id="endLocation" {...register('endLocation')} />
          {errors.endLocation && (
            <p className="text-sm text-destructive">{errors.endLocation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" {...register('notes')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hostId">Host (optional)</Label>
          <Select
            value={watch('hostId') ? String(watch('hostId')) : 'none'}
            onValueChange={(v) => setValue('hostId', v === 'none' ? null : parseInt(v))}
          >
            <SelectTrigger id="hostId">
              <SelectValue placeholder="No host assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No host assigned</SelectItem>
              {hosts?.map((host) => (
                <SelectItem key={host.id} value={String(host.id)}>
                  {host.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetupUrl">Meetup URL (optional)</Label>
          <Input
            id="meetupUrl"
            type="url"
            placeholder="https://www.meetup.com/..."
            {...register('meetupUrl')}
          />
          {errors.meetupUrl && (
            <p className="text-sm text-destructive">{errors.meetupUrl.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting || excludeDate.isPending}>
            {isSubmitting ? 'Saving...' : event ? 'Update Event' : instanceDefaults ? 'Save as One-off' : 'Create Event'}
          </Button>
        </div>
      </form>

      {/* Conflict detection dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Conflict</AlertDialogTitle>
            <AlertDialogDescription>
              A recurring event ({conflictInstance?.title ?? 'unknown'}) is already scheduled for{' '}
              {conflictInstance ? format(new Date(conflictInstance.startDateTime), 'h:mm a') : ''} on this date.
              <br /><br />
              Would you like to replace it or keep both?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConflictDialogOpen(false); setPendingFormData(null); setConflictInstance(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={handleConflictKeepBoth}>
              Keep Both
            </AlertDialogAction>
            <AlertDialogAction onClick={handleConflictReplace}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
