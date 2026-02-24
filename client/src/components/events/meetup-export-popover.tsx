import { useState } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Copy, Check } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface MeetupExportPopoverProps {
  eventId?: number;
  postedToMeetup?: boolean;
  onTogglePosted?: () => void;
  calendarEvent?: CalendarEvent;
}

function generateClientSideDescription(ce: CalendarEvent): string {
  const dateLabel = format(new Date(ce.startDateTime), 'EEEE, MMMM d, yyyy h:mm a');
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
  postedToMeetup,
  onTogglePosted,
  calendarEvent,
}: MeetupExportPopoverProps) {
  const [open, setOpen] = useState(false);
  const [descFormat, setDescFormat] = useState<'plain' | 'html'>('plain');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadDescription(fmt: 'plain' | 'html') {
    if (calendarEvent) {
      // Client-side generation for virtual recurring instances
      setDescription(generateClientSideDescription(calendarEvent));
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

        {isDbEvent && onTogglePosted !== undefined && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <input
              type="checkbox"
              id="posted-to-meetup"
              checked={postedToMeetup ?? false}
              onChange={() => onTogglePosted()}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
            <Label htmlFor="posted-to-meetup" className="text-sm cursor-pointer">
              Posted to Meetup
            </Label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
