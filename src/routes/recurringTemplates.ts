import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createRecurringTemplateSchema, updateRecurringTemplateSchema, recurrencePreviewSchema } from '../validation/events.js';
import { z } from 'zod';
import * as recurringService from '../services/recurringService.js';

const router = Router();

// All recurring template routes require authentication
router.use(requireAuth);

// Validation schemas for query params
const listTemplatesQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
});

const instancesQuerySchema = z.object({
  start: z.string().datetime('Start must be a valid ISO 8601 date string'),
  end: z.string().datetime('End must be a valid ISO 8601 date string'),
});

/**
 * POST /
 * Create new recurring template
 */
router.post(
  '/',
  validateBody(createRecurringTemplateSchema),
  asyncHandler(async (req, res) => {
    const result = await recurringService.createRecurringTemplate(req.body);

    if (result && 'error' in result && result.error === 'route_not_found') {
      res.status(422).json({ error: 'Route not found' });
      return;
    }

    res.status(201).json({ template: result });
  })
);

/**
 * GET /
 * List active recurring templates with optional category filter
 */
router.get(
  '/',
  validateQuery(listTemplatesQuerySchema),
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query;

    const filters = categoryId !== undefined ? { categoryId: Number(categoryId) } : undefined;
    const templates = await recurringService.listRecurringTemplates(filters);

    res.status(200).json({ templates });
  })
);

/**
 * GET /preview
 * Preview recurrence pattern - returns natural language text and next 3 dates
 * Must be defined before /:id to avoid path conflict
 */
router.get(
  '/preview',
  validateQuery(recurrencePreviewSchema),
  asyncHandler(async (req, res) => {
    // Zod has already coerced and validated the query params via recurrencePreviewSchema
    const { frequency, dayOfWeek, bySetPos, startTime } = req.query as unknown as {
      frequency: 'weekly' | 'biweekly' | 'monthly';
      dayOfWeek: number;
      bySetPos?: number | null;
      startTime: string;
    };

    const pattern: recurringService.RecurrencePattern = {
      frequency,
      dayOfWeek: Number(dayOfWeek),
      bySetPos: bySetPos != null ? Number(bySetPos) : undefined,
      startTime,
    };

    const preview = recurringService.getRecurrencePreview(pattern);
    res.status(200).json(preview);
  })
);

/**
 * GET /:id
 * Get single recurring template by id
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const template = await recurringService.getRecurringTemplateById(id);
    if (!template) {
      res.status(404).json({ error: 'Recurring template not found' });
      return;
    }

    res.status(200).json({ template });
  })
);

/**
 * GET /:id/instances
 * Get generated instances for a template in date range
 */
router.get(
  '/:id/instances',
  validateQuery(instancesQuerySchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const { start, end } = req.query;
    const instances = await recurringService.getInstancesInRange(
      id,
      new Date(start as string),
      new Date(end as string)
    );

    res.status(200).json({ instances });
  })
);

/**
 * PUT /:id/exclude-date
 * Add a date to the template's excluded dates (deletes that instance)
 * Must be before /:id to avoid path conflict
 */
const excludeDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

router.put(
  '/:id/exclude-date',
  validateBody(excludeDateSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const { date } = req.body as { date: string };
    const result = await recurringService.excludeDateFromTemplate(id, date);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Recurring template not found' });
        return;
      }
    }

    res.status(200).json({ success: true });
  })
);

/**
 * PUT /:id
 * Update recurring template with optimistic locking
 */
router.put(
  '/:id',
  validateBody(updateRecurringTemplateSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    // Check that at least one data field is provided beyond version
    const { version, ...dataFields } = req.body;
    if (Object.keys(dataFields).length === 0) {
      res.status(422).json({ error: 'At least one field to update is required' });
      return;
    }

    const result = await recurringService.updateRecurringTemplate(id, req.body);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Recurring template not found' });
        return;
      }
      if (result.error === 'conflict') {
        res.status(409).json({ error: 'Recurring template was modified by another user. Please refresh and try again.' });
        return;
      }
    }

    res.status(200).json({ template: result.template });
  })
);

/**
 * DELETE /:id
 * Delete or deactivate recurring template
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    const result = await recurringService.deleteRecurringTemplate(id);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Recurring template not found' });
        return;
      }
    }

    res.status(204).send();
  })
);

export default router;
