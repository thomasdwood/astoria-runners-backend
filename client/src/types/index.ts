export interface User {
  id: number;
  email: string;
  displayName: string;
}

export type RouteCategory = 'Brewery Run' | 'Coffee Run' | 'Brunch Run' | 'Weekend';

export interface Route {
  id: number;
  name: string;
  distance: number;
  category: RouteCategory;
  endLocation: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  routeId: number;
  recurringTemplateId: number | null;
  startDateTime: string;
  endLocation: string | null;
  notes: string | null;
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
  dayOfWeek: number;
  startTime: string;
  endLocation: string | null;
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
  endLocation: string | null;
  notes: string | null;
  route: Route;
}

export interface CalendarEvent {
  id: number | null;
  title: string;
  category: RouteCategory;
  startDateTime: string;
  displayDate: string;
  displayTime: string;
  endLocation: string | null;
  notes: string | null;
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
