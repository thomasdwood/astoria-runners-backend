import { useState, useEffect } from 'react';
import { useCalendarMonth, useCalendarList } from '@/hooks/use-calendar';
import { MonthGrid } from '@/components/calendar/month-grid';
import { ListView } from '@/components/calendar/list-view';
import { CategoryFilter } from '@/components/calendar/category-filter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const isMobile = useIsMobile();
  const [view, setView] = useState<string>(isMobile ? 'list' : 'month');

  useEffect(() => {
    if (isMobile && view === 'month') setView('list');
  }, [isMobile, view]);

  const monthQuery = useCalendarMonth({ year, month, categoryId });
  const listQuery = useCalendarList({ categoryId });

  function navigate(direction: 'prev' | 'next') {
    if (!monthQuery.data?.navigation) return;
    const nav = monthQuery.data.navigation[direction];
    setYear(nav.year);
    setMonth(nav.month);
  }

  return (
    <div className="container py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Event Calendar</h1>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            {!isMobile && <TabsTrigger value="month">Month</TabsTrigger>}
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CategoryFilter categories={[]} selected={categoryId} onSelect={setCategoryId} />

      {view === 'month' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {monthQuery.data?.grid.monthName} {monthQuery.data?.grid.year}
            </h2>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {monthQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : monthQuery.data ? (
            <MonthGrid weeks={monthQuery.data.grid.weeks} />
          ) : null}
        </div>
      ) : (
        <div>
          {listQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : listQuery.data ? (
            <ListView groupedByDate={listQuery.data.groupedByDate} />
          ) : null}
        </div>
      )}
    </div>
  );
}
