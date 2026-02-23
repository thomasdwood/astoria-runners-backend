import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  findUserByEmail,
  verifyPassword,
  validatePassword,
} from '../services/authService.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user and create session
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required',
      });
      return;
    }

    // Find user by email
    const user = await findUserByEmail(email);

    // Return generic error if user not found (don't reveal if email exists)
    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(user.passwordHash, password);

    // Return same generic error for invalid password
    if (!isValid) {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.displayName = user.displayName;

    // Ensure session is persisted to Redis before responding
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  })
);

/**
 * POST /auth/logout
 * Destroy session (global logout)
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        res.status(500).json({
          error: 'Failed to log out',
        });
        return;
      }

      // Clear cookie
      res.clearCookie('sid');

      res.status(200).json({
        success: true,
      });
    });
  })
);

/**
 * GET /auth/me
 * Get current user from session
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      res.status(401).json({
        error: 'Not authenticated',
      });
      return;
    }

    res.status(200).json({
      user: {
        id: req.session.userId,
        email: req.session.email,
        displayName: req.session.displayName,
      },
    });
  })
);

export default router;
