import { useState } from 'react';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useUpdateMeetupStatus,
} from '@/hooks/use-events';
import { ApiResponseError } from '@/lib/api';
import { EventForm } from '@/components/events/event-form';
import { MeetupDescriptionDialog } from '@/components/events/meetup-description-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryBadge } from '@/components/shared/category-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
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
import { Plus, Pencil, Trash2, CalendarDays, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Event } from '@/types';

export function EventsPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const updateMeetupStatus = useUpdateMeetupStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Event | undefined>();
  const [meetupEventId, setMeetupEventId] = useState<number | null>(null);

  function openCreate() {
    setEditingEvent(undefined);
    setDialogOpen(true);
  }

  function openEdit(event: Event) {
    setEditingEvent(event);
    setDialogOpen(true);
  }

  async function handleSubmit(data: { routeId: number; startDateTime: string; notes?: string }) {
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, version: editingEvent.version, ...data });
        toast.success('Event updated');
      } else {
        await createEvent.mutateAsync(data);
        toast.success('Event created');
      }
      setDialogOpen(false);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage scheduled events"
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
      ) : !events?.length ? (
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
              <TableHead>Meetup</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {format(new Date(event.startDateTime), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.startDateTime), 'h:mm a')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{event.route.name}</span>
                    <CategoryBadge category={event.route.category} />
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={event.postedToMeetup}
                    onCheckedChange={() => handleMeetupToggle(event)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMeetupEventId(event.id)}
                      title="Meetup description"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(event)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event details.' : 'Schedule a new event.'}
            </DialogDescription>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            onSubmit={handleSubmit}
            isSubmitting={createEvent.isPending || updateEvent.isPending}
          />
        </DialogContent>
      </Dialog>

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
