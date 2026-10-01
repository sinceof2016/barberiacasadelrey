import { Request, Response, NextFunction } from 'express';

const RAW_CORS_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS !== 'false';
const CORS_MAX_AGE = parseInt(process.env.CORS_MAX_AGE || '86400', 10);

const defaultAllowedOriginPatterns: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/.*\.run\.app$/,
  /^https?:\/\/.*\.ai\.studio$/,
  /^https?:\/\/.*\.google\.com$/,
  /^https?:\/\/.*\.web\.app$/,
  /^https?:\/\/.*\.firebaseapp\.com$/
];

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (RAW_CORS_ORIGINS.includes('*')) return true;
  if (RAW_CORS_ORIGINS.includes(origin)) return true;
  for (const pattern of defaultAllowedOriginPatterns) {
    if (pattern.test(origin)) return true;
  }
  for (const configured of RAW_CORS_ORIGINS) {
    if (configured.startsWith('*.')) {
      const baseDomain = configured.slice(2);
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith(baseDomain) || url.hostname === baseDomain) {
          return true;
        }
      } catch {
        // url inválida
      }
    }
  }
  return false;
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (CORS_CREDENTIALS) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ' +
    'X-Api-Key, X-Client-Version, X-Device-Id, X-Signature, X-Branch-Id, ' +
    'If-None-Match, Cache-Control, Pragma'
  );
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Type, ETag, Date, X-Response-Time, ' +
    'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After'
  );
  res.setHeader('Access-Control-Max-Age', CORS_MAX_AGE.toString());

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}
