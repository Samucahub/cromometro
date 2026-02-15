import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitMiddleware } from './rate-limit.middleware';

export class AuthRateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    // Aplicar limiters específicos aos endpoints de auth
    if (path === '/auth/register') {
      return RateLimitMiddleware.registerLimiter(req, res, next);
    }
    if (path === '/auth/login') {
      return RateLimitMiddleware.loginLimiter(req, res, next);
    }
    if (path === '/auth/verify-email') {
      return RateLimitMiddleware.verifyEmailLimiter(req, res, next);
    }
    if (path === '/auth/resend-code') {
      return RateLimitMiddleware.resendCodeLimiter(req, res, next);
    }
    if (path === '/auth/google' || path === '/auth/github') {
      return RateLimitMiddleware.oauthLimiter(req, res, next);
    }

    // Para outros endpoints, continuar
    next();
  }
}
