import { Link } from 'react-router-dom';
import { useRoutes } from '@/hooks/use-routes';
import { useEvents } from '@/hooks/use-events';
import { useRecurringTemplates } from '@/hooks/use-recurring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/shared/category-badge';
import { MapPin, CalendarDays, Repeat, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';

export function DashboardPage() {
  const { data: routes } = useRoutes();
  const now = new Date();
  const { data: upcomingEvents } = useEvents({
    start: now.toISOString(),
    end: addDays(now, 7).toISOString(),
  });
  const { data: templates } = useRecurringTemplates();

  const activeTemplates = templates?.filter((t) => t.isActive) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Astoria Runners admin overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTemplates.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/admin/events">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/routes">
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {!upcomingEvents?.length ? (
            <p className="text-sm text-muted-foreground">No events in the next 7 days</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className="text-sm font-medium w-24">
                    {format(new Date(event.startDateTime), 'EEE, MMM d')}
                  </div>
                  <div className="text-sm text-muted-foreground w-16">
                    {format(new Date(event.startDateTime), 'h:mm a')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{event.route.name}</span>
                    <CategoryBadge category={event.route.category} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
