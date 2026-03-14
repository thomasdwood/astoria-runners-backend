import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createHostSchema, updateHostSchema } from '../validation/hosts.js';
import * as hostsService from '../services/hostsService.js';

const router = Router();

/**
 * GET /
 * List all hosts (public — forms and event display need hosts)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const hosts = await hostsService.listHosts();
    res.status(200).json({ hosts });
  })
);

/**
 * POST /
 * Create new host (auth required)
 */
router.post(
  '/',
  requireAuth,
  validateBody(createHostSchema),
  asyncHandler(async (req, res) => {
    const host = await hostsService.createHost(req.body);
    res.status(201).json({ host });
  })
);

/**
 * PUT /:id
 * Update host (auth required)
 */
router.put(
  '/:id',
  requireAuth,
  validateBody(updateHostSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid host ID' });
      return;
    }

    const host = await hostsService.updateHost(id, req.body);

    if (!host) {
      res.status(404).json({ error: 'Host not found' });
      return;
    }

    res.status(200).json({ host });
  })
);

/**
 * DELETE /:id
 * Delete host (auth required, FK cascade sets hostId null on events)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid host ID' });
      return;
    }

    const result = await hostsService.deleteHost(id);

    if ('error' in result) {
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Host not found' });
        return;
      }
    }

    res.status(200).json({ success: true });
  })
);

export default router;
