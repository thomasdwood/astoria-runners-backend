// @ts-ignore - discord-webhook-node has type resolution issues with ESM
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import { config } from '../config/env.js';
import { getSetting } from './settingsService.js';

// Category color name → Discord embed hex color
const CATEGORY_HEX_COLORS: Record<string, number> = {
  amber: 0xF59E0B,
  orange: 0xF97316,
  emerald: 0x10B981,
  blue: 0x3B82F6,
  purple: 0xA855F7,
  red: 0xEF4444,
  pink: 0xEC4899,
  teal: 0x14B8A6,
  indigo: 0x6366F1,
  slate: 0x64748B,
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CategoryInfo {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface EventWithRoute {
  id: number;
  startDateTime: Date;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string;
    startLocation: string | null;
    endLocation: string | null;
    category: CategoryInfo;
  };
}

interface RecurringTemplateWithRoute {
  id: number;
  frequency: string;
  dayOfWeek: number;
  bySetPos: number | null;
  startTime: string;
  startLocation: string | null;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string;
    startLocation: string | null;
    endLocation: string | null;
    category: CategoryInfo;
  };
}

// Lazy-initialized webhook instance
let webhook: Webhook | null = null;

function getWebhook(): Webhook | null {
  if (!config.discord.webhookUrl) {
    return null;
  }
  if (!webhook) {
    webhook = new Webhook(config.discord.webhookUrl);
  }
  return webhook;
}

function getCategoryHexColor(colorName: string): number {
  return CATEGORY_HEX_COLORS[colorName] ?? 0x64748B; // default slate
}

async function isNotificationsEnabled(): Promise<boolean> {
  if (!config.discord.webhookUrl) return false;
  const setting = await getSetting('discord_notifications_enabled');
  // Default to enabled if setting doesn't exist
  return setting !== 'false';
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/New_York',
  }).format(date);
}

/**
 * Add conditional location fields to an embed.
 * Meeting Point: shown only if startLocation differs from default start location setting.
 * End Location: shown only if different from start location.
 */
async function addLocationFields(
  embed: MessageBuilder,
  event: { startLocation: string | null; endLocation: string | null; route: { startLocation: string | null; endLocation: string | null } }
): Promise<void> {
  const startLocation = event.startLocation || event.route.startLocation;
  const endLocation = event.endLocation || event.route.endLocation;

  if (startLocation) {
    const defaultStart = await getSetting('default_start_location');
    if (!defaultStart || startLocation !== defaultStart) {
      embed.addField('Meeting Point', startLocation, false);
    }
  }

  if (endLocation && endLocation !== startLocation) {
    embed.addField('End Location', endLocation, false);
  }
}

export async function notifyEventCreated(event: EventWithRoute): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const hook = getWebhook();
  if (!hook) return;

  const embed = new MessageBuilder()
    .setTitle(`Lace up! ${event.route.category.icon} ${event.route.name}`)
    .setDescription('New run scheduled — mark your calendar!')
    .setColor(getCategoryHexColor(event.route.category.color))
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category.name, true);

  await addLocationFields(embed, event);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();
  await hook.send(embed);
}

export async function notifyEventUpdated(event: EventWithRoute): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const hook = getWebhook();
  if (!hook) return;

  const embed = new MessageBuilder()
    .setTitle(`Heads up — schedule change: ${event.route.name}`)
    .setDescription('An upcoming run has been updated. Check the latest details below.')
    .setColor(getCategoryHexColor(event.route.category.color))
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category.name, true);

  await addLocationFields(embed, event);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();
  await hook.send(embed);
}

export async function notifyEventDeleted(event: EventWithRoute): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const hook = getWebhook();
  if (!hook) return;

  const embed = new MessageBuilder()
    .setTitle(`Run Cancelled: ${event.route.name}`)
    .setDescription('This run has been removed from the schedule.')
    .setColor(getCategoryHexColor(event.route.category.color))
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category.name, true);

  await addLocationFields(embed, event);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();
  await hook.send(embed);
}

export async function notifyRecurringCreated(template: RecurringTemplateWithRoute): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const hook = getWebhook();
  if (!hook) return;

  // Build schedule description
  const dayName = DAY_NAMES[template.dayOfWeek] ?? 'Unknown';
  const [hours, minutes] = template.startTime.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const timeStr = `${displayHour}:${minutes} ${ampm}`;

  let scheduleDesc: string;
  if (template.frequency === 'weekly') {
    scheduleDesc = `Every ${dayName} at ${timeStr}`;
  } else if (template.frequency === 'biweekly') {
    scheduleDesc = `Every other ${dayName} at ${timeStr}`;
  } else {
    // Monthly with bySetPos
    const ordinals: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', [-1]: 'last' };
    const pos = template.bySetPos !== null ? (ordinals[template.bySetPos] ?? '') : '';
    scheduleDesc = `${pos} ${dayName} of the month at ${timeStr}`;
  }

  const embed = new MessageBuilder()
    .setTitle(`New recurring run! ${template.route.category.icon} ${template.route.name}`)
    .setDescription(scheduleDesc)
    .setColor(getCategoryHexColor(template.route.category.color))
    .addField('Route', template.route.name, true)
    .addField('Distance', `${template.route.distance} mi`, true)
    .addField('Category', template.route.category.name, true);

  await addLocationFields(embed, template);

  if (template.notes) {
    embed.addField('Notes', template.notes, false);
  }

  embed.setTimestamp();
  await hook.send(embed);
}

export async function notifyRecurringDeleted(template: RecurringTemplateWithRoute): Promise<void> {
  if (!(await isNotificationsEnabled())) return;

  const hook = getWebhook();
  if (!hook) return;

  const embed = new MessageBuilder()
    .setTitle(`${template.route.name} recurring schedule has been cancelled`)
    .setDescription('This recurring run is no longer on the schedule.')
    .setColor(getCategoryHexColor(template.route.category.color))
    .addField('Route', template.route.name, true)
    .addField('Distance', `${template.route.distance} mi`, true)
    .addField('Category', template.route.category.name, true);

  embed.setTimestamp();
  await hook.send(embed);
}
