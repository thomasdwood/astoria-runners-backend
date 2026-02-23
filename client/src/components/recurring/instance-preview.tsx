import { useRecurringInstances } from '@/hooks/use-recurring';
import { format, addMonths } from 'date-fns';
import { CalendarDays } from 'lucide-react';

interface InstancePreviewProps {
  templateId: number;
}

export function InstancePreview({ templateId }: InstancePreviewProps) {
  const now = new Date();
  const start = now.toISOString();
  const end = addMonths(now, 3).toISOString();

  const { data: instances, isLoading } = useRecurringInstances(templateId, start, end);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  if (!instances?.length) {
    return <p className="text-sm text-muted-foreground py-2">No upcoming instances</p>;
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <CalendarDays className="h-3.5 w-3.5" />
        Upcoming Instances ({instances.length})
      </h4>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {instances.map((inst, i) => (
          <div key={i} className="text-sm text-muted-foreground">
            {format(new Date(inst.startDateTime), 'EEE, MMM d, yyyy h:mm a')}
          </div>
        ))}
      </div>
    </div>
  );
}
