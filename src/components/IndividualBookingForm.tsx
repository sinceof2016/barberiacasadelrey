import React, { useState, useEffect } from 'react';
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
  ShieldCheck, 
  MapPin, 
  Building2,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  RotateCcw
} from 'lucide-react';
import { AddToCalendarButtons } from './AddToCalendarButtons';
import { 
  WhatsAppConfirmButton, 
  WHATSAPP_BARBERIA_DISPLAY, 
  WHATSAPP_BARBERIA_NUMERO,
  generarTextoMensajeReserva, 
  generarUrlWhatsAppBarberia,
  generarUrlWaMeBarberia
} from './WhatsAppConfirmButton';
import { VintageDatePicker } from './VintageDatePicker';
import { useColombiaClock, getColombiaDateTime, isSlotPassedInColombia } from '../utils/colombiaTime';
import { sucursalesCasaDelRey } from '../services/localData';
import { 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageCrownIcon,
  VintageBarberPole, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';
import { 
  guardarDatosClienteRecurrente, 
  obtenerDatosClienteRecurrente, 
  tieneConsentimiento,
  registrarEventoAnalitica 
} from '../services/cookieService';
import { validarNombre, validarTelefono, validarEmail, validarTextoSeguro } from '../utils/security';

interface IndividualBookingFormProps {
  servicios: Servicio[];
  barberos: Barbero[];
  preselectedServiceId?: number;
  preselectedBarberId?: number;
  onBookingSuccess: (cita: Cita) => void;
}

type BookingStep = 1 | 2 | 3 | 4 | 5;

export const IndividualBookingForm: React.FC<IndividualBookingFormProps> = ({
  servicios,
  barberos,
  preselectedServiceId,
  preselectedBarberId,
  onBookingSuccess,
}) => {
  const colClock = useColombiaClock();

  // Wizard Section Step (1: Sede, 2: Servicio, 3: Barbero, 4: Fecha & Hora, 5: Datos & Confirmación)
  const [pasoActual, setPasoActual] = useState<BookingStep>(1);

  // Form selections
  const [sucursalId, setSucursalId] = useState<string>('suc-chico');
  const [servicioId, setServicioId] = useState<number>(preselectedServiceId || (servicios[0]?.id ?? 1));
  const [barberoId, setBarberoId] = useState<string | number>(preselectedBarberId || '');
  
  const [fecha, setFecha] = useState<string>(() => getColombiaDateTime().fecha);
  const [hora, setHora] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [aceptaTerminos, setAceptaTerminos] = useState<boolean>(true);
  const [honeypotEmpresa, setHoneypotEmpresa] = useState<string>(''); // Campo trampa anti-spam

  // Filter for services tab
  const [categoriaServicio, setCategoriaServicio] = useState<string>('todos');

  // Slots & Loading
  const [slotsDisponibilidad, setSlotsDisponibilidad] = useState<HorarioSlot[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [cookieFuncionalActiva, setCookieFuncionalActiva] = useState<boolean>(() => tieneConsentimiento('funcionales'));
  const [datosCargadosDeCookie, setDatosCargadosDeCookie] = useState<boolean>(false);

  // Cargar datos guardados en cookies funcionales para clientes recurrentes
  useEffect(() => {
    if (tieneConsentimiento('funcionales')) {
      const rec = obtenerDatosClienteRecurrente();
      if (rec) {
        if (rec.nombre) setClienteNombre(rec.nombre);
        if (rec.telefono) setClienteTelefono(rec.telefono);
        if (rec.email) setClienteEmail(rec.email);
        if (rec.sucursalId) setSucursalId(rec.sucursalId);
        setDatosCargadosDeCookie(true);
      }
    }

    const handler = () => {
      const activa = tieneConsentimiento('funcionales');
      setCookieFuncionalActiva(activa);
      if (activa) {
        const rec = obtenerDatosClienteRecurrente();
        if (rec) {
          if (rec.nombre) setClienteNombre(rec.nombre);
          if (rec.telefono) setClienteTelefono(rec.telefono);
          if (rec.email) setClienteEmail(rec.email);
          if (rec.sucursalId) setSucursalId(rec.sucursalId);
          setDatosCargadosDeCookie(true);
        }
      } else {
        setDatosCargadosDeCookie(false);
      }
    };

    window.addEventListener('cdr_cookie_consent_changed', handler);
    return () => window.removeEventListener('cdr_cookie_consent_changed', handler);
  }, []);

  useEffect(() => {
    if (preselectedServiceId) setServicioId(preselectedServiceId);
  }, [preselectedServiceId]);

  useEffect(() => {
    if (preselectedBarberId) setBarberoId(preselectedBarberId);
  }, [preselectedBarberId]);

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

          if (disponibles.length > 0) {
            setHora(prev => (disponibles.includes(prev) ? prev : disponibles[0]));
          } else {
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

  useEffect(() => {
    if (citaCreada) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [citaCreada]);

  const scrollToSectionTop = () => {
    const el = document.getElementById('booking-section-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleSeleccionarSede = (sId: string) => {
    setSucursalId(sId);
    if (barberoId) {
      const barb = barberos.find(b => String(b.id) === String(barberoId));
      if (barb && barb.sucursalId && barb.sucursalId !== sId) {
        setBarberoId('');
      }
    }
    setErrorMensaje(null);
    // Transición suave inmediata a la siguiente pantalla (Paso 2: Servicios)
    setTimeout(() => {
      setPasoActual(2);
      scrollToSectionTop();
    }, 220);
  };

  const handleAvanzarPaso = (siguientePaso: BookingStep) => {
    setErrorMensaje(null);

    // Validaciones por paso antes de avanzar
    if (pasoActual === 1 && siguientePaso > 1) {
      if (!sucursalId) {
        setErrorMensaje('Por favor selecciona una sede para continuar.');
        return;
      }
    }

    if (pasoActual === 2 && siguientePaso > 2) {
      if (!servicioId) {
        setErrorMensaje('Por favor selecciona un servicio de la carta para continuar.');
        return;
      }
    }

    if (pasoActual === 4 && siguientePaso > 4) {
      if (!hora) {
        setErrorMensaje('Por favor selecciona una hora disponible para tu cita.');
        return;
      }
      if (isSlotPassedInColombia(hora, fecha)) {
        setErrorMensaje(`El horario seleccionado (${hora}) ya ha transcurrido. Por favor selecciona un turno libre.`);
        return;
      }
    }

    setPasoActual(siguientePaso);
    scrollToSectionTop();
  };

  const handleRetrocederPaso = () => {
    setErrorMensaje(null);
    setPasoActual(prev => (Math.max(1, prev - 1) as BookingStep));
    scrollToSectionTop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    if (honeypotEmpresa.trim() !== '') {
      console.warn('Bot submission blocked by honeypot.');
      return;
    }

    // Validación escrita estricta contra comandos y código malicioso
    const nombreVal = validarNombre(clienteNombre);
    if (!nombreVal.esValido) {
      setErrorMensaje(nombreVal.motivo || 'El nombre ingresado contiene caracteres o formato no válido.');
      return;
    }

    const telVal = validarTelefono(clienteTelefono);
    if (!telVal.esValido) {
      setErrorMensaje(telVal.motivo || 'El teléfono ingresado contiene caracteres o formato no válido.');
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
      setErrorMensaje('Por favor selecciona un horario disponible para el turno.');
      return;
    }

    if (!aceptaTerminos) {
      setErrorMensaje('Por favor acepta el tratamiento de datos y confirmación del turno para proceder.');
      return;
    }

    if (isSlotPassedInColombia(hora, fecha)) {
      setErrorMensaje(`El horario seleccionado (${hora}) ya transcurrió según el reloj oficial de Colombia (${colClock.hora12}). Por favor selecciona un turno futuro.`);
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
        onBookingSuccess(resp.reserva);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const servicioSeleccionado = servicios.find(s => s.id === Number(servicioId));
  const barberoSeleccionado = barberos.find(b => String(b.id) === String(barberoId));
  const sucursalSeleccionada = sucursalesCasaDelRey.find(s => s.id === sucursalId);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  // Filtrado de servicios por categoría
  const serviciosFiltrados = servicios.filter(s => {
    if (categoriaServicio === 'todos') return true;
    const n = s.nombre.toLowerCase();
    if (categoriaServicio === 'combos') return n.includes('combo') || n.includes('paquete') || n.includes('completo');
    if (categoriaServicio === 'barba') return n.includes('barba') || n.includes('afeitado') || n.includes('ritual');
    if (categoriaServicio === 'cortes') return !n.includes('combo') && (n.includes('corte') || n.includes('cabello') || n.includes('niño'));
    return true;
  });

  const barberosFiltrados = barberos.filter(
    b => !b.sucursalId || b.sucursalId === sucursalId
  );

  // VISTA DE RESERVA CONFIRMADA (Voucher oficial)
  if (citaCreada) {
    return (
      <div className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-5 sm:p-7 shadow-md relative overflow-hidden font-mono text-xs text-[#221A14]">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex items-start sm:items-center justify-between border-b border-[#DFCBB5] pb-4 mb-5 pt-1 max-w-full">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1 max-w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] flex items-center justify-center shadow-2xs shrink-0 mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-xs sm:text-lg font-serif font-bold text-[#221A14] tracking-wide leading-tight break-words">
                  TURNO CONFIRMADO EN EL LIBRO DE CITAS
                </h3>
                <span className="px-1.5 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-mono font-bold rounded-full border border-[#86EFAC] shrink-0">
                  {citaCreada.estado}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6F5A4B] font-mono mt-0.5 break-all">
                CÓDIGO OFICIAL: <span className="font-bold text-[#7C571C]">{citaCreada.idReserva}</span>
              </p>
            </div>
          </div>
          <VintageWaxSeal text="CONFIRMADO" className="hidden sm:inline-flex shrink-0 ml-2" />
        </div>

        {/* Vintage Voucher card */}
        <div className="rounded-xl bg-[#FFFFFF] p-4 sm:p-5 border border-[#DFCBB5] space-y-3 mb-5 font-mono text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase tracking-wider block font-bold">
                CÓDIGO DE RESERVA
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-[#7C571C]">{citaCreada.idReserva}</span>
                <button
                  onClick={handleCopiarId}
                  className="p-1.5 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] hover:text-[#221A14] transition-all cursor-pointer shadow-2xs"
                  title="Copiar código"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">VALOR EN CAJA</span>
              <span className="text-base font-bold text-[#221A14]">
                {formatPrecio(citaCreada.precioTotal || 35000)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block">Caballero:</span>
              <span className="font-bold text-[#221A14]">{citaCreada.clienteNombre}</span>
              <span className="text-[10px] text-[#6F5A4B] block">{citaCreada.clienteTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block">Servicio:</span>
              <span className="font-bold text-[#221A14]">{citaCreada.servicioNombre}</span>
              <span className="text-[10px] text-[#7C571C] block">
                {citaCreada.barberoNombre ? `Atendido por ${citaCreada.barberoNombre}` : 'Barbero según asignación de sala'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block">Fecha y Turno:</span>
              <span className="font-bold text-[#7C571C] text-sm">
                {citaCreada.fecha} a las {citaCreada.hora}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block">Sede Asignada:</span>
              <span className="font-bold text-[#221A14]">
                {citaCreada.sucursalNombre || 'Sede Chicó Real'}
              </span>
            </div>
          </div>
        </div>

        {/* Sincronización con Calendario y WhatsApp */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5]">
            <p className="text-xs font-bold text-[#7C571C] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>AÑADIR A TU CALENDARIO PERSONAL</span>
            </p>
            <AddToCalendarButtons cita={citaCreada} />
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block animate-pulse" />
                <span className="text-xs font-bold text-[#221A14]">
                  Notificación automática WhatsApp activada
                </span>
              </div>
              <span className="text-[11px] text-[#6F5A4B] block mt-0.5">
                Turno notificado a la línea oficial {WHATSAPP_BARBERIA_DISPLAY}
              </span>
            </div>
            <WhatsAppConfirmButton cita={citaCreada} autoNotificar={true} className="w-full sm:w-auto" />
          </div>

          <button
            type="button"
            onClick={() => {
              setCitaCreada(null);
              setPasoActual(1);
            }}
            className="w-full py-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Agendar Otro Turno</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="booking-section-container" className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-3 sm:p-6 shadow-md relative overflow-hidden font-mono text-xs text-[#221A14]">
      <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

      {/* HEADER CON NAVEGADOR DE SECCIONES / PASOS */}
      <div className="border-b border-[#DFCBB5] pb-3 sm:pb-4 mb-4 sm:mb-5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <VintageCrownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C571C]" />
              <h2 className="font-serif text-sm sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                Reserva de Turno Individual
              </h2>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#6F5A4B] font-mono mt-0.5 hidden sm:block">
              Experiencia pantalla por pantalla: avanza paso a paso hasta asegurar tu sillón real
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FBEBE1] px-2.5 py-1 rounded-full border border-[#DFCBB5]">
            <span className="text-[9px] sm:text-[10px] text-[#6F5A4B] font-bold uppercase">Paso {pasoActual} de 5</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C]" />
            <span className="text-[9px] sm:text-[10px] text-[#7C571C] font-bold">
              {pasoActual === 1 ? 'Sede' : pasoActual === 2 ? 'Servicio' : pasoActual === 3 ? 'Barbero' : pasoActual === 4 ? 'Fecha & Hora' : 'Confirmar'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NAVEGADOR DE PASOS / STEPPER OPTIMIZADO PARA MÓVIL (PANTALLAS < SM)       */}
        {/* ========================================================================= */}
        <div className="sm:hidden mb-1">
          <div className="flex items-center justify-between relative px-2 py-1">
            {/* Línea conectora de fondo */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[#DFCBB5] rounded-full" />
            {/* Línea de progreso activa */}
            <div 
              className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-[#7C571C] rounded-full transition-all duration-300"
              style={{ width: `${((pasoActual - 1) / 4) * 80}%` }}
            />

            {[
              { num: 1 as BookingStep, shortLabel: 'Sede' },
              { num: 2 as BookingStep, shortLabel: 'Servicio' },
              { num: 3 as BookingStep, shortLabel: 'Barbero' },
              { num: 4 as BookingStep, shortLabel: 'Horario' },
              { num: 5 as BookingStep, shortLabel: 'Datos' },
            ].map(step => {
              const isActive = pasoActual === step.num;
              const isDone = pasoActual > step.num;
              const canClick = step.num < pasoActual ||
                (step.num === 2 && sucursalId) ||
                (step.num === 3 && sucursalId && servicioId) ||
                (step.num === 4 && sucursalId && servicioId) ||
                (step.num === 5 && sucursalId && servicioId && hora);

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (canClick) {
                      setPasoActual(step.num);
                      scrollToSectionTop();
                    }
                  }}
                  disabled={!canClick}
                  className={`relative z-10 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${
                    !canClick ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                  aria-label={`Ir al paso ${step.num}: ${step.shortLabel}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      isActive
                        ? 'bg-[#7C571C] text-[#FAF6EE] ring-3 ring-[#FBEBE1] ring-offset-1 scale-110 font-black'
                        : isDone
                        ? 'bg-[#15803D] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#6F5A4B] border border-[#DFCBB5]'
                    }`}
                  >
                    {isDone ? (
                      <CheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <span>{step.num}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-mono leading-none tracking-tight font-bold ${
                    isActive ? 'text-[#7C571C]' : isDone ? 'text-[#15803D]' : 'text-[#8A796D]'
                  }`}>
                    {step.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NAVEGADOR DE PASOS PARA ESCRITORIO / TABLET (SM EN ADELANTE)              */}
        {/* ========================================================================= */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-2">
          {[
            { num: 1 as BookingStep, label: 'Sede', icon: Building2 },
            { num: 2 as BookingStep, label: 'Servicio', icon: VintageScissorsIcon },
            { num: 3 as BookingStep, label: 'Barbero', icon: StraightRazorIcon },
            { num: 4 as BookingStep, label: 'Fecha & Hora', icon: Clock },
            { num: 5 as BookingStep, label: 'Confirmar', icon: ShieldCheck },
          ].map(step => {
            const isActive = pasoActual === step.num;
            const isDone = pasoActual > step.num;
            const StepIcon = step.icon;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  // Permitir ir a pasos anteriores o si el paso ya es alcanzable
                  if (step.num < pasoActual) {
                    setPasoActual(step.num);
                    scrollToSectionTop();
                  } else if (step.num === 2 && sucursalId) {
                    setPasoActual(2);
                    scrollToSectionTop();
                  } else if (step.num === 3 && sucursalId && servicioId) {
                    setPasoActual(3);
                    scrollToSectionTop();
                  } else if (step.num === 4 && sucursalId && servicioId) {
                    setPasoActual(4);
                    scrollToSectionTop();
                  } else if (step.num === 5 && sucursalId && servicioId && hora) {
                    setPasoActual(5);
                    scrollToSectionTop();
                  }
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[50px] relative ${
                  isActive
                    ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] shadow-sm ring-1 ring-[#7C571C]'
                    : isDone
                    ? 'bg-[#EBF7EE] text-[#15803D] border-[#86EFAC] hover:bg-[#DDF3E2]'
                    : 'bg-[#FFFFFF] text-[#8A796D] border-[#DFCBB5]/70 opacity-70'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <CheckIcon className="w-3.5 h-3.5 text-[#15803D]" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${isActive ? 'bg-[#FAF6EE] text-[#7C571C]' : 'bg-[#DFCBB5] text-[#221A14]'}`}>
                      {step.num}
                    </span>
                  )}
                  <span className="text-xs font-bold uppercase truncate">
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerta de Error si la hay */}
      {errorMensaje && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMensaje(null)}
            className="text-[#BA1A1A] p-1 hover:bg-[#FFB4AB] rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 1: SELECCIÓN DE SEDE (1 A LA VEZ) */}
      {/* ========================================================================= */}
      {pasoActual === 1 && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#7C571C] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7C571C]" />
                <span>PANTALLA 1 // SELECCIONA LA SEDE</span>
              </label>
              <span className="text-[9px] sm:text-[10px] text-[#6F5A4B] font-mono lowercase">
                ({sucursalesCasaDelRey.length} sedes Bogotá)
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#6F5A4B] mb-2.5 sm:mb-3">
              Toca la sede de tu preferencia para avanzar a la carta de servicios.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {sucursalesCasaDelRey.map(s => {
                const isSelected = sucursalId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSeleccionarSede(s.id)}
                    className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative active:scale-[0.99] min-h-[100px] sm:min-h-[105px] ${
                      isSelected
                        ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-md ring-2 ring-[#7C571C]'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-sm font-serif font-bold text-[#221A14] tracking-wide">
                          {s.nombre}
                        </span>
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#15803D] text-[#FAF6EE] text-[9px] font-bold shrink-0 flex items-center gap-1">
                            <CheckIcon className="w-2.5 h-2.5" />
                            <span>Elegida</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#FBEBE1] text-[#7C571C] text-[9px] font-mono font-bold shrink-0 border border-[#DFCBB5]">
                            Elegir →
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6F5A4B] leading-relaxed font-mono mb-2">
                        {s.direccion}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#DFCBB5]/60 flex items-center justify-between text-[10px] font-mono text-[#7C571C]">
                      <span className="font-bold">{s.ciudad}</span>
                      <span className="text-[#6F5A4B]">{s.telefono}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón de Siguiente para la Pantalla 1 */}
          <div className="pt-3 border-t border-[#DFCBB5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div>
              <span className="text-[9px] sm:text-[10px] text-[#6F5A4B] block font-mono">Sede elegida:</span>
              <span className="font-bold text-[#221A14] text-xs">
                {sucursalSeleccionada?.nombre || 'Selecciona una sede arriba'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAvanzarPaso(2)}
              disabled={!sucursalId}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95 min-h-[44px]"
            >
              <span>Continuar a Servicios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 2: SELECCIÓN DE SERVICIO (1 A LA VEZ) */}
      {/* ========================================================================= */}
      {pasoActual === 2 && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Banner de Sede Activa */}
          <div className="p-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#7C571C] shrink-0" />
              <div className="truncate">
                <span className="text-[9px] text-[#6F5A4B] font-mono uppercase block">Sede de atención:</span>
                <span className="text-xs font-serif font-bold text-[#221A14] truncate block">{sucursalSeleccionada?.nombre}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasoActual(1);
                scrollToSectionTop();
              }}
              className="text-[10px] font-mono font-bold text-[#7C571C] hover:underline px-2.5 py-1 rounded bg-[#FBEBE1] border border-[#DFCBB5] cursor-pointer shrink-0"
            >
              Cambiar Sede
            </button>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] flex items-center gap-1.5">
                <VintageScissorsIcon className="w-3.5 h-3.5 text-[#7C571C]" />
                <span>PANTALLA 2 // SELECCIONA EL SERVICIO</span>
              </label>

              {/* Filtros por Categoría */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'cortes', label: 'Cortes' },
                  { id: 'barba', label: 'Barba & Ritual' },
                  { id: 'combos', label: 'Combos Reales' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaServicio(cat.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      categoriaServicio === cat.id
                        ? 'bg-[#7C571C] text-[#FAF6EE] shadow-2xs'
                        : 'bg-[#FFFFFF] text-[#6F5A4B] border border-[#DFCBB5] hover:bg-[#FBEBE1]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[50vh] sm:max-h-[440px] overflow-y-auto pr-1">
              {serviciosFiltrados.map(s => {
                const isSelected = Number(servicioId) === s.id;
                const esCombo = s.nombre.toLowerCase().includes('combo');
                return (
                  <div
                    key={s.id}
                    onClick={() => setServicioId(s.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden active:scale-98 min-h-[90px] ${
                      isSelected
                        ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs ring-1.5 ring-[#7C571C]'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                    }`}
                  >
                    {esCombo && (
                      <span className="absolute top-0 right-0 bg-[#7C571C] text-[#FAF6EE] text-[8px] font-mono font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        COMBO
                      </span>
                    )}
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-serif font-bold text-[#221A14] tracking-wide leading-tight">
                          {s.nombre}
                        </span>
                        <span className="text-[10px] font-mono text-[#6F5A4B] shrink-0 mt-0.5 bg-[#FFF8F5] px-1.5 py-0.5 rounded border border-[#DFCBB5]/60">
                          {s.duracionMinutos}m
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6F5A4B] line-clamp-2 leading-relaxed mb-2 font-mono">
                        {s.descripcion}
                      </p>
                    </div>
                    <div className="mt-1 pt-2 border-t border-[#DFCBB5]/50 flex items-center justify-between">
                      <span className="text-[9px] text-[#6F5A4B] uppercase">Tarifa en Caja</span>
                      <span className="text-xs font-mono font-bold text-[#7C571C]">{formatPrecio(s.precio)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navegación Pantalla 2 */}
          <div className="pt-3 border-t border-[#DFCBB5] grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRetrocederPaso}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#6F5A4B] border border-[#DFCBB5] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás (Sede)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAvanzarPaso(3)}
              disabled={!servicioId}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95 min-h-[44px]"
            >
              <span>Continuar al Barbero</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 3: ELECCIÓN DEL MAESTRO BARBERO */}
      {/* ========================================================================= */}
      {pasoActual === 3 && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Banner de Resumen Previo */}
          <div className="p-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs min-w-0">
              <span className="font-serif font-bold text-[#221A14] truncate">📍 {sucursalSeleccionada?.nombre}</span>
              <span className="text-[#DFCBB5] hidden sm:inline">&bull;</span>
              <span className="text-[#7C571C] font-bold truncate">✂️ {servicioSeleccionado?.nombre}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasoActual(2);
                scrollToSectionTop();
              }}
              className="text-[10px] font-mono font-bold text-[#7C571C] hover:underline px-2.5 py-1 rounded bg-[#FBEBE1] border border-[#DFCBB5] cursor-pointer shrink-0"
            >
              Cambiar
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-1.5 flex items-center gap-1.5">
              <StraightRazorIcon className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>PANTALLA 3 // SELECCIONA TU BARBERO</span>
            </label>
            <p className="text-[10px] sm:text-[11px] text-[#6F5A4B] mb-3">
              Elige un maestro de la sede o deja la asignación al primer sillón libre.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Opción Cualquier Maestro */}
              <div
                onClick={() => setBarberoId('')}
                className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 active:scale-98 min-h-[64px] ${
                  barberoId === ''
                    ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] ring-1.5 ring-[#7C571C] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#FAF6EE] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold block text-[#221A14]">Cualquier Barbero</span>
                  <span className="text-[10px] font-mono text-[#15803D] font-bold">Turno más rápido disponible</span>
                </div>
              </div>

              {/* Barberos de la Sede */}
              {barberosFiltrados.map(b => {
                const isSelected = String(barberoId) === String(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => setBarberoId(b.id)}
                    className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 active:scale-98 min-h-[64px] ${
                      isSelected
                        ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] ring-1.5 ring-[#7C571C] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#DFCBB5] shrink-0 bg-[#221A14]">
                      {b.fotoUrl ? (
                        <img 
                          src={b.fotoUrl} 
                          alt={b.nombre} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#FAF6EE] font-bold">
                          {b.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold block text-[#221A14] truncate">{b.nombre}</span>
                      <span className="text-[10px] font-mono text-[#7C571C] truncate block">{b.especialidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navegación Pantalla 3 */}
          <div className="pt-3 border-t border-[#DFCBB5] grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRetrocederPaso}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#6F5A4B] border border-[#DFCBB5] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              onClick={() => handleAvanzarPaso(4)}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <span>Elegir Horario</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 4: FECHA Y HORA DEL TURNO */}
      {/* ========================================================================= */}
      {pasoActual === 4 && (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Banner de Resumen Previo */}
          <div className="p-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs min-w-0">
              <span className="font-serif font-bold text-[#221A14] truncate">📍 {sucursalSeleccionada?.nombre}</span>
              <span className="text-[#DFCBB5] hidden sm:inline">&bull;</span>
              <span className="text-[#7C571C] font-bold truncate">✂️ {servicioSeleccionado?.nombre}</span>
              <span className="text-[#DFCBB5] hidden sm:inline">&bull;</span>
              <span className="text-[#6F5A4B] truncate">💈 {barberoSeleccionado?.nombre || 'Cualquier Barbero'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasoActual(3);
                scrollToSectionTop();
              }}
              className="text-[10px] font-mono font-bold text-[#7C571C] hover:underline px-2.5 py-1 rounded bg-[#FBEBE1] border border-[#DFCBB5] cursor-pointer shrink-0"
            >
              Cambiar
            </button>
          </div>

          {/* Banner de Sincronización con Reloj Colombia */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7C571C] animate-pulse shrink-0" />
              <div>
                <div className="text-[11px] font-mono text-[#221A14] font-bold">
                  Horario Oficial Bogotá (UTC-5)
                </div>
                <div className="text-[9px] font-mono text-[#6F5A4B]">
                  {colClock.fechaTexto}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[9px] font-mono uppercase text-[#6F5A4B]">Hora Actual:</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#FBEBE1] text-[#7C571C] text-xs font-mono font-bold tracking-wider border border-[#DFCBB5]">
                {colClock.horaCompleta}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* Selector de Fecha */}
            <div className="lg:col-span-5 space-y-2">
              <VintageDatePicker
                id="input-fecha-reserva"
                label="SELECCIONA EL DÍA DE TU TURNO"
                value={fecha}
                onChange={setFecha}
                minDate={colClock.fecha}
              />
              <div className="text-[10px] text-[#6F5A4B] font-mono bg-[#FFFFFF] p-2.5 rounded-xl border border-[#DFCBB5] flex items-center gap-2 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#7C571C] shrink-0" />
                <span>Horario: Lun a Dom 9:00 AM - 7:00 PM</span>
              </div>
            </div>

            {/* Franjas Horarias */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C]">
                  PANTALLA 4 // TURNOS DISPONIBLES
                </label>
                {barberoSeleccionado && (
                  <span className="text-[9px] font-mono text-[#7C571C] font-bold">
                    Agenda de {barberoSeleccionado.nombre}
                  </span>
                )}
              </div>

              {cargandoHorarios ? (
                <div className="h-32 flex flex-col items-center justify-center text-[11px] font-mono text-[#6F5A4B] bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] shadow-2xs">
                  <Clock className="w-5 h-5 animate-spin text-[#7C571C] mb-2" />
                  <span>Consultando disponibilidad de sillones...</span>
                </div>
              ) : (slotsDisponibilidad.length === 0 && horariosDisponibles.length === 0) ? (
                <div className="h-32 flex flex-col items-center justify-center text-[11px] font-mono text-[#6F5A4B] bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] shadow-2xs p-4 text-center">
                  <Ban className="w-5 h-5 text-[#BA1A1A] mb-1" />
                  <span className="font-bold text-[#BA1A1A]">No hay turnos disponibles para esta fecha.</span>
                  <span className="text-[10px] text-[#6F5A4B] mt-1">Por favor selecciona otro día en el calendario.</span>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 max-h-56 overflow-y-auto p-2 sm:p-2.5 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] scrollbar-thin shadow-2xs">
                    {(slotsDisponibilidad.length > 0 ? slotsDisponibilidad : horariosDisponibles.map(h => ({
                      hora24: h,
                      hora12: h,
                      disponible: true
                    }))).map(slot => {
                      const isSelected = hora === slot.hora12;
                      const isPassed = slot.esPasado || isSlotPassedInColombia(slot.hora12, fecha);
                      const isOccupied = !slot.disponible && !isPassed;

                      if (isPassed) {
                        return (
                          <button
                            type="button"
                            key={slot.hora12}
                            disabled
                            className="py-2.5 px-1 rounded-xl text-[10px] font-mono bg-[#F8F5F1] text-[#A8988B] border border-[#E8E0D7] cursor-not-allowed flex flex-col items-center justify-center opacity-60 select-none min-h-[46px]"
                          >
                            <span className="line-through">{slot.hora12}</span>
                            <span className="text-[8px] uppercase tracking-tight text-[#8A796D] font-bold">
                              Pasado
                            </span>
                          </button>
                        );
                      }

                      if (isOccupied) {
                        return (
                          <button
                            type="button"
                            key={slot.hora12}
                            disabled
                            className="py-2.5 px-1 rounded-xl text-[10px] font-mono bg-[#FFDAD6]/50 text-[#BA1A1A] border border-[#BA1A1A]/30 cursor-not-allowed flex flex-col items-center justify-center opacity-70 select-none min-h-[46px]"
                          >
                            <span className="line-through">{slot.hora12}</span>
                            <span className="text-[8px] uppercase tracking-tight text-[#BA1A1A] font-bold">
                              Ocupado
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={slot.hora12}
                          id={`btn-hora-${slot.hora12.replace(/[\s:]/g, '')}`}
                          onClick={() => setHora(slot.hora12)}
                          className={`py-2.5 px-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all flex flex-col items-center justify-center cursor-pointer min-h-[46px] active:scale-95 ${
                            isSelected
                              ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm font-black ring-1.5 ring-[#7C571C] scale-[1.02]'
                              : 'bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C]'
                          }`}
                        >
                          <span>{slot.hora12}</span>
                          <span className={`text-[8px] uppercase tracking-tight mt-0.5 font-bold ${isSelected ? 'text-[#FAF6EE]' : 'text-[#15803D]'}`}>
                            Libre
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[9px] font-mono text-[#6F5A4B] px-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                      Disponible
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#BA1A1A]" />
                      Ocupado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#8A796D]" />
                      Hora pasada
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navegación Pantalla 4 */}
          <div className="pt-3 border-t border-[#DFCBB5] grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRetrocederPaso}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#6F5A4B] border border-[#DFCBB5] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              onClick={() => handleAvanzarPaso(5)}
              disabled={!hora}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95 min-h-[44px]"
            >
              <span>Mis Datos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANTALLA 5: DATOS DEL CABALLERO & CONFIRMACIÓN */}
      {/* ========================================================================= */}
      {pasoActual === 5 && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
          {/* Banner de Resumen Previo */}
          <div className="p-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs min-w-0">
              <span className="font-serif font-bold text-[#221A14] truncate">📍 {sucursalSeleccionada?.nombre}</span>
              <span className="text-[#DFCBB5] hidden sm:inline">&bull;</span>
              <span className="text-[#7C571C] font-bold truncate">✂️ {servicioSeleccionado?.nombre}</span>
              <span className="text-[#DFCBB5] hidden sm:inline">&bull;</span>
              <span className="text-[#7C571C] font-mono font-bold">📅 {fecha} {hora}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasoActual(4);
                scrollToSectionTop();
              }}
              className="text-[10px] font-mono font-bold text-[#7C571C] hover:underline px-2.5 py-1 rounded bg-[#FBEBE1] border border-[#DFCBB5] cursor-pointer shrink-0"
            >
              Cambiar
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>PANTALLA 5 // INFORMACIÓN DEL CABALLERO</span>
            </label>
            {cookieFuncionalActiva && datosCargadosDeCookie && (
              <span className="text-[9px] font-mono text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded-full border border-[#86EFAC] flex items-center gap-1 font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Autocompletado con Cookies</span>
                <span className="sm:hidden">Guardado</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-[#6F5A4B] mb-1 font-bold">
                Nombre Completo <span className="text-[#7C571C]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F5A4B]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-cliente-nombre"
                  type="text"
                  placeholder="Ej. Andrés Cepeda"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#6F5A4B] mb-1 font-bold">
                Teléfono / WhatsApp <span className="text-[#7C571C]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F5A4B]">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-cliente-telefono"
                  type="tel"
                  placeholder="Ej. +57 300 123 4567"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono text-[#6F5A4B] font-bold">
                  Correo Electrónico
                </label>
                <span className="text-[9px] font-mono px-1.5 py-0.2 text-[#6F5A4B] bg-[#FBEBE1] rounded border border-[#DFCBB5]">
                  Opcional
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F5A4B]">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-cliente-email"
                  type="email"
                  placeholder="caballero@ejemplo.com"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
                />
              </div>
            </div>
          </div>

          {/* Campo Honeypot Oculto (Anti-Spam) */}
          <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <input
              id="input-empresa-hp"
              type="text"
              name="company_trap"
              value={honeypotEmpresa}
              onChange={(e) => setHoneypotEmpresa(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Resumen Completo del Turno a Confirmar */}
          <div className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2 text-[10px] text-[#6F5A4B] uppercase font-bold">
              <span>RESUMEN FINAL DE TU CITA:</span>
              <span className="text-[#7C571C]">LA CASA DEL REY</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#FFF8F5] p-2 rounded-lg border border-[#DFCBB5]/70">
                <span className="text-[9px] text-[#6F5A4B] uppercase block">Sede:</span>
                <span className="font-bold text-[#221A14] truncate block">
                  {sucursalSeleccionada?.nombre.replace('Sede ', '') || 'Chicó Real'}
                </span>
              </div>

              <div className="bg-[#FFF8F5] p-2 rounded-lg border border-[#DFCBB5]/70">
                <span className="text-[9px] text-[#6F5A4B] uppercase block">Servicio:</span>
                <span className="font-bold text-[#221A14] truncate block">
                  {servicioSeleccionado?.nombre || 'Corte Clásico'}
                </span>
              </div>

              <div className="bg-[#FFF8F5] p-2 rounded-lg border border-[#DFCBB5]/70">
                <span className="text-[9px] text-[#6F5A4B] uppercase block">Barbero:</span>
                <span className="font-bold text-[#7C571C] truncate block">
                  {barberoSeleccionado ? barberoSeleccionado.nombre : 'Primer disponible'}
                </span>
              </div>

              <div className="bg-[#FFF8F5] p-2 rounded-lg border border-[#DFCBB5]/70">
                <span className="text-[9px] text-[#6F5A4B] uppercase block">Fecha & Turno:</span>
                <span className="font-bold text-[#7C571C] truncate block">
                  {fecha} {hora}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DFCBB5]/60 flex items-center justify-between text-xs">
              <span className="text-[#6F5A4B] font-bold uppercase">VALOR EN SALÓN:</span>
              <span className="text-sm sm:text-base font-bold text-[#7C571C]">
                {servicioSeleccionado ? formatPrecio(servicioSeleccionado.precio) : '$ 35.000'}
              </span>
            </div>
          </div>

          {/* Habeas Data Checkbox */}
          <div className="pt-1 flex items-start gap-2.5">
            <input
              id="checkbox-terminos-individual"
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#DFCBB5] bg-[#FFFFFF] text-[#7C571C] focus:ring-0 cursor-pointer accent-[#7C571C]"
            />
            <label htmlFor="checkbox-terminos-individual" className="text-[10px] font-mono text-[#6F5A4B] leading-relaxed cursor-pointer select-none">
              Acepto el tratamiento de datos para la confirmación de la cita conforme a la Ley 1581 de 2012.
            </label>
          </div>

          {/* Botones de Envío y Atrás */}
          <div className="pt-3 border-t border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRetrocederPaso}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#6F5A4B] border border-[#DFCBB5] font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás (Horario)</span>
            </button>

            <button
              type="submit"
              id="btn-confirmar-reserva-individual"
              disabled={enviando || !hora || !clienteNombre.trim() || !clienteTelefono.trim()}
              className="w-full sm:w-auto px-7 py-3.5 sm:py-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider cursor-pointer min-h-[48px]"
            >
              {enviando ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>CONFIRMANDO EN LIBRO REAL...</span>
                </>
              ) : (
                <>
                  <VintageScissorsIcon className="w-4 h-4" />
                  <span>CONFIRMAR TURNO DEFINITIVO</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
