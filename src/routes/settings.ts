import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import * as settingsService from '../services/settingsService.js';
import { EDITABLE_SETTINGS, EditableSettingKey, settingValueSchemas } from '../validation/settings.js';

const router = Router();

/**
 * GET /
 * Get all settings (public — forms need default start location)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await settingsService.getAllSettings();
    res.status(200).json({ settings });
  })
);

/**
 * GET /locations
 * Get location suggestions from previously-used locations (public)
 */
router.get(
  '/locations',
  asyncHandler(async (_req, res) => {
    const locations = await settingsService.getLocationSuggestions();
    res.status(200).json({ locations });
  })
);

/**
 * PUT /:key
 * Upsert a setting value (auth required)
 */
router.put(
  '/:key',
  requireAuth,
  asyncHandler(async (req, res) => {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;

    if (!EDITABLE_SETTINGS.includes(key as EditableSettingKey)) {
      res.status(400).json({ error: 'Unknown setting key' });
      return;
    }

    const valueSchema = settingValueSchemas[key as EditableSettingKey];
    const parsed = valueSchema.safeParse(req.body.value);

    if (!parsed.success) {
      res.status(422).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((e) => ({ field: 'value', message: e.message })),
      });
      return;
    }

    const setting = await settingsService.upsertSetting(key, parsed.data);
    res.status(200).json({ setting });
  })
);

export default router;
