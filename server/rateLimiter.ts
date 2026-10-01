import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    max,
    message = 'Demasiadas solicitudes desde esta dirección IP, por favor intenta más tarde.',
    statusCode = 429,
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || '127.0.0.1'
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', record.resetAt.toString());

    if (record.count > max) {
      res.setHeader('Retry-After', resetTimeSeconds.toString());
      res.status(statusCode).json({
        exito: false,
        mensaje: message,
        retryAfter: resetTimeSeconds
      });
      return;
    }

    next();
  };
}

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Límite global de peticiones alcanzado. Por favor espera un momento.'
});

export const authEndpointRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiados intentos de autenticación. Acceso temporalmente restringido por 15 minutos.'
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: 'Has alcanzado el límite de reservas por intervalo de tiempo. Intenta nuevamente en unos minutos.'
});

export const apiTestingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Límite de ejecución de pruebas alcanzado.'
});

// Gestor de Bloqueo por Intentos Fallidos (Anti-Brute-Force)
interface LoginAttemptRecord {
  attempts: number;
  blockedUntil: number;
  lastAttempt: number;
}

const loginAttemptsStore = new Map<string, LoginAttemptRecord>();
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

export function recordFailedLogin(ip: string, email: string): { blocked: boolean; remainingAttempts: number; lockoutMinutes: number; failedAttempts: number; retryAfterSeconds: number } {
  const key = `${ip}::${email.toLowerCase()}`;
  const now = Date.now();
  const record = loginAttemptsStore.get(key) || { attempts: 0, blockedUntil: 0, lastAttempt: now };

  if (now > record.blockedUntil && record.blockedUntil > 0) {
    record.attempts = 0;
    record.blockedUntil = 0;
  }

  record.attempts++;
  record.lastAttempt = now;

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + (LOCKOUT_DURATION_MINUTES * 60 * 1000);
    loginAttemptsStore.set(key, record);
    return {
      blocked: true,
      remainingAttempts: 0,
      lockoutMinutes: LOCKOUT_DURATION_MINUTES,
      failedAttempts: record.attempts,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MINUTES * 60)
    };
  }

  loginAttemptsStore.set(key, record);
  return {
    blocked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - record.attempts,
    lockoutMinutes: LOCKOUT_DURATION_MINUTES,
    failedAttempts: record.attempts,
    retryAfterSeconds: 0
  };
}

export function checkLoginLockout(ip: string, email: string): { blocked: boolean; retryAfterSeconds: number; lockoutMinutes: number } {
  const key = `${ip}::${email.toLowerCase()}`;
  const now = Date.now();
  const record = loginAttemptsStore.get(key);

  if (record && record.blockedUntil > now) {
    const remainingMs = record.blockedUntil - now;
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
      lockoutMinutes: Math.ceil(remainingMs / (60 * 1000))
    };
  }

  return { blocked: false, retryAfterSeconds: 0, lockoutMinutes: 0 };
}

export function clearLoginLockout(ip: string, email: string): void {
  const key = `${ip}::${email.toLowerCase()}`;
  loginAttemptsStore.delete(key);
}

export function clearAllLockoutsForEmail(email: string): void {
  const clean = email.toLowerCase();
  for (const [key] of loginAttemptsStore.entries()) {
    if (key.endsWith(`::${clean}`)) {
      loginAttemptsStore.delete(key);
    }
  }
}
