import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  UserCheck, 
  LogOut,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleCalendarEventItem } from '../types';
import { listGoogleCalendarEvents, deleteGoogleCalendarEvent } from '../services/googleCalendar';
import { googleSignIn, logoutGoogle, getAccessToken } from '../services/firebaseAuth';
import { CalendarConfirmDialog } from './CalendarConfirmDialog';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  onUserChange: (user: User | null) => void;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  onUserChange,
}) => {
  const [eventos, setEventos] = useState<GoogleCalendarEventItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    eventId: string;
    summary: string;
    dateStr?: string;
  }>({
    isOpen: false,
    eventId: '',
    summary: '',
  });
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    if (isOpen && googleUser) {
      cargarEventos();
    }
  }, [isOpen, googleUser]);

  const cargarEventos = async () => {
    setCargando(true);
    setErrorMsg(null);
    try {
      const items = await listGoogleCalendarEvents();
      setEventos(items);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudieron cargar los eventos de Google Calendar.');
    } finally {
      setCargando(false);
    }
  };

  const handleSignIn = async () => {
    setCargando(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        onUserChange(result.user);
        setSuccessMsg(`¡Conectado con ${result.user.email}!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      setCargando(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      onUserChange(null);
      setEventos([]);
      setSuccessMsg('Sesión de Google cerrada exitosamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cerrar sesión.');
    }
  };

  const handlePromptDelete = (evento: GoogleCalendarEventItem) => {
    const dateStr = evento.start?.dateTime 
      ? new Date(evento.start.dateTime).toLocaleDateString('es-CO', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : evento.start?.date || '';

    setConfirmDialog({
      isOpen: true,
      eventId: evento.id,
      summary: evento.summary,
      dateStr,
    });
  };

  const handleConfirmDelete = async () => {
    setEliminando(true);
    try {
      await deleteGoogleCalendarEvent(confirmDialog.eventId);
      setEventos(prev => prev.filter(e => e.id !== confirmDialog.eventId));
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      setSuccessMsg(`Evento "${confirmDialog.summary}" eliminado de Google Calendar.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el evento de Google Calendar.');
    } finally {
      setEliminando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#14100E] border border-[#3D2E26] rounded-2xl shadow-2xl overflow-hidden text-[#FAF6EE]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#1A1412] border-b border-[#3D2E26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#261B16] border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27] shadow-md">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-royal text-[#FAF6EE]">
                  Google Calendar
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1C2C1D] text-[#86EFAC] text-[9px] font-mono font-bold border border-[#2D472F] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-pulse" />
                  WORKSPACE API v3
                </span>
              </div>
              <p className="text-xs text-[#A8988B] mt-0.5 font-mono">
                Sincronización bidireccional de turnos y recordatorios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#FAF6EE] hover:bg-[#261B16] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-[#132A18] border border-[#23532C] rounded-xl flex items-center gap-2.5 text-xs text-[#86EFAC] font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#86EFAC]" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#2D1515] border border-[#522323] rounded-xl flex items-center gap-2.5 text-xs text-[#FCA5A5] font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Account Card */}
          <div className="bg-[#1C1512] border border-[#3D2E26] rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {googleUser ? (
                <div className="flex items-center gap-3.5">
                  {googleUser.photoURL ? (
                    <img 
                      src={googleUser.photoURL} 
                      alt={googleUser.displayName || 'Google User'} 
                      className="w-11 h-11 rounded-full border-2 border-[#C59B27] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#261B16] border border-[#C59B27] flex items-center justify-center text-[#C59B27] font-bold">
                      {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#FAF6EE]">
                        {googleUser.displayName || 'Usuario Google'}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#1C2C1D] text-[#86EFAC] text-[9px] font-mono font-bold rounded">
                        CONECTADO
                      </span>
                    </div>
                    <span className="text-xs text-[#A8988B] font-mono block">
                      {googleUser.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-bold text-[#FAF6EE] flex items-center gap-1.5 font-royal">
                    <Sparkles className="w-4 h-4 text-[#C59B27]" />
                    Conecta tu Cuenta de Google
                  </h4>
                  <p className="text-xs text-[#A8988B] mt-1 leading-relaxed max-w-md">
                    Inicia sesión para sincronizar tus turnos reservados directamente con tu Google Calendar y recibir recordatorios 24h y 1h antes en tu teléfono.
                  </p>
                </div>
              )}

              <div className="shrink-0">
                {googleUser ? (
                  <button
                    id="btn-google-signout"
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#261B16] hover:bg-[#3A2219] text-[#E5B869] text-xs font-mono border border-[#3D2E26] hover:border-[#C59B27] transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </button>
                ) : (
                  <GoogleSignInButton 
                    id="btn-google-signin-modal"
                    onClick={handleSignIn}
                    isLoading={cargando}
                    text="Acceder con Google"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Event List Section */}
          {googleUser && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#FAF6EE]">
                    Próximos Eventos en tu Google Calendar
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={cargarEventos}
                    disabled={cargando}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C1512] hover:bg-[#261B16] text-[#A8988B] hover:text-[#FAF6EE] text-xs font-mono border border-[#3D2E26] transition-all"
                    title="Actualizar eventos"
                  >
                    <RefreshCw className={`w-3 h-3 ${cargando ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refrescar</span>
                  </button>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#2A1E18] hover:bg-[#3D2E26] text-[#C59B27] hover:text-[#FAF6EE] text-xs font-mono border border-[#C59B27]/40 transition-all"
                  >
                    <span>Abrir Google Calendar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {cargando && eventos.length === 0 ? (
                <div className="p-8 text-center bg-[#181210] rounded-xl border border-[#2D221D]">
                  <div className="w-6 h-6 border-2 border-[#C59B27] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#A8988B] font-mono">Consultando Google Calendar API...</p>
                </div>
              ) : eventos.length === 0 ? (
                <div className="p-8 text-center bg-[#181210] rounded-xl border border-[#2D221D] space-y-2">
                  <CalendarIcon className="w-8 h-8 text-[#5C4D43] mx-auto" />
                  <p className="text-sm font-bold text-[#FAF6EE]">No tienes eventos próximos programados</p>
                  <p className="text-xs text-[#A8988B] max-w-sm mx-auto font-mono">
                    Cuando reserves una cita o sincronices tus turnos, aparecerán aquí con sus alarmas configuradas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {eventos.map(evento => {
                    const isCasaDelRey = (evento.summary || '').includes('Casa del Rey') || 
                                         (evento.description || '').includes('Casa del Rey');
                    const startRaw = evento.start?.dateTime || evento.start?.date;
                    const dateFormatted = startRaw 
                      ? new Date(startRaw).toLocaleDateString('es-CO', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: evento.start?.dateTime ? '2-digit' : undefined,
                          minute: evento.start?.dateTime ? '2-digit' : undefined,
                        })
                      : 'Fecha no especificada';

                    return (
                      <div 
                        key={evento.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isCasaDelRey
                            ? 'bg-[#221814] border-[#C59B27]/50 shadow-sm'
                            : 'bg-[#181210] border-[#2E221B]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#FAF6EE] truncate">
                              {evento.summary}
                            </span>
                            {isCasaDelRey && (
                              <span className="px-1.5 py-0.2 rounded bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#E5B869] text-[9px] font-mono font-bold">
                                👑 BARBERÍA
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-mono text-[#A8988B]">
                            <div className="flex items-center gap-1 text-[#E5B869]">
                              <Clock className="w-3 h-3 text-[#C59B27]" />
                              <span>{dateFormatted}</span>
                            </div>
                            {evento.location && (
                              <div className="hidden sm:flex items-center gap-1 text-[#8A796D] truncate max-w-xs">
                                <MapPin className="w-3 h-3 shrink-0 text-[#C59B27]" />
                                <span className="truncate">{evento.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {evento.htmlLink && (
                            <a
                              href={evento.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#C59B27] hover:bg-[#261B16] transition-colors"
                              title="Ver en Google Calendar"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handlePromptDelete(evento)}
                            className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#EF4444] hover:bg-[#2D1515] transition-colors"
                            title="Eliminar evento de Google Calendar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1A1412] border-t border-[#3D2E26] flex items-center justify-between text-xs font-mono text-[#8A796D]">
          <span>Zona horaria: America/Bogota (UTC-5)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#261B16] hover:bg-[#33241E] text-[#FAF6EE] border border-[#3D2E26] font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Mutating Action (Delete) */}
      <CalendarConfirmDialog
        isOpen={confirmDialog.isOpen}
        actionType="delete"
        title="¿Eliminar evento de Google Calendar?"
        description="Esta acción eliminará el evento de tu calendario principal de Google Calendar. No afectará la base de datos interna de la barbería."
        itemSummary={confirmDialog.summary}
        dateStr={confirmDialog.dateStr}
        isLoading={eliminando}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
