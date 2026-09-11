import React, { useState } from 'react';
import { Cita } from '../types';
import { CalendarPlus, Download, Check, ExternalLink, BellRing, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { createGoogleCalendarEvent, buildGoogleCalendarEventPayload } from '../services/googleCalendar';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { CalendarConfirmDialog } from './CalendarConfirmDialog';

interface AddToCalendarButtonsProps {
  cita: Cita;
  servicioNombre?: string;
  barberoNombre?: string;
  duracionMinutos?: number;
  className?: string;
  onSyncSuccess?: (eventId: string, htmlLink?: string) => void;
}

export interface CalendarEventDetails {
  cita: Cita;
  servicioNombre?: string;
  barberoNombre?: string;
  duracionMinutos?: number;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export function getCalendarEventParams({
  cita,
  servicioNombre,
  barberoNombre,
  duracionMinutos = 45,
}: CalendarEventDetails) {
  const [yearStr, monthStr, dayStr] = (cita.fecha || '').split('-');
  const [hourStr, minStr] = (cita.hora || '10:00').split(':');

  const year = Number(yearStr) || new Date().getFullYear();
  const month = Number(monthStr) || (new Date().getMonth() + 1);
  const day = Number(dayStr) || new Date().getDate();
  const hour = Number(hourStr) || 10;
  const minute = Number(minStr) || 0;

  const startDate = new Date(year, month - 1, day, hour, minute, 0);
  const duration = cita.tipo === 'Grupal' ? 60 : (duracionMinutos || 45);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const startFormatted = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endHour = endDate.getHours();
  const endMinute = endDate.getMinutes();
  const endFormatted = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endHour)}${pad(endMinute)}00`;

  const location = cita.sucursalNombre 
    ? `Barbería La Casa del Rey - ${cita.sucursalNombre}, Bogotá, Colombia`
    : 'Barbería La Casa del Rey - Cra. 15 # 85-32, Zona Rosa, Bogotá, Colombia';
  
  const title = cita.tipo === 'Grupal'
    ? `Reserva Grupal (${cita.totalPersonas || 2} personas) - Barbería La Casa del Rey [${cita.idReserva}]`
    : `${servicioNombre || 'Corte Real'} - Barbería La Casa del Rey [${cita.idReserva}]`;

  const description = [
    `Cita confirmada en Barbería La Casa del Rey`,
    `Código de Reserva: ${cita.idReserva}`,
    `Tipo: ${cita.tipo}`,
    cita.sucursalNombre ? `Sede: ${cita.sucursalNombre}` : null,
    cita.clienteNombre ? `Cliente: ${cita.clienteNombre}` : `Responsable: ${cita.responsableNombre}`,
    `Teléfono: ${cita.clienteTelefono || cita.responsableTelefono}`,
    servicioNombre ? `Servicio: ${servicioNombre}` : null,
    barberoNombre ? `Barbero asignado: ${barberoNombre}` : null,
    cita.detalles ? `Integrantes: ${cita.detalles.map(d => d.nombre).join(', ')}` : null,
    ``,
    `Ubicación: ${location}`,
    `Por favor presentarse 5 minutos antes de la hora fijada.`,
    `Para reprogramar o cancelar, comunícate al +57 (300) 123-4567.`
  ].filter(Boolean).join('\n');

  return {
    title,
    description,
    location,
    startFormatted,
    endFormatted,
  };
}

export function getGoogleCalendarUrl(params: CalendarEventDetails): string {
  const { title, description, location, startFormatted, endFormatted } = getCalendarEventParams(params);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startFormatted}/${endFormatted}&ctz=America/Bogota&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;
}

export function downloadAppleCalendarIcs(params: CalendarEventDetails): void {
  const { title, description, location, startFormatted, endFormatted } = getCalendarEventParams(params);
  const nowFormatted = new Date().toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barberia Casa del Rey//Citas Booking//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${params.cita.idReserva}-${Date.now()}@barberiacasadelrey.com`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de Turno - Barbería La Casa del Rey',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Cita_${params.cita.idReserva}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const AddToCalendarButtons: React.FC<AddToCalendarButtonsProps> = ({
  cita,
  servicioNombre,
  barberoNombre,
  duracionMinutos = 45,
  className = '',
  onSyncSuccess,
}) => {
  const [descargadoIcs, setDescargadoIcs] = useState(false);
  const [sincronizandoApi, setSincronizandoApi] = useState(false);
  const [eventoCreado, setEventoCreado] = useState<{ id: string; htmlLink?: string } | null>(null);
  const [errorSync, setErrorSync] = useState<string | null>(null);

  // Mandatory explicit confirmation dialog for modifying Workspace calendar
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const googleCalendarUrl = getGoogleCalendarUrl({ cita, servicioNombre, barberoNombre, duracionMinutos });

  const handleDownloadApple = () => {
    downloadAppleCalendarIcs({ cita, servicioNombre, barberoNombre, duracionMinutos });
    setDescargadoIcs(true);
    setTimeout(() => setDescargadoIcs(false), 3000);
  };

  const handleDirectSyncClick = async () => {
    setErrorSync(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        // Need to sign in with Google first
        const res = await googleSignIn();
        if (!res?.accessToken) return;
      }
      // Prompt confirmation dialog
      setShowConfirmModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorSync(err.message || 'Error al conectar con Google Calendar.');
    }
  };

  const handleConfirmCreateEvent = async () => {
    setSincronizandoApi(true);
    setErrorSync(null);
    try {
      const result = await createGoogleCalendarEvent(cita, servicioNombre, barberoNombre, duracionMinutos);
      setEventoCreado({ id: result.id, htmlLink: result.htmlLink });
      setShowConfirmModal(false);
      if (onSyncSuccess) {
        onSyncSuccess(result.id, result.htmlLink);
      }
    } catch (err: any) {
      console.error(err);
      setErrorSync(err.message || 'Error al crear el evento en Google Calendar.');
    } finally {
      setSincronizandoApi(false);
    }
  };

  const payload = buildGoogleCalendarEventPayload(cita, servicioNombre, barberoNombre, duracionMinutos);

  return (
    <div className={`p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] space-y-3 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-3.5 h-3.5 text-[#7C571C]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#221A14]">
            Sincronización con Google Calendar
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded border border-[#86EFAC] font-bold">
          API OFICIAL v3
        </span>
      </div>

      <p className="text-[11px] text-[#6F5A4B] leading-tight">
        Guarda tu cita directamente en tu cuenta de Google Calendar para recibir alarmas 24 horas y 1 hora antes en tus dispositivos.
      </p>

      {/* Success banner if synced */}
      {eventoCreado && (
        <div className="p-3 bg-[#EBF7EE] border border-[#86EFAC] rounded-lg flex items-center justify-between gap-2 text-xs font-mono text-[#15803D]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>¡Cita sincronizada en tu Google Calendar!</span>
          </div>
          {eventoCreado.htmlLink && (
            <a
              href={eventoCreado.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold underline hover:text-[#0E5427]"
            >
              <span>Ver evento</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Error alert */}
      {errorSync && (
        <div className="p-2.5 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-lg flex items-center gap-2 text-xs font-mono text-[#BA1A1A]">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
          <span>{errorSync}</span>
        </div>
      )}

      {/* Direct Google Calendar 1-Click Sync Button */}
      <div className="pt-1">
        <button
          id="btn-sync-google-calendar-direct"
          type="button"
          onClick={handleDirectSyncClick}
          disabled={sincronizandoApi || !!eventoCreado}
          className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all shadow-sm ${
            eventoCreado
              ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] cursor-default'
              : 'bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] border border-[#DFCBB5] active:scale-[0.99] cursor-pointer'
          }`}
        >
          {sincronizandoApi ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Sincronizando con Google Calendar...</span>
            </>
          ) : eventoCreado ? (
            <>
              <Check className="w-4 h-4 text-[#15803D]" />
              <span>Sincronizado en tu Google Calendar</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#FAF6EE]" />
              <span>Sincronizar directamente con mi Google Calendar</span>
            </>
          )}
        </button>
      </div>

      {/* Fallback Buttons: Web Google Calendar link & Apple .ics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
        <a
          id="btn-add-google-calendar-web"
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#FBEBE1] hover:bg-[#F3DECE] border border-[#DFCBB5] hover:border-[#7C571C] text-[#221A14] text-[11px] font-semibold transition-all group shadow-2xs"
          title="Abrir plantilla en calendar.google.com"
        >
          <CalendarPlus className="w-3.5 h-3.5 text-[#7C571C] group-hover:scale-110 transition-transform" />
          <span>Abrir plantilla web Google</span>
          <ExternalLink className="w-3 h-3 text-[#6F5A4B] ml-auto" />
        </a>

        <button
          id="btn-add-apple-calendar"
          type="button"
          onClick={handleDownloadApple}
          className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#FBEBE1] hover:bg-[#F3DECE] border border-[#DFCBB5] hover:border-[#7C571C] text-[#221A14] text-[11px] font-semibold transition-all group shadow-2xs cursor-pointer"
        >
          {descargadoIcs ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#15803D]" />
              <span className="text-[#15803D]">Descargado (.ics)</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-[#7C571C] group-hover:scale-110 transition-transform" />
              <span>Apple Calendar (.ics)</span>
              <span className="text-[9px] font-mono text-[#6F5A4B] ml-auto">iOS/Mac</span>
            </>
          )}
        </button>
      </div>

      {/* Explicit User Confirmation Dialog for Mutating Workspace Operation */}
      <CalendarConfirmDialog
        isOpen={showConfirmModal}
        actionType="create"
        title="¿Agregar cita a tu Google Calendar?"
        description="Se creará un nuevo evento en tu calendario principal de Google Calendar con recordatorios automáticos de 24h y 1h antes."
        itemSummary={payload.summary}
        dateStr={cita.fecha}
        timeStr={cita.hora}
        location={payload.location}
        isLoading={sincronizandoApi}
        onConfirm={handleConfirmCreateEvent}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
