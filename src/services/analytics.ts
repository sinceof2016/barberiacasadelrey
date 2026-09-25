/**
 * Servicio de Google Analytics 4 (GA4) - Barbería La Casa del Rey
 * 
 * Permite la medición y seguimiento de interacciones de usuario,
 * reservas de citas, selección de servicios y maestros barberos,
 * eventos de caja y visualizaciones de páginas (incluyendo 404).
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// ID de Medición GA4 (Prioriza variable de entorno o fallback oficial de la barbería)
export const GA_MEASUREMENT_ID = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
  'G-L3Z9WQK06P';

let isInitialized = false;

/**
 * Inicializa Google Analytics (gtag.js) dinámicamente si no está presente
 */
export function initGoogleAnalytics(measurementId: string = GA_MEASUREMENT_ID): void {
  if (typeof window === 'undefined') return;
  if (isInitialized && window.gtag) return;

  try {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag(...args: any[]) {
        window.dataLayer?.push(args);
      };
    }

    // Si el script gtag no está en el DOM, insertarlo
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (!existingScript && measurementId) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // Controlamos pageviews manualmente para SPA
      app_name: 'Barbería La Casa del Rey',
      anonymize_ip: true,
    });

    isInitialized = true;
  } catch (err) {
    console.warn('[Analytics] Error al inicializar Google Analytics:', err);
  }
}

/**
 * Registra una visualización de página / pestaña en la SPA
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  initGoogleAnalytics();

  try {
    const title = pageTitle || document.title || 'Barbería La Casa del Rey';
    const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: window.location.href,
        page_path: path,
        send_to: GA_MEASUREMENT_ID
      });
    }
  } catch (err) {
    console.warn('[Analytics] Error en trackPageView:', err);
  }
}

/**
 * Envía un evento personalizado a Google Analytics
 */
export function trackEvent(
  eventName: string,
  eventParams: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return;
  initGoogleAnalytics();

  try {
    if (window.gtag) {
      window.gtag('event', eventName, {
        ...eventParams,
        send_to: GA_MEASUREMENT_ID
      });
    }
  } catch (err) {
    console.warn(`[Analytics] Error al emitir evento "${eventName}":`, err);
  }
}

/**
 * Rastreo específico: Inicio de proceso de reserva
 */
export function trackBookingStart(tipo: 'individual' | 'grupal'): void {
  trackEvent('begin_checkout', {
    event_category: 'Reservas',
    event_label: `Reserva ${tipo}`,
    booking_type: tipo
  });
}

/**
 * Rastreo específico: Reserva creada exitosamente
 */
export function trackBookingComplete(cita: {
  idReserva: string;
  servicioNombre?: string;
  precio?: number;
  barberoNombre?: string;
  sucursalNombre?: string;
  tipo?: string;
}): void {
  trackEvent('purchase', {
    transaction_id: cita.idReserva,
    value: cita.precio || 0,
    currency: 'COP',
    items: [
      {
        item_id: cita.idReserva,
        item_name: cita.servicioNombre || 'Servicio de Barbería',
        item_category: 'Barbería',
        item_variant: cita.sucursalNombre,
        price: cita.precio || 0,
        quantity: 1
      }
    ],
    barber_name: cita.barberoNombre,
    branch_name: cita.sucursalNombre,
    booking_type: cita.tipo
  });
}

/**
 * Rastreo específico: Selección de servicio del catálogo
 */
export function trackServiceSelect(servicio: { id: number; nombre: string; precio: number }): void {
  trackEvent('select_item', {
    item_list_name: 'Catálogo de Servicios',
    items: [
      {
        item_id: String(servicio.id),
        item_name: servicio.nombre,
        price: servicio.precio,
        item_category: 'Servicio'
      }
    ]
  });
}

/**
 * Rastreo específico: Selección de Barbero
 */
export function trackBarberSelect(barbero: { id: number; nombre: string; especialidad: string }): void {
  trackEvent('select_content', {
    content_type: 'barbero',
    item_id: String(barbero.id),
    barber_name: barbero.nombre,
    specialty: barbero.especialidad
  });
}

/**
 * Rastreo específico: Error 404 (Página no encontrada)
 */
export function track404Error(rutaIntentada: string): void {
  trackEvent('404_not_found', {
    event_category: 'Errores',
    event_label: `Ruta 404: ${rutaIntentada}`,
    attempted_path: rutaIntentada,
    page_location: typeof window !== 'undefined' ? window.location.href : rutaIntentada
  });
}

/**
 * Rastreo específico: Inicio de sesión exitoso
 */
export function trackLogin(rol: string, usuarioNombre: string): void {
  trackEvent('login', {
    method: 'credenciales_internas',
    user_role: rol,
    user_name: usuarioNombre
  });
}
