import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLOR_MAP } from '@/lib/constants';
import { Clock, MapPin, FileText, AlertCircle, User, ExternalLink } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface EventPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
}

export function EventPopover({ event, children }: EventPopoverProps) {
  const colors = CATEGORY_COLOR_MAP[event.categoryColor] ?? CATEGORY_COLOR_MAP['slate'];
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          {event.isCancelled && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>This event has been cancelled</span>
            </div>
          )}
          <div>
            <h4 className="font-semibold">{event.title}</h4>
            <Badge variant="outline" className={`${colors.badge} mt-1`}>
              {event.categoryIcon ? `${event.categoryIcon} ` : ''}{event.category}
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {event.displayDate} at {event.displayTime}
              </span>
            </div>
            {event.endLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.endLocation}</span>
              </div>
            )}
            {event.notes && !event.isCancelled && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{event.notes}</span>
              </div>
            )}
            {event.hostName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{event.hostName}</span>
              </div>
            )}
            {event.meetupUrl && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={event.meetupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  View on Meetup
                </a>
              </div>
            )}
            {event.stravaUrl && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={event.stravaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  View route on Strava
                </a>
              </div>
            )}
          </div>
          {event.isRecurring && !event.isCancelled && (
            <p className="text-xs text-muted-foreground">Recurring event</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
