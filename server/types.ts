import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userSession?: {
    token: string;
    userId: string;
    nombre: string;
    email: string;
    rol: string;
    puedeVerApi: boolean;
    sucursalAsignada?: string;
  };
}

export interface LogEntry {
  timestamp: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warn' | 'error';
}
