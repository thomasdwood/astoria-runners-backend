import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CategoryBadge } from '@/components/shared/category-badge';
import { Clock, MapPin, FileText } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface EventPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
}

export function EventPopover({ event, children }: EventPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">{event.title}</h4>
            <CategoryBadge category={event.category} className="mt-1" />
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
            {event.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{event.notes}</span>
              </div>
            )}
          </div>
          {event.isRecurring && (
            <p className="text-xs text-muted-foreground">Recurring event</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
