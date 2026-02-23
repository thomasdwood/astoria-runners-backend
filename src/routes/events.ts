import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema, listEventsQuerySchema, updateMeetupStatusSchema } from '../validation/events.js';
import * as eventService from '../services/eventService.js';
import { generateMeetupDescription } from '../services/meetupExportService.js';

const router = Router();

// All event routes require authentication
router.use(requireAuth);

/**
 * POST /
 * Create new event
 */
router.post(
  '/',
  validateBody(createEventSchema),
  asyncHandler(async (req, res) => {
    const result = await eventService.createEvent(req.body);

    if (result && 'error' in result && result.error === 'route_not_found') {
      res.status(422).json({ error: 'Route not found' });
      return;
    }

    res.status(201).json({ event: result });
  })
);

/**
 * GET /
 * List events with optional filters
 */
router.get(
  '/',
  validateQuery(listEventsQuerySchema),
  asyncHandler(async (req, res) => {
    const { category, start, end } = req.query;

    const filters: { category?: string; start?: Date; end?: Date } = {};

    if (category) {
      filters.category = category as string;
    }
    if (start) {
      filters.start = new Date(start as string);
    }
    if (end) {
      filters.end = new Date(end as string);
    }

    const events = await eventService.listEvents(Object.keys(filters).length > 0 ? filters : undefined);
    res.status(200).json({ events });
  })
);

/**
 * GET /:id/meetup-description
 * Generate Meetup description for an event
 */
router.get(
  '/:id/meetup-description',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    const event = await eventService.getEventById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const description = generateMeetupDescription(event as any);
    res.status(200).json({ description });
  })
);

/**
 * PATCH /:id/meetup-status
 * Toggle postedToMeetup status for an event
 */
router.patch(
  '/:id/meetup-status',
  validateBody(updateMeetupStatusSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    const result = await eventService.updateMeetupStatus(id, req.body.postedToMeetup);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
    }

    res.status(200).json({ event: result.event });
  })
);

/**
 * GET /:id
 * Get single event by id
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    const event = await eventService.getEventById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(200).json({ event });
  })
);

/**
 * PUT /:id
 * Update event with optimistic locking
 */
router.put(
  '/:id',
  validateBody(updateEventSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    // Check that at least one data field is provided beyond version
    const { version, ...dataFields } = req.body;
    if (Object.keys(dataFields).length === 0) {
      res.status(422).json({ error: 'At least one field to update is required' });
      return;
    }

    const result = await eventService.updateEvent(id, req.body);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
      if (result.error === 'conflict') {
        res.status(409).json({ error: 'Event was modified by another user. Please refresh and try again.' });
        return;
      }
    }

    res.status(200).json({ event: result.event });
  })
);

/**
 * DELETE /:id
 * Delete event
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid event ID' });
      return;
    }

    const result = await eventService.deleteEvent(id);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
    }

    res.status(204).send();
  })
);

export default router;
