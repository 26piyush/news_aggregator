import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/authUtils.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;

  // 1. Check for Bearer token (Signed User Session)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Try verifying our signed JWT
    const verified = verifyToken(token);
    if (verified) {
      req.user = {
        id: verified.sub,
        email: verified.email,
        name: verified.name,
        role: verified.role || 'user',
      };
      return next();
    }

    // Fallback: If external Supabase JWT
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.sub) {
          req.user = {
            id: payload.sub,
            email: payload.email || `${payload.sub}@supabase.user`,
            name: payload.user_metadata?.name || payload.email?.split('@')[0],
            role: payload.role || 'user',
          };
          return next();
        }
      }
    } catch {
      // Fall through to guest
    }
  }

  // 2. Check for custom user ID header (guest / client session tracking)
  if (customUserId) {
    req.user = {
      id: customUserId,
      email: `${customUserId}@guest.local`,
      name: 'Guest Reader',
      role: 'guest',
    };
    return next();
  }

  // 3. Transparent default guest session fallback
  req.user = {
    id: 'guest-user-default',
    email: 'guest@newsaggregator.local',
    name: 'Guest Reader',
    role: 'guest',
  };
  next();
}
