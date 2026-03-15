import { z } from 'zod';

export const EDITABLE_SETTINGS = [
  'default_start_location',
  'meetup_description_template',
  'discord_notifications_enabled',
] as const;

export type EditableSettingKey = (typeof EDITABLE_SETTINGS)[number];

export const settingValueSchemas: Record<EditableSettingKey, z.ZodType<string>> = {
  default_start_location: z.string().min(1, 'Value is required').max(200, 'Must be 200 characters or less'),
  meetup_description_template: z.string().max(5000, 'Must be 5000 characters or less'),
  discord_notifications_enabled: z.enum(['true', 'false'] as [string, ...string[]]),
};
