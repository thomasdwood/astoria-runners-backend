import { db } from '../config/database.js';
import { pool } from '../config/database.js';
import { users } from './schema/users.js';
import { routes } from './schema/routes.js';
import { events } from './schema/events.js';
import { recurringTemplates } from './schema/recurringTemplates.js';
import { categories } from './schema/categories.js';
import { settings } from './schema/settings.js';
import { hashPassword } from '../services/authService.js';
import { eq, inArray, and, isNull, sql } from 'drizzle-orm';
import rrulePkg from 'rrule';
const { RRule } = rrulePkg;
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';

/**
 * Seed database with demo organizer accounts
 * Idempotent: Can be run multiple times without error
 */
async function seed() {
  console.log('Starting database seed...');

  // Define seed users
  const seedUsers = [
    {
      email: 'admin@astoriarunners.com',
      password: 'organizer123',
      displayName: 'Demo Organizer',
      role: 'organizer',
    },
    {
      email: 'thomas.d.wood@gmail.com',
      password: 'organizer123',
      displayName: 'Tom Wood',
      role: 'organizer',
    },
  ];

  // Hash passwords and insert users with upsert pattern
  for (const user of seedUsers) {
    const passwordHash = await hashPassword(user.password);

    await db
      .insert(users)
      .values({
        email: user.email,
        passwordHash,
        displayName: user.displayName,
        role: user.role,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          displayName: user.displayName,
          role: user.role,
        },
      });

    console.log(`✓ Seeded user: ${user.email} (${user.displayName})`);
  }

  console.log(`✓ Seeded ${seedUsers.length} organizer accounts\n`);

  // Seed categories (must exist before routes due to FK)
  const seedCategories = [
    { name: 'Brewery Run', color: 'amber', icon: '🍺' },
    { name: 'Coffee Run', color: 'orange', icon: '☕' },
    { name: 'Brunch Run', color: 'emerald', icon: '🥂' },
    { name: 'Weekend', color: 'blue', icon: '🌅' },
  ];

  for (const category of seedCategories) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({
        target: categories.name,
        set: {
          color: category.color,
          icon: category.icon,
          updatedAt: sql`NOW()`,
        },
      });
    console.log(`✓ Seeded category: ${category.name} (${category.icon})`);
  }

  console.log(`✓ Seeded ${seedCategories.length} categories\n`);

  // Seed default start location setting
  await db
    .insert(settings)
    .values({ key: 'default_start_location', value: 'Astoria Park Track' })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: 'Astoria Park Track',
        updatedAt: sql`NOW()`,
      },
    });
  console.log('✓ Seeded setting: default_start_location = Astoria Park Track');

  // Seed meetup description template setting
  const meetupTemplate = `Join us for a {{distance}} mile {{routeName}}!

Start: {{startLocation}}
End: {{endLocation}}
{{#if host}}Host: {{host}}{{/if}}
{{#if routeLink}}Strava Route: {{routeLink}}{{/if}}
{{#if notes}}Notes: {{notes}}{{/if}}`;

  await db
    .insert(settings)
    .values({ key: 'meetup_description_template', value: meetupTemplate })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: meetupTemplate,
        updatedAt: sql`NOW()`,
      },
    });
  console.log('✓ Seeded setting: meetup_description_template\n');

  // Look up category IDs for route seeding
  const categoryRows = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const categoryIdByName = new Map(categoryRows.map(c => [c.name, c.id]));

  // Seed routes
  const sampleRoutes = [
    {
      name: 'ICONYC Brewing Loop',
      distance: '3.50',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: 'ICONYC Brewing, 31-01 Vernon Blvd',
    },
    {
      name: 'Kinship Coffee Out-and-Back',
      distance: '2.80',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Kinship Coffee, 30-13 34th St',
    },
    {
      name: 'Astoria Park to Comfortland',
      distance: '4.20',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Comfortland, 40-09 30th Ave',
    },
    {
      name: 'Randalls Island Bridge Loop',
      distance: '8.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: 'Astoria Park Great Lawn',
    },
    {
      name: 'Singlecut Beersmiths Run',
      distance: '4.00',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: 'SingleCut Beersmiths, 19-33 37th St',
    },
  ];

  // Delete in FK order: events -> recurring_templates -> routes (idempotent)
  const routeNames = sampleRoutes.map(r => r.name);
  const existingRoutes = await db.select({ id: routes.id }).from(routes).where(inArray(routes.name, routeNames));
  const existingRouteIds = existingRoutes.map(r => r.id);
  if (existingRouteIds.length > 0) {
    await db.delete(events).where(inArray(events.routeId, existingRouteIds));
    await db.delete(recurringTemplates).where(inArray(recurringTemplates.routeId, existingRouteIds));
  }
  await db.delete(routes).where(inArray(routes.name, routeNames));

  await db.insert(routes).values(sampleRoutes);

  console.log(`✓ Seeded routes: ${sampleRoutes.map(r => r.name).join(', ')}`);

  // Helper: Map JavaScript day of week (0=Sunday) to RRule weekday constants
  function dayOfWeekToRRuleDay(day: number) {
    const daysMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    return daysMap[day];
  }

  // Helper: Compute dtstart for RRULE - find next occurrence of the day of week from today
  function computeDtstart(dayOfWeek: number, startTime: string): Date {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);

    // Get the next occurrence of the specified day of week
    let dtstart = startOfDay(now);
    const currentDay = now.getDay();

    if (currentDay === dayOfWeek) {
      // If today is the target day, use today
      dtstart = startOfDay(now);
    } else {
      // Calculate days until next occurrence
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
      dtstart = addDays(dtstart, daysUntilTarget);
    }

    // Set the time
    dtstart = setHours(dtstart, hours);
    dtstart = setMinutes(dtstart, minutes);

    return dtstart;
  }

  // Helper: Build RRULE string (without COUNT for open-ended recurrence)
  function buildRRule(dayOfWeek: number, startTime: string): string {
    const dtstart = computeDtstart(dayOfWeek, startTime);

    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [dayOfWeekToRRuleDay(dayOfWeek)],
      dtstart: dtstart,
    });

    return rule.toString();
  }

  // Seed recurring templates
  const recurringTemplateData = [
    {
      routeName: 'ICONYC Brewing Loop',
      dayOfWeek: 1, // Monday
      startTime: '18:30',
      frequency: 'weekly' as const,
      interval: 1,
    },
    {
      routeName: 'Randalls Island Bridge Loop',
      dayOfWeek: 6, // Saturday
      startTime: '08:00',
      frequency: 'weekly' as const,
      interval: 1,
    },
  ];

  for (const template of recurringTemplateData) {
    // Look up route by name
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.name, template.routeName))
      .limit(1);

    if (!route) {
      console.warn(`⚠ Route not found: ${template.routeName}, skipping recurring template`);
      continue;
    }

    // Build RRULE string (no COUNT - open-ended)
    const rruleString = buildRRule(template.dayOfWeek, template.startTime);

    // Delete existing template with matching routeId + dayOfWeek (idempotent)
    await db
      .delete(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.routeId, route.id),
          eq(recurringTemplates.dayOfWeek, template.dayOfWeek)
        )
      );

    // Insert new template with new frequency/interval columns
    await db.insert(recurringTemplates).values({
      routeId: route.id,
      rrule: rruleString,
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      frequency: template.frequency,
      interval: template.interval,
      bySetPos: null,
      endDate: null,
      endLocation: route.endLocation,
    });

    console.log(`✓ Seeded recurring template: ${template.routeName} (${getDayName(template.dayOfWeek)} at ${template.startTime})`);
  }

  console.log(`✓ Seeded ${recurringTemplateData.length} recurring templates\n`);

  // RRULE migration: strip COUNT from any existing recurring templates that have it
  const allTemplates = await db.select({ id: recurringTemplates.id, rrule: recurringTemplates.rrule }).from(recurringTemplates);
  let migratedCount = 0;
  for (const template of allTemplates) {
    if (template.rrule.includes(';COUNT=')) {
      const cleanRRule = template.rrule.replace(/;COUNT=\d+/g, '');
      await db
        .update(recurringTemplates)
        .set({
          rrule: cleanRRule,
          frequency: 'weekly',
          interval: 1,
          updatedAt: sql`NOW()`,
        })
        .where(eq(recurringTemplates.id, template.id));
      migratedCount++;
    }
  }
  if (migratedCount > 0) {
    console.log(`✓ Migrated ${migratedCount} RRULE strings (stripped COUNT parameter)\n`);
  }

  // Helper: Compute next occurrence of a day of week
  function nextDay(date: Date, dayOfWeek: number): Date {
    const currentDay = date.getDay();
    let daysUntilTarget = dayOfWeek - currentDay;

    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }

    return addDays(date, daysUntilTarget);
  }

  // Helper: Get day name for logging
  function getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  // Seed one-off events
  const oneOffEventData = [
    {
      routeName: 'Kinship Coffee Out-and-Back',
      dayOfWeek: 3, // Wednesday
      time: '18:00',
      notes: 'Bring friends!',
    },
    {
      routeName: 'Astoria Park to Comfortland',
      dayOfWeek: 0, // Sunday
      time: '09:30',
      notes: 'First brunch run of the season',
    },
    {
      routeName: 'Singlecut Beersmiths Run',
      dayOfWeek: 5, // Friday
      time: '18:30',
      notes: null,
    },
  ];

  for (const event of oneOffEventData) {
    // Look up route by name
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.name, event.routeName))
      .limit(1);

    if (!route) {
      console.warn(`⚠ Route not found: ${event.routeName}, skipping event`);
      continue;
    }

    // Compute next occurrence of the day of week
    const now = new Date();
    const nextOccurrence = nextDay(now, event.dayOfWeek);

    // Set the time
    const [hours, minutes] = event.time.split(':').map(Number);
    const startDateTime = setMinutes(setHours(nextOccurrence, hours), minutes);

    // Delete existing one-off events with matching routeId (idempotent)
    await db
      .delete(events)
      .where(
        and(
          eq(events.routeId, route.id),
          isNull(events.recurringTemplateId)
        )
      );

    // Insert new event
    await db.insert(events).values({
      routeId: route.id,
      startDateTime: startDateTime,
      endLocation: route.endLocation,
      notes: event.notes || undefined,
    });

    console.log(`✓ Seeded one-off event: ${event.routeName} (${getDayName(event.dayOfWeek)} ${event.time})`);
  }

  console.log(`✓ Seeded ${oneOffEventData.length} one-off events\n`);

  console.log(`✓ Seed complete: ${seedUsers.length} organizer accounts, ${seedCategories.length} categories, ${sampleRoutes.length} routes, ${recurringTemplateData.length} recurring templates, ${oneOffEventData.length} one-off events`);
}

/**
 * Main entry point
 */
async function main() {
  try {
    await seed();
    console.log('\nSeeding complete');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
