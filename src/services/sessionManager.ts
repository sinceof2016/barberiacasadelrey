/**
 * Gestor de Expiración de Sesión y Control de Inactividad
 * Barbería La Casa del Rey
 *
 * Enforces session timeouts:
 * 1. Expiración absoluta de sesión: 120 minutos (2 horas)
 * 2. Expiración por inactividad del usuario: 30 minutos sin interacción
 * 3. Notificación y cierre seguro de sesión automático
 */

import { Usuario } from '../types';

export const SESSION_CONFIG = {
  STORAGE_KEY: 'casa_del_rey_session_v1',
  USER_STORAGE_KEY: 'casa_del_rey_usuario',
  DEFAULT_EXPIRY_MINUTES: 120, // 2 horas de duración máxima de token
  DEFAULT_INACTIVITY_MINUTES: 30, // 30 minutos sin actividad
  CHECK_INTERVAL_MS: 15000, // Comprobación periódica cada 15s
};

export interface ActiveSessionData {
  token: string;
  usuario: Usuario;
  loginTime: number;
  expiresAt: number;
  lastActivity: number;
  maxInactiveMs: number;
}

type SessionExpireCallback = (reason: 'timeout' | 'inactivity' | 'revoked') => void;
const expireListeners: Set<SessionExpireCallback> = new Set();
let watcherTimer: any = null;
let activityListenersAttached = false;

/**
 * Guarda e inicializa una nueva sesión segura con expiración programada
 */
export function initUserSession(
  usuario: Usuario,
  token?: string,
  expiryMinutes: number = SESSION_CONFIG.DEFAULT_EXPIRY_MINUTES,
  inactivityMinutes: number = SESSION_CONFIG.DEFAULT_INACTIVITY_MINUTES
): ActiveSessionData {
  const now = Date.now();
  const sessionToken = token || `sess_cdr_${Math.random().toString(36).substring(2)}_${now}`;
  const expiresAt = now + expiryMinutes * 60 * 1000;
  const maxInactiveMs = inactivityMinutes * 60 * 1000;

  const sessionData: ActiveSessionData = {
    token: sessionToken,
    usuario: {
      ...usuario,
      token: sessionToken,
      tokenExpiresAt: expiresAt,
    },
    loginTime: now,
    expiresAt,
    lastActivity: now,
    maxInactiveMs,
  };

  try {
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(SESSION_CONFIG.USER_STORAGE_KEY, JSON.stringify(sessionData.usuario));
    sessionStorage.removeItem('cdr_manual_logout');
  } catch (err) {
    console.error('Error al guardar sesión activa:', err);
  }

  attachActivityListeners();
  return sessionData;
}

/**
 * Obtiene los datos de la sesión activa en el cliente
 */
export function getActiveSession(): ActiveSessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Comprueba el estado y validez de la sesión actual
 */
export function checkSessionStatus(): {
  isValid: boolean;
  reason?: 'timeout' | 'inactivity' | 'no_session';
  remainingMinutes: number;
  session: ActiveSessionData | null;
} {
  const session = getActiveSession();
  if (!session) {
    return { isValid: false, reason: 'no_session', remainingMinutes: 0, session: null };
  }

  const now = Date.now();

  // 1. Expiración absoluta de sesión (120 min)
  if (now >= session.expiresAt) {
    return { isValid: false, reason: 'timeout', remainingMinutes: 0, session };
  }

  // 2. Expiración por inactividad (30 min)
  const idleTime = now - session.lastActivity;
  if (idleTime >= session.maxInactiveMs) {
    return { isValid: false, reason: 'inactivity', remainingMinutes: 0, session };
  }

  const remainingMs = Math.min(session.expiresAt - now, session.maxInactiveMs - idleTime);
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

  return { isValid: true, remainingMinutes, session };
}

/**
 * Actualiza la marca de tiempo de la última interacción del usuario
 */
let lastThrottledRecord = 0;
export function recordUserActivity(): void {
  const now = Date.now();
  // Limitar escritura a localStorage a una vez cada 30 segundos
  if (now - lastThrottledRecord < 30000) return;
  lastThrottledRecord = now;

  const session = getActiveSession();
  if (!session) return;

  // Si la sesión ya superó el tiempo máximo de inactividad o expiró el token, terminarla en vez de revivirla
  const idleTime = now - session.lastActivity;
  if (idleTime >= session.maxInactiveMs || now >= session.expiresAt) {
    terminateSession('inactivity');
    return;
  }

  session.lastActivity = now;
  try {
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignorar errores en almacenamiento
  }
}

export type TerminateSessionReason = 'timeout' | 'inactivity' | 'revoked' | 'manual' | 'no_session';

/**
 * Cierra la sesión activa y notifica a los suscriptores
 */
export function terminateSession(reason: TerminateSessionReason = 'manual'): void {
  try {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.USER_STORAGE_KEY);
    sessionStorage.setItem('cdr_manual_logout', 'true');
  } catch {
    // Ignorar errores
  }

  if (reason !== 'manual' && reason !== 'no_session') {
    expireListeners.forEach(listener => {
      try {
        listener(reason);
      } catch (e) {
        console.error('Error in session expire listener:', e);
      }
    });
  }
}

/**
 * Suscribe un callback para cuando la sesión expire
 */
export function onSessionExpired(callback: SessionExpireCallback): () => void {
  expireListeners.add(callback);
  return () => {
    expireListeners.delete(callback);
  };
}

/**
 * Inicia el observador periódico de expiración de sesión
 */
export function startSessionWatcher(onExpire: SessionExpireCallback): () => void {
  const unsubscribe = onSessionExpired(onExpire);

  if (!watcherTimer) {
    watcherTimer = setInterval(() => {
      const status = checkSessionStatus();
      const session = getActiveSession();
      if (session && !status.isValid && status.reason) {
        terminateSession(status.reason);
      }
    }, SESSION_CONFIG.CHECK_INTERVAL_MS);
  }

  attachActivityListeners();

  return () => {
    unsubscribe();
    if (expireListeners.size === 0 && watcherTimer) {
      clearInterval(watcherTimer);
      watcherTimer = null;
    }
  };
}

/**
 * Registra listeners de actividad de usuario en el documento
 */
function attachActivityListeners(): void {
  if (activityListenersAttached || typeof window === 'undefined') return;
  activityListenersAttached = true;

  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  events.forEach(evt => {
    window.addEventListener(evt, () => recordUserActivity(), { passive: true });
  });
}
