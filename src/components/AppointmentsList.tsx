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
  Calendar,
  Sparkles,
  ExternalLink,
  Mail,
  Users,
  FileSpreadsheet,
  Building2,
  MapPin
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SUCURSALES_CASA_DEL_REY, getSucursalById } from '../data/sucursales';
import { getGoogleCalendarUrl, downloadAppleCalendarIcs } from './AddToCalendarButtons';
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
  const [filtroSede, setFiltroSede] = useState<string>(() => {
    if (sucursalAsignada && sucursalAsignada !== 'todas') {
      return sucursalAsignada;
    }
    return 'todas';
  });
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
      alert(err.message || 'Error al conectar con Google Calendar.');
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
        alert('Todos los turnos pendientes de hoy ya fueron sincronizados o no hay turnos activos.');
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
      alert(err.message || 'Error al conectar con Google Calendar.');
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
      alert('Error en sincronización: ' + err.message);
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
    if (!window.confirm(`¿Confirmas cancelar la reserva ${idReserva}?`)) return;
    setCancelandoId(idReserva);
    try {
      await cancelarCita(idReserva);
      onRefresh();
    } catch (err: any) {
      alert('Error al cancelar: ' + err.message);
    } finally {
      setCancelandoId(null);
    }
  };

  // Helpers para resolver sede de cualquier cita (incluso registros sin sucursalId explícito)
  const getCitaSedeId = (c: Cita): string => {
    if (c.sucursalId) return c.sucursalId;
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

  // Citas segmentadas por la sede seleccionada (o todas si es 'todas')
  const citasSede = filtroSede === 'todas'
    ? citas
    : citas.filter(c => getCitaSedeId(c) === filtroSede);

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

  const sedeActualInfo = filtroSede !== 'todas' ? getSucursalById(filtroSede) : null;

  return (
    <div className="py-2 space-y-4">
      {/* Selector de Sede para el Administrador & Supervisores */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3.5 sm:p-4 shadow-lg relative overflow-hidden">
        <BarberPoleRibbon className="h-1" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#241A15] border border-[#C59B27]/40 text-[#C59B27] flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-royal text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FAF6EE] flex items-center gap-1.5">
                  <span>Libro de Turnos por Sede</span>
                  {esAdmin && (
                    <span className="text-[9px] font-mono bg-[#C59B27] text-[#120E0C] px-1.5 py-0.5 rounded font-bold">
                      ADMIN
                    </span>
                  )}
                </h3>
                {filtroSede !== 'todas' && sedeActualInfo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2A1E18] text-[#E5B869] border border-[#C59B27]/50 font-bold flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#C59B27]" />
                    {sedeActualInfo.nombre}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8A796D] font-mono mt-0.5">
                {filtroSede === 'todas'
                  ? 'Consolidado general de citas de las 3 sedes oficiales en Bogotá D.C.'
                  : `${sedeActualInfo?.direccion} • 📞 ${sedeActualInfo?.telefono}`}
              </p>
            </div>
          </div>

          {/* Botones de conmutación rápida de sede */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setFiltroSede('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filtroSede === 'todas'
                  ? 'bg-[#C59B27] text-[#120E0C] shadow-md ring-1 ring-[#C59B27]'
                  : 'bg-[#0E0A09] text-[#A8988B] hover:text-[#FAF6EE] border border-[#3D2E26] hover:border-[#8A6642]'
              }`}
            >
              <span>Todas las Sedes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                filtroSede === 'todas' ? 'bg-[#120E0C] text-[#E5B869]' : 'bg-[#1A1412] text-[#8A796D]'
              }`}>
                {citas.length}
              </span>
            </button>

            {SUCURSALES_CASA_DEL_REY.map(s => {
              const isSelected = filtroSede === s.id;
              const countSede = citas.filter(c => getCitaSedeId(c) === s.id).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFiltroSede(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#C59B27] text-[#120E0C] shadow-md ring-1 ring-[#C59B27]'
                      : 'bg-[#0E0A09] text-[#A8988B] hover:text-[#FAF6EE] border border-[#3D2E26] hover:border-[#8A6642]'
                  }`}
                  title={`${s.nombre} (${s.direccion})`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{s.nombre.replace('Sede ', '')}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-[#120E0C] text-[#E5B869]' : 'bg-[#1A1412] text-[#8A796D]'
                  }`}>
                    {countSede}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vintage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#1A1412] border border-[#3D2E26] p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[#8A796D] text-[10px] uppercase font-bold tracking-wider font-mono">
              TOTAL CITAS EN LIBRO
            </p>
            <VintageBarberPole className="w-4 h-4 opacity-70" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#FAF6EE]">{citasSede.length}</p>
            <span className="text-[10px] text-[#E5B869] font-mono">
              {filtroSede === 'todas' ? 'TODAS LAS SEDES' : 'EN ESTA SEDE'}
            </span>
          </div>
        </div>

        <div className="bg-[#1A1412] border border-[#3D2E26] p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[#8A796D] text-[10px] uppercase font-bold tracking-wider font-mono">
              CABALLEROS ATENDIDOS
            </p>
            <StraightRazorIcon className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#86EFAC]">{totalClientes}</p>
            <span className="text-[10px] text-[#86EFAC] font-mono">EN AGENDA</span>
          </div>
        </div>

        <div className="bg-[#1A1412] border border-[#3D2E26] p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[#8A796D] text-[10px] uppercase font-bold tracking-wider font-mono">
              RECAUDO EN CAJA
            </p>
            <VintageCrownIcon className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-mono font-bold tracking-tight text-[#FAF6EE]">{formatPrecio(totalIngresos)}</p>
            <span className="text-[10px] text-[#8A796D] font-mono">COP</span>
          </div>
        </div>
      </div>

      {/* Sección: Turnos del Día (Hoy) sincronizados con el calendario interno */}
      {/* Fondo Blanco Marfil (#FAF6EE) */}
      <div className="rounded-xl bg-[#FAF6EE] border border-[#DDD3C1] shadow-lg p-3.5 sm:p-4 text-[#1A1412] font-mono relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1A1412] text-[#E5B869] flex items-center justify-center shrink-0 shadow-sm">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-royal text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1412]">
                  Turnos del Día (Hoy) {filtroSede !== 'todas' && sedeActualInfo ? `— ${sedeActualInfo.nombre}` : ''}
                </h4>
                <span className="text-[10px] bg-[#1A1412] text-[#86EFAC] font-bold px-2 py-0.5 rounded-full border border-[#86EFAC]/30">
                  {citasHoyPendientes.length} Por Atender
                </span>
                {citasHoyPasadas.length > 0 && (
                  <span className="text-[10px] bg-[#EDE5D4] text-[#7C6656] font-semibold px-2 py-0.5 rounded border border-[#D5C8B3]" title="Turnos cuya hora ya transcurrió en Colombia">
                    {citasHoyPasadas.length} Pasados
                  </span>
                )}
                <span className="text-[10px] bg-[#EDE5D4] text-[#1A1412] font-semibold px-2 py-0.5 rounded border border-[#D5C8B3]">
                  {hoyStr}
                </span>
              </div>
              <p className="text-[11px] text-[#6A574A] mt-0.5">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                ocultarPasadosHoy
                  ? 'bg-[#1A1412] text-[#86EFAC] border border-[#86EFAC]/40'
                  : 'bg-[#FFFFFF] text-[#6A574A] border border-[#DDD3C1] hover:bg-[#EDE5D4]'
              }`}
              title="Omitir o incluir turnos que ya pasaron de la hora actual"
            >
              <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{ocultarPasadosHoy ? 'Omitir Pasados: ON' : 'Omitir Pasados: OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroFechaModo(filtroFechaModo === 'hoy' ? 'todos' : 'hoy');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                filtroFechaModo === 'hoy'
                  ? 'bg-[#1A1412] text-[#FAF6EE] ring-2 ring-[#C59B27]'
                  : 'bg-[#FFFFFF] hover:bg-[#1A1412] text-[#1A1412] hover:text-[#FAF6EE] border border-[#DDD3C1]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{filtroFechaModo === 'hoy' ? '✓ Solo Hoy' : 'Filtrar Hoy'}</span>
            </button>

            {filtroFechaModo !== 'todos' && (
              <button
                type="button"
                onClick={() => setFiltroFechaModo('todos')}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#EDE5D4] text-[#7C6656] hover:text-[#1A1412] text-xs border border-[#DDD3C1] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver Todos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Toolbar - Vintage Density */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#1A1412] border border-[#3D2E26]">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Campo de búsqueda rápida por nombre, teléfono o folio */}
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-[#8A796D] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Buscar por nombre, correo, tel o folio..."
              className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-md pl-8 pr-7 py-1 text-xs font-mono text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27]"
            />
            {busquedaTexto && (
              <button
                onClick={() => setBusquedaTexto('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A796D] hover:text-[#FAF6EE]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span className="text-[10px] font-mono uppercase font-bold text-[#C59B27] hidden sm:inline ml-1">
            FILTRAR:
          </span>

          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="bg-[#0E0A09] border border-[#3D2E26] rounded-md px-2.5 py-1 text-xs font-mono text-[#E5B869] focus:outline-none focus:border-[#C59B27] cursor-pointer"
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

          <select
            value={filtroTipo}
            onChange={(e: any) => setFiltroTipo(e.target.value)}
            className="bg-[#0E0A09] border border-[#3D2E26] rounded-md px-2.5 py-1 text-xs font-mono text-[#FAF6EE] focus:outline-none focus:border-[#C59B27] cursor-pointer"
          >
            <option value="todos">TODOS LOS FORMATOS</option>
            <option value="Individual">INDIVIDUAL</option>
            <option value="Grupal">GRUPAL</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e: any) => setFiltroEstado(e.target.value)}
            className="bg-[#0E0A09] border border-[#3D2E26] rounded-md px-2.5 py-1 text-xs font-mono text-[#FAF6EE] focus:outline-none focus:border-[#C59B27] cursor-pointer"
          >
            <option value="todos">TODOS LOS ESTADOS</option>
            <option value="Confirmada">CONFIRMADAS</option>
            <option value="Cancelada">CANCELADAS</option>
          </select>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroFechaModo(filtroFechaModo === 'fecha' ? 'todos' : 'fecha')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                filtroFechaModo === 'fecha'
                  ? 'bg-[#C59B27] text-[#120E0C] border-[#C59B27] font-bold'
                  : 'bg-[#0E0A09] text-[#A8988B] border-[#3D2E26] hover:text-[#FAF6EE]'
              }`}
            >
              <span>📅 Por Calendario</span>
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
            className="px-2.5 py-1 rounded-lg bg-[#1F1815] hover:bg-[#2A1E18] border border-[#3D2E26] hover:border-[#C59B27] text-xs font-mono text-[#E5B869] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Sincronizar todos los turnos pendientes de hoy a tu cuenta de Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
            <span className="hidden sm:inline">Sincronizar Hoy con Google ({citasHoyPendientes.length})</span>
            <span className="sm:hidden">Sync Hoy Google</span>
          </button>

          {onOpenGoogleCalendarModal && (
            <button
              id="btn-open-google-modal-list"
              type="button"
              onClick={onOpenGoogleCalendarModal}
              className="px-2 py-1 rounded-lg bg-[#181210] hover:bg-[#261B16] border border-[#3D2E26] text-xs font-mono text-[#FAF6EE] transition-all flex items-center gap-1"
              title="Administrar Google Calendar"
            >
              <Sparkles className="w-3 h-3 text-[#C59B27]" />
              <span className="hidden md:inline">Ver Calendario</span>
            </button>
          )}

          {onOpenReporteClientes && (
            <button
              id="btn-reporte-clientes-lista"
              type="button"
              onClick={onOpenReporteClientes}
              className="px-2.5 py-1 rounded-lg bg-[#142316] hover:bg-[#1D3521] border border-[#23532C] hover:border-[#86EFAC] text-xs font-mono font-bold text-[#86EFAC] transition-all flex items-center gap-1.5 shadow cursor-pointer"
              title="Generar reporte de base de datos con los clientes que realizan reservas"
            >
              <Users className="w-3.5 h-3.5 text-[#86EFAC]" />
              <span className="hidden sm:inline">Reporte Clientes</span>
              <span className="sm:hidden">Clientes</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="px-2.5 py-1 rounded-lg bg-[#241C18] hover:bg-[#33251E] border border-[#3D2E26] hover:border-[#C59B27] text-xs font-mono text-[#FAF6EE] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3 text-[#C59B27]" />
            <span>Actualizar</span>
          </button>
          <button
            onClick={onOpenNewBooking}
            className="px-3.5 py-1.5 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs shadow transition-all flex items-center gap-1.5 tracking-wider"
          >
            <VintageScissorsIcon className="w-3 h-3" />
            <span>+ Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Calendar Notification Toast */}
      {notifCalendar && (
        <div className="p-3 bg-[#132A18] border border-[#23532C] rounded-xl flex items-center justify-between gap-2 text-xs font-mono text-[#86EFAC] shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
            <span>{notifCalendar}</span>
          </div>
          <button onClick={() => setNotifCalendar(null)} className="text-[#86EFAC]/70 hover:text-[#86EFAC]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Vintage Table */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl overflow-hidden shadow-2xl relative">
        <BarberPoleRibbon className="h-1" />
        <div className="px-4 py-3 border-b border-[#3D2E26] flex items-center justify-between bg-[#14100E]">
          <h3 className="text-xs font-royal font-bold uppercase tracking-widest text-[#FAF6EE] flex items-center gap-2">
            <StraightRazorIcon className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>LIBRO MAESTRO DE TURNOS ({citasFiltradas.length})</span>
          </h3>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#C59B27]"></div>
            <div className="w-2 h-2 rounded-full bg-[#3D2E26]"></div>
          </div>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs font-mono text-[#8A796D] space-y-2">
            <p>
              No hay citas registradas en el libro {filtroSede !== 'todas' && sedeActualInfo ? `para ${sedeActualInfo.nombre}` : ''} con los filtros seleccionados.
            </p>
            {filtroSede !== 'todas' && (
              <div>
                <button
                  type="button"
                  onClick={() => setFiltroSede('todas')}
                  className="mt-1 px-3 py-1 bg-[#241A15] hover:bg-[#C59B27] text-[#FAF6EE] hover:text-[#120E0C] border border-[#3D2E26] rounded-md font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ver Todas las Sedes</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-[#0E0A09] text-[#8A796D] font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">FOLIO</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">SEDE</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">FORMATO</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">CABALLERO / TITULAR</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">FECHA & HORA</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">SERVICIO / DESGLOSE</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium">ESTADO</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium text-right">VALOR</th>
                  <th className="px-3 py-2.5 border-b border-[#3D2E26] font-medium text-right">CALENDARIO / ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2019] font-mono text-xs">
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
                    <tr key={c.idReserva} className="hover:bg-[#241A15] transition-colors group">
                      <td className="px-3 py-3 text-[#E5B869] font-bold whitespace-nowrap">
                        {c.idReserva}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setFiltroSede(getCitaSedeId(c))}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#14100E] hover:bg-[#2A1E18] text-[#E5B869] border border-[#3D2E26] hover:border-[#C59B27] transition-all cursor-pointer shadow-xs"
                          title={`Filtrar libro solo por ${getCitaSedeNombre(c)}`}
                        >
                          <Building2 className="w-2.5 h-2.5 text-[#C59B27]" />
                          <span>{getCitaSedeNombre(c).replace('Sede ', '')}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 bg-[#0E0A09] text-[#A8988B] rounded text-[10px] border border-[#3D2E26]">
                          {c.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#FAF6EE] font-medium whitespace-nowrap">
                        <div className="font-semibold">{c.clienteNombre || c.responsableNombre}</div>
                        <div className="text-[10px] text-[#8A796D]">{c.clienteTelefono || c.responsableTelefono}</div>
                        {(c.clienteEmail || c.responsableEmail) && (
                          <div 
                            className="text-[10px] text-[#C59B27] truncate max-w-[180px] flex items-center gap-1 mt-0.5" 
                            title={c.clienteEmail || c.responsableEmail}
                          >
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span>{c.clienteEmail || c.responsableEmail}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[#A8988B] whitespace-nowrap">
                        <span className="text-[#FAF6EE]">{c.fecha}</span> @ <span className="text-[#E5B869] font-bold">{c.hora}</span>
                      </td>
                      <td className="px-3 py-3 text-[#A8988B]">
                        {c.tipo === 'Individual' ? (
                          <div>
                            <span className="text-[#FAF6EE]">{servicio?.nombre || 'Corte Real'}</span>
                            {barbero && <div className="text-[10px] text-[#8A796D]">Maestro: {barbero.nombre}</div>}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[#E5B869] font-bold">{c.totalPersonas} Integrantes</span>
                            <div className="text-[10px] text-[#8A796D] truncate max-w-xs">
                              {c.detalles?.map(d => d.nombre).join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                          c.estado === 'Confirmada'
                            ? 'bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F]'
                            : 'bg-[#3E161C] text-[#F87171] border border-[#6B242D]'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#FAF6EE] whitespace-nowrap">
                        {valorFila}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.estado !== 'Cancelada' && (
                            <>
                              {/* Direct Google Calendar Workspace Sync */}
                              {syncedMap[c.idReserva] ? (
                                <a
                                  href={syncedMap[c.idReserva].htmlLink || 'https://calendar.google.com'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F] hover:border-[#86EFAC] transition-colors"
                                  title="Turno sincronizado con Google Calendar. Clic para ver."
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#86EFAC]" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePromptSyncSingle(c)}
                                  disabled={sincronizandoCalendar}
                                  className="p-1.5 rounded-md bg-[#0E0A09] hover:bg-[#2A1E18] text-[#8A796D] hover:text-[#C59B27] border border-[#3D2E26] hover:border-[#C59B27] transition-colors"
                                  title="Sincronizar directamente con Google Calendar (API v3)"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
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
                                className="p-1.5 rounded-md bg-[#0E0A09] hover:bg-[#2A1E18] text-[#8A796D] hover:text-[#C59B27] border border-[#3D2E26] hover:border-[#C59B27] transition-colors"
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
                                className="p-1.5 rounded-md bg-[#0E0A09] hover:bg-[#2A1E18] text-[#8A796D] hover:text-[#86EFAC] border border-[#3D2E26] hover:border-[#86EFAC]/50 transition-colors"
                                title="Descargar Apple Calendar (.ics)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancelar(c.idReserva)}
                                disabled={cancelandoId === c.idReserva}
                                className="p-1.5 rounded-md bg-[#0E0A09] hover:bg-[#3E161C] text-[#8A796D] hover:text-[#F87171] border border-[#3D2E26] hover:border-[#6B242D] transition-colors"
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
