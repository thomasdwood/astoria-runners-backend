import { useState } from 'react';
import { addWeeks, startOfToday, format } from 'date-fns';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useUpdateMeetupStatus,
  useCancelRecurringInstance,
  useExcludeRecurringDate,
  useRestoreCancelledInstance,
} from '@/hooks/use-events';
import { useCalendarList } from '@/hooks/use-calendar';
import { ApiResponseError } from '@/lib/api';
import { EventForm } from '@/components/events/event-form';
import { MeetupDescriptionDialog } from '@/components/events/meetup-description-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, CalendarDays, FileText, Repeat, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Event, CalendarEvent } from '@/types';

// Unified row type for the events table
type EventRow =
  | { kind: 'one-off'; event: Event }
  | { kind: 'recurring-instance'; calEvent: CalendarEvent }
  | { kind: 'cancelled-instance'; event: Event };

interface RecurringActionTarget {
  calEvent: CalendarEvent;
  action: 'cancel' | 'delete';
}

export function EventsPage() {
  // Fetch one-off events
  const { data: events, isLoading: eventsLoading } = useEvents();

  // Fetch calendar list for next 8 weeks (includes recurring instances)
  const rangeStart = startOfToday().toISOString();
  const rangeEnd = addWeeks(startOfToday(), 8).toISOString();
  const { data: calendarData, isLoading: calendarLoading } = useCalendarList({
    start: rangeStart,
    end: rangeEnd,
  });

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const updateMeetupStatus = useUpdateMeetupStatus();
  const cancelInstance = useCancelRecurringInstance();
  const excludeDate = useExcludeRecurringDate();
  const restoreInstance = useRestoreCancelledInstance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [editingInstance, setEditingInstance] = useState<CalendarEvent | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Event | undefined>();
  const [meetupEventId, setMeetupEventId] = useState<number | null>(null);
  const [recurringActionTarget, setRecurringActionTarget] = useState<RecurringActionTarget | undefined>();
  const [restoreTarget, setRestoreTarget] = useState<Event | undefined>();

  const isLoading = eventsLoading || calendarLoading;

  // Build unified sorted list
  const rows: EventRow[] = (() => {
    const result: EventRow[] = [];

    // One-off events (non-cancelled, not linked to recurring template — or all DB events)
    if (events) {
      for (const ev of events) {
        if (ev.isCancelled) {
          result.push({ kind: 'cancelled-instance', event: ev });
        } else {
          result.push({ kind: 'one-off', event: ev });
        }
      }
    }

    // Calendar recurring instances (no DB id, isRecurring = true)
    if (calendarData?.events) {
      for (const ce of calendarData.events) {
        if (ce.id === null && ce.isRecurring && ce.recurringTemplateId !== null) {
          // Pure virtual instance — not yet materialized
          result.push({ kind: 'recurring-instance', calEvent: ce });
        }
        // Materialized (cancelled) recurring instances are already covered via useEvents()
      }
    }

    // Sort by startDateTime ascending
    result.sort((a, b) => {
      const dateA = a.kind === 'recurring-instance' ? a.calEvent.startDateTime : a.event.startDateTime;
      const dateB = b.kind === 'recurring-instance' ? b.calEvent.startDateTime : b.event.startDateTime;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return result;
  })();

  function openCreate() {
    setEditingEvent(undefined);
    setEditingInstance(undefined);
    setDialogOpen(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setEditingInstance(undefined);
    setDialogOpen(true);
  }

  function openEditInstance(calEvent: CalendarEvent) {
    setEditingEvent(undefined);
    setEditingInstance(calEvent);
    setDialogOpen(true);
  }

  async function handleSubmit(data: { routeId: number; startDateTime: string; startLocation?: string; endLocation?: string; notes?: string }) {
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, version: editingEvent.version, ...data });
        toast.success('Event updated');
      } else if (editingInstance) {
        // Materialize recurring instance as a one-off exception
        await createEvent.mutateAsync({
          ...data,
          recurringTemplateId: editingInstance.recurringTemplateId !== null ? editingInstance.recurringTemplateId : undefined,
        });
        toast.success('Instance saved as one-off event');
      } else {
        await createEvent.mutateAsync(data);
        toast.success('Event created');
      }
      setDialogOpen(false);
      setEditingInstance(undefined);
    } catch (err) {
      if (err instanceof ApiResponseError && err.status === 409) {
        toast.error('Conflict: event was modified by another user. Refreshing...');
      } else if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast.success('Event deleted');
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
    setDeleteTarget(undefined);
  }

  async function handleRecurringAction() {
    if (!recurringActionTarget) return;
    const { calEvent, action } = recurringActionTarget;

    try {
      if (action === 'cancel') {
        await cancelInstance.mutateAsync({
          routeId: calEvent.routeId,
          startDateTime: calEvent.startDateTime,
          recurringTemplateId: calEvent.recurringTemplateId!,
          startLocation: calEvent.startLocation,
          endLocation: calEvent.endLocation,
          notes: calEvent.notes,
        });
        toast.success('Instance cancelled');
      } else {
        // Delete: add to excludedDates
        const dateStr = format(new Date(calEvent.startDateTime), 'yyyy-MM-dd');
        await excludeDate.mutateAsync({
          templateId: calEvent.recurringTemplateId!,
          date: dateStr,
        });
        toast.success('Instance removed');
      }
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
    setRecurringActionTarget(undefined);
  }

  async function handleRestore() {
    if (!restoreTarget) return;
    try {
      await restoreInstance.mutateAsync(restoreTarget.id);
      toast.success('Instance restored');
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
    setRestoreTarget(undefined);
  }

  async function handleMeetupToggle(event: Event) {
    try {
      await updateMeetupStatus.mutateAsync({
        id: event.id,
        postedToMeetup: !event.postedToMeetup,
      });
    } catch (err) {
      if (err instanceof ApiResponseError) toast.error(err.message);
    }
  }

  const editingDefaultValues = editingInstance
    ? {
        routeId: editingInstance.routeId,
        startDateTime: format(new Date(editingInstance.startDateTime), "yyyy-MM-dd'T'HH:mm"),
        notes: editingInstance.notes ?? '',
        endLocation: editingInstance.endLocation ?? '',
        startLocation: editingInstance.startLocation ?? '',
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage scheduled events (next 8 weeks)"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Meetup</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              if (row.kind === 'recurring-instance') {
                const ce = row.calEvent;
                return (
                  <TableRow key={`ri-${ce.recurringTemplateId}-${ce.startDateTime}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(ce.startDateTime), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ce.displayTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{ce.title}</span>
                        {ce.category && (
                          <CategoryBadge category={{ name: ce.category, color: ce.categoryColor ?? 'slate', icon: ce.categoryIcon }} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Repeat className="h-3 w-3" />
                        Recurring
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xs">—</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditInstance(ce)}
                          title="Edit this instance"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRecurringActionTarget({ calEvent: ce, action: 'cancel' })}
                          title="Cancel this instance"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRecurringActionTarget({ calEvent: ce, action: 'delete' })}
                          title="Remove this instance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              if (row.kind === 'cancelled-instance') {
                const ev = row.event;
                return (
                  <TableRow key={`cancelled-${ev.id}`} className="opacity-60">
                    <TableCell>
                      <div>
                        <div className="font-medium line-through">
                          {format(new Date(ev.startDateTime), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          {format(new Date(ev.startDateTime), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="line-through">{ev.route.name}</span>
                        <CategoryBadge category={ev.route.category} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="gap-1">
                        Cancelled
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xs">—</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRestoreTarget(ev)}
                        title="Restore instance"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }

              // kind === 'one-off'
              const ev = row.event;
              return (
                <TableRow key={`ev-${ev.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {format(new Date(ev.startDateTime), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(ev.startDateTime), 'h:mm a')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{ev.route.name}</span>
                      <CategoryBadge category={ev.route.category} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {ev.recurringTemplateId ? (
                      <Badge variant="outline" className="gap-1">
                        <Repeat className="h-3 w-3" />
                        Exception
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">One-off</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={ev.postedToMeetup}
                      onCheckedChange={() => handleMeetupToggle(ev)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMeetupEventId(ev.id)}
                        title="Meetup description"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ev)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(ev)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingInstance(undefined); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : editingInstance ? 'Edit Recurring Instance' : 'Create Event'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? 'Update event details.'
                : editingInstance
                ? 'Saving will create a one-off exception for this instance.'
                : 'Schedule a new event.'}
            </DialogDescription>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            instanceDefaults={editingDefaultValues}
            onSubmit={handleSubmit}
            isSubmitting={createEvent.isPending || updateEvent.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete one-off event */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel recurring instance */}
      <AlertDialog
        open={recurringActionTarget?.action === 'cancel'}
        onOpenChange={(open) => !open && setRecurringActionTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel This Instance</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel this occurrence? It will appear greyed out on the public calendar so runners know it's not happening.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecurringAction}>Cancel Instance</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete recurring instance */}
      <AlertDialog
        open={recurringActionTarget?.action === 'delete'}
        onOpenChange={(open) => !open && setRecurringActionTarget(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove This Instance</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this occurrence? It will be removed entirely from the calendar — runners won't see it at all.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecurringAction}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore cancelled instance */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Instance</AlertDialogTitle>
            <AlertDialogDescription>
              Restore this cancelled instance? It will become visible again on the public calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {meetupEventId && (
        <MeetupDescriptionDialog
          eventId={meetupEventId}
          open={!!meetupEventId}
          onOpenChange={(open) => !open && setMeetupEventId(null)}
        />
      )}
    </div>
  );
}
