import { useState } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useSettings } from '@/hooks/use-settings';
import { useCreateEvent, useUpdateMeetupUrl } from '@/hooks/use-events';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { CalendarEvent } from '@/types';

interface MeetupExportPopoverProps {
  eventId?: number;
  meetupUrl?: string | null;
  calendarEvent?: CalendarEvent;
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template
  );
}

const DEFAULT_TEMPLATE = `Join us for a {{routeName}} run!

Date: {{date}}
Start: {{startLocation}}{{endLocationLine}}
Distance: {{distance}} miles{{hostLine}}{{routeLinkLine}}{{notesBlock}}

See you there!`;

function generateClientSideDescription(ce: CalendarEvent, templateOverride?: string): string {
  const dateLabel = format(new Date(ce.startDateTime), 'EEEE, MMMM d, yyyy h:mm a');

  if (templateOverride) {
    const endLocationLine =
      ce.endLocation && ce.endLocation !== ce.startLocation
        ? `\nEnd: ${ce.endLocation}`
        : '';
    const hostLine = ce.hostName ? `\nHost: ${ce.hostName}` : '';
    const routeLinkLine = ce.stravaUrl ? `\nRoute: ${ce.stravaUrl}` : '';
    const notesBlock = ce.notes ? `\n\n${ce.notes}` : '';

    return applyTemplate(templateOverride, {
      routeName: ce.title,
      distance: ce.distance != null ? String(ce.distance) : '',
      startLocation: ce.startLocation ?? '',
      endLocation: ce.endLocation ?? '',
      host: ce.hostName ?? '',
      routeLink: ce.stravaUrl ?? '',
      notes: ce.notes ?? '',
      date: dateLabel,
      endLocationLine,
      hostLine,
      routeLinkLine,
      notesBlock,
    }).trim();
  }

  // Default generation
  let description = `Join us for a ${ce.category} on ${ce.title}!\n\n`;
  description += `Date: ${dateLabel}\n`;

  if (ce.startLocation) {
    description += `Start: ${ce.startLocation}\n`;
  }

  if (ce.endLocation && ce.endLocation !== ce.startLocation) {
    description += `End: ${ce.endLocation}\n`;
  }

  if (ce.notes) {
    description += `\n${ce.notes}\n`;
  }

  description += '\nSee you there!';
  return description.trim();
}

export function MeetupExportPopover({
  eventId,
  meetupUrl,
  calendarEvent,
}: MeetupExportPopoverProps) {
  const [open, setOpen] = useState(false);
  const [descFormat, setDescFormat] = useState<'plain' | 'html'>('plain');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(meetupUrl ?? '');
  const [urlSaved, setUrlSaved] = useState(false);

  const { data: settings } = useSettings();
  const savedTemplate = settings?.find((s) => s.key === 'meetup_description_template')?.value;
  const updateMeetupUrl = useUpdateMeetupUrl();
  const createEvent = useCreateEvent();

  async function loadDescription(fmt: 'plain' | 'html') {
    if (calendarEvent) {
      // Client-side generation for virtual recurring instances
      setDescription(generateClientSideDescription(calendarEvent, savedTemplate));
      return;
    }

    if (!eventId) return;

    setLoading(true);
    try {
      const res = await api.get<{ description: string }>(
        `/api/events/${eventId}/meetup-description?format=${fmt}`
      );
      setDescription(res.description);
    } catch {
      setDescription('Failed to load description');
    }
    setLoading(false);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setCopied(false);
      setUrlInput(meetupUrl ?? '');
      setUrlSaved(false);
      loadDescription(descFormat);
    }
  }

  async function handleFormatChange(fmt: 'plain' | 'html') {
    setDescFormat(fmt);
    await loadDescription(fmt);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveUrl() {
    try {
      let targetId = eventId;

      if (!targetId && calendarEvent) {
        // Materialize the virtual recurring instance on-demand before saving the URL
        const result = await createEvent.mutateAsync({
          routeId: calendarEvent.routeId,
          startDateTime: calendarEvent.startDateTime,
          startLocation: calendarEvent.startLocation ?? undefined,
          endLocation: calendarEvent.endLocation ?? undefined,
          notes: calendarEvent.notes ?? undefined,
          recurringTemplateId: calendarEvent.recurringTemplateId !== null ? calendarEvent.recurringTemplateId : undefined,
        });
        targetId = result.event.id;
      }

      if (!targetId) return;

      await updateMeetupUrl.mutateAsync({ id: targetId, meetupUrl: urlInput || null });
      setUrlSaved(true);
      toast.success(urlInput ? 'Meetup URL saved' : 'Meetup URL cleared');
      setTimeout(() => setUrlSaved(false), 2000);
    } catch {
      toast.error('Failed to save Meetup URL');
    }
  }

  const isDbEvent = !!eventId && !calendarEvent;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Meetup description">
          <FileText className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-4 space-y-3" align="end">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Meetup Description</span>
          {!calendarEvent && (
            <div className="flex gap-1">
              <Button
                variant={descFormat === 'plain' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleFormatChange('plain')}
              >
                Plain Text
              </Button>
              <Button
                variant={descFormat === 'html' ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleFormatChange('html')}
              >
                HTML
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs max-h-48 overflow-y-auto">
            {description}
          </pre>
        )}

        <Button onClick={handleCopy} className="w-full" size="sm" disabled={loading}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </>
          )}
        </Button>

        {(isDbEvent || !!calendarEvent) && (
          <div className="space-y-2 pt-1 border-t">
            <Label htmlFor="meetup-url" className="text-sm">
              Meetup URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="meetup-url"
                type="url"
                placeholder="https://www.meetup.com/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={handleSaveUrl}
                disabled={updateMeetupUrl.isPending || createEvent.isPending}
              >
                {urlSaved ? <Check className="h-3 w-3" /> : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
