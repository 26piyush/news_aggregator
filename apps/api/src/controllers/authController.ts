import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRegisterSchema, AuthLoginSchema, GuestLoginSchema } from '../schemas/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, verifyPassword, signToken } from '../utils/authUtils.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = AuthRegisterSchema.parse(req.body);

      // Check if user already exists
      const existing = await userRepository.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      // Hash password and store user
      const passwordHash = hashPassword(password);
      const user = await userRepository.createUser({
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role: 'user',
      });

      // Generate JWT session token
      const token = signToken({
        sub: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
      });

      res.status(201).json({
        message: 'Account created successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = AuthLoginSchema.parse(req.body);

      const user = await userRepository.findUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = signToken({
        sub: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
      });

      res.json({
        message: 'Logged in successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  async guest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = GuestLoginSchema.safeParse(req.body);
      const existingId = parsed.success ? parsed.data.guestId : undefined;
      const guestId = existingId && existingId.startsWith('guest-')
        ? existingId
        : `guest-${crypto.randomBytes(6).toString('hex')}`;

      res.json({
        message: 'Guest session active.',
        user: {
          id: guestId,
          email: `${guestId}@guest.local`,
          name: 'Guest Reader',
          role: 'guest',
        },
        guestId,
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }

      res.json({
        user: req.user,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
