// @ts-ignore - discord-webhook-node has type resolution issues with ESM
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import { config } from '../config/env.js';

type WebhookAction = 'event_created' | 'event_updated' | 'event_deleted';

interface EventWithRoute {
  id: number;
  routeId: number;
  startDateTime: Date;
  endLocation: string | null;
  notes: string | null;
  route: {
    name: string;
    distance: string;
    category: string;
    endLocation: string;
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

export function isDiscordEnabled(): boolean {
  return config.discord.webhookUrl.length > 0;
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

export async function notifyEventCreated(event: EventWithRoute): Promise<void> {
  if (!isDiscordEnabled()) {
    return;
  }

  const hook = getWebhook();
  if (!hook) {
    return;
  }

  const embed = new MessageBuilder()
    .setTitle(`New Run Scheduled: ${event.route.name}`)
    .setColor('#00FF00')
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category, true)
    .addField('End Location', event.endLocation || event.route.endLocation, false);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();

  await hook.send(embed);
}

export async function notifyEventUpdated(event: EventWithRoute): Promise<void> {
  if (!isDiscordEnabled()) {
    return;
  }

  const hook = getWebhook();
  if (!hook) {
    return;
  }

  const embed = new MessageBuilder()
    .setTitle(`Run Updated: ${event.route.name}`)
    .setColor('#FFA500')
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category, true)
    .addField('End Location', event.endLocation || event.route.endLocation, false);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();

  await hook.send(embed);
}

export async function notifyEventDeleted(event: EventWithRoute): Promise<void> {
  if (!isDiscordEnabled()) {
    return;
  }

  const hook = getWebhook();
  if (!hook) {
    return;
  }

  const embed = new MessageBuilder()
    .setTitle(`Run Cancelled: ${event.route.name}`)
    .setColor('#FF0000')
    .addField('Date and Time', formatDateTime(event.startDateTime), false)
    .addField('Route', event.route.name, true)
    .addField('Distance', `${event.route.distance} mi`, true)
    .addField('Category', event.route.category, true)
    .addField('End Location', event.endLocation || event.route.endLocation, false);

  if (event.notes) {
    embed.addField('Notes', event.notes, false);
  }

  embed.setTimestamp();

  await hook.send(embed);
}
