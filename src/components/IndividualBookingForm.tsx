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
      <div className="rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] p-5 sm:p-6 shadow-sm relative overflow-hidden font-mono text-xs text-[#221A14]">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-4 mb-5 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-[#221A14] tracking-wide">
                  TURNO CONFIRMADO EN EL LIBRO DE CITAS
                </h3>
                <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-mono font-bold rounded border border-[#86EFAC]">
                  {citaCreada.estado}
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
                CÓDIGO OFICIAL: {citaCreada.idReserva}
              </p>
            </div>
          </div>
          <VintageWaxSeal text="CONFIRMADO" className="hidden sm:inline-flex" />
        </div>

        {/* Vintage Voucher card */}
        <div className="rounded-xl bg-[#FFFFFF] p-4 border border-[#DFCBB5] space-y-3 mb-5 font-mono text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase tracking-wider block font-bold">
                CÓDIGO DE RESERVA
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-[#7C571C]">{citaCreada.idReserva}</span>
                <button
                  onClick={handleCopiarId}
                  className="p-1 rounded bg-[#FBEBE1] border border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] hover:text-[#221A14] transition-all cursor-pointer shadow-2xs"
                  title="Copiar código"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">VALOR EN CAJA</span>
              <span className="text-base font-bold text-[#221A14]">
                {servicioSeleccionado ? formatPrecio(servicioSeleccionado.precio) : '$ 35.000'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">CABALLERO</span>
              <span className="text-[#221A14] font-medium">{citaCreada.clienteNombre}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">SEDE DEL CORTE</span>
              <span className="text-[#221A14] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C571C]" />
                {citaCreada.sucursalNombre || 'Sede Chicó Real'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">TELÉFONO</span>
              <span className="text-[#221A14] font-medium">{citaCreada.clienteTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">FECHA Y HORA</span>
              <span className="text-[#7C571C] font-bold">{citaCreada.fecha} @ {citaCreada.hora}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">MAESTRO ASIGNADO</span>
              <span className="text-[#221A14] font-medium">
                {barberoSeleccionado ? barberoSeleccionado.nombre : 'Cualquier Maestro'}
              </span>
            </div>
            {citaCreada.clienteEmail && (
              <div className="col-span-2 pt-2 border-t border-[#DFCBB5] flex items-center gap-2">
                <span className="text-[10px] text-[#6F5A4B] uppercase font-bold">CORREO REGISTRADO:</span>
                <span className="text-[#221A14] font-medium">{citaCreada.clienteEmail}</span>
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
          className="w-full py-2.5 px-3 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs font-mono tracking-wider shadow-sm transition-all cursor-pointer"
        >
          AGENDAR OTRO TURNO
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] p-5 sm:p-6 shadow-sm relative overflow-hidden font-mono text-xs text-[#221A14]">
      <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

      <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-4 mb-5 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
            <h3 className="text-sm font-serif font-bold tracking-wide text-[#221A14] uppercase">
              Reserva de Turno Individual
            </h3>
          </div>
          <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
            Registro directo en el libro tradicional de Barbería La Casa del Rey
          </p>
        </div>
      </div>

      {errorMensaje && (
        <div className="mb-4 p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
          <span>{errorMensaje}</span>
        </div>
      )}

      {/* 1. Seleccionar Sede */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>01 // SELECCIONA LA SEDE DEL CORTE</span>
          </span>
          <span className="text-[9px] text-[#6F5A4B] font-mono lowercase">
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
                    ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs ring-1 ring-[#7C571C]/50'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-serif font-bold text-[#221A14] tracking-wide">
                      {s.nombre}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#6F5A4B] line-clamp-2 leading-relaxed font-mono mb-1">
                    {s.direccion}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#DFCBB5]/50 flex items-center justify-between text-[9px] font-mono text-[#7C571C]">
                  <span>{s.ciudad}</span>
                  <span className="text-[#6F5A4B]">{s.telefono}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Seleccionar Servicio */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <VintageScissorsIcon className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>02 // SELECCIONA EL SERVICIO</span>
          </span>
          <span className="text-[9px] text-[#6F5A4B] font-normal lowercase">
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
                    ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs ring-1 ring-[#7C571C]/50'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                }`}
              >
                {esCombo && (
                  <span className="absolute top-0 right-0 bg-[#7C571C] text-[#FAF6EE] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-bl uppercase tracking-wider">
                    COMBO
                  </span>
                )}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-serif font-bold text-[#221A14] tracking-wide leading-tight">
                      {s.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-[#6F5A4B] shrink-0 mt-0.5">
                      {s.duracionMinutos}m
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6F5A4B] line-clamp-2 leading-relaxed mb-2 font-mono">
                    {s.descripcion}
                  </p>
                </div>
                <div className="mt-1 pt-2 border-t border-[#DFCBB5]/50 flex items-center justify-between">
                  <span className="text-[9px] text-[#6F5A4B] uppercase">Tarifa</span>
                  <span className="text-xs font-mono font-bold text-[#7C571C]">{formatPrecio(s.precio)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Seleccionar Barbero */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-2 flex items-center gap-1.5">
          <StraightRazorIcon className="w-3.5 h-3.5 text-[#7C571C]" />
          <span>03 // ELECCIÓN DEL MAESTRO BARBERO</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div
            onClick={() => setBarberoId('')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
              barberoId === ''
                ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] ring-1 ring-[#7C571C]/40 shadow-xs'
                : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
            }`}
          >
            <span className="text-xs font-bold block text-[#221A14]">Turno Disponible</span>
            <span className="text-[10px] font-mono text-[#6F5A4B]">Cualquier Maestro</span>
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
                      ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] ring-1 ring-[#7C571C]/40 shadow-xs'
                      : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                  }`}
                >
                  <span className="text-xs font-bold block text-[#221A14]">{b.nombre}</span>
                  <span className="text-[10px] font-mono text-[#7C571C]">{b.especialidad}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Banner de Sincronización con Reloj Colombia */}
      <div className="mb-5 p-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#7C571C] animate-pulse shrink-0" />
          <div>
            <div className="text-[11px] font-mono text-[#221A14] font-bold">
              Horario Oficial Barbería La Casa del Rey (Bogotá, Colombia • UTC-5)
            </div>
            <div className="text-[9px] font-mono text-[#6F5A4B]">
              {colClock.fechaTexto}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[9px] font-mono uppercase text-[#6F5A4B]">Hora Actual:</span>
          <span className="px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] text-xs font-mono font-bold tracking-wider border border-[#DFCBB5]">
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
          <div className="mt-2 text-[10px] text-[#6F5A4B] font-mono bg-[#FFFFFF] p-2 rounded-lg border border-[#DFCBB5] flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3 h-3 text-[#7C571C] shrink-0" />
            <span>Atención de Lunes a Domingo: 9:00 AM – 7:00 PM</span>
          </div>
        </div>

        {/* Franjas Horarias en Formato 12 Horas (9:00 AM - 7:00 PM) con Validación de Disponibilidad */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C]">
              05 // HORARIOS DISPONIBLES (9:00 AM – 7:00 PM)
            </label>
            {barberoSeleccionado && (
              <span className="text-[9px] font-mono text-[#7C571C]">
                Agenda de {barberoSeleccionado.nombre}
              </span>
            )}
          </div>

          {cargandoHorarios ? (
            <div className="h-28 flex flex-col items-center justify-center text-[11px] font-mono text-[#6F5A4B] bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] shadow-2xs">
              <Clock className="w-4 h-4 animate-spin text-[#7C571C] mb-1.5" />
              <span>Verificando disponibilidad de sillones...</span>
            </div>
          ) : (slotsDisponibilidad.length === 0 && horariosDisponibles.length === 0) ? (
            <div className="h-28 flex flex-col items-center justify-center text-[11px] font-mono text-[#6F5A4B] bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] shadow-2xs">
              <Ban className="w-4 h-4 text-[#8A796D] mb-1" />
              <span>No hay turnos disponibles para esta fecha.</span>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-2 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] scrollbar-thin shadow-2xs">
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
                        className="py-2 px-1.5 rounded-lg text-[10px] font-mono transition-all bg-[#F8F5F1] text-[#A8988B] border border-[#E8E0D7] cursor-not-allowed flex flex-col items-center justify-center opacity-60 select-none"
                      >
                        <span className="line-through">{slot.hora12}</span>
                        <span className="text-[7.5px] uppercase tracking-tighter text-[#8A796D] font-bold mt-0.5">
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
                        className="py-2 px-1.5 rounded-lg text-[10px] font-mono transition-all bg-[#FFDAD6]/40 text-[#BA1A1A] border border-[#BA1A1A]/30 cursor-not-allowed flex flex-col items-center justify-center opacity-80 select-none"
                      >
                        <span className="line-through">{slot.hora12}</span>
                        <span className="text-[8px] uppercase tracking-tighter text-[#BA1A1A] font-bold mt-0.5">
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
                      className={`py-2 px-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm font-black ring-1 ring-[#7C571C]/50 scale-[1.02]'
                          : 'bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C]'
                      }`}
                    >
                      <span>{slot.hora12}</span>
                      <span className={`text-[8px] uppercase tracking-tight mt-0.5 ${isSelected ? 'text-[#FAF6EE]' : 'text-[#15803D]'}`}>
                        Libre
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Leyenda de Disponibilidad */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[9px] font-mono text-[#6F5A4B] px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                  Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                  Reservado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A796D]" />
                  Hora ya pasada
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Datos del Cliente */}
      <div className="border-t border-[#DFCBB5] pt-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C]">
            06 // INFORMACIÓN DEL CABALLERO
          </label>
          <span className="text-[9px] font-mono text-[#6F5A4B]">
            * Campos obligatorios
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-[#6F5A4B] mb-1 font-bold">
              Nombre Completo <span className="text-[#7C571C]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6F5A4B]">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-nombre"
                type="text"
                placeholder="Ej. Andrés Cepeda"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg py-2 pl-8 pr-3 text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#6F5A4B] mb-1 font-bold">
              Teléfono / WhatsApp <span className="text-[#7C571C]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6F5A4B]">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-telefono"
                type="tel"
                placeholder="Ej. +57 300 123 4567"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg py-2 pl-8 pr-3 text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono text-[#6F5A4B] font-bold">
                Correo Electrónico
              </label>
              <span className="text-[9px] font-mono px-1.5 py-0.5 text-[#6F5A4B] bg-[#FBEBE1] rounded border border-[#DFCBB5]">
                Opcional
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6F5A4B]">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-cliente-email"
                type="email"
                placeholder="caballero@ejemplo.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg py-2 pl-8 pr-3 text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs"
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
        <div className="mt-3 pt-3 border-t border-[#DFCBB5] flex items-start gap-2.5">
          <input
            id="checkbox-terminos-individual"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-[#DFCBB5] bg-[#FFFFFF] text-[#7C571C] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#7C571C]"
          />
          <label htmlFor="checkbox-terminos-individual" className="text-[10px] font-mono text-[#6F5A4B] leading-tight cursor-pointer select-none">
            Acepto el tratamiento de datos para la gestión del turno y la recepción del comprobante de reserva vía WhatsApp / SMS (Ley 1581 de 2012).
          </label>
        </div>
      </div>

      {/* Resumen y Botón de Envío */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="font-mono text-xs">
          <span className="text-[9px] uppercase tracking-widest text-[#6F5A4B] block font-bold">TOTAL EN CAJA</span>
          <span className="text-lg font-bold text-[#7C571C]">
            {servicioSeleccionado ? formatPrecio(servicioSeleccionado.precio) : '$ 35.000'}
          </span>
          <span className="text-[10px] text-[#6F5A4B] block mt-0.5">
            {fecha} {hora ? `• ${hora}` : ''}
          </span>
        </div>

        <button
          type="submit"
          id="btn-confirmar-reserva-individual"
          disabled={enviando || !hora}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wider cursor-pointer"
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
