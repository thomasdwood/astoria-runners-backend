# Phase 3: Event Scheduling & Public Calendar - Research

**Researched:** 2026-02-13
**Domain:** Event scheduling, recurring events, calendar UI components
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 requires implementing event CRUD operations with recurring event support and dual calendar views (month and list). The core technical challenge is the recurring events pattern, which requires choosing between naive (store all instances) vs. expert (template + programmatic generation) approaches.

**Key findings:**
- Template-instance pattern is industry standard for recurring events (store template, generate instances on-the-fly)
- react-big-calendar is the de facto library for event-heavy calendar UIs (6.4k stars, supports month/week/day/agenda views)
- rrule.js implements RFC 5545 iCalendar RRULE standard for recurring event patterns (3.7k stars, actively maintained)
- date-fns with date-fns-tz provides tree-shakeable date handling with timezone support (already aligns with existing Drizzle ORM patterns)
- PostgreSQL timestamptz + generate_series enables efficient instance generation at query time

**Primary recommendation:** Use template-instance pattern with rrule.js for recurrence rules, react-big-calendar for UI, and PostgreSQL generate_series for efficient instance materialization. Defer exception handling (EXDATE/EXRULE) to Phase 4 or later - start with simple weekly recurrence only.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | Database ORM (already in use) | Already established in Phase 1-2, handles timestamptz well |
| rrule | 2.8+ | RFC 5545 recurrence rules | Industry standard (3.7k stars), human-readable RRULE strings, timezone support via Intl API |
| react-big-calendar | 1.19+ | Calendar UI component | Most popular event-heavy calendar (6.4k stars), month/week/day/agenda views, customizable |
| date-fns | 3.0+ | Date manipulation | Tree-shakeable, smallest bundle size (1.6 KiB), modular |
| date-fns-tz | 3.0+ | Timezone conversion | Extends date-fns for timezone operations, keeps bundle small |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.3.6 | Validation (already in use) | Already established, validate event creation/update payloads |
| PostgreSQL generate_series | Built-in | Generate date sequences | Materialize recurring event instances efficiently at query time |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rrule | rSchedule | rSchedule has more features (imports/exports ICAL), but rrule is more established and lighter |
| react-big-calendar | react-day-picker | react-day-picker is foundation library (6M downloads) but doesn't handle event-heavy UIs; better for date pickers |
| date-fns | Day.js | Day.js (6.64 KiB) is good for Moment.js migration, but date-fns (1.6 KiB) is smaller with better tree-shaking |
| Template-instance | Naive (store all instances) | Naive is simpler to implement but requires background jobs, has storage overhead, makes updates complex |

**Installation:**
```bash
# Backend (Node.js/Express)
npm install rrule date-fns date-fns-tz

# Frontend (React - to be added in this phase)
npm install react-big-calendar date-fns date-fns-tz
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── db/
│   └── schema/
│       ├── events.ts              # Event instances (one-off + materialized recurring)
│       └── recurring_templates.ts # Recurring event templates with RRULE
├── services/
│   ├── eventService.ts           # Event CRUD + instance generation
│   └── recurringService.ts       # RRULE parsing, instance generation
├── routes/
│   ├── events.ts                 # Organizer: POST/PUT/DELETE events
│   └── calendar.ts               # Public: GET calendar views (month, list)
└── utils/
    └── dateHelpers.ts            # Timezone conversion, formatting
```

### Pattern 1: Template-Instance Model (Expert Approach)

**What:** Store recurring pattern as template, generate instances programmatically on-the-fly or materialized in database.

**When to use:** Any recurring event scenario (weekly runs, monthly meetings, etc.).

**Schema structure:**
```typescript
// events table - stores both one-off events and materialized recurring instances
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => routes.id),
  recurringTemplateId: integer('recurring_template_id').references(() => recurringTemplates.id), // NULL for one-off events
  startDateTime: timestamp('start_date_time', { withTimezone: true }).notNull(),
  endLocation: varchar('end_location', { length: 200 }),
  notes: text('notes'),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// recurring_templates table - stores RRULE patterns
export const recurringTemplates = pgTable('recurring_templates', {
  id: serial('id').primaryKey(),
  routeId: integer('route_id').notNull().references(() => routes.id),
  rrule: text('rrule').notNull(), // RFC 5545 RRULE string
  startDateTime: timestamp('start_date_time', { withTimezone: true }).notNull(), // Template start
  endLocation: varchar('end_location', { length: 200 }),
  notes: text('notes'),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Instance generation using rrule.js:**
```typescript
// Source: https://github.com/jkbrzt/rrule
import { RRule, datetime } from 'rrule';

// Create weekly recurrence rule (every Monday at 6:30 PM)
const rule = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO],
  dtstart: datetime(2026, 2, 17, 18, 30), // Feb 17, 2026 at 6:30 PM
  count: 10, // Generate 10 instances
});

// Get all instances
const instances = rule.all();
// [2026-02-17 18:30, 2026-02-24 18:30, 2026-03-03 18:30, ...]

// Get instances in date range
const rangeInstances = rule.between(
  new Date('2026-02-01'),
  new Date('2026-03-31'),
  true // inclusive
);
```

### Pattern 2: Hybrid Materialization Strategy

**What:** Generate instances on-the-fly for calendar queries, but materialize (store) instances when organizer needs to modify individual occurrence.

**When to use:** Balance between query performance and storage efficiency.

**Implementation approach:**
1. Calendar queries: Generate instances from recurring_templates using rrule.between()
2. One-off edits: Materialize instance to events table, mark as exception
3. Template updates: Regenerate non-exception instances

**Benefits:**
- Efficient storage (only exceptions stored)
- Fast queries (no complex recurrence calculation at runtime)
- Flexible editing (individual instances can be modified)

### Pattern 3: PostgreSQL generate_series for Date Ranges

**What:** Use PostgreSQL's built-in generate_series function to create date sequences efficiently at the database level.

**When to use:** Pre-calculating date ranges for recurring events during query execution.

**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/functions-srf.html
-- Generate daily instances for a week
SELECT generate_series(
  '2026-02-17 18:30:00'::timestamptz,
  '2026-02-23 18:30:00'::timestamptz,
  '1 day'::interval
) AS instance_date;

-- Combine with events table for materialization
INSERT INTO events (recurring_template_id, start_date_time, route_id, ...)
SELECT
  rt.id,
  generate_series(
    rt.start_date_time,
    rt.start_date_time + interval '3 months', -- Generate 3 months ahead
    '1 week'::interval -- Weekly recurrence
  ),
  rt.route_id,
  ...
FROM recurring_templates rt
WHERE rt.id = $1;
```

### Pattern 4: Calendar View Rendering with react-big-calendar

**What:** Use react-big-calendar's built-in views (month, week, day, agenda) with custom event components.

**When to use:** Displaying events in multiple view formats for users.

**Example:**
```typescript
// Source: https://github.com/jquense/react-big-calendar
import { Calendar, momentLocalizer } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MyCalendar = ({ events }) => (
  <Calendar
    localizer={localizer}
    events={events}
    startAccessor="start"
    endAccessor="end"
    defaultView="month"
    views={['month', 'agenda']} // Agenda = list view
    style={{ height: 600 }}
  />
);
```

### Anti-Patterns to Avoid

- **Storing RRULE in events table** - Duplicates recurrence logic, breaks single source of truth
- **Client-side instance generation for large date ranges** - Causes performance issues, use server-side or database-level generation
- **Timezone-naive date storage** - Always use timestamptz, never timestamp without timezone
- **Materializing infinite recurring events** - Use COUNT or UNTIL in RRULE to limit instances
- **Global time conversion** - Convert to user timezone only at presentation layer, store UTC everywhere

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recurrence rule parsing | Custom "every Monday" parser | rrule.js with RFC 5545 RRULE | Edge cases: last day of month, nth weekday, DST transitions, leap years |
| Calendar UI grid layout | CSS Grid calendar | react-big-calendar | Event overlaps, drag-and-drop, multi-day events, responsive design |
| Timezone conversion | Manual UTC offset math | date-fns-tz + Intl API | DST transitions, historical timezone changes, IANA database updates |
| Date range generation | Manual loop incrementing dates | PostgreSQL generate_series or rrule.between() | Performance, leap years, DST gaps, month-end edge cases |
| Event filtering by date | String comparison of dates | Drizzle ORM operators (gte, lt) with Date objects | Type safety, index usage, timezone handling |

**Key insight:** Date/time and recurrence logic has decades of edge cases (DST, leap years, timezone changes, RFC 5545 spec complexity). Libraries like rrule, date-fns, and PostgreSQL's date functions have solved these. Custom implementations will have bugs.

## Common Pitfalls

### Pitfall 1: DST Transition Handling

**What goes wrong:** Events scheduled at "2:30 AM" on DST transition day may not exist (clocks jump from 2 AM to 3 AM) or occur twice (fall back from 2 AM to 1 AM).

**Why it happens:** timestamptz stores UTC, but recurrence rules operate on local time. The conversion point is ambiguous during DST transitions.

**How to avoid:**
- Use RRULE's TZID parameter to specify timezone explicitly
- Avoid scheduling recurring events during DST transition hours (2-3 AM in most US timezones)
- Let rrule.js handle the conversion using Intl API

**Warning signs:**
- Events disappearing from calendar during March/November DST transitions
- Duplicate events appearing on "fall back" weekends
- "Invalid date" errors during instance generation

### Pitfall 2: Infinite Recurrence Without Limits

**What goes wrong:** RRULE without COUNT or UNTIL generates infinite instances, causing memory/performance issues.

**Why it happens:** Default RRULE without termination condition repeats forever.

**How to avoid:**
- Always set COUNT (max number of occurrences) OR UNTIL (end date) in RRULE
- For "ongoing" events, use practical limit like COUNT=52 (one year of weekly events) and regenerate yearly
- Use rrule.between(start, end) instead of rrule.all() to limit query range

**Warning signs:**
- Memory spikes when calling rule.all()
- Calendar queries timing out
- Database storage growing unexpectedly if materializing instances

### Pitfall 3: Editing Recurring Event Instance Without Exception Tracking

**What goes wrong:** User edits "next Monday's run" but system updates the entire recurring template, changing all future instances.

**Why it happens:** No distinction between "edit this instance" vs. "edit all instances" in data model.

**How to avoid:**
- Implement exception handling (EXDATE in RFC 5545) - track which instances are excluded
- When editing single instance: materialize to events table with recurring_template_id, mark template with EXDATE for that date
- When editing template: apply changes only to future instances (or provide "all future" vs "this and future" options)

**Warning signs:**
- User complaints about "all events changed when I only wanted to change one"
- Missing events on dates that should have recurrence
- Duplicate events (template instance + materialized exception)

### Pitfall 4: Timezone Mismatch Between Server and Database

**What goes wrong:** PostgreSQL server timezone is not UTC, causing timestamptz to be interpreted in wrong timezone.

**Why it happens:** PostgreSQL defaults to server's system timezone unless explicitly configured.

**How to avoid:**
- Set PostgreSQL timezone to UTC in postgresql.conf: `timezone = 'UTC'`
- Verify with: `SHOW timezone;` in psql
- Always pass JavaScript Date objects (which are UTC-aware) to Drizzle ORM
- Convert to user's local timezone only in frontend presentation layer

**Warning signs:**
- Events appearing at wrong times when viewed from different timezones
- Timestamps off by server's UTC offset (e.g., 5 hours for EST)
- Database timestamps don't match application logs

### Pitfall 5: Category Filter Not Propagated from Route to Event

**What goes wrong:** Filtering events by category requires JOIN to routes table on every query, causing performance issues.

**Why it happens:** Category is on routes table, not denormalized to events.

**How to avoid:**
- Either: Accept JOIN for category filtering (reasonable for small dataset)
- Or: Denormalize category to events table for faster filtering (add category column to events, copy from route on insert)
- Use Drizzle ORM relational queries with joins: `db.query.events.findMany({ with: { route: true } })`

**Warning signs:**
- Slow calendar queries when filtering by category
- N+1 query problem (fetching route for each event separately)
- Database query plan showing sequential scans instead of index usage

### Pitfall 6: react-big-calendar Requires Container Height

**What goes wrong:** Calendar renders with 0 height or doesn't display properly.

**Why it happens:** react-big-calendar requires explicit height on container element to calculate layout.

**How to avoid:**
- Set explicit height in pixels or vh: `<Calendar style={{ height: 600 }} />` or `height: 80vh`
- Ensure parent container has defined height if using percentage
- Check browser dev tools for element with 0 height

**Warning signs:**
- Calendar component not visible despite successful API data fetch
- Events not rendering even though data is present
- Layout collapses to 0 height

## Code Examples

Verified patterns from official sources:

### Create Weekly Recurring Event Template
```typescript
// Source: https://github.com/jkbrzt/rrule
import { RRule, Weekday } from 'rrule';

// Every Monday at 6:30 PM, for 12 weeks
const rruleString = new RRule({
  freq: RRule.WEEKLY,
  byweekday: [RRule.MO],
  dtstart: new Date(Date.UTC(2026, 1, 17, 18, 30)), // Feb 17, 2026, 6:30 PM UTC
  count: 12,
}).toString();

// rruleString = "DTSTART:20260217T183000Z\nRRULE:FREQ=WEEKLY;COUNT=12;BYDAY=MO"

// Store in database
await db.insert(recurringTemplates).values({
  routeId: 5,
  rrule: rruleString,
  startDateTime: new Date(Date.UTC(2026, 1, 17, 18, 30)),
  endLocation: 'SingleCut Beersmiths',
  notes: 'Weekly brewery run',
});
```

### Generate Instances from RRULE Template
```typescript
// Source: https://github.com/jkbrzt/rrule
import { RRule } from 'rrule';

// Fetch template from database
const template = await db.query.recurringTemplates.findFirst({
  where: eq(recurringTemplates.id, templateId),
});

// Parse RRULE and generate instances for date range
const rule = RRule.fromString(template.rrule);
const instances = rule.between(
  new Date('2026-02-01'),
  new Date('2026-04-30'),
  true // inclusive
);

// Convert to event objects
const events = instances.map(date => ({
  recurringTemplateId: template.id,
  routeId: template.routeId,
  startDateTime: date,
  endLocation: template.endLocation,
  notes: template.notes,
}));
```

### Query Events with Category Filter (Drizzle ORM)
```typescript
// Source: https://orm.drizzle.team/docs/operators
import { gte, lte, eq } from 'drizzle-orm';

// Get events in date range with category filter
const eventsWithRoutes = await db.query.events.findMany({
  where: and(
    gte(events.startDateTime, new Date('2026-02-01')),
    lte(events.startDateTime, new Date('2026-02-28'))
  ),
  with: {
    route: true, // Join routes table
  },
});

// Filter by category in application code (or use SQL where clause)
const breweryRuns = eventsWithRoutes.filter(
  e => e.route.category === 'Brewery Run'
);
```

### Calendar View with react-big-calendar
```typescript
// Source: https://github.com/jquense/react-big-calendar
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Transform events from API to react-big-calendar format
const calendarEvents = apiEvents.map(event => ({
  id: event.id,
  title: `${event.route.name} (${event.route.category})`,
  start: new Date(event.startDateTime),
  end: new Date(event.startDateTime), // Same as start for point-in-time events
  resource: event, // Attach full event object
}));

function MyCalendar() {
  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      defaultView="month"
      views={['month', 'agenda']} // Month grid + list view
      style={{ height: 600 }}
      onSelectEvent={(event) => console.log('Selected:', event.resource)}
    />
  );
}
```

### Convert UTC to User Timezone for Display
```typescript
// Source: https://date-fns.org/docs/format
import { formatInTimeZone } from 'date-fns-tz';

// Event stored as UTC in database
const eventDateUTC = new Date('2026-02-17T18:30:00Z');

// Display in user's timezone (e.g., America/New_York)
const displayTime = formatInTimeZone(
  eventDateUTC,
  'America/New_York',
  'EEE, MMM d, yyyy h:mm a zzz'
);
// "Mon, Feb 17, 2026 1:30 PM EST"

// For New York timezone in February (EST), UTC 18:30 = 1:30 PM local
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Moment.js for date manipulation | date-fns or Day.js | ~2020 | Smaller bundle size, tree-shaking support, immutable API |
| Storing all recurring instances | Template + on-the-fly generation | Established pattern | Reduced storage, easier updates, infinite recurrence support |
| Custom recurrence parsers | RFC 5545 RRULE standard (rrule.js) | RFC published 2009, widely adopted ~2015 | Standardization, interoperability with iCal/Google Calendar |
| timestamp without timezone | timestamptz (timestamp with timezone) | PostgreSQL best practice since 7.3 (2002) | Consistent UTC storage, correct DST handling |
| Custom calendar UI components | react-big-calendar or specialized libraries | ~2016 (react-big-calendar initial release) | Event overlaps, responsive design, accessibility handled |

**Deprecated/outdated:**
- **Moment.js** - Still works but deprecated, use date-fns or Day.js for new projects
- **FREQ=SECONDLY or FREQ=MINUTELY for weekly events** - Overkill complexity, use FREQ=WEEKLY
- **Storing timezone offset as +/-HH:MM** - Use IANA timezone identifiers (e.g., 'America/New_York') for DST handling

## Open Questions

1. **Exception Handling Scope**
   - What we know: RFC 5545 supports EXDATE (exclude specific dates) and EXRULE (exclude by pattern)
   - What's unclear: Does Phase 3 require individual instance editing, or just template-level operations?
   - Recommendation: Start with template-only editing (all future instances), defer individual instance editing to Phase 4. Simpler data model, faster to implement.

2. **Materialization Strategy**
   - What we know: Hybrid approach (on-the-fly + selective materialization) balances performance and storage
   - What's unclear: How far in advance should instances be materialized? 3 months? 6 months?
   - Recommendation: Generate instances on-the-fly for calendar queries (no materialization), materialize only when editing individual instance. Avoids premature optimization.

3. **Frontend Framework**
   - What we know: Phase 1-2 are backend-only (Express API), no frontend framework established yet
   - What's unclear: Which React framework (Create React App, Vite, Next.js) should be used for calendar UI?
   - Recommendation: Use Vite for fastest development setup, aligns with modern React ecosystem. Next.js is overkill for this POC.

4. **Category Filter Performance**
   - What we know: Category lives on routes table, requires JOIN for filtering events
   - What's unclear: Is JOIN performance acceptable, or should category be denormalized to events?
   - Recommendation: Start with JOIN (cleaner data model), add category to events if slow. Optimize based on real usage.

## Sources

### Primary (HIGH confidence)
- [rrule.js GitHub Repository](https://github.com/jkbrzt/rrule) - RFC 5545 RRULE implementation, usage patterns
- [react-big-calendar GitHub Repository](https://github.com/jquense/react-big-calendar) - Calendar component features, views, customization
- [PostgreSQL Date/Time Types Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html) - timestamptz behavior, timezone handling
- [Drizzle ORM Operators Documentation](https://orm.drizzle.team/docs/operators) - Date filtering with gte, lte, eq
- [PostgreSQL generate_series Documentation](https://www.postgresql.org/docs/current/functions-srf.html) - Set returning functions

### Secondary (MEDIUM confidence)
- [Medium: Recurring Calendar Events Database Design](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5) - Template-instance pattern explanation
- [Redgate: Managing Recurring Events In a Data Model](https://www.red-gate.com/blog/again-and-again-managing-recurring-events-in-a-data-model) - Database design patterns
- [node-postgres Date/Time Types](https://node-postgres.com/features/types) - How node-postgres handles timestamptz
- [OneUpTime: PostgreSQL Time Series Data](https://oneuptime.com/blog/post/2026-01-25-postgresql-generate-time-series/view) - generate_series examples
- [Builder.io: React Calendar Component Libraries 2025](https://www.builder.io/blog/best-react-calendar-component-ai) - Library comparison

### Tertiary (LOW confidence - needs verification)
- [DHiWise: date-fns vs Day.js Comparison](https://www.dhiwise.com/post/date-fns-vs-dayjs-the-battle-of-javascript-date-libraries) - Bundle size claims (verify with bundlephobia)
- [Eleken: Calendar UI UX Best Practices](https://www.eleken.co/blog-posts/calendar-ui) - General UX guidance
- [Stratifi Creative: Calendar View UX](https://stratificreative.com/blog/the-problem-with-calendar-views-how-to-improve-ux-on-your-events-page/) - List vs month view opinions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-big-calendar, rrule.js, and date-fns are well-established with official documentation verified
- Architecture: MEDIUM - Template-instance pattern is industry standard, but hybrid materialization strategy is architectural choice not universally standardized
- Pitfalls: MEDIUM-HIGH - DST and timezone issues are well-documented in PostgreSQL and rrule docs, but real-world edge cases vary by implementation

**Research date:** 2026-02-13
**Valid until:** ~2026-03-15 (30 days for stable ecosystem, React calendar libraries mature)
