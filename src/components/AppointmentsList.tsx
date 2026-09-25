import React, { useState } from 'react';
import { Cita, Servicio, Barbero } from '../types';
import { cancelarCita } from '../services/api';
import { getColombiaDateTime, parseSlotToMinutes } from '../utils/colombiaTime';
import { 
  Trash2, 
  RefreshCw, 
  CalendarPlus, 
  Download, 
  Search, 
  X, 
  CalendarCheck, 
  Clock, 
  RotateCcw, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  Mail,
  Users,
  FileSpreadsheet,
  Building2,
  MapPin,
  Lock,
  MessageSquare
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SUCURSALES_CASA_DEL_REY, getSucursalById } from '../data/sucursales';
import { getGoogleCalendarUrl, downloadAppleCalendarIcs } from './AddToCalendarButtons';
import { 
  generarTextoMensajeReserva, 
  generarUrlWhatsAppBarberia, 
  generarUrlWhatsAppCliente,
  WHATSAPP_BARBERIA_DISPLAY 
} from './WhatsAppConfirmButton';
import { VintageDatePicker } from './VintageDatePicker';
import { 
  VintageBarberPole, 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageCrownIcon,
  BarberPoleRibbon 
} from './VintageBarberIcons';
import { createGoogleCalendarEvent, buildGoogleCalendarEventPayload } from '../services/googleCalendar';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { CalendarConfirmDialog } from './CalendarConfirmDialog';
import { validarTextoSeguro } from '../utils/security';

interface AppointmentsListProps {
  citas: Cita[];
  servicios: Servicio[];
  barberos: Barbero[];
  onRefresh: () => void;
  onOpenNewBooking: () => void;
  googleUser?: User | null;
  onOpenGoogleCalendarModal?: () => void;
  onOpenReporteClientes?: () => void;
  esAdmin?: boolean;
  sucursalAsignada?: string;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  citas,
  servicios,
  barberos,
  onRefresh,
  onOpenNewBooking,
  googleUser,
  onOpenGoogleCalendarModal,
  onOpenReporteClientes,
  esAdmin = false,
  sucursalAsignada,
}) => {
  const colTime = getColombiaDateTime();
  const hoyStr = colTime.fecha;
  // Aislamiento estricto de caja: Los usuarios cajeros solo visualizan su sede asignada
  const esCajeroAislado = !esAdmin && !!sucursalAsignada && sucursalAsignada !== 'todas';

  const [filtroSede, setFiltroSede] = useState<string>(() => {
    if (sucursalAsignada && sucursalAsignada !== 'todas') {
      return sucursalAsignada;
    }
    return 'todas';
  });

  const sedeFiltroEfectiva = esCajeroAislado ? (sucursalAsignada || 'suc-chico') : filtroSede;
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'Individual' | 'Grupal'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Confirmada' | 'Cancelada'>('todos');
  const [filtroFechaModo, setFiltroFechaModo] = useState<'todos' | 'hoy' | 'fecha'>('todos');
  const [fechaFiltro, setFechaFiltro] = useState<string>(hoyStr);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [ocultarPasadosHoy, setOcultarPasadosHoy] = useState<boolean>(true);

  // Google Calendar Sync State
  const [syncedMap, setSyncedMap] = useState<Record<string, { eventId: string; htmlLink?: string }>>({});
  const [sincronizandoCalendar, setSincronizandoCalendar] = useState<boolean>(false);
  const [notifCalendar, setNotifCalendar] = useState<string | null>(null);
  const [errorNotif, setErrorNotif] = useState<string | null>(null);

  const notificarError = (msg: string) => {
    setErrorNotif(msg);
    setTimeout(() => setErrorNotif(null), 5000);
  };

  const safeConfirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch {
      return true;
    }
  };
  const [syncConfirmDialog, setSyncConfirmDialog] = useState<{
    isOpen: boolean;
    mode: 'single' | 'batch';
    cita?: Cita;
    citasBatch?: Cita[];
    summary: string;
    dateStr?: string;
    timeStr?: string;
  }>({
    isOpen: false,
    mode: 'single',
    summary: '',
  });

  const handlePromptSyncSingle = async (cita: Cita) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (!res?.accessToken) return;
      }
      const s = cita.servicioId ? servicios.find(srv => srv.id === cita.servicioId) : null;
      const b = cita.barberoId ? barberos.find(barb => String(barb.id) === String(cita.barberoId)) : null;
      const payload = buildGoogleCalendarEventPayload(cita, s?.nombre, b?.nombre, s?.duracionMinutos);
      setSyncConfirmDialog({
        isOpen: true,
        mode: 'single',
        cita,
        summary: payload.summary,
        dateStr: cita.fecha,
        timeStr: cita.hora,
      });
    } catch (err: any) {
      notificarError(err.message || 'Error al conectar con Google Calendar.');
    }
  };

  const handlePromptSyncBatch = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (!res?.accessToken) return;
      }
      const citasParaSincronizar = citasHoyPendientes.filter(c => !syncedMap[c.idReserva]);
      if (citasParaSincronizar.length === 0) {
        notificarError('Todos los turnos pendientes de hoy ya fueron sincronizados o no hay turnos activos.');
        return;
      }
      setSyncConfirmDialog({
        isOpen: true,
        mode: 'batch',
        citasBatch: citasParaSincronizar,
        summary: `Sincronización por Lote: ${citasParaSincronizar.length} turno(s) de hoy`,
        dateStr: hoyStr,
      });
    } catch (err: any) {
      notificarError(err.message || 'Error al conectar con Google Calendar.');
    }
  };

  const handleConfirmSync = async () => {
    setSincronizandoCalendar(true);
    try {
      if (syncConfirmDialog.mode === 'single' && syncConfirmDialog.cita) {
        const c = syncConfirmDialog.cita;
        const s = c.servicioId ? servicios.find(srv => srv.id === c.servicioId) : null;
        const b = c.barberoId ? barberos.find(barb => String(barb.id) === String(c.barberoId)) : null;
        const res = await createGoogleCalendarEvent(c, s?.nombre, b?.nombre, s?.duracionMinutos);
        setSyncedMap(prev => ({ ...prev, [c.idReserva]: { eventId: res.id, htmlLink: res.htmlLink } }));
        setNotifCalendar(`¡Turno ${c.idReserva} sincronizado exitosamente en Google Calendar!`);
      } else if (syncConfirmDialog.mode === 'batch' && syncConfirmDialog.citasBatch) {
        let count = 0;
        const newMap: Record<string, { eventId: string; htmlLink?: string }> = {};
        for (const c of syncConfirmDialog.citasBatch) {
          try {
            const s = c.servicioId ? servicios.find(srv => srv.id === c.servicioId) : null;
            const b = c.barberoId ? barberos.find(barb => String(barb.id) === String(c.barberoId)) : null;
            const res = await createGoogleCalendarEvent(c, s?.nombre, b?.nombre, s?.duracionMinutos);
            newMap[c.idReserva] = { eventId: res.id, htmlLink: res.htmlLink };
            count++;
          } catch (e) {
            console.error('Error sincronizando cita en lote:', c.idReserva, e);
          }
        }
        setSyncedMap(prev => ({ ...prev, ...newMap }));
        setNotifCalendar(`¡Se sincronizaron ${count} turnos en Google Calendar!`);
      }
      setSyncConfirmDialog(prev => ({ ...prev, isOpen: false }));
      setTimeout(() => setNotifCalendar(null), 4500);
    } catch (err: any) {
      notificarError('Error en sincronización: ' + err.message);
    } finally {
      setSincronizandoCalendar(false);
    }
  };

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const handleCancelar = async (idReserva: string) => {
    if (!safeConfirm(`¿Confirmas cancelar la reserva ${idReserva}?`)) return;
    setCancelandoId(idReserva);
    try {
      await cancelarCita(idReserva);
      onRefresh();
      setNotifCalendar(`Reserva ${idReserva} cancelada exitosamente.`);
      setTimeout(() => setNotifCalendar(null), 4500);
    } catch (err: any) {
      notificarError('Error al cancelar: ' + err.message);
    } finally {
      setCancelandoId(null);
    }
  };

  // Helpers para resolver sede de cualquier cita (incluso registros sin sucursalId explícito)
  const getCitaSedeId = (c: Cita): string => {
    if (c.sucursalId) return c.sucursalId;
    if (c.sucursalNombre) {
      const nom = c.sucursalNombre.toLowerCase();
      if (nom.includes('usaquén') || nom.includes('usaquen')) return 'suc-usaquen';
      if (nom.includes('chapinero')) return 'suc-chapinero';
      if (nom.includes('chicó') || nom.includes('chico')) return 'suc-chico';
    }
    if (c.barberoId) {
      const b = barberos.find(barb => String(barb.id) === String(c.barberoId));
      if (b?.sucursalId) return b.sucursalId;
    }
    return 'suc-chico';
  };

  const getCitaSedeNombre = (c: Cita): string => {
    if (c.sucursalNombre) return c.sucursalNombre;
    const sId = getCitaSedeId(c);
    return getSucursalById(sId).nombre;
  };

  // Citas segmentadas por la sede efectiva (aislada para cajero, configurable para admin)
  const citasSede = sedeFiltroEfectiva === 'todas'
    ? citas
    : citas.filter(c => getCitaSedeId(c) === sedeFiltroEfectiva);

  const citasHoy = citasSede.filter(c => c.fecha === hoyStr && c.estado !== 'Cancelada');
  const citasHoyPendientes = citasHoy.filter(c => parseSlotToMinutes(c.hora) > colTime.totalMinutos);
  const citasHoyPasadas = citasHoy.filter(c => parseSlotToMinutes(c.hora) <= colTime.totalMinutos);

  const citasFiltradas = citasSede.filter(c => {
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    const matchFecha = 
      filtroFechaModo === 'todos' ? true :
      filtroFechaModo === 'hoy' ? c.fecha === hoyStr :
      c.fecha === fechaFiltro;

    // No tener en cuenta turnos de hoy que ya pasaron de la hora actual
    if (ocultarPasadosHoy && c.fecha === hoyStr) {
      const slotMin = parseSlotToMinutes(c.hora);
      if (slotMin <= colTime.totalMinutos) {
        return false;
      }
    }
    
    if (!busquedaTexto.trim()) return matchTipo && matchEstado && matchFecha;

    const term = busquedaTexto.toLowerCase().trim();
    const matchId = c.idReserva.toLowerCase().includes(term);
    const matchNombre = (c.clienteNombre || c.responsableNombre || '').toLowerCase().includes(term);
    const matchTel = (c.clienteTelefono || c.responsableTelefono || '').replace(/\s+/g, '').includes(term.replace(/\s+/g, ''));
    const matchEmail = (c.clienteEmail || c.responsableEmail || '').toLowerCase().includes(term);
    const matchParticipantes = c.detalles?.some(d => d.nombre.toLowerCase().includes(term));
    const sedeNombre = getCitaSedeNombre(c).toLowerCase();
    const matchSede = sedeNombre.includes(term);

    return matchTipo && matchEstado && matchFecha && (matchId || matchNombre || matchTel || matchEmail || matchParticipantes || matchSede);
  });

  const totalIngresos = citasSede
    .filter(c => c.estado === 'Confirmada')
    .reduce((total, c) => {
      if (c.tipo === 'Individual') {
        const s = servicios.find(srv => srv.id === c.servicioId);
        return total + (s?.precio || 35000);
      } else if (c.tipo === 'Grupal' && c.detalles) {
        const subtotal = c.detalles.reduce((sum, d) => {
          const s = servicios.find(srv => srv.id === d.servicioId);
          return sum + (s?.precio || 35000);
        }, 0);
        return total + subtotal;
      }
      return total;
    }, 0);

  const totalClientes = citasSede
    .filter(c => c.estado === 'Confirmada')
    .reduce((count, c) => count + (c.tipo === 'Grupal' ? (c.totalPersonas || 2) : 1), 0);

  const sedeActualInfo = sedeFiltroEfectiva !== 'todas' ? getSucursalById(sedeFiltroEfectiva) : null;

  return (
    <div className="py-2 space-y-4 font-sans">
      {/* Selector de Sede o Banner de Aislamiento para Caja */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <BarberPoleRibbon className="h-1 -mx-5 -mt-5 mb-4" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-sm sm:text-base font-bold uppercase tracking-wider text-[#221A14] flex items-center gap-1.5">
                  <span>Libro de Turnos</span>
                  {esAdmin ? (
                    <span className="text-[9px] font-mono bg-[#7C571C] text-white px-2 py-0.5 rounded-full font-bold">
                      ADMINISTRADOR
                    </span>
                  ) : esCajeroAislado ? (
                    <span className="text-[9px] font-mono bg-[#7C571C] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> CAJA AISLADA
                    </span>
                  ) : null}
                </h3>
                {sedeFiltroEfectiva !== 'todas' && sedeActualInfo && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#7C571C]" />
                    {sedeActualInfo.nombre}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                {esCajeroAislado
                  ? `Acceso exclusivo de Caja para ${sedeActualInfo?.nombre}. Dirección: ${sedeActualInfo?.direccion} • 📞 ${sedeActualInfo?.telefono}`
                  : sedeFiltroEfectiva === 'todas'
                  ? 'Consolidado general de citas de las 3 sedes oficiales en Bogotá D.C.'
                  : `${sedeActualInfo?.direccion} • 📞 ${sedeActualInfo?.telefono}`}
              </p>
            </div>
          </div>

          {/* Si es cajero aislado: Muestra badge de seguridad bloqueado. Si es admin: botones para cambiar sede */}
          {esCajeroAislado ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] text-xs font-semibold shrink-0">
              <Lock className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Sede de Caja: <strong className="text-[#221A14]">{sedeActualInfo?.nombre}</strong></span>
              <span className="text-[10px] bg-[#7C571C] text-white px-2 py-0.5 rounded-full font-bold ml-1">Exclusivo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setFiltroSede('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  sedeFiltroEfectiva === 'todas'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm ring-1 ring-[#7C571C]'
                    : 'bg-[#FFF8F5] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C]'
                }`}
              >
                <span>Todas las Sedes</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  sedeFiltroEfectiva === 'todas' ? 'bg-[#FFFFFF] text-[#7C571C]' : 'bg-[#FBEBE1] text-[#6F5A4B]'
                }`}>
                  {citas.length}
                </span>
              </button>

              {SUCURSALES_CASA_DEL_REY.map(s => {
                const isSelected = sedeFiltroEfectiva === s.id;
                const countSede = citas.filter(c => getCitaSedeId(c) === s.id).length;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFiltroSede(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm ring-1 ring-[#7C571C]'
                        : 'bg-[#FFF8F5] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C]'
                    }`}
                    title={`${s.nombre} (${s.direccion})`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>{s.nombre.replace('Sede ', '')}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-[#FFFFFF] text-[#7C571C]' : 'bg-[#FBEBE1] text-[#6F5A4B]'
                    }`}>
                      {countSede}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Heritage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] p-4 rounded-2xl shadow-xs relative overflow-hidden hover:border-[#7C571C] transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[#6F5A4B] text-[10px] uppercase font-bold tracking-wider font-mono">
              TOTAL TURNOS EN LIBRO
            </p>
            <VintageBarberPole className="w-4 h-4 opacity-70 text-[#7C571C]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#221A14]">{citasSede.length}</p>
            <span className="text-[10px] text-[#7C571C] font-mono font-bold uppercase">
              {sedeFiltroEfectiva === 'todas' ? 'TODAS LAS SEDES' : 'EN ESTA SEDE'}
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8F5] border border-[#DFCBB5] p-4 rounded-2xl shadow-xs relative overflow-hidden hover:border-[#7C571C] transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[#6F5A4B] text-[10px] uppercase font-bold tracking-wider font-mono">
              CABALLEROS ATENDIDOS
            </p>
            <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#15803D]">{totalClientes}</p>
            <span className="text-[10px] text-[#15803D] font-mono font-bold">EN AGENDA</span>
          </div>
        </div>

        <div className="bg-[#FFF8F5] border border-[#DFCBB5] p-4 rounded-2xl shadow-xs relative overflow-hidden hover:border-[#7C571C] transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[#6F5A4B] text-[10px] uppercase font-bold tracking-wider font-mono">
              RECAUDO EN CAJA
            </p>
            <VintageCrownIcon className="w-4 h-4 text-[#7C571C]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#221A14]">{formatPrecio(totalIngresos)}</p>
            <span className="text-[10px] text-[#6F5A4B] font-mono">COP</span>
          </div>
        </div>
      </div>

      {/* Sección: Turnos del Día (Hoy) sincronizados con el reloj de Colombia */}
      <div className="rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5] shadow-xs p-4 text-[#221A14] font-mono relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] text-[#7C571C] flex items-center justify-center shrink-0 shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#221A14]">
                  Turnos del Día (Hoy) {sedeFiltroEfectiva !== 'todas' && sedeActualInfo ? `— ${sedeActualInfo.nombre}` : ''}
                </h4>
                <span className="text-[10px] bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30 font-bold px-2 py-0.5 rounded-full">
                  {citasHoyPendientes.length} Por Atender
                </span>
                {citasHoyPasadas.length > 0 && (
                  <span className="text-[10px] bg-[#FFF8F5] text-[#6F5A4B] font-semibold px-2 py-0.5 rounded-full border border-[#DFCBB5]" title="Turnos cuya hora ya transcurrió en Colombia">
                    {citasHoyPasadas.length} Pasados
                  </span>
                )}
                <span className="text-[10px] bg-[#FFF8F5] text-[#221A14] font-semibold px-2 py-0.5 rounded-full border border-[#DFCBB5]">
                  {hoyStr}
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5 font-sans">
                {ocultarPasadosHoy
                  ? `Excluyendo turnos que ya pasaron de la hora actual (${colTime.hora12})`
                  : `Mostrando todos los turnos del día (${citasHoy.length} en total)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setOcultarPasadosHoy(!ocultarPasadosHoy)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                ocultarPasadosHoy
                  ? 'bg-[#7C571C] text-white'
                  : 'bg-[#FFF8F5] text-[#6F5A4B] border border-[#DFCBB5] hover:bg-[#FBEBE1]'
              }`}
              title="Omitir o incluir turnos que ya pasaron de la hora actual"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{ocultarPasadosHoy ? 'Omitir Pasados: ON' : 'Omitir Pasados: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroFechaModo(filtroFechaModo === 'hoy' ? 'todos' : 'hoy');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                filtroFechaModo === 'hoy'
                  ? 'bg-[#221A14] text-[#FFF8F5]'
                  : 'bg-[#FFF8F5] text-[#221A14] hover:bg-[#221A14] hover:text-[#FFF8F5] border border-[#DFCBB5]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>{filtroFechaModo === 'hoy' ? '✓ Solo Hoy' : 'Filtrar Hoy'}</span>
            </button>

            {filtroFechaModo !== 'todos' && (
              <button
                type="button"
                onClick={() => setFiltroFechaModo('todos')}
                className="px-2.5 py-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] text-xs border border-[#DFCBB5] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver Todos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Toolbar - Heritage Warm Styling */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Campo de búsqueda rápida por nombre, teléfono o folio */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-[#6F5A4B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => {
                const val = e.target.value;
                const check = validarTextoSeguro(val, { campo: 'Búsqueda', longitudMaxima: 80 });
                if (check.esValido) {
                  setBusquedaTexto(val);
                }
              }}
              placeholder="Buscar por nombre, correo, tel o folio..."
              className="w-full bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl pl-9 pr-7 py-1.5 text-xs font-mono text-[#221A14] placeholder-[#6F5A4B] focus:outline-none focus:border-[#7C571C]"
            />
            {busquedaTexto && (
              <button
                onClick={() => setBusquedaTexto('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6F5A4B] hover:text-[#221A14]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span className="text-[10px] font-mono uppercase font-bold text-[#7C571C] hidden sm:inline ml-1">
            FILTRAR:
          </span>

          {!esCajeroAislado ? (
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#7C571C] font-bold focus:outline-none focus:border-[#7C571C] cursor-pointer"
              title="Filtrar libro por sede"
            >
              <option value="todas">🏛️ TODAS LAS SEDES ({citas.length})</option>
              {SUCURSALES_CASA_DEL_REY.map(s => {
                const cSede = citas.filter(c => getCitaSedeId(c) === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    📍 {s.nombre.toUpperCase()} ({cSede})
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5] text-xs font-mono font-bold text-[#7C571C]">
              <span>📍 {getSucursalById(sedeFiltroEfectiva).nombre.toUpperCase()}</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#15803D]/10 text-[#15803D] rounded border border-[#86EFAC] font-bold">
                CAJA AISLADA
              </span>
            </div>
          )}

          <select
            value={filtroTipo}
            onChange={(e: any) => setFiltroTipo(e.target.value)}
            className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#221A14] focus:outline-none focus:border-[#7C571C] cursor-pointer"
          >
            <option value="todos">TODOS LOS FORMATOS</option>
            <option value="Individual">INDIVIDUAL</option>
            <option value="Grupal">GRUPAL</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e: any) => setFiltroEstado(e.target.value)}
            className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#221A14] focus:outline-none focus:border-[#7C571C] cursor-pointer"
          >
            <option value="todos">TODOS LOS ESTADOS</option>
            <option value="Confirmada">CONFIRMADAS</option>
            <option value="Cancelada">CANCELADAS</option>
          </select>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroFechaModo(filtroFechaModo === 'fecha' ? 'todos' : 'fecha')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                filtroFechaModo === 'fecha'
                  ? 'bg-[#7C571C] text-white border-[#7C571C] font-bold'
                  : 'bg-[#FFF8F5] text-[#6F5A4B] border-[#DFCBB5] hover:text-[#221A14]'
              }`}
            >
              <span>📅 Por Fecha</span>
            </button>
            {filtroFechaModo === 'fecha' && (
              <div className="w-44">
                <VintageDatePicker
                  id="datepicker-agenda-filtro"
                  value={fechaFiltro}
                  onChange={setFechaFiltro}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Batch Sync to Google Calendar */}
          <button
            id="btn-sync-all-google-calendar"
            type="button"
            onClick={handlePromptSyncBatch}
            disabled={sincronizandoCalendar || citasHoyPendientes.length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] border border-[#DFCBB5] hover:border-[#7C571C] text-xs font-mono text-[#7C571C] font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Sincronizar todos los turnos pendientes de hoy a tu cuenta de Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-[#7C571C]" />
            <span className="hidden sm:inline">Sync Hoy ({citasHoyPendientes.length})</span>
            <span className="sm:hidden">Sync</span>
          </button>

          {onOpenGoogleCalendarModal && (
            <button
              id="btn-open-google-modal-list"
              type="button"
              onClick={onOpenGoogleCalendarModal}
              className="px-2.5 py-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] border border-[#DFCBB5] text-xs font-mono text-[#221A14] transition-all flex items-center gap-1 cursor-pointer"
              title="Administrar Google Calendar"
            >
              <Sparkles className="w-3 h-3 text-[#7C571C]" />
              <span className="hidden md:inline">Calendario</span>
            </button>
          )}

          {onOpenReporteClientes && (
            <button
              id="btn-reporte-clientes-lista"
              type="button"
              onClick={onOpenReporteClientes}
              className="px-3 py-1.5 rounded-xl bg-[#15803D]/10 hover:bg-[#15803D]/20 border border-[#15803D]/30 text-xs font-mono font-bold text-[#15803D] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Generar reporte de base de datos con los clientes que realizan reservas"
            >
              <Users className="w-3.5 h-3.5 text-[#15803D]" />
              <span className="hidden sm:inline">Reporte Clientes</span>
              <span className="sm:hidden">Clientes</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-xs font-mono text-[#221A14] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#7C571C]" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={onOpenNewBooking}
            className="px-3.5 py-1.5 rounded-xl bg-[#7C571C] hover:bg-[#684816] text-[#FFFFFF] font-mono font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 tracking-wider cursor-pointer"
          >
            <VintageScissorsIcon className="w-3 h-3" />
            <span>+ Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Calendar Notification Toast */}
      {notifCalendar && (
        <div className="p-3 bg-[#15803D]/10 border border-[#15803D]/30 rounded-xl flex items-center justify-between gap-2 text-xs font-mono text-[#15803D] shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{notifCalendar}</span>
          </div>
          <button onClick={() => setNotifCalendar(null)} className="text-[#15803D]/70 hover:text-[#15803D] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Notification Toast */}
      {errorNotif && (
        <div className="p-3 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-xl flex items-center justify-between gap-2 text-xs font-mono text-[#BA1A1A] shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
            <span>{errorNotif}</span>
          </div>
          <button onClick={() => setErrorNotif(null)} className="text-[#BA1A1A]/70 hover:text-[#BA1A1A] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Heritage Table */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl overflow-hidden shadow-xs relative">
        <BarberPoleRibbon className="h-1" />
        <div className="px-5 py-3.5 border-b border-[#DFCBB5] flex items-center justify-between bg-[#FBEBE1]">
          <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-[#221A14] flex items-center gap-2">
            <StraightRazorIcon className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>LIBRO MAESTRO DE TURNOS ({citasFiltradas.length})</span>
          </h3>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#7C571C]"></div>
            <div className="w-2 h-2 rounded-full bg-[#DFCBB5]"></div>
          </div>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs font-mono text-[#6F5A4B] space-y-2">
            <p>
              No hay citas registradas en el libro {sedeFiltroEfectiva !== 'todas' && sedeActualInfo ? `para ${sedeActualInfo.nombre}` : ''} con los filtros seleccionados.
            </p>
            {!esCajeroAislado && sedeFiltroEfectiva !== 'todas' && (
              <div>
                <button
                  type="button"
                  onClick={() => setFiltroSede('todas')}
                  className="mt-1 px-3 py-1 bg-[#FBEBE1] hover:bg-[#7C571C] text-[#221A14] hover:text-[#FFFFFF] border border-[#DFCBB5] rounded-xl font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ver Todas las Sedes</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse font-sans">
              <thead className="bg-[#FBEBE1] text-[#7C571C] font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">FOLIO</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">SEDE</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">FORMATO</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">CABALLERO / TITULAR</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">FECHA & HORA</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">SERVICIO / DESGLOSE</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold">ESTADO</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold text-right">VALOR</th>
                  <th className="px-3.5 py-3 border-b border-[#DFCBB5] font-bold text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFCBB5] font-mono text-xs">
                {citasFiltradas.map((c) => {
                  const servicio = c.servicioId ? servicios.find(s => s.id === c.servicioId) : null;
                  const barbero = c.barberoId ? barberos.find(b => String(b.id) === String(c.barberoId)) : null;

                  const valorFila = c.tipo === 'Individual' && servicio
                    ? formatPrecio(servicio.precio)
                    : c.detalles
                    ? formatPrecio(
                        c.detalles.reduce((sum, d) => {
                          const s = servicios.find(sv => sv.id === d.servicioId);
                          return sum + (s?.precio || 0);
                        }, 0)
                      )
                    : '$ 35.000';

                  return (
                    <tr key={c.idReserva} className="hover:bg-[#FBEBE1]/60 transition-colors group font-sans">
                      <td className="px-3.5 py-3 text-[#7C571C] font-bold font-mono whitespace-nowrap">
                        {c.idReserva}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {!esCajeroAislado ? (
                          <button
                            type="button"
                            onClick={() => setFiltroSede(getCitaSedeId(c))}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FBEBE1] hover:bg-[#7C571C] text-[#7C571C] hover:text-white border border-[#DFCBB5] transition-all cursor-pointer shadow-xs"
                            title={`Filtrar libro solo por ${getCitaSedeNombre(c)}`}
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{getCitaSedeNombre(c).replace('Sede ', '')}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{getCitaSedeNombre(c).replace('Sede ', '')}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="px-2.5 py-0.5 bg-[#FFF8F5] text-[#6F5A4B] rounded-full text-[10px] border border-[#DFCBB5] font-mono">
                          {c.tipo}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-[#221A14] font-medium whitespace-nowrap">
                        <div className="font-semibold text-xs text-[#221A14]">{c.clienteNombre || c.responsableNombre}</div>
                        <div className="text-[10px] text-[#6F5A4B] font-mono">{c.clienteTelefono || c.responsableTelefono}</div>
                        {(c.clienteEmail || c.responsableEmail) && (
                          <div 
                            className="text-[10px] text-[#7C571C] truncate max-w-[180px] flex items-center gap-1 mt-0.5 font-mono" 
                            title={c.clienteEmail || c.responsableEmail}
                          >
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span>{c.clienteEmail || c.responsableEmail}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-[#6F5A4B] whitespace-nowrap font-mono text-xs">
                        <span className="text-[#221A14] font-semibold">{c.fecha}</span> @ <span className="text-[#7C571C] font-bold">{c.hora}</span>
                      </td>
                      <td className="px-3.5 py-3 text-[#6F5A4B]">
                        {c.tipo === 'Individual' ? (
                          <div>
                            <span className="text-[#221A14] font-semibold">{servicio?.nombre || 'Corte Real'}</span>
                            {barbero && <div className="text-[10px] text-[#6F5A4B] font-mono">Maestro: {barbero.nombre}</div>}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[#7C571C] font-bold font-mono">{c.totalPersonas} Integrantes</span>
                            <div className="text-[10px] text-[#6F5A4B] truncate max-w-xs font-mono">
                              {c.detalles?.map(d => d.nombre).join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${
                          c.estado === 'Confirmada'
                            ? 'bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30'
                            : 'bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-[#221A14] whitespace-nowrap font-mono">
                        {valorFila}
                      </td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.estado !== 'Cancelada' && (
                            <>
                              {/* Direct Google Calendar Workspace Sync */}
                              {syncedMap[c.idReserva] ? (
                                <a
                                  href={syncedMap[c.idReserva].htmlLink || 'https://calendar.google.com'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-xl bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30 hover:bg-[#15803D]/25 transition-colors"
                                  title="Turno sincronizado con Google Calendar. Clic para ver."
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePromptSyncSingle(c)}
                                  disabled={sincronizandoCalendar}
                                  className="p-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#7C571C] border border-[#DFCBB5] hover:border-[#7C571C] transition-colors cursor-pointer"
                                  title="Sincronizar directamente con Google Calendar (API v3)"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#7C571C]" />
                                </button>
                              )}

                              <a
                                href={getGoogleCalendarUrl({
                                  cita: c,
                                  servicioNombre: servicio?.nombre,
                                  barberoNombre: barbero?.nombre,
                                  duracionMinutos: servicio?.duracionMinutos,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#7C571C] border border-[#DFCBB5] hover:border-[#7C571C] transition-colors"
                                title="Abrir plantilla web en Google Calendar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() =>
                                  downloadAppleCalendarIcs({
                                    cita: c,
                                    servicioNombre: servicio?.nombre,
                                    barberoNombre: barbero?.nombre,
                                    duracionMinutos: servicio?.duracionMinutos,
                                  })
                                }
                                className="p-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#15803D] border border-[#DFCBB5] hover:border-[#15803D]/50 transition-colors cursor-pointer"
                                title="Descargar Apple Calendar (.ics)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Notificación directa por WhatsApp al cliente */}
                              {(() => {
                                const telCliente = c.clienteTelefono || c.responsableTelefono || (c as any).telefono;
                                const mensaje = generarTextoMensajeReserva(c, servicio?.nombre, barbero?.nombre, servicio?.precio);
                                const targetUrl = telCliente 
                                  ? (generarUrlWhatsAppCliente(telCliente, mensaje) || generarUrlWhatsAppBarberia(mensaje))
                                  : generarUrlWhatsAppBarberia(mensaje);

                                return (
                                  <a
                                    href={targetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-xl bg-[#EBF7EE] hover:bg-[#25D366] text-[#15803D] hover:text-[#0A180E] border border-[#86EFAC] transition-all cursor-pointer shadow-2xs"
                                    title={telCliente ? `Contactar al cliente por WhatsApp (${c.clienteNombre || 'Caballero'} - ${telCliente})` : `Notificar por WhatsApp a ${WHATSAPP_BARBERIA_DISPLAY}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                  </a>
                                );
                              })()}
                              <button
                                onClick={() => handleCancelar(c.idReserva)}
                                disabled={cancelandoId === c.idReserva}
                                className="p-1.5 rounded-xl bg-[#FFF8F5] hover:bg-[#DC2626]/10 text-[#6F5A4B] hover:text-[#DC2626] border border-[#DFCBB5] hover:border-[#DC2626]/40 transition-colors cursor-pointer"
                                title="Cancelar turno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Workspace Calendar Operations */}
      <CalendarConfirmDialog
        isOpen={syncConfirmDialog.isOpen}
        actionType={syncConfirmDialog.mode === 'batch' ? 'sync_all' : 'create'}
        title={syncConfirmDialog.mode === 'batch' ? '¿Sincronizar turnos de hoy en Google Calendar?' : '¿Agregar turno a tu Google Calendar?'}
        description={
          syncConfirmDialog.mode === 'batch'
            ? `Se agregarán ${syncConfirmDialog.citasBatch?.length || 0} turnos pendientes del día de hoy a tu calendario principal de Google Calendar.`
            : 'Se creará el evento oficial de tu turno en tu Google Calendar con recordatorios de 24h y 1h antes.'
        }
        itemSummary={syncConfirmDialog.summary}
        dateStr={syncConfirmDialog.dateStr}
        timeStr={syncConfirmDialog.timeStr}
        itemsCount={syncConfirmDialog.citasBatch?.length}
        isLoading={sincronizandoCalendar}
        onConfirm={handleConfirmSync}
        onCancel={() => setSyncConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
