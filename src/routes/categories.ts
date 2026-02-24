import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validation/categories.js';
import * as categoryService from '../services/categoryService.js';

const router = Router();

/**
 * GET /
 * List all categories (public — calendar and forms need categories)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await categoryService.listCategories();
    res.status(200).json({ categories });
  })
);

/**
 * POST /
 * Create new category (auth required)
 */
router.post(
  '/',
  requireAuth,
  validateBody(createCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ category });
  })
);

/**
 * PUT /:id
 * Update category (auth required)
 */
router.put(
  '/:id',
  requireAuth,
  validateBody(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const category = await categoryService.updateCategory(id, req.body);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(200).json({ category });
  })
);

/**
 * DELETE /:id
 * Delete category (auth required, protected if in use)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const result = await categoryService.deleteCategory(id);

    if ('error' in result) {
      if (result.error === 'in_use') {
        res.status(409).json({
          error: 'Cannot delete category',
          routeCount: result.routeCount,
        });
        return;
      }
      if (result.error === 'not_found') {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
    }

    res.status(200).json({ success: true });
  })
);

export default router;
