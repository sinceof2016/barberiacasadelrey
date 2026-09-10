import React, { useState, useEffect } from 'react';
import { Servicio, Barbero, Cita, HorarioSlot } from '../types';
import { getDisponibilidad, crearCitaIndividual } from '../services/api';
import { Clock, User, Phone, CheckCircle2, AlertCircle, Copy, Check, Ban, Sparkles, Mail, ShieldCheck, MapPin } from 'lucide-react';
import { AddToCalendarButtons } from './AddToCalendarButtons';
import { WhatsAppConfirmButton } from './WhatsAppConfirmButton';
import { VintageDatePicker } from './VintageDatePicker';
import { useColombiaClock, getColombiaDateTime, isSlotPassedInColombia } from '../utils/colombiaTime';
import { sucursalesCasaDelRey } from '../services/localData';
import { 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageBarberPole, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';

interface IndividualBookingFormProps {
  servicios: Servicio[];
  barberos: Barbero[];
  preselectedServiceId?: number;
  preselectedBarberId?: number;
  onBookingSuccess: (cita: Cita) => void;
}

export const IndividualBookingForm: React.FC<IndividualBookingFormProps> = ({
  servicios,
  barberos,
  preselectedServiceId,
  preselectedBarberId,
  onBookingSuccess,
}) => {
  const colClock = useColombiaClock();
  const [sucursalId, setSucursalId] = useState<string>('suc-chico');
  const [servicioId, setServicioId] = useState<number>(preselectedServiceId || (servicios[0]?.id ?? 1));
  const [barberoId, setBarberoId] = useState<string | number>(preselectedBarberId || '');
  
  const [fecha, setFecha] = useState<string>(() => getColombiaDateTime().fecha);
  const [hora, setHora] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [aceptaTerminos, setAceptaTerminos] = useState<boolean>(true);
  const [honeypotEmpresa, setHoneypotEmpresa] = useState<string>(''); // Campo trampa invisible para bots

  const [slotsDisponibilidad, setSlotsDisponibilidad] = useState<HorarioSlot[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

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

          // Si el horario seleccionado ya no está disponible, seleccionar el primer disponible
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

  // Al generarse la reserva, regresar automáticamente al principio de la página
  useEffect(() => {
    if (citaCreada) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
      document.body?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [citaCreada]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    // Protección Anti-Spam: Si el campo trampa oculto fue rellenado por un bot, se rechaza
    if (honeypotEmpresa.trim() !== '') {
      console.warn('Bot submission blocked by honeypot.');
      return;
    }

    if (!clienteNombre.trim()) {
      setErrorMensaje('Ingresa el nombre completo del caballero.');
      return;
    }
    if (!clienteTelefono.trim()) {
      setErrorMensaje('Ingresa el teléfono o WhatsApp de contacto.');
      return;
    }
    if (!hora) {
      setErrorMensaje('Selecciona un horario disponible para el turno.');
      return;
    }

    if (!aceptaTerminos) {
      setErrorMensaje('Por favor acepta el tratamiento de datos y confirmación del turno para proceder.');
      return;
    }

    if (isSlotPassedInColombia(hora, fecha)) {
      setErrorMensaje(`El horario seleccionado (${hora}) ya ha transcurrido según el reloj oficial de Colombia (${colClock.hora12}). Por favor selecciona un turno disponible a futuro.`);
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
        setCitaCreada(resp.reserva);
        onBookingSuccess(resp.reserva);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
        document.body?.scrollTo?.({ top: 0, behavior: 'smooth' });
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

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  if (citaCreada) {
    return (
      <div className="rounded-xl bg-[#1A1412] border border-[#C59B27] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <BarberPoleRibbon className="h-1.5 absolute top-0 left-0" />

        <div className="flex items-center justify-between border-b border-[#3D2E26] pb-4 mb-5 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C2C1D] border border-[#2D472F] text-[#86EFAC] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-royal font-bold text-[#FAF6EE] tracking-wide">
                  TURNO CONFIRMADO EN EL LIBRO DE CITAS
                </h3>
                <span className="px-2 py-0.5 bg-[#1C2C1D] text-[#86EFAC] text-[9px] font-mono font-bold rounded border border-[#2D472F]">
                  {citaCreada.estado}
                </span>
              </div>
              <p className="text-xs text-[#A8988B] font-mono mt-0.5">
                CÓDIGO OFICIAL: {citaCreada.idReserva}
              </p>
            </div>
          </div>
          <VintageWaxSeal text="CONFIRMADO" className="hidden sm:inline-flex" />
        </div>

        {/* Vintage Voucher card */}
        <div className="rounded-xl bg-[#0E0A09] p-4 border border-[#3D2E26] space-y-3 mb-5 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-[#2B1F19] pb-3">
            <div>
              <span className="text-[10px] text-[#8A796D] uppercase tracking-wider block font-bold">
                CÓDIGO DE RESERVA
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-[#E5B869]">{citaCreada.idReserva}</span>
                <button
                  onClick={handleCopiarId}
                  className="p-1 rounded bg-[#1A1412] border border-[#3D2E26] hover:border-[#C59B27] text-[#A8988B] hover:text-[#FAF6EE] transition-all"
                  title="Copiar código"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#86EFAC]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">VALOR EN CAJA</span>
              <span className="text-base font-bold text-[#FAF6EE]">
                {servicioSeleccionado ? formatPrecio(servicioSeleccionado.precio) : '$ 35.000'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#8A796D] block uppercase font-bold">CABALLERO</span>
              <span className="text-[#FAF6EE] font-medium">{citaCreada.clienteNombre}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] block uppercase font-bold">SEDE DEL CORTE</span>
              <span className="text-[#FAF6EE] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C59B27]" />
                {citaCreada.sucursalNombre || 'Sede Chicó Real'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] block uppercase font-bold">TELÉFONO</span>
              <span className="text-[#FAF6EE] font-medium">{citaCreada.clienteTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] block uppercase font-bold">FECHA Y HORA</span>
              <span className="text-[#E5B869] font-bold">{citaCreada.fecha} @ {citaCreada.hora}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-[#8A796D] block uppercase font-bold">MAESTRO ASIGNADO</span>
              <span className="text-[#FAF6EE] font-medium">
                {barberoSeleccionado ? barberoSeleccionado.nombre : 'Cualquier Maestro'}
              </span>
            </div>
            {citaCreada.clienteEmail && (
              <div className="col-span-2 pt-2 border-t border-[#2B1F19] flex items-center gap-2">
                <span className="text-[10px] text-[#8A796D] uppercase font-bold">CORREO REGISTRADO:</span>
                <span className="text-[#FAF6EE] font-medium">{citaCreada.clienteEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Google / Apple Calendar Retention Integration */}
        <AddToCalendarButtons
          cita={citaCreada}
          servicioNombre={servicioSeleccionado?.nombre}
          barberoNombre={barberoSeleccionado?.nombre}
          duracionMinutos={servicioSeleccionado?.duracionMinutos}
          className="mb-4"
        />

        {/* WhatsApp Direct Confirmation Button */}
        <WhatsAppConfirmButton
          cita={citaCreada}
          servicioNombre={servicioSeleccionado?.nombre}
          barberoNombre={barberoSeleccionado?.nombre}
          precioTotal={servicioSeleccionado?.precio}
          className="mb-5"
        />

        <button
          onClick={() => setCitaCreada(null)}
          className="w-full py-2.5 px-3 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold text-xs font-mono tracking-wider shadow-md transition-all"
        >
          AGENDAR OTRO TURNO
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#1A1412] border border-[#3D2E26] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#3D2E26] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <StraightRazorIcon className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-sm font-royal font-bold tracking-wide text-[#FAF6EE] uppercase">
              Reserva de Turno Individual
            </h3>
          </div>
          <p className="text-xs text-[#A8988B] mt-0.5">
            Registro directo en el libro tradicional de Barbería La Casa del Rey
          </p>
        </div>
      </div>

      {errorMensaje && (
        <div className="mb-4 p-3 rounded-lg bg-[#3E161C] border border-[#6B242D] text-[#FCA5A5] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
          <span>{errorMensaje}</span>
        </div>
      )}

      {/* 1. Seleccionar Sede */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>01 // SELECCIONA LA SEDE DEL CORTE</span>
          </span>
          <span className="text-[9px] text-[#A8988B] font-mono lowercase">
            ({sucursalesCasaDelRey.length} sedes en Bogotá)
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {sucursalesCasaDelRey.map(s => {
            const isSelected = sucursalId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSucursalId(s.id);
                  if (barberoId) {
                    const barb = barberos.find(b => String(b.id) === String(barberoId));
                    if (barb && barb.sucursalId && barb.sucursalId !== s.id) {
                      setBarberoId('');
                    }
                  }
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] shadow-md ring-1 ring-[#C59B27]/50'
                    : 'bg-[#14100E] border-[#3D2E26] hover:border-[#8A6642] text-[#A8988B]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-royal font-bold text-[#FAF6EE] tracking-wide">
                      {s.nombre}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#86EFAC] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#8A796D] line-clamp-2 leading-relaxed font-mono mb-1">
                    {s.direccion}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#2A1E18] flex items-center justify-between text-[9px] font-mono text-[#E5B869]">
                  <span>{s.ciudad}</span>
                  <span className="text-[#8A796D]">{s.telefono}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Seleccionar Servicio */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <VintageScissorsIcon className="w-3.5 h-3.5" />
            <span>02 // SELECCIONA EL SERVICIO</span>
          </span>
          <span className="text-[9px] text-[#A8988B] font-normal lowercase">
            ({servicios.length} opciones disponibles)
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {servicios.map(s => {
            const isSelected = Number(servicioId) === s.id;
            const esCombo = s.nombre.toLowerCase().includes('combo');
            return (
              <div
                key={s.id}
                onClick={() => setServicioId(s.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] shadow-md ring-1 ring-[#C59B27]/50'
                    : 'bg-[#14100E] border-[#3D2E26] hover:border-[#8A6642] text-[#A8988B]'
                }`}
              >
                {esCombo && (
                  <span className="absolute top-0 right-0 bg-[#C59B27] text-[#120E0C] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-bl uppercase tracking-wider">
                    COMBO
                  </span>
                )}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-royal font-bold text-[#FAF6EE] tracking-wide leading-tight">
                      {s.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-[#8A796D] shrink-0 mt-0.5">
                      {s.duracionMinutos}m
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A796D] line-clamp-2 leading-relaxed mb-2 font-mono">
                    {s.descripcion}
                  </p>
                </div>
                <div className="mt-1 pt-2 border-t border-[#2A1E18] flex items-center justify-between">
                  <span className="text-[9px] text-[#8A796D] uppercase">Tarifa</span>
                  <span className="text-xs font-mono font-bold text-[#E5B869]">{formatPrecio(s.precio)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Seleccionar Barbero */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] mb-2 flex items-center gap-1.5">
          <StraightRazorIcon className="w-3 h-3" />
          <span>03 // ELECCIÓN DEL MAESTRO BARBERO</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div
            onClick={() => setBarberoId('')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
              barberoId === ''
                ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] ring-1 ring-[#C59B27]/40'
                : 'bg-[#14100E] border-[#3D2E26] hover:border-[#8A6642] text-[#8A796D]'
            }`}
          >
            <span className="text-xs font-bold block text-[#FAF6EE]">Turno Disponible</span>
            <span className="text-[10px] font-mono text-[#8A796D]">Cualquier Maestro</span>
          </div>

          {barberos
            .filter(b => !b.sucursalId || b.sucursalId === sucursalId)
            .map(b => {
              const isSelected = String(barberoId) === String(b.id);
              return (
                <div
                  key={b.id}
                  onClick={() => setBarberoId(b.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
                    isSelected
                      ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] ring-1 ring-[#C59B27]/40'
                      : 'bg-[#14100E] border-[#3D2E26] hover:border-[#8A6642] text-[#8A796D]'
                  }`}
                >
                  <span className="text-xs font-bold block text-[#FAF6EE]">{b.nombre}</span>
                  <span className="text-[10px] font-mono text-[#E5B869]">{b.especialidad}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Banner de Sincronización con Reloj Colombia */}
      <div className="mb-5 p-2.5 rounded-lg bg-[#0E0A09] border border-[#3D2E26] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#C59B27] animate-pulse shrink-0" />
          <div>
            <div className="text-[11px] font-mono text-[#FAF6EE] font-bold">
              Horario Oficial Barbería La Casa del Rey (Bogotá, Colombia • UTC-5)
            </div>
            <div className="text-[9px] font-mono text-[#A8988B]">
              {colClock.fechaTexto}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[9px] font-mono uppercase text-[#A8988B]">Hora Actual:</span>
          <span className="px-2 py-0.5 rounded bg-[#261B16] text-[#E5B869] text-xs font-mono font-black tracking-wider border border-[#3D2E26]">
            {colClock.horaCompleta}
          </span>
        </div>
      </div>

      {/* 3. Fecha (con calendario desplegable) y Horarios Disponibles en Formato 12 Horas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Selector de Fecha con Calendario Desplegable */}
        <div className="lg:col-span-5">
          <VintageDatePicker
            id="input-fecha-reserva"
            label="04 // FECHA DEL TURNO (CALENDARIO)"
            value={fecha}
            onChange={setFecha}
            minDate={colClock.fecha}
          />
          <div className="mt-2 text-[10px] text-[#8A796D] font-mono bg-[#0E0A09] p-2 rounded border border-[#2B1F19] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#C59B27] shrink-0" />
            <span>Atención de Lunes a Domingo: 9:00 AM – 7:00 PM</span>
          </div>
        </div>

        {/* Franjas Horarias en Formato 12 Horas (9:00 AM - 7:00 PM) con Validación de Disponibilidad */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27]">
              05 // HORARIOS DISPONIBLES (9:00 AM – 7:00 PM)
            </label>
            {barberoSeleccionado && (
              <span className="text-[9px] font-mono text-[#E5B869]">
                Agenda de {barberoSeleccionado.nombre}
              </span>
            )}
          </div>

          {cargandoHorarios ? (
            <div className="h-28 flex flex-col items-center justify-center text-[11px] font-mono text-[#A8988B] bg-[#0E0A09] rounded-lg border border-[#2B1F19]">
              <Clock className="w-4 h-4 animate-spin text-[#C59B27] mb-1.5" />
              <span>Verificando disponibilidad de sillones...</span>
            </div>
          ) : (slotsDisponibilidad.length === 0 && horariosDisponibles.length === 0) ? (
            <div className="h-28 flex flex-col items-center justify-center text-[11px] font-mono text-[#8A796D] bg-[#0E0A09] rounded-lg border border-[#2B1F19]">
              <Ban className="w-4 h-4 text-[#8A796D] mb-1" />
              <span>No hay turnos disponibles para esta fecha.</span>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1 bg-[#0E0A09] rounded-lg border border-[#2B1F19] scrollbar-thin">
                {(slotsDisponibilidad.length > 0 ? slotsDisponibilidad : horariosDisponibles.map(h => ({
                  hora24: h,
                  hora12: h,
                  disponible: true
                }))).map(slot => {
                  const isSelected = hora === slot.hora12;
                  const isPassed = slot.esPasado || isSlotPassedInColombia(slot.hora12, fecha);
                  const isOccupied = !slot.disponible && !isPassed;

                  // Horario ya transcurrido según el reloj de Colombia
                  if (isPassed) {
                    return (
                      <button
                        type="button"
                        key={slot.hora12}
                        disabled
                        title={`Horario no disponible: ya transcurrió según el reloj oficial de Colombia (${colClock.hora12})`}
                        className="py-2 px-1.5 rounded-md text-[10px] font-mono transition-all bg-[#120E0C]/90 text-[#5A4B43] border border-[#221713] cursor-not-allowed flex flex-col items-center justify-center opacity-40 select-none"
                      >
                        <span className="line-through">{slot.hora12}</span>
                        <span className="text-[7.5px] uppercase tracking-tighter text-[#7A6458] font-bold mt-0.5">
                          Pasado
                        </span>
                      </button>
                    );
                  }

                  // Horario reservado por otro cliente
                  if (isOccupied) {
                    return (
                      <button
                        type="button"
                        key={slot.hora12}
                        disabled
                        title={slot.motivoOcupado || 'Horario no disponible para este barbero'}
                        className="py-2 px-1.5 rounded-md text-[10px] font-mono transition-all bg-[#19110F]/70 text-[#6E5A50] border border-[#261B16] cursor-not-allowed flex flex-col items-center justify-center opacity-60 select-none"
                      >
                        <span className="line-through">{slot.hora12}</span>
                        <span className="text-[8px] uppercase tracking-tighter text-[#A13A3A] font-bold mt-0.5">
                          Ocupado
                        </span>
                      </button>
                    );
                  }

                  // Horario libre
                  return (
                    <button
                      type="button"
                      key={slot.hora12}
                      id={`btn-hora-${slot.hora12.replace(/[\s:]/g, '')}`}
                      onClick={() => setHora(slot.hora12)}
                      className={`py-2 px-1.5 rounded-md text-[10px] font-mono font-bold transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#C59B27] text-[#120E0C] shadow font-black ring-1 ring-[#FAF6EE]/50 scale-[1.02]'
                          : 'bg-[#14100E] hover:bg-[#251A15] text-[#FAF6EE] border border-[#3D2E26] hover:border-[#8A6642]'
                      }`}
                    >
                      <span>{slot.hora12}</span>
                      <span className={`text-[8px] uppercase tracking-tight mt-0.5 ${isSelected ? 'text-[#120E0C]' : 'text-[#86EFAC]'}`}>
                        Libre
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Leyenda de Disponibilidad */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[9px] font-mono text-[#8A796D] px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC]" />
                  Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A13A3A]" />
                  Reservado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5A4B43]" />
                  Hora ya pasada
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Datos del Cliente */}
      <div className="border-t border-[#3D2E26] pt-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27]">
            06 // INFORMACIÓN DEL CABALLERO
          </label>
          <span className="text-[9px] font-mono text-[#8A796D]">
            * Campos obligatorios
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-[#A8988B] mb-1 font-bold">
              Nombre Completo <span className="text-[#C59B27]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8A796D]">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-nombre"
                type="text"
                placeholder="Ej. Andrés Cepeda"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2 pl-8 pr-3 text-xs text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#A8988B] mb-1 font-bold">
              Teléfono / WhatsApp <span className="text-[#C59B27]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8A796D]">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-telefono"
                type="tel"
                placeholder="Ej. +57 300 123 4567"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2 pl-8 pr-3 text-xs text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27] transition-colors"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono text-[#A8988B] font-bold">
                Correo Electrónico
              </label>
              <span className="text-[9px] font-mono px-1.5 py-0.5 text-[#8A796D] bg-[#261B16] rounded border border-[#3D2E26]">
                Opcional
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8A796D]">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-email"
                type="email"
                placeholder="caballero@ejemplo.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2 pl-8 pr-3 text-xs text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Campo Honeypot Oculto (Anti-Spam / Anti-Bots) */}
        <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label htmlFor="input-empresa-hp">Empresa (no rellenar)</label>
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

        {/* Habeas Data & Confirmación WhatsApp Checkbox */}
        <div className="mt-3 pt-3 border-t border-[#261B16] flex items-start gap-2.5">
          <input
            id="checkbox-terminos-individual"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-[#3D2E26] bg-[#0E0A09] text-[#C59B27] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#C59B27]"
          />
          <label htmlFor="checkbox-terminos-individual" className="text-[10px] font-mono text-[#A8988B] leading-tight cursor-pointer select-none">
            Acepto el tratamiento de datos para la gestión del turno y la recepción del comprobante de reserva vía WhatsApp / SMS (Ley 1581 de 2012).
          </label>
        </div>
      </div>

      {/* Resumen y Botón de Envío */}
      <div className="p-4 rounded-xl bg-[#0E0A09] border border-[#3D2E26] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="font-mono text-xs">
          <span className="text-[9px] uppercase tracking-widest text-[#8A796D] block font-bold">TOTAL EN CAJA</span>
          <span className="text-lg font-bold text-[#E5B869]">
            {servicioSeleccionado ? formatPrecio(servicioSeleccionado.precio) : '$ 35.000'}
          </span>
          <span className="text-[10px] text-[#A8988B] block mt-0.5">
            {fecha} {hora ? `• ${hora}` : ''}
          </span>
        </div>

        <button
          type="submit"
          id="btn-confirmar-reserva-individual"
          disabled={enviando || !hora}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider"
        >
          {enviando ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>REGISTRANDO EN AGENDA...</span>
            </>
          ) : (
            <>
              <VintageScissorsIcon className="w-3.5 h-3.5" />
              <span>CONFIRMAR TURNO</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
