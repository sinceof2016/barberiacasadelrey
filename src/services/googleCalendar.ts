import { Cita, GoogleCalendarEventItem } from '../types';
import { getAccessToken } from './firebaseAuth';

const pad = (n: number) => n.toString().padStart(2, '0');

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  location: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
  extendedProperties?: {
    private: Record<string, string>;
  };
}

/**
 * Prepares the RFC3339 formatted event payload for an appointment in Colombia Time (UTC-5)
 */
export function buildGoogleCalendarEventPayload(
  cita: Cita,
  servicioNombre?: string,
  barberoNombre?: string,
  duracionMinutos: number = 45
): GoogleCalendarEventPayload {
  const [yearStr, monthStr, dayStr] = (cita.fecha || '').split('-');
  const [hourStr, minStr] = (cita.hora || '10:00').split(':');

  const year = Number(yearStr) || new Date().getFullYear();
  const month = Number(monthStr) || (new Date().getMonth() + 1);
  const day = Number(dayStr) || new Date().getDate();
  const hour = Number(hourStr) || 10;
  const minute = Number(minStr) || 0;

  const duration = cita.tipo === 'Grupal' ? 60 : (duracionMinutos || 45);

  // Compute end time minutes
  const totalStartMinutes = hour * 60 + minute;
  const totalEndMinutes = totalStartMinutes + duration;
  const endHour = Math.floor(totalEndMinutes / 60);
  const endMinute = totalEndMinutes % 60;

  // RFC3339 formatted strings with Colombia -05:00 offset
  const startDateTime = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-05:00`;
  const endDateTime = `${year}-${pad(month)}-${pad(day)}T${pad(endHour)}:${pad(endMinute)}:00-05:00`;

  const location = 'Barbería La Casa del Rey - Cra. 15 # 85-32, Zona Rosa, Bogotá, Colombia';

  const summary = cita.tipo === 'Grupal'
    ? `Reserva Grupal (${cita.totalPersonas || cita.detalles?.length || 2} personas) - Barbería La Casa del Rey [${cita.idReserva}]`
    : `${servicioNombre || 'Corte Real'} - Barbería La Casa del Rey [${cita.idReserva}]`;

  const emailContacto = cita.clienteEmail || cita.responsableEmail;

  const description = [
    `👑 CITA CONFIRMADA EN BARBERÍA LA CASA DEL REY`,
    `Código de Reserva: ${cita.idReserva}`,
    `Modalidad: ${cita.tipo}`,
    cita.clienteNombre ? `Cliente: ${cita.clienteNombre}` : `Responsable: ${cita.responsableNombre}`,
    `Teléfono de contacto: ${cita.clienteTelefono || cita.responsableTelefono || 'No especificado'}`,
    emailContacto ? `Correo electrónico: ${emailContacto}` : null,
    servicioNombre ? `Servicio contratado: ${servicioNombre}` : null,
    barberoNombre ? `Maestro Barbero: ${barberoNombre}` : null,
    cita.detalles && cita.detalles.length > 0 
      ? `Integrantes del grupo: ${cita.detalles.map(d => d.nombre).join(', ')}` 
      : null,
    ``,
    `📍 Ubicación: Cra. 15 # 85-32, Zona Rosa, Bogotá, Colombia`,
    `⏱ Por favor presentarse 5 minutos antes para brindarle una experiencia clásica con toalla caliente y café de cortesía.`,
    `📞 Dudas o cambios: +57 (300) 123-4567`
  ].filter(Boolean).join('\n');

  const payload: GoogleCalendarEventPayload = {
    summary,
    description,
    location,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Bogota',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Bogota',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },   // 1 hour before
      ],
    },
    extendedProperties: {
      private: {
        barberiaApp: 'CasaDelRey',
        idReserva: cita.idReserva,
        tipo: cita.tipo,
        ...(emailContacto ? { clienteEmail: emailContacto } : {})
      }
    }
  };

  if (emailContacto && emailContacto.includes('@')) {
    (payload as any).attendees = [{ email: emailContacto.trim() }];
  }

  return payload;
}

/**
 * Creates an event on the user's primary Google Calendar using the Google Calendar API v3
 */
export async function createGoogleCalendarEvent(
  cita: Cita,
  servicioNombre?: string,
  barberoNombre?: string,
  duracionMinutos: number = 45
): Promise<GoogleCalendarEventItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay una sesión activa de Google Calendar. Por favor inicia sesión con Google.');
  }

  const payload = buildGoogleCalendarEventPayload(cita, servicioNombre, barberoNombre, duracionMinutos);

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error ${response.status}: No se pudo crear el evento en Google Calendar.`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    id: data.id,
    summary: data.summary,
    description: data.description,
    location: data.location,
    start: data.start,
    end: data.end,
    htmlLink: data.htmlLink,
    status: data.status,
  };
}

/**
 * Lists events from the primary calendar, optionally filtering for Casa del Rey events
 */
export async function listGoogleCalendarEvents(
  timeMin?: string,
  maxResults: number = 25
): Promise<GoogleCalendarEventItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay una sesión activa de Google Calendar.');
  }

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', String(maxResults));
  
  if (timeMin) {
    url.searchParams.set('timeMin', timeMin);
  } else {
    // Default to start of today
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    url.searchParams.set('timeMin', now.toISOString());
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Error al consultar eventos de Google Calendar.');
  }

  const data = await response.json();
  const items: any[] = data.items || [];

  return items.map(item => ({
    id: item.id,
    summary: item.summary || 'Sin título',
    description: item.description,
    location: item.location,
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink,
    status: item.status,
  }));
}

/**
 * Deletes an event from Google Calendar (MUST be preceded by explicit confirmation)
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay una sesión activa de Google Calendar.');
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Error al eliminar el evento de Google Calendar.');
  }
}
