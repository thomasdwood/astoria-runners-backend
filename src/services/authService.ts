import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema/users.js';

/**
 * Hash password using Argon2
 * Configuration follows OWASP recommendations
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify password against Argon2 hash
 */
export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch (err) {
    // Invalid hash format or verification error
    return false;
  }
}

/**
 * Validate password strength
 * Per NIST recommendations: minimum 8 characters, no complexity requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters',
    };
  }

  return { valid: true };
}

/**
 * Find user by email address
 */
export async function findUserByEmail(email: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return results[0] || null;
}
