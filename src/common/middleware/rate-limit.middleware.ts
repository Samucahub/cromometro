import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware para proteger contra brute force
 * e abuso de API
 */
export class RateLimitMiddleware {
  /**
   * Limiter geral: 100 requests por 15 minutos por IP
   */
  public static globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Demasiadas requisições, tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Limiter para login: 5 tentativas por 15 minutos
   */
  public static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    message: 'Demasiadas tentativas de login, tente novamente em 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Limiter para registro: 3 tentativas por 1 hora
   */
  public static registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: 'Demasiadas tentativas de registo, tente novamente em 1 hora',
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Limiter para verificação de email: 10 tentativas por 15 minutos
   * (permitir mais porque o utilizador pode enganar-se no código)
   */
  public static verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: 'Demasiadas tentativas de verificação, tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Limiter para reenvio de código: 3 tentativas por 1 hora
   */
  public static resendCodeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: 'Demasiados reenvios de código, tente novamente em 1 hora',
    standardHeaders: true,
    legacyHeaders: false,
  });

  /**
   * Limiter para OAuth: 10 tentativas por 1 hora
   */
  public static oauthLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: 'Demasiadas tentativas de OAuth, tente novamente em 1 hora',
    standardHeaders: true,
    legacyHeaders: false,
  });
}
