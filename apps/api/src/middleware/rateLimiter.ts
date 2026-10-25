import { Request, Response, NextFunction } from 'express';

const clientRequests = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const client = clientRequests.get(ip);
    if (!client || now > client.resetAt) {
      clientRequests.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    client.count++;
    if (client.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down and try again shortly.',
      });
      return;
    }

    next();
  };
}
