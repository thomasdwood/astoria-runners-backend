import { cn } from '@/lib/utils';
import { CATEGORY_DOT_COLORS, DAY_NAMES_SHORT } from '@/lib/constants';
import { EventPopover } from './event-popover';
import type { CalendarDay } from '@/types';

interface MonthGridProps {
  weeks: CalendarDay[][];
}

export function MonthGrid({ weeks }: MonthGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted">
        {DAY_NAMES_SHORT.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-t">
          {week.map((day) => (
            <div
              key={day.date}
              className={cn(
                'min-h-[100px] p-1.5 border-r last:border-r-0',
                !day.isCurrentMonth && 'bg-muted/30'
              )}
            >
              <div
                className={cn(
                  'text-sm mb-1',
                  day.isToday &&
                    'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold',
                  !day.isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {day.dayOfMonth}
              </div>
              <div className="space-y-0.5">
                {day.events.map((event, ei) => (
                  <EventPopover key={`${event.id ?? event.recurringTemplateId}-${ei}`} event={event}>
                    <button className="w-full text-left">
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded px-1 py-0.5 text-xs truncate hover:bg-muted/80 transition-colors',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            CATEGORY_DOT_COLORS[event.category]
                          )}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>
                    </button>
                  </EventPopover>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
