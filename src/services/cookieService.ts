/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Gestión y Aplicación de Cookies
 * Barbería La Casa del Rey
 * Cumplimiento con Ley 1581 de 2012 (Habeas Data Colombia), RGPD y directrices de privacidad web.
 */

export type CookieCategory = 'necesarias' | 'funcionales' | 'analiticas' | 'marketing';

export interface CookieConsent {
  necesarias: boolean;
  funcionales: boolean;
  analiticas: boolean;
  marketing: boolean;
  version: string;
  fechaDecision: string;
}

export interface DetalleCookie {
  nombre: string;
  categoria: CookieCategory;
  proposito: string;
  duracion: string;
  tipo: 'Propia' | 'Terceros';
}

export const CATALOGO_COOKIES: DetalleCookie[] = [
  {
    nombre: 'cdr_consent',
    categoria: 'necesarias',
    proposito: 'Registra tus preferencias de consentimiento de cookies y políticas de privacidad.',
    duracion: '12 meses',
    tipo: 'Propia'
  },
  {
    nombre: 'casa_del_rey_usuario',
    categoria: 'necesarias',
    proposito: 'Mantiene la sesión autenticada de administradores, barberos y cajeros del salón.',
    duracion: 'Sesión / 30 días',
    tipo: 'Propia'
  },
  {
    nombre: 'cdr_cliente_rec',
    categoria: 'funcionales',
    proposito: 'Recuerda el nombre, teléfono y correo del caballero para agendamiento express en próximas reservas.',
    duracion: '6 meses',
    tipo: 'Propia'
  },
  {
    nombre: 'cdr_sede_fav',
    categoria: 'funcionales',
    proposito: 'Guarda la sede habitual seleccionada (Chicó Real, Cedritos o Usaquén).',
    duracion: '6 meses',
    tipo: 'Propia'
  },
  {
    nombre: 'cdr_analytics_data',
    categoria: 'analiticas',
    proposito: 'Registra de manera totalmente anónima las visitas a servicios y horarios más demandados.',
    duracion: '3 meses',
    tipo: 'Propia'
  },
  {
    nombre: 'cdr_promo_banner',
    categoria: 'marketing',
    proposito: 'Controla la frecuencia de visualización de promociones de cortesía y membresías de salón.',
    duracion: '1 mes',
    tipo: 'Propia'
  }
];

const COOKIE_CONSENT_KEY = 'casa_del_rey_cookie_consent';
const COOKIE_CONSENT_COOKIE = 'cdr_consent';
const COOKIE_VERSION = '2026.1';

/**
 * Establece una cookie en el navegador con atributos de seguridad
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieString;
  } catch (e) {
    console.warn('[CookieService] Error al escribir cookie:', e);
  }
}

/**
 * Lee una cookie por su nombre
 */
export function getCookie(name: string): string | null {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Elimina una cookie
 */
export function deleteCookie(name: string): void {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('[CookieService] Error al eliminar cookie:', e);
  }
}

/**
 * Obtiene el estado de consentimiento guardado
 */
export function obtenerConsentimientoCookies(): CookieConsent | null {
  try {
    // 1. Intentar desde cookie
    const cookieVal = getCookie(COOKIE_CONSENT_COOKIE);
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      if (parsed && typeof parsed.necesarias === 'boolean') {
        return parsed as CookieConsent;
      }
    }

    // 2. Fallback a localStorage
    const localVal = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (localVal) {
      const parsed = JSON.parse(localVal);
      if (parsed && typeof parsed.necesarias === 'boolean') {
        return parsed as CookieConsent;
      }
    }
  } catch (e) {
    console.error('[CookieService] Error al parsear consentimiento:', e);
  }
  return null;
}

/**
 * Aplica las políticas de cookies según las preferencias del usuario:
 * Si una categoría está deshabilitada, purga los datos y cookies asociados.
 */
export function aplicarPoliticaCookies(consent: CookieConsent): void {
  // Cookies Funcionales
  if (!consent.funcionales) {
    deleteCookie('cdr_cliente_rec');
    deleteCookie('cdr_sede_fav');
    localStorage.removeItem('casa_del_rey_cliente_recordado');
    localStorage.removeItem('casa_del_rey_sede_preferida');
  }

  // Cookies Analíticas
  if (!consent.analiticas) {
    deleteCookie('cdr_analytics_data');
    localStorage.removeItem('casa_del_rey_analytics');
  }

  // Cookies de Marketing
  if (!consent.marketing) {
    deleteCookie('cdr_promo_banner');
    localStorage.removeItem('casa_del_rey_marketing');
  }
}

/**
 * Guarda las preferencias de consentimiento y dispara el evento de sincronización
 */
export function guardarConsentimientoCookies(opciones: {
  funcionales: boolean;
  analiticas: boolean;
  marketing: boolean;
}): CookieConsent {
  const consent: CookieConsent = {
    necesarias: true, // Las necesarias siempre se mantienen
    funcionales: Boolean(opciones.funcionales),
    analiticas: Boolean(opciones.analiticas),
    marketing: Boolean(opciones.marketing),
    version: COOKIE_VERSION,
    fechaDecision: new Date().toISOString()
  };

  try {
    const jsonStr = JSON.stringify(consent);
    setCookie(COOKIE_CONSENT_COOKIE, jsonStr, 365);
    localStorage.setItem(COOKIE_CONSENT_KEY, jsonStr);
  } catch (e) {
    console.warn('[CookieService] Error persistiendo consentimiento:', e);
  }

  // Aplicar inmediatamente la purga o habilitación
  aplicarPoliticaCookies(consent);

  // Notificar a componentes en tiempo real
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cdr_cookie_consent_changed', { detail: consent }));
  }

  return consent;
}

/**
 * Acepta todas las categorías
 */
export function aceptarTodasLasCookies(): CookieConsent {
  return guardarConsentimientoCookies({
    funcionales: true,
    analiticas: true,
    marketing: true
  });
}

/**
 * Acepta únicamente las esenciales
 */
export function aceptarSoloNecesarias(): CookieConsent {
  return guardarConsentimientoCookies({
    funcionales: false,
    analiticas: false,
    marketing: false
  });
}

/**
 * Comprueba si una categoría específica cuenta con aprobación
 */
export function tieneConsentimiento(categoria: CookieCategory): boolean {
  if (categoria === 'necesarias') return true;
  const consent = obtenerConsentimientoCookies();
  if (!consent) return false;
  return Boolean(consent[categoria]);
}

/**
 * APLICACIÓN DE COOKIE FUNCIONAL:
 * Guarda los datos de contacto y sede habitual para autocompletar reservas
 */
export function guardarDatosClienteRecurrente(datos: {
  nombre?: string;
  telefono?: string;
  email?: string;
  sucursalId?: string;
}): void {
  if (!tieneConsentimiento('funcionales')) {
    return; // No se almacena si el cliente no dio consentimiento
  }

  try {
    const payload = JSON.stringify({
      nombre: datos.nombre || '',
      telefono: datos.telefono || '',
      email: datos.email || '',
      sucursalId: datos.sucursalId || 'suc-chico',
      actualizadoEn: new Date().toISOString()
    });

    setCookie('cdr_cliente_rec', payload, 180);
    localStorage.setItem('casa_del_rey_cliente_recordado', payload);
  } catch (e) {
    console.warn('[CookieService] Error guardando cliente recurrente:', e);
  }
}

/**
 * APLICACIÓN DE COOKIE FUNCIONAL:
 * Recupera los datos de contacto del cliente recurrente si las cookies funcionales están activas
 */
export function obtenerDatosClienteRecurrente(): {
  nombre?: string;
  telefono?: string;
  email?: string;
  sucursalId?: string;
} | null {
  if (!tieneConsentimiento('funcionales')) {
    return null;
  }

  try {
    const cookieVal = getCookie('cdr_cliente_rec');
    if (cookieVal) {
      return JSON.parse(cookieVal);
    }
    const localVal = localStorage.getItem('casa_del_rey_cliente_recordado');
    if (localVal) {
      return JSON.parse(localVal);
    }
  } catch (e) {
    console.error('[CookieService] Error leyendo cliente recurrente:', e);
  }
  return null;
}

/**
 * APLICACIÓN DE COOKIE ANALÍTICA:
 * Registra eventos de navegación anónimos (ej: catálogo visitado, reserva iniciada)
 */
export function registrarEventoAnalitica(evento: string, detalles?: Record<string, any>): void {
  if (!tieneConsentimiento('analiticas')) {
    return; // No se almacena analítica si no hay consentimiento
  }

  try {
    const localKey = 'casa_del_rey_analytics';
    const registros: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    registros.push({
      evento,
      detalles: detalles || {},
      ts: new Date().toISOString()
    });

    // Mantener sólo los últimos 50 eventos locales
    const truncados = registros.slice(-50);
    localStorage.setItem(localKey, JSON.stringify(truncados));

    // Contador anónimo en cookie de sesión
    const cookiePrev = Number(getCookie('cdr_analytics_data') || '0');
    setCookie('cdr_analytics_data', String(cookiePrev + 1), 90);
  } catch (e) {
    console.warn('[CookieService] Error registrando analítica:', e);
  }
}
