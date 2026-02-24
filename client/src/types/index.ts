export interface User {
  id: number;
  email: string;
  displayName: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface Route {
  id: number;
  name: string;
  distance: number;
  categoryId: number;
  category: Category;
  startLocation: string | null;
  endLocation: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  routeId: number;
  recurringTemplateId: number | null;
  startDateTime: string;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  isCancelled: boolean;
  postedToMeetup: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  route: Route;
}

export interface RecurringTemplate {
  id: number;
  routeId: number;
  rrule: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  dayOfWeek: number;
  bySetPos: number | null;
  startTime: string;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
  excludedDates: string | null;
  notes: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  route: Route;
}

export interface RecurringInstance {
  recurringTemplateId: number;
  routeId: number;
  startDateTime: string;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  route: Route;
}

export interface CalendarEvent {
  id: number | null;
  title: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  startDateTime: string;
  displayDate: string;
  displayTime: string;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  isCancelled: boolean;
  isRecurring: boolean;
  recurringTemplateId: number | null;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CalendarMonthResponse {
  view: 'month';
  grid: {
    year: number;
    month: number;
    monthName: string;
    weeks: CalendarDay[][];
  };
  events: CalendarEvent[];
  navigation: {
    prev: { year: number; month: number };
    next: { year: number; month: number };
  };
}

export interface CalendarListResponse {
  view: 'list';
  events: CalendarEvent[];
  groupedByDate: Record<string, CalendarEvent[]>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  details?: ValidationError[];
}
