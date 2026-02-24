import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLOR_MAP } from '@/lib/constants';
import { Clock, MapPin } from 'lucide-react';
import type { CalendarEvent } from '@/types';

interface ListViewProps {
  groupedByDate: Record<string, CalendarEvent[]>;
}

export function ListView({ groupedByDate }: ListViewProps) {
  const dates = Object.keys(groupedByDate).sort();

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No upcoming events
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            {groupedByDate[date][0].displayDate}
          </h3>
          <div className="space-y-2">
            {groupedByDate[date].map((event, i) => {
              const colors = CATEGORY_COLOR_MAP[event.categoryColor] ?? CATEGORY_COLOR_MAP['slate'];
              return (
                <div
                  key={`${event.id ?? event.recurringTemplateId}-${i}`}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant="outline" className={colors.badge}>
                        {event.categoryIcon ? `${event.categoryIcon} ` : ''}{event.category}
                      </Badge>
                      {event.isRecurring && (
                        <span className="text-xs text-muted-foreground">(recurring)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {event.displayTime}
                      </span>
                      {event.endLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.endLocation}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
