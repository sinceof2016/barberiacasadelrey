import React, { useState, useEffect, useMemo } from 'react';
import { Servicio, Barbero, Cita, HorarioSlot } from '../types';
import { getDisponibilidad, crearCitaIndividual } from '../services/api';
import { 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Ban, 
  Sparkles, 
  Mail, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  X,
  Sun,
  Sunset,
  Moon,
  Star,
  FileText
} from 'lucide-react';
import { AddToCalendarButtons } from './AddToCalendarButtons';
import { 
  WhatsAppConfirmButton, 
  WHATSAPP_BARBERIA_DISPLAY, 
} from './WhatsAppConfirmButton';
import { VintageDatePicker } from './VintageDatePicker';
import { useColombiaClock, getColombiaDateTime, isSlotPassedInColombia } from '../utils/colombiaTime';
import { sucursalesCasaDelRey } from '../services/localData';
import comboCabelloBarbaCejasImg from '../assets/images/combo_cabello_barba_cejas_1790442966946.jpg';
import corteCabelloCejasImg from '../assets/images/corte_cabello_cejas_barber_1790442983111.jpg';
import { 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';
import { 
  guardarDatosClienteRecurrente, 
  obtenerDatosClienteRecurrente, 
  tieneConsentimiento,
  registrarEventoAnalitica 
} from '../services/cookieService';
import { validarNombre, validarTelefono, validarEmail } from '../utils/security';

interface IndividualBookingFormProps {
  servicios: Servicio[];
  barberos: Barbero[];
  preselectedServiceId?: number;
  preselectedBarberId?: number;
  onBookingSuccess: (cita: Cita) => void;
}

type BookingView = 'servicios' | 'profesional' | 'horarios' | 'datos' | 'voucher';
type ShiftPeriod = 'manana' | 'tarde' | 'noche';

const FOTOS_SERVICIOS: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
  2: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80',
  3: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  4: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80',
  5: corteCabelloCejasImg,
  6: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
  7: comboCabelloBarbaCejasImg,
};

const FOTOS_BARBEROS_DEFAULT: Record<number, string> = {
  101: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  102: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  201: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=80',
  202: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=300&q=80',
  301: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
  302: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

const DIAS_ABREV = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export const IndividualBookingForm: React.FC<IndividualBookingFormProps> = ({
  servicios,
  barberos,
  preselectedServiceId,
  preselectedBarberId,
  onBookingSuccess,
}) => {
  const colClock = useColombiaClock();

  // Screen flow navigation: servicios -> profesional -> horarios -> datos -> voucher
  const [vistaActual, setVistaActual] = useState<BookingView>(() => {
    if (preselectedServiceId && preselectedBarberId) return 'horarios';
    if (preselectedServiceId) return 'profesional';
    return 'servicios';
  });

  const [sobreNosotrosExpandido, setSobreNosotrosExpandido] = useState<boolean>(false);

  // Form selections
  const [sucursalId, setSucursalId] = useState<string>('suc-chico');
  const [servicioId, setServicioId] = useState<number>(preselectedServiceId || (servicios[0]?.id ?? 1));
  const [barberoId, setBarberoId] = useState<string | number>(preselectedBarberId || '');
  const [fecha, setFecha] = useState<string>(() => getColombiaDateTime().fecha);
  const [hora, setHora] = useState<string>('');

  // Client info form
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [aceptaTerminos, setAceptaTerminos] = useState<boolean>(true);
  const [honeypotEmpresa] = useState<string>('');

  // UI state
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [busquedaBarbero, setBusquedaBarbero] = useState<string>('');
  const [franjaActiva, setFranjaActiva] = useState<ShiftPeriod>('manana');
  const [resumenAbierto, setResumenAbierto] = useState<boolean>(false);
  const [modalPoliticaAbierto, setModalPoliticaAbierto] = useState<boolean>(false);
  const [selectorFechaAbierto, setSelectorFechaAbierto] = useState<boolean>(false);
  const [selectorSedeAbierto, setSelectorSedeAbierto] = useState<boolean>(false);
  const [intentadoEnviar, setIntentadoEnviar] = useState<boolean>(false);

  // Carousel offset for days
  const [offsetDias, setOffsetDias] = useState<number>(0);

  // Slots & Loading
  const [slotsDisponibilidad, setSlotsDisponibilidad] = useState<HorarioSlot[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Scroll to container top smoothly
  const scrollToContainer = () => {
    const el = document.getElementById('webook-booking-flow');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cargar datos de cookies funcionales
  useEffect(() => {
    if (tieneConsentimiento('funcionales')) {
      const rec = obtenerDatosClienteRecurrente();
      if (rec) {
        if (rec.nombre) setClienteNombre(rec.nombre);
        if (rec.telefono) setClienteTelefono(rec.telefono);
        if (rec.email) setClienteEmail(rec.email);
        if (rec.sucursalId) setSucursalId(rec.sucursalId);
      }
    }
  }, []);

  useEffect(() => {
    if (preselectedServiceId) {
      setServicioId(preselectedServiceId);
      setVistaActual('profesional');
    }
  }, [preselectedServiceId]);

  useEffect(() => {
    if (preselectedBarberId) {
      setBarberoId(preselectedBarberId);
      setVistaActual('horarios');
    }
  }, [preselectedBarberId]);

  // Cargar disponibilidad de horarios al cambiar fecha, barbero o sede
  useEffect(() => {
    let isMounted = true;
    async function fetchHorarios() {
      if (!fecha) return;
      setCargandoHorarios(true);
      setErrorMensaje(null);
      try {
        const resp = await getDisponibilidad(fecha, barberoId || undefined, sucursalId);
        if (isMounted) {
          const slots = resp.slots || [];
          setSlotsDisponibilidad(slots);
          const disponibles = resp.horariosDisponibles || [];
          setHorariosDisponibles(disponibles);

          if (hora && !disponibles.includes(hora)) {
            setHora('');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMensaje('No se pudo cargar la disponibilidad para la fecha seleccionada.');
        }
      } finally {
        if (isMounted) setCargandoHorarios(false);
      }
    }

    fetchHorarios();
    return () => { isMounted = false; };
  }, [fecha, barberoId, sucursalId]);

  // Manejador de confirmación
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIntentadoEnviar(true);
    setErrorMensaje(null);

    if (honeypotEmpresa.trim() !== '') return;

    const nombreVal = validarNombre(clienteNombre);
    if (!nombreVal.esValido) {
      setErrorMensaje(nombreVal.motivo || 'Por favor ingresa un nombre válido.');
      return;
    }

    const telVal = validarTelefono(clienteTelefono);
    if (!telVal.esValido) {
      setErrorMensaje(telVal.motivo || 'Por favor ingresa un número de teléfono celular válido.');
      return;
    }

    if (clienteEmail.trim()) {
      const emailVal = validarEmail(clienteEmail);
      if (!emailVal.esValido) {
        setErrorMensaje(emailVal.motivo || 'El correo electrónico no es válido.');
        return;
      }
    }

    if (!hora) {
      setErrorMensaje('Por favor selecciona una hora disponible para tu cita.');
      setVistaActual('horarios');
      return;
    }

    if (!aceptaTerminos) {
      setErrorMensaje('Debes aceptar el tratamiento de datos para confirmar tu turno.');
      return;
    }

    if (isSlotPassedInColombia(hora, fecha)) {
      setErrorMensaje(`El horario seleccionado (${hora}) ya transcurrió en Colombia. Por favor selecciona otro turno.`);
      setVistaActual('horarios');
      return;
    }

    setEnviando(true);
    try {
      const sucursalSel = sucursalesCasaDelRey.find(s => s.id === sucursalId);
      const resp = await crearCitaIndividual({
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        clienteEmail: clienteEmail.trim() || undefined,
        servicioId: Number(servicioId),
        barberoId: barberoId ? Number(barberoId) : undefined,
        fecha,
        hora,
        sucursalId,
        sucursalNombre: sucursalSel?.nombre || 'Sede Chicó Real',
      });

      if (resp.exito && resp.reserva) {
        guardarDatosClienteRecurrente({
          nombre: clienteNombre.trim(),
          telefono: clienteTelefono.trim(),
          email: clienteEmail.trim() || undefined,
          sucursalId
        });

        registrarEventoAnalitica('reserva_confirmada', {
          idReserva: resp.reserva.idReserva,
          sucursalId,
          servicioId: Number(servicioId)
        });

        setCitaCreada(resp.reserva);
        setVistaActual('voucher');
        onBookingSuccess(resp.reserva);
        scrollToContainer();
      } else {
        setErrorMensaje(resp.mensaje || 'Error al agendar la cita.');
      }
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCopiarId = () => {
    if (!citaCreada) return;
    navigator.clipboard.writeText(citaCreada.idReserva);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const servicioSeleccionado = servicios.find(s => s.id === Number(servicioId)) || servicios[0];
  const barberoSeleccionado = barberos.find(b => String(b.id) === String(barberoId));
  const sucursalSeleccionada = sucursalesCasaDelRey.find(s => s.id === sucursalId) || sucursalesCasaDelRey[0];

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const clasificarFranja = (horaStr: string): ShiftPeriod => {
    const match = horaStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 'manana';
    let h = parseInt(match[1], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    if (h < 12) return 'manana';
    if (h < 17) return 'tarde';
    return 'noche';
  };

  const todosLosSlots = useMemo(() => {
    if (slotsDisponibilidad.length > 0) return slotsDisponibilidad;
    return horariosDisponibles.map(h => ({
      hora24: h,
      hora12: h,
      disponible: true
    }));
  }, [slotsDisponibilidad, horariosDisponibles]);

  const slotsPorFranja = useMemo(() => {
    const manana: HorarioSlot[] = [];
    const tarde: HorarioSlot[] = [];
    const noche: HorarioSlot[] = [];

    todosLosSlots.forEach(s => {
      const periodo = clasificarFranja(s.hora12);
      if (periodo === 'manana') manana.push(s);
      else if (periodo === 'tarde') tarde.push(s);
      else noche.push(s);
    });

    return { manana, tarde, noche };
  }, [todosLosSlots]);

  const conteoDisponibles = useMemo(() => {
    const cuenta = (arr: HorarioSlot[]) =>
      arr.filter(s => s.disponible && !s.esPasado && !isSlotPassedInColombia(s.hora12, fecha)).length;

    return {
      manana: cuenta(slotsPorFranja.manana),
      tarde: cuenta(slotsPorFranja.tarde),
      noche: cuenta(slotsPorFranja.noche),
    };
  }, [slotsPorFranja, fecha]);

  useEffect(() => {
    if (conteoDisponibles[franjaActiva] === 0) {
      if (conteoDisponibles.tarde > 0) setFranjaActiva('tarde');
      else if (conteoDisponibles.manana > 0) setFranjaActiva('manana');
      else if (conteoDisponibles.noche > 0) setFranjaActiva('noche');
    }
  }, [conteoDisponibles]);

  const listaDias = useMemo(() => {
    const dias = [];
    const [y, m, d] = (colClock.fecha || getColombiaDateTime().fecha).split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let i = 0; i < 21; i++) {
      const fechaObj = new Date(baseDate);
      fechaObj.setDate(baseDate.getDate() + i);

      const añoStr = fechaObj.getFullYear();
      const mesStr = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const diaStr = String(fechaObj.getDate()).padStart(2, '0');
      const fechaIso = `${añoStr}-${mesStr}-${diaStr}`;

      dias.push({
        fechaIso,
        diaAbrev: DIAS_ABREV[fechaObj.getDay()],
        numeroDia: fechaObj.getDate(),
        nombreDiaLargo: fechaObj.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }),
      });
    }
    return dias;
  }, [colClock.fecha]);

  const diasVisibles = useMemo(() => {
    const inicio = Math.max(0, Math.min(offsetDias, listaDias.length - 4));
    return listaDias.slice(inicio, inicio + 4);
  }, [listaDias, offsetDias]);

  const diaActualInfo = listaDias.find(d => d.fechaIso === fecha) || listaDias[0];

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      if (categoriaFiltro === 'todos') return true;
      const n = s.nombre.toLowerCase();
      if (categoriaFiltro === 'cortes') return !n.includes('combo') && (n.includes('corte') || n.includes('cabello'));
      if (categoriaFiltro === 'barba') return n.includes('barba') || n.includes('afeitado') || n.includes('cejas');
      if (categoriaFiltro === 'combos') return n.includes('combo') || n.includes('tríada');
      return true;
    });
  }, [servicios, categoriaFiltro]);

  const barberosFiltrados = useMemo(() => {
    return barberos.filter(b => {
      const matchesSede = !b.sucursalId || b.sucursalId === sucursalId;
      if (!matchesSede) return false;
      if (!busquedaBarbero.trim()) return true;
      const q = busquedaBarbero.toLowerCase();
      return b.nombre.toLowerCase().includes(q) || b.especialidad.toLowerCase().includes(q);
    });
  }, [barberos, sucursalId, busquedaBarbero]);

  // =========================================================================
  // PANTALLA DE VOUCHER / CITA CONFIRMADA
  // =========================================================================
  if (vistaActual === 'voucher' && citaCreada) {
    return (
      <div id="webook-booking-flow" className="rounded-3xl bg-[#FFF1E9] border border-[#DFCBB5] p-4 sm:p-7 shadow-xl relative overflow-hidden font-sans text-xs text-[#221A14]">
        <BarberPoleRibbon className="h-1.5 absolute top-0 left-0 right-0" />

        <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-4 mb-5 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#221A14] tracking-tight">
                  TURNO CONFIRMADO
                </h3>
                <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[10px] font-mono font-bold rounded-full border border-[#86EFAC]">
                  {citaCreada.estado || 'CONFIRMADO'}
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
                CÓDIGO OFICIAL: <span className="font-bold text-[#7C571C]">{citaCreada.idReserva}</span>
              </p>
            </div>
          </div>
          <VintageWaxSeal text="CONFIRMADO" className="hidden sm:inline-flex shrink-0" />
        </div>

        {/* Voucher card */}
        <div className="rounded-2xl bg-[#FFFFFF] p-4 sm:p-5 border border-[#DFCBB5] space-y-3.5 mb-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DFCBB5]/60 pb-3">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase tracking-wider block font-bold font-mono">
                CÓDIGO DE RESERVA
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-mono font-bold text-[#7C571C]">{citaCreada.idReserva}</span>
                <button
                  type="button"
                  onClick={handleCopiarId}
                  className="p-1.5 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-[#4F4539] transition-all cursor-pointer"
                  title="Copiar código"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold font-mono">VALOR EN SALÓN</span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#7C571C]">
                {formatPrecio(citaCreada.precioTotal || servicioSeleccionado.precio)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-mono">Cliente:</span>
              <span className="font-bold text-[#221A14] text-sm">{citaCreada.clienteNombre}</span>
              <span className="text-xs text-[#6F5A4B] block">{citaCreada.clienteTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-mono">Servicio:</span>
              <span className="font-bold text-[#221A14] text-sm">{citaCreada.servicioNombre}</span>
              <span className="text-xs text-[#7C571C] block font-medium">
                {citaCreada.barberoNombre ? `Atendido por ${citaCreada.barberoNombre}` : 'Barbero según asignación de sala'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-mono">Fecha & Turno:</span>
              <span className="font-bold text-[#7C571C] text-sm">
                {citaCreada.fecha} • {citaCreada.hora}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-mono">Sede Asignada:</span>
              <span className="font-bold text-[#221A14] text-sm">
                {citaCreada.sucursalNombre || sucursalSeleccionada.nombre}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block animate-pulse" />
                <span className="text-xs font-bold text-[#221A14]">
                  Notificación automática WhatsApp despachada
                </span>
              </div>
              <span className="text-[11px] text-[#6F5A4B] block mt-0.5">
                Mensaje de confirmación enviado a tu número y a la línea oficial {WHATSAPP_BARBERIA_DISPLAY}
              </span>
            </div>
            <WhatsAppConfirmButton cita={citaCreada} autoNotificar={true} className="w-full sm:w-auto" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] shadow-xs">
            <p className="text-[11px] font-bold text-[#7C571C] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>AÑADIR A TU CALENDARIO PERSONAL</span>
            </p>
            <AddToCalendarButtons cita={citaCreada} />
          </div>

          <button
            type="button"
            onClick={() => {
              setCitaCreada(null);
              setHora('');
              setVistaActual('servicios');
            }}
            className="w-full py-3.5 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Agendar Otra Cita</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER PRINCIPAL DEL MÓDULO (COLORES HERITAGE LUXURY)
  // =========================================================================
  return (
    <div id="webook-booking-flow" className="w-full max-w-xl mx-auto pb-36 sm:pb-40 font-sans text-[#221A14] relative select-none">
      
      {/* ===================================================================== */}
      {/* VISTA 1: CATÁLOGO DE SERVICIOS                                       */}
      {/* ===================================================================== */}
      {vistaActual === 'servicios' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Header Superior: Marca & Selector de Sede */}
          <div className="pt-1 px-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#221A14] flex items-center gap-2">
                  <span>Barbería La Casa del Rey</span>
                </h1>
                <p className="text-[11px] text-[#6F5A4B] mt-0.5">Tradición real & cuidado exclusivo para caballeros</p>
              </div>

              {/* Botón de Sede rápida */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSelectorSedeAbierto(!selectorSedeAbierto)}
                  className="px-3 py-1.5 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-[11px] font-semibold text-[#7C571C] flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{sucursalSeleccionada.nombre.replace('Sede ', '')}</span>
                  <ChevronDown className="w-3 h-3 text-[#6F5A4B]" />
                </button>

                {selectorSedeAbierto && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-mono uppercase text-[#6F5A4B] px-2 py-1 block font-bold">
                      Selecciona la Sede:
                    </span>
                    {sucursalesCasaDelRey.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSucursalId(s.id);
                          setSelectorSedeAbierto(false);
                          if (barberoId) {
                            const barb = barberos.find(b => String(b.id) === String(barberoId));
                            if (barb && barb.sucursalId && barb.sucursalId !== s.id) setBarberoId('');
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          sucursalId === s.id ? 'bg-[#7C571C] text-[#FFFFFF] font-bold' : 'text-[#221A14] hover:bg-[#FBEBE1]'
                        }`}
                      >
                        <span className="truncate">{s.nombre}</span>
                        {sucursalId === s.id && <Check className="w-3.5 h-3.5 text-[#FFFFFF]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta "Sobre nosotros" */}
          <div className="rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] p-4 shadow-xs">
            <h2 className="text-sm font-serif font-bold text-[#221A14] mb-1">Sobre nosotros</h2>
            <p className="text-xs text-[#4F4539] leading-relaxed">
              Somos Barbería La Casa del Rey, aquí te ofrecemos mucho más que un corte de cabello: disfruta de una experiencia completa de barbería tradicional y moderna con servicio de toalla caliente, perfilado a navaja libre y café de origen...
              {sobreNosotrosExpandido && (
                <span className="block mt-1 text-[#221A14]">
                  Contamos con maestros barberos de amplia trayectoria en Bogotá. Elige tu sede, tu profesional de confianza y vive el ritual del auténtico caballero.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setSobreNosotrosExpandido(!sobreNosotrosExpandido)}
              className="text-xs font-bold text-[#7C571C] hover:underline mt-1.5 inline-block cursor-pointer"
            >
              {sobreNosotrosExpandido ? 'Ver menos' : 'Ver más'}
            </button>
          </div>

          {/* Título de sección "Lo más pedido aquí" */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#221A14]">Lo más pedido aquí</h2>
              <span className="text-xs text-[#7C571C] font-semibold cursor-pointer hover:underline">
                Ver los {servicios.length} servicios →
              </span>
            </div>

            {/* Categorías de filtro estilo pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'cortes', label: 'Cortes' },
                { id: 'barba', label: 'Barba & Ritual' },
                { id: 'combos', label: 'Combos' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaFiltro(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaFiltro === cat.id
                      ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                      : 'bg-[#FBEBE1] text-[#4F4539] hover:bg-[#F5E5DB] hover:text-[#221A14] border border-[#DFCBB5]/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Lista de Tarjetas de Servicio */}
            <div className="space-y-3">
              {serviciosFiltrados.map((s, idx) => {
                const foto = FOTOS_SERVICIOS[s.id] || FOTOS_SERVICIOS[1];
                const esMasPedido = idx === 0;

                return (
                  <div
                    key={s.id}
                    className="rounded-3xl bg-[#FFF1E9] border border-[#DFCBB5] hover:border-[#7C571C] p-3.5 sm:p-4 shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Thumbnail cuadrada con badge */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-[#DFCBB5] bg-[#FBEBE1]">
                        <img 
                          src={foto} 
                          alt={s.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#7C571C] inline-block shadow-xs ring-2 ring-white/70" />
                        </div>
                      </div>

                      {/* Detalles del Servicio */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                        <div>
                          {esMasPedido && (
                            <span className="text-[10px] font-bold text-[#7C571C] uppercase tracking-wider mb-0.5 block font-mono">
                              ★ N.° 1 EN RESERVAS
                            </span>
                          )}
                          <h3 className="text-sm font-serif font-bold text-[#221A14] leading-snug truncate">
                            {s.nombre}
                          </h3>
                          <span className="text-xs text-[#6F5A4B] block mt-0.5">
                            {s.duracionMinutos} min
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-[#6F5A4B] uppercase block">Precio a partir de</span>
                            <span className="text-sm sm:text-base font-serif font-bold text-[#7C571C]">
                              {formatPrecio(s.precio)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setServicioId(s.id);
                              setVistaActual('profesional');
                              scrollToContainer();
                            }}
                            className="px-4 py-2 rounded-full bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                          >
                            Reservar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer de la tarjeta con avatares */}
                    <div className="mt-3 pt-2.5 border-t border-[#DFCBB5]/60 flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#FFF1E9] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Barbero" />
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#FFF1E9] object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Barbero" />
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-[#FFF1E9] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Barbero" />
                      </div>
                      <span className="text-[11px] text-[#6F5A4B] truncate">
                        446 clientes lo reservaron este mes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 2: ELIGE TU PROFESIONAL                                        */}
      {/* ===================================================================== */}
      {vistaActual === 'profesional' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 pt-1 px-1">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] block">
                ELIGE TU PROFESIONAL
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#221A14] mt-0.5">
                {servicioSeleccionado.nombre}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setVistaActual('servicios');
                scrollToContainer();
              }}
              className="p-2 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] hover:text-[#221A14] cursor-pointer transition-colors"
              title="Volver"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7667]" />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={busquedaBarbero}
              onChange={(e) => setBusquedaBarbero(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-full py-2.5 pl-10 pr-4 text-xs text-[#221A14] placeholder-[#8C7667] focus:outline-none focus:border-[#7C571C] transition-colors shadow-xs"
            />
          </div>

          <div className="px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6F5A4B] block mb-2">
              ELIGE UNA OPCIÓN
            </span>

            {/* Grid de 2 columnas */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Cualquier Profesional */}
              <div
                onClick={() => {
                  setBarberoId('');
                  setVistaActual('horarios');
                  scrollToContainer();
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center justify-center active:scale-95 min-h-[140px] shadow-xs ${
                  barberoId === ''
                    ? 'bg-[#FBEBE1] border-[#7C571C] ring-2 ring-[#7C571C]/20 shadow-md'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#C49756]'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-[#FFF1E9] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] mb-2 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#221A14] leading-tight">Cualquier Profesional</h4>
                <span className="text-[10px] text-[#6F5A4B] mt-0.5">Turno más rápido</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#C49756]">
                  <Star className="w-3 h-3 fill-[#C49756]" />
                  <span className="text-[#221A14]">5.0</span>
                </div>
              </div>

              {/* Barberos */}
              {barberosFiltrados.map((b) => {
                const isSelected = String(barberoId) === String(b.id);
                const foto = b.fotoUrl || FOTOS_BARBEROS_DEFAULT[b.id] || FOTOS_BARBEROS_DEFAULT[101];

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setBarberoId(b.id);
                      setVistaActual('horarios');
                      scrollToContainer();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center justify-between active:scale-95 min-h-[140px] shadow-xs ${
                      isSelected
                        ? 'bg-[#FBEBE1] border-[#7C571C] ring-2 ring-[#7C571C]/20 shadow-md'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#C49756]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#DFCBB5] mb-2 shadow-xs bg-[#FBEBE1]">
                      <img 
                        src={foto} 
                        alt={b.nombre} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-[#221A14] leading-tight truncate max-w-[130px]">
                        {b.nombre}
                      </h4>
                      <span className="text-[10px] text-[#6F5A4B] block truncate max-w-[130px] mt-0.5">
                        Barbero Profesional
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#C49756]">
                      <Star className="w-3 h-3 fill-[#C49756]" />
                      <span className="text-[#221A14]">4.9</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 3: HORARIOS DISPONIBLES (CALENDARIO & HORAS - STEPPER 1/2)     */}
      {/* ===================================================================== */}
      {vistaActual === 'horarios' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Header con Stepper: Reservar [ (1) --- (2) ] (X) */}
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-base font-serif font-bold text-[#221A14]">Reservar</span>

            {/* Stepper (1) --- (2) */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#7C571C] text-[#FFFFFF] font-bold text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <div className="w-8 h-0.5 bg-[#DFCBB5]" />
              <div className="w-6 h-6 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] text-[#6F5A4B] font-bold text-xs flex items-center justify-center">
                2
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVistaActual('profesional');
                scrollToContainer();
              }}
              className="p-1.5 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Resumen del Servicio con Badge */}
          <div className="rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hora ? 'bg-[#DEF7EC] text-[#03543F] border border-[#84E1BC]' : 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]'
              }`}>
                {hora ? `Hora: ${hora}` : 'Sin hora seleccionada'}
              </span>

              <button
                type="button"
                onClick={() => setHora('')}
                className="text-[#6F5A4B] hover:text-[#221A14] text-[10px] cursor-pointer"
                title="Limpiar hora"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-sm font-serif font-bold text-[#221A14]">
                {servicioSeleccionado.nombre}
              </h3>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                {servicioSeleccionado.duracionMinutos} min • {barberoSeleccionado?.nombre || 'Cualquier Barbero'} • {formatPrecio(servicioSeleccionado.precio)}
              </p>
            </div>

            {/* Dropdown de Colaborador seleccionado */}
            <div className="pt-2 border-t border-[#DFCBB5]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#6F5A4B]">Colaborador seleccionado:</span>
              <button
                type="button"
                onClick={() => setVistaActual('profesional')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] text-xs font-bold text-[#221A14] cursor-pointer shadow-2xs"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-[#FBEBE1]">
                  <img 
                    src={barberoSeleccionado?.fotoUrl || FOTOS_BARBEROS_DEFAULT[barberoSeleccionado?.id || 101]} 
                    alt="Barbero"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span>{barberoSeleccionado?.nombre?.split(' ')[0] || 'Cualquiera'}</span>
                <ChevronDown className="w-3 h-3 text-[#6F5A4B]" />
              </button>
            </div>
          </div>

          {/* Carrusel de Días Horizontal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#221A14]">Horarios disponibles</h3>
                <span className="text-xs text-[#6F5A4B] capitalize">{diaActualInfo.nombreDiaLargo}</span>
              </div>
            </div>

            {/* Selector de días estilo carrusel */}
            <div className="flex items-center gap-1.5 sm:gap-2 justify-between">
              <button
                type="button"
                onClick={() => setOffsetDias(prev => Math.max(0, prev - 1))}
                disabled={offsetDias === 0}
                className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] flex items-center justify-center text-[#6F5A4B] hover:text-[#221A14] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 grid grid-cols-4 gap-1.5">
                {diasVisibles.map(d => {
                  const isSelected = fecha === d.fechaIso;
                  return (
                    <button
                      key={d.fechaIso}
                      type="button"
                      onClick={() => setFecha(d.fechaIso)}
                      className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#7C571C] text-[#FFFFFF] shadow-md font-bold scale-[1.03]'
                          : 'bg-[#FFFFFF] text-[#4F4539] border border-[#DFCBB5] hover:border-[#7C571C] shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-mono leading-none">{d.diaAbrev}</span>
                      <span className="text-base font-bold mt-1 leading-none">{d.numeroDia}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setOffsetDias(prev => Math.min(listaDias.length - 4, prev + 1))}
                disabled={offsetDias >= listaDias.length - 4}
                className="w-9 h-9 rounded-full bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] flex items-center justify-center text-[#6F5A4B] hover:text-[#221A14] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Botón para desplegar calendario */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectorFechaAbierto(!selectorFechaAbierto)}
                className="w-7 h-7 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#6F5A4B] hover:text-[#7C571C] cursor-pointer"
                title="Elegir fecha específica"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectorFechaAbierto && (
              <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] shadow-lg animate-in fade-in duration-150">
                <VintageDatePicker
                  value={fecha}
                  onChange={(f) => {
                    setFecha(f);
                    setSelectorFechaAbierto(false);
                  }}
                  minDate={colClock.fecha}
                />
              </div>
            )}
          </div>

          {/* Filtro de Franjas Segmentadas: Mañana | Tarde | Noche */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5]">
            <button
              type="button"
              onClick={() => setFranjaActiva('manana')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                franjaActiva === 'manana'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mañana</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${franjaActiva === 'manana' ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#6F5A4B]'}`}>
                {conteoDisponibles.manana}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFranjaActiva('tarde')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                franjaActiva === 'tarde'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Sunset className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tarde</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${franjaActiva === 'tarde' ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#6F5A4B]'}`}>
                {conteoDisponibles.tarde}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFranjaActiva('noche')}
              className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                franjaActiva === 'noche'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Noche</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${franjaActiva === 'noche' ? 'bg-[#FFFFFF]/25 text-[#FFFFFF]' : 'bg-[#FFFFFF] text-[#6F5A4B]'}`}>
                {conteoDisponibles.noche}
              </span>
            </button>
          </div>

          {/* Subtítulo de turnos y duración */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#221A14]">
              {conteoDisponibles[franjaActiva]} Horarios disponibles: {franjaActiva === 'manana' ? 'Mañana' : franjaActiva === 'tarde' ? 'Tarde' : 'Noche'}
            </span>
            <span className="text-[11px] text-[#6F5A4B]">
              Duración {servicioSeleccionado.duracionMinutos} min
            </span>
          </div>

          {/* Grid de 2 Columnas de Horarios */}
          {cargandoHorarios ? (
            <div className="h-36 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col items-center justify-center gap-2 text-xs text-[#6F5A4B] shadow-xs">
              <Clock className="w-5 h-5 animate-spin text-[#7C571C]" />
              <span>Consultando turnos en salón...</span>
            </div>
          ) : slotsPorFranja[franjaActiva].length === 0 ? (
            <div className="h-32 rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col items-center justify-center text-center p-4 text-xs text-[#6F5A4B] shadow-xs">
              <Ban className="w-5 h-5 text-[#8C7667] mb-1" />
              <span>No hay turnos configurados en este periodo.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {slotsPorFranja[franjaActiva].map((slot) => {
                const isSelected = hora === slot.hora12;
                const isPassed = slot.esPasado || isSlotPassedInColombia(slot.hora12, fecha);
                const isOccupied = !slot.disponible && !isPassed;

                if (isPassed || isOccupied) {
                  return (
                    <button
                      key={slot.hora12}
                      type="button"
                      disabled
                      className="py-3 px-3 rounded-2xl bg-[#FBEBE1]/60 border border-[#DFCBB5]/50 text-[#A8988B] cursor-not-allowed text-xs font-medium flex items-center justify-between opacity-60"
                    >
                      <span className="line-through">{slot.hora12}</span>
                      <span className="text-[9px] uppercase">{isPassed ? 'Pasado' : 'Ocupado'}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={slot.hora12}
                    type="button"
                    onClick={() => setHora(slot.hora12)}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between active:scale-95 shadow-2xs ${
                      isSelected
                        ? 'bg-[#7C571C] text-[#FFFFFF] border border-[#7C571C] shadow-md ring-2 ring-[#7C571C]/20'
                        : 'bg-[#FFFFFF] text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C]'
                    }`}
                  >
                    <span>{slot.hora12}</span>
                    <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-[#FFFFFF]' : 'text-[#15803D]'}`}>
                      Libre
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VISTA 4: DATOS DEL CLIENTE (STEPPER 2/2)                             */}
      {/* ===================================================================== */}
      {vistaActual === 'datos' && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
          
          {/* Header con Stepper: Reservar [ (✓) --- (2) ] (X) */}
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="text-base font-serif font-bold text-[#221A14]">Reservar</span>

            {/* Stepper (✓) --- (2) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVistaActual('horarios')}
                className="w-6 h-6 rounded-full bg-[#15803D] text-[#FFFFFF] font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
                title="Volver a horarios"
              >
                ✓
              </button>
              <div className="w-8 h-0.5 bg-[#7C571C]" />
              <div className="w-6 h-6 rounded-full bg-[#7C571C] text-[#FFFFFF] font-bold text-xs flex items-center justify-center shadow-xs">
                2
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVistaActual('horarios');
                scrollToContainer();
              }}
              className="p-1.5 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alertas */}
          {intentadoEnviar && (!clienteNombre.trim() || !clienteTelefono.trim()) && (
            <div className="p-3.5 rounded-2xl bg-[#FEF08A]/50 border border-[#FACC15] text-[#854D0E] text-xs flex items-center gap-2 animate-in fade-in duration-150 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#854D0E]" />
              <span>Debes completar los campos obligatorios del cliente</span>
            </div>
          )}

          {errorMensaje && (
            <div className="p-3.5 rounded-2xl bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] text-xs flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMensaje}</span>
            </div>
          )}

          {/* Campos del Formulario */}
          <div className="space-y-3.5">
            {/* Campo Nombre Completo */}
            <div>
              <label className="block text-xs font-semibold text-[#221A14] mb-1.5">
                Nombre completo <span className="text-[#7C571C]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7667]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className={`w-full bg-[#FFFFFF] rounded-2xl py-3 pl-11 pr-4 text-xs text-[#221A14] placeholder-[#8C7667] focus:outline-none transition-colors border shadow-2xs ${
                    intentadoEnviar && !clienteNombre.trim() ? 'border-[#E02424]' : 'border-[#DFCBB5] focus:border-[#7C571C]'
                  }`}
                  required
                />
              </div>
              {intentadoEnviar && !clienteNombre.trim() && (
                <span className="text-[11px] text-[#E02424] block mt-1">Campo requerido</span>
              )}
            </div>

            {/* Campo Correo Electrónico */}
            <div>
              <label className="block text-xs font-semibold text-[#221A14] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7667]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-2xl py-3 pl-11 pr-4 text-xs text-[#221A14] placeholder-[#8C7667] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs"
                />
              </div>
              <span className="text-[11px] text-[#6F5A4B] block mt-1">
                Si lo dejas, te llega confirmación por mail.
              </span>
            </div>

            {/* Campo Teléfono Celular */}
            <div>
              <label className="block text-xs font-semibold text-[#221A14] mb-1.5">
                Teléfono celular <span className="text-[#7C571C]">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 px-3 py-3 rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5] text-xs font-bold text-[#221A14] shrink-0">
                  <span>🇨🇴</span>
                  <span>+57</span>
                </div>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7667]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="300 123 4567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className={`w-full bg-[#FFFFFF] rounded-2xl py-3 pl-11 pr-4 text-xs text-[#221A14] placeholder-[#8C7667] focus:outline-none transition-colors border shadow-2xs ${
                      intentadoEnviar && !clienteTelefono.trim() ? 'border-[#E02424]' : 'border-[#DFCBB5] focus:border-[#7C571C]'
                    }`}
                    required
                  />
                </div>
              </div>
              <span className="text-[11px] text-[#6F5A4B] block mt-1">
                Te enviamos confirmación y recordatorios por WhatsApp.
              </span>
              {intentadoEnviar && !clienteTelefono.trim() && (
                <span className="text-[11px] text-[#E02424] block mt-1">Campo requerido</span>
              )}
            </div>

            {/* Botón de Política de Cancelación */}
            <div
              onClick={() => setModalPoliticaAbierto(true)}
              className="p-3.5 rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] hover:border-[#7C571C] flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#7C571C]" />
                <span className="text-xs font-semibold text-[#221A14]">Política de cancelación</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6F5A4B]" />
            </div>

            {/* Habeas Data Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="checkbox-habeas-data"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#DFCBB5] bg-[#FFFFFF] text-[#7C571C] focus:ring-0 cursor-pointer accent-[#7C571C]"
              />
              <label htmlFor="checkbox-habeas-data" className="text-[11px] text-[#6F5A4B] leading-relaxed cursor-pointer select-none">
                Acepto el tratamiento de datos y recordatorios de turno conforme a la Ley 1581 de 2012.
              </label>
            </div>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* BARRA STICKY INFERIOR FLOTANTE (RESUMEN ^ + BOTÓN SIGUIENTE / CONFIRMAR) */}
      {/* ===================================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F5]/98 backdrop-blur-xl border-t border-[#DFCBB5] px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom,14px))] shadow-[0_-6px_25px_rgba(44,29,17,0.12)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          
          {/* Lado Izquierdo: RESUMEN ^ / TOTAL A PAGAR */}
          <div
            onClick={() => setResumenAbierto(!resumenAbierto)}
            className="cursor-pointer group select-none"
          >
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#6F5A4B] group-hover:text-[#7C571C] transition-colors">
              <span>{vistaActual === 'datos' ? 'TOTAL A PAGAR' : 'RESUMEN'}</span>
              {resumenAbierto ? <ChevronDown className="w-3.5 h-3.5 text-[#7C571C]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#7C571C]" />}
            </div>
            <span className="text-[10px] text-[#6F5A4B] block">Precio a partir de</span>
            <span className="text-sm sm:text-base font-serif font-bold text-[#7C571C] block leading-tight">
              {formatPrecio(servicioSeleccionado.precio)}
            </span>
          </div>

          {/* Lado Derecho: Botón de Acción */}
          {vistaActual === 'servicios' && (
            <button
              type="button"
              onClick={() => {
                setVistaActual('profesional');
                scrollToContainer();
              }}
              className="px-6 sm:px-8 py-3 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Siguiente</span>
              <span className="w-5 h-5 rounded-full bg-[#FFFFFF]/25 text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                1
              </span>
            </button>
          )}

          {vistaActual === 'profesional' && (
            <button
              type="button"
              onClick={() => {
                setVistaActual('horarios');
                scrollToContainer();
              }}
              className="px-6 sm:px-8 py-3 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Siguiente</span>
              <span className="w-5 h-5 rounded-full bg-[#FFFFFF]/25 text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                1
              </span>
            </button>
          )}

          {vistaActual === 'horarios' && (
            <button
              type="button"
              disabled={!hora}
              onClick={() => {
                setVistaActual('datos');
                scrollToContainer();
              }}
              className="px-6 sm:px-8 py-3 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <span className="w-5 h-5 rounded-full bg-[#FFFFFF]/25 text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                1
              </span>
            </button>
          )}

          {vistaActual === 'datos' && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => handleSubmit()}
              className="px-6 sm:px-8 py-3 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40"
            >
              {enviando ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Confirmando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar</span>
                  <span className="w-5 h-5 rounded-full bg-[#FFFFFF]/25 text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                    1
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Desplegable del Resumen */}
        {resumenAbierto && (
          <div className="max-w-xl mx-auto mt-3 pt-3 border-t border-[#DFCBB5] text-xs text-[#6F5A4B] space-y-1.5 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex justify-between">
              <span>Sede:</span>
              <span className="text-[#221A14] font-semibold">{sucursalSeleccionada.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span>Servicio:</span>
              <span className="text-[#221A14] font-semibold">{servicioSeleccionado.nombre} ({servicioSeleccionado.duracionMinutos} min)</span>
            </div>
            <div className="flex justify-between">
              <span>Profesional:</span>
              <span className="text-[#7C571C] font-semibold">{barberoSeleccionado?.nombre || 'Cualquier Profesional'}</span>
            </div>
            {hora && (
              <div className="flex justify-between">
                <span>Fecha & Hora:</span>
                <span className="text-[#221A14] font-semibold">{fecha} a las {hora}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE POLÍTICA DE CANCELACIÓN                                      */}
      {/* ===================================================================== */}
      {modalPoliticaAbierto && (
        <div className="fixed inset-0 z-50 bg-[#221A14]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FFF8F5] border border-[#DFCBB5] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2 text-[#7C571C]">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-serif font-bold text-[#221A14]">Política de Cancelación</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPoliticaAbierto(false)}
                className="text-[#6F5A4B] hover:text-[#221A14] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#4F4539] leading-relaxed">
              En <strong className="text-[#221A14]">Barbería La Casa del Rey</strong> valoramos tu tiempo y el de nuestros maestros barberos.
            </p>
            <ul className="text-xs text-[#6F5A4B] space-y-2 list-disc pl-4">
              <li>Puedes cancelar o reprogramar tu turno con al menos <strong className="text-[#221A14]">2 horas de anticipación</strong> sin costo alguno.</li>
              <li>Agradecemos llegar 5 minutos antes para degustar tu café de cortesía o bebida de bienvenida.</li>
              <li>Puedes gestionar cualquier cambio directamente por nuestro WhatsApp oficial <strong className="text-[#7C571C]">{WHATSAPP_BARBERIA_DISPLAY}</strong>.</li>
            </ul>
            <button
              type="button"
              onClick={() => setModalPoliticaAbierto(false)}
              className="w-full py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] font-bold text-xs cursor-pointer transition-colors shadow-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
