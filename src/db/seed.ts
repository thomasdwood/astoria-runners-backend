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
    // Use explicit constraint name to ensure conflict resolution works regardless
    // of whether the DB was created via migration or manual DDL
    await pool.query(
      `INSERT INTO categories (name, color, icon)
       VALUES ($1, $2, $3)
       ON CONFLICT ON CONSTRAINT "categories_name_unique"
       DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon, updated_at = NOW()`,
      [category.name, category.color, category.icon],
    );
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
    // Brewery Runs (Beer Run → Brewery Run)
    {
      name: 'Astoria Tavern',
      distance: '3.10',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: 'Bohemian Beer Garden',
      distance: '3.10',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: 'Singlecut',
      distance: '3.10',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: 'Focal Point',
      distance: '4.00',
      categoryId: categoryIdByName.get('Brewery Run')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    // Coffee Runs (Coffee → Coffee Run)
    {
      name: "Randall's Island South + Olive Coffee",
      distance: '6.20',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Olive Coffee, 30th Ave NW',
      stravaUrl: 'https://www.strava.com/routes/3302477830316781372',
    },
    {
      name: "Randall's Island South + Under Pressure",
      distance: '6.20',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Under Pressure Coffee, 31 St & 31 Ave',
      stravaUrl: 'https://www.strava.com/routes/3243250647982161784',
    },
    {
      name: 'Double Queensboro + Partners Coffee',
      distance: '6.40',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Partners Coffee, Jackson Ave & 43 Ave',
      stravaUrl: 'https://www.strava.com/routes/3242849757789446008',
    },
    {
      name: 'Ditmars/Steinway + The Barn',
      distance: '6.50',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'The Barn Coffee Shop, Hoyt Ave S & 27 St',
      stravaUrl: 'https://www.strava.com/routes/3209596697991325920',
    },
    {
      name: "Randall's Island South + Astoria Bakery",
      distance: '6.80',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Astoria Bakery & Cafe, Ditmars Blvd & 45 St',
      stravaUrl: 'https://www.strava.com/routes/3189015422369427928',
    },
    {
      name: 'Gantry Park + Kinship',
      distance: '7.00',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Kinship Coffee, 21st St & 24 Ave',
      stravaUrl: 'https://www.strava.com/routes/3270063069409843294',
    },
    {
      name: "Hunter's Point South + Coffee Ave",
      distance: '7.50',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Coffee Ave, 36th Ave NW',
      stravaUrl: 'https://www.strava.com/routes/3165806754536117652',
    },
    {
      name: 'Roosevelt Island Full Loop + The Barn',
      distance: '8.00',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'The Barn Coffee Shop, Hoyt Ave S',
      stravaUrl: 'https://www.strava.com/routes/3270063069409843294',
    },
    {
      name: 'Roosevelt Island Full Loop + Kinship',
      distance: '8.30',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Kinship Coffee, 21 St & 24 Ave',
      stravaUrl: 'https://www.strava.com/routes/3455712185788069698',
    },
    {
      name: 'Pulaski & K Bridges + Moka & Co.',
      distance: '9.00',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Moka & Co., Steinway St & 30th Ave',
      stravaUrl: 'https://www.strava.com/routes/3220735818575650838',
    },
    {
      name: 'Ditmars/Flushing Bay + Mighty Oak',
      distance: '9.90',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Mighty Oak Rosters, 24 Ave & 28 St',
      stravaUrl: 'https://www.strava.com/routes/3186460179379781404',
    },
    {
      name: "Randall's South & Hunter's Point South + 51st Bakery & Cafe",
      distance: '13.00',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: '51st Bakery & Cafe, 51 Ave & Vernon Blvd',
      stravaUrl: 'https://www.strava.com/routes/3257528089879254416',
    },
    {
      name: "Randall's South & Over Newtown Creek + Cafe 9",
      distance: '13.10',
      categoryId: categoryIdByName.get('Coffee Run')!,
      startLocation: null,
      endLocation: 'Cafe 9, 34 Ave & 9 St',
      stravaUrl: 'https://www.strava.com/routes/3267569382737507494',
    },
    // Brunch Runs (Brunch → Brunch Run)
    {
      name: "Roosevelt Island North (+ Astoria Provisions)",
      distance: '6.00',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Urban Hawker, W 50th St & 7th Ave',
      stravaUrl: 'https://www.strava.com/routes/3266588600444037286',
    },
    {
      name: "Roosevelt Island North (+ Brooklyn Bagel)",
      distance: '7.30',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Brooklyn Bagel, Ditmars Blvd',
      stravaUrl: 'https://www.strava.com/routes/3287893826317421528',
    },
    {
      name: 'Pulaski + K Bridges (+ Brooklyn Bagel)',
      distance: '9.00',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Brooklyn Bagel, Broadway NW',
      stravaUrl: 'https://www.strava.com/routes/3253528223505788294',
    },
    {
      name: 'Astoria to Flushing (+ New World Mall)',
      distance: '13.10',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'New World Mall, Flushing Main St',
      stravaUrl: 'https://www.strava.com/routes/3302500640861356234',
    },
    {
      name: 'Astoria to the Bronx (+ La Masa)',
      distance: '13.10',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'La Masa, Morris Park Ave',
      stravaUrl: 'https://www.strava.com/routes/3046932276959807600',
    },
    {
      name: 'Hudson River to Chinatown (+ Buddha Bodai)',
      distance: '13.10',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Buddha Bodai, Mulberry St',
      stravaUrl: 'https://www.strava.com/routes/3099560291269560232',
    },
    {
      name: "Pulaski & K Bridges (+ Queens Room)",
      distance: '13.10',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'The Queens Room, 36th St & Ditmars Blvd',
      stravaUrl: 'https://www.strava.com/routes/3311841618451815554',
    },
    {
      name: "Spring Cherry Blossoms (+ Partner's Coffee)",
      distance: '13.10',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Queensborough Plaza',
      stravaUrl: 'https://www.strava.com/routes/3346092017441907742',
    },
    {
      name: "Roosevelt Island North & Central Park (+ Urban Hawker)",
      distance: '17.00',
      categoryId: categoryIdByName.get('Brunch Run')!,
      startLocation: null,
      endLocation: 'Urban Hawker, W 50th St & 7th Ave',
      stravaUrl: 'https://www.strava.com/routes/3266589876859774740',
    },
    // Weekend Runs (Weekend + Slow Run + Regular Wednesday + Regular Intervals → Weekend)
    {
      name: 'Classic',
      distance: '3.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: 'Classic Wednesday',
      distance: '3.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: 'Regular Intervals',
      distance: '3.50',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: null,
    },
    {
      name: "Randall's Island South",
      distance: '6.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2914361338176682348',
    },
    {
      name: 'Roosevelt Island North',
      distance: '6.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3042906094538963942',
    },
    {
      name: 'Ditmars/Steinway',
      distance: '6.20',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3042912607490450680',
    },
    {
      name: "Randall's Island Northwest",
      distance: '6.20',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3407112516882384176',
    },
    {
      name: 'Roosevelt Island South',
      distance: '6.20',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2842602087266162262',
    },
    {
      name: "Randall's Island East",
      distance: '6.80',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3066888290905076180',
    },
    {
      name: 'Gantry Park',
      distance: '7.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2978491265675608436',
    },
    {
      name: "Randall's Island West",
      distance: '7.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2961802400387375902',
    },
    {
      name: 'Roosevelt Island Full Loop',
      distance: '8.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2845378570944936266',
    },
    {
      name: "Hunter's Point South",
      distance: '8.50',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2978385807842745572',
    },
    {
      name: 'Over Newtown Creek',
      distance: '8.50',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2883925128702203286',
    },
    {
      name: 'Double Queensboro',
      distance: '9.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3376723652553882942',
    },
    {
      name: "Randall's Island Full Loop",
      distance: '9.20',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/2943321887962786564',
    },
    {
      name: 'Pulaski + K Bridges',
      distance: '10.20',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3362217595327393114',
    },
    {
      name: "Randall's Island South & Roosevelt Island North",
      distance: '12.10',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3272584013954957278',
    },
    {
      name: "Roosevelt Island South & Randalls Island South",
      distance: '12.10',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3253480027183818578',
    },
    {
      name: "Ditmars/Steinway + Randall's Island Northwest",
      distance: '12.50',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3407114375970620814',
    },
    {
      name: 'Ditmars/Roosevelt Island Full Loop',
      distance: '14.00',
      categoryId: categoryIdByName.get('Weekend')!,
      startLocation: null,
      endLocation: null,
      stravaUrl: 'https://www.strava.com/routes/3391597470566344402',
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
      routeName: 'Singlecut',
      dayOfWeek: 1, // Monday
      startTime: '18:30',
      frequency: 'weekly' as const,
      interval: 1,
    },
    {
      routeName: "Randall's Island South",
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
      routeName: 'Classic Wednesday',
      dayOfWeek: 3, // Wednesday
      time: '18:00',
      notes: 'Bring friends!',
    },
    {
      routeName: "Roosevelt Island North (+ Brooklyn Bagel)",
      dayOfWeek: 0, // Sunday
      time: '09:30',
      notes: 'First brunch run of the season',
    },
    {
      routeName: 'Focal Point',
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
