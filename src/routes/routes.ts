import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createRouteSchema, updateRouteSchema, listRoutesQuerySchema } from '../validation/routes.js';
import * as routeService from '../services/routeService.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /
 * Create new route
 */
router.post(
  '/',
  validateBody(createRouteSchema),
  asyncHandler(async (req, res) => {
    const result = await routeService.createRoute(req.body);

    if ('error' in result) {
      if (result.error === 'category_not_found') {
        res.status(422).json({ error: 'Category not found' });
        return;
      }
    }

    res.status(201).json({ route: result });
  })
);

/**
 * GET /
 * List all routes (optionally filtered by categoryId)
 */
router.get(
  '/',
  validateQuery(listRoutesQuerySchema),
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    const routes = await routeService.listRoutes(
      categoryId !== undefined ? { categoryId: Number(categoryId) } : undefined
    );
    res.status(200).json({ routes });
  })
);

/**
 * GET /:id
 * Get single route by id
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    const route = await routeService.getRouteById(id);
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.status(200).json({ route });
  })
);

/**
 * PUT /:id
 * Update route with optimistic locking
 */
router.put(
  '/:id',
  validateBody(updateRouteSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    // Check that at least one data field is provided beyond version
    const { version, ...dataFields } = req.body;
    if (Object.keys(dataFields).length === 0) {
      res.status(422).json({ error: 'At least one field to update is required' });
      return;
    }

    const result = await routeService.updateRoute(id, req.body);

    if ('error' in result) {
      if (result.error === 'category_not_found') {
        res.status(422).json({ error: 'Category not found' });
        return;
      }
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Route not found' });
        return;
      }
      if (result.error === 'conflict') {
        res.status(409).json({ error: 'Route was modified by another user. Please refresh and try again.' });
        return;
      }
    }

    res.status(200).json({ route: result.route });
  })
);

/**
 * DELETE /:id
 * Delete route
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    const result = await routeService.deleteRoute(id);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Route not found' });
        return;
      }
    }

    res.status(204).send();
  })
);

export default router;
