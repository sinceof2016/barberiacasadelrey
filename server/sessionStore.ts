import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types';

export interface ActiveSession {
  token: string;
  userId: string;
  nombre: string;
  email: string;
  rol: string;
  puedeVerApi: boolean;
  sucursalAsignada?: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  ip: string;
}

export const activeSessionsStore = new Map<string, ActiveSession>();

export const SESSION_EXPIRY_MINUTES = 120;
export const SESSION_INACTIVITY_MINUTES = 30;

// Limpieza periódica de sesiones expiradas
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessionsStore.entries()) {
    const expiredByTotalTime = now > session.expiresAt;
    const expiredByInactivity = (now - session.lastActivityAt) > (SESSION_INACTIVITY_MINUTES * 60 * 1000);
    if (expiredByTotalTime || expiredByInactivity) {
      activeSessionsStore.delete(token);
    }
  }
}, 60 * 1000);

export function verificarAutenticacion(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      exito: false,
      mensaje: 'Acceso no autorizado. Se requiere token de sesión Bearer válido.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessionsStore.get(token);

  if (!session) {
    res.status(401).json({
      exito: false,
      mensaje: 'Sesión inválida o expirada. Por favor inicia sesión nuevamente.'
    });
    return;
  }

  const now = Date.now();
  if (now > session.expiresAt) {
    activeSessionsStore.delete(token);
    res.status(401).json({
      exito: false,
      mensaje: 'La sesión ha expirado por límite de tiempo de 120 minutos.'
    });
    return;
  }

  if ((now - session.lastActivityAt) > (SESSION_INACTIVITY_MINUTES * 60 * 1000)) {
    activeSessionsStore.delete(token);
    res.status(401).json({
      exito: false,
      mensaje: 'Sesión cerrada automáticamente por inactividad (30 minutos).'
    });
    return;
  }

  // Renovar actividad
  session.lastActivityAt = now;
  req.userSession = {
    token: session.token,
    userId: session.userId,
    nombre: session.nombre,
    email: session.email,
    rol: session.rol,
    puedeVerApi: session.puedeVerApi,
    sucursalAsignada: session.sucursalAsignada
  };

  next();
}

export function requerirRolAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.userSession || (req.userSession.rol !== 'SuperAdmin' && req.userSession.rol !== 'Administrador')) {
    res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Se requieren permisos administrativos.'
    });
    return;
  }
  next();
}

export function requerirRolSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.userSession || req.userSession.rol !== 'SuperAdmin') {
    res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Se requieren permisos de Super Administrador.'
    });
    return;
  }
  next();
}
