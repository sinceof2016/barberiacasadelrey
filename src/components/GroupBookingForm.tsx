import React, { useState, useEffect } from 'react';
import { Servicio, Cita } from '../types';
import { crearCitaGrupal } from '../services/api';
import { Users, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Check, Clock, User, Phone, Mail, ShieldCheck, MapPin } from 'lucide-react';
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

interface GroupBookingFormProps {
  servicios: Servicio[];
  onBookingSuccess: (cita: Cita) => void;
}

interface ParticipanteInput {
  id: string;
  nombre: string;
  servicioId: number;
}

const HORARIOS_GRUPALES_12H = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
];

export const GroupBookingForm: React.FC<GroupBookingFormProps> = ({
  servicios,
  onBookingSuccess,
}) => {
  const colClock = useColombiaClock();

  const [sucursalId, setSucursalId] = useState<string>('suc-chico');
  const [responsableNombre, setResponsableNombre] = useState<string>('');
  const [responsableTelefono, setResponsableTelefono] = useState<string>('');
  const [responsableEmail, setResponsableEmail] = useState<string>('');
  const [fecha, setFecha] = useState<string>(() => getColombiaDateTime().fecha);
  const [aceptaTerminos, setAceptaTerminos] = useState<boolean>(true);
  const [honeypotEmpresa, setHoneypotEmpresa] = useState<string>(''); // Campo trampa invisible anti-spam
  
  // Lista de horas grupales futuras para la fecha seleccionada
  const horasDisponibles = HORARIOS_GRUPALES_12H.filter(h => !isSlotPassedInColombia(h, fecha));
  const [hora, setHora] = useState<string>(() => horasDisponibles[0] || '02:00 PM');

  // Ajustar hora si la actual ya pasó
  useEffect(() => {
    if (isSlotPassedInColombia(hora, fecha)) {
      if (horasDisponibles.length > 0) {
        setHora(horasDisponibles[0]);
      } else {
        setHora('');
      }
    }
  }, [fecha, colClock.totalMinutos]);

  const [participantes, setParticipantes] = useState<ParticipanteInput[]>([
    { id: '1', nombre: '', servicioId: servicios[0]?.id ?? 1 },
    { id: '2', nombre: '', servicioId: servicios[1]?.id ?? 2 },
  ]);

  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const agregarParticipante = () => {
    if (participantes.length >= 8) return;
    setParticipantes(prev => [
      ...prev,
      { id: Date.now().toString(), nombre: '', servicioId: servicios[0]?.id ?? 1 }
    ]);
  };

  const eliminarParticipante = (id: string) => {
    if (participantes.length <= 2) {
      setErrorMensaje('Una reserva grupal debe contar con al menos 2 personas.');
      return;
    }
    setErrorMensaje(null);
    setParticipantes(prev => prev.filter(p => p.id !== id));
  };

  const actualizarParticipante = (id: string, campo: 'nombre' | 'servicioId', valor: any) => {
    setParticipantes(prev =>
      prev.map(p => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const totalCalculado = participantes.reduce((sum, p) => {
    const s = servicios.find(serv => serv.id === Number(p.servicioId));
    return sum + (s?.precio || 0);
  }, 0);

  // Al generarse la reserva grupal, regresar automáticamente al principio de la página
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

    // Protección Anti-Spam: Si el campo trampa fue rellenado, descartar silenciosamente
    if (honeypotEmpresa.trim() !== '') {
      console.warn('Bot submission blocked by honeypot.');
      return;
    }

    if (!responsableNombre.trim()) {
      setErrorMensaje('Ingresa el nombre del responsable de la comitiva.');
      return;
    }
    if (!responsableTelefono.trim()) {
      setErrorMensaje('Ingresa el teléfono del responsable.');
      return;
    }

    const sinNombre = participantes.some(p => !p.nombre.trim());
    if (sinNombre) {
      setErrorMensaje('Ingresa los nombres de todos los caballeros del grupo.');
      return;
    }

    if (!hora) {
      setErrorMensaje('Por favor selecciona un horario disponible.');
      return;
    }

    if (!aceptaTerminos) {
      setErrorMensaje('Por favor acepta el tratamiento de datos y confirmación del turno para proceder.');
      return;
    }

    if (isSlotPassedInColombia(hora, fecha)) {
      setErrorMensaje(`El horario seleccionado (${hora}) ya ha transcurrido en el reloj oficial de Colombia (${colClock.hora12}). Por favor selecciona un turno disponible.`);
      return;
    }

    setEnviando(true);
    try {
      const sucursalSel = sucursalesCasaDelRey.find(s => s.id === sucursalId);
      const resp = await crearCitaGrupal({
        responsableNombre: responsableNombre.trim(),
        responsableTelefono: responsableTelefono.trim(),
        responsableEmail: responsableEmail.trim() || undefined,
        fecha,
        hora,
        sucursalId,
        sucursalNombre: sucursalSel?.nombre || 'Sede Chicó Real',
        participantes: participantes.map(p => ({
          nombre: p.nombre.trim(),
          servicioId: Number(p.servicioId),
        })),
      });

      if (resp.exito && resp.reserva) {
        setCitaCreada(resp.reserva);
        onBookingSuccess(resp.reserva);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
        document.body?.scrollTo?.({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(resp.mensaje || 'Error al procesar reserva grupal.');
      }
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error al registrar la cita grupal.');
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
                  RESERVA GRUPAL CONFIRMADA EN SALÓN
                </h3>
                <span className="px-2 py-0.5 bg-[#1C2C1D] text-[#86EFAC] text-[9px] font-mono font-bold rounded border border-[#2D472F]">
                  {citaCreada.estado}
                </span>
              </div>
              <p className="text-xs text-[#A8988B] font-mono mt-0.5">
                FOLIO GRUPAL: {citaCreada.idReserva}
              </p>
            </div>
          </div>
          <VintageWaxSeal text="GRUPO VINTAGE" className="hidden sm:inline-flex" />
        </div>

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
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#86EFAC]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#261B16] text-[#E5B869] rounded-md text-[10px] font-mono border border-[#3D2E26] font-bold">
              {citaCreada.totalPersonas} CABALLEROS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">RESPONSABLE</span>
              <span className="text-[#FAF6EE] font-medium">{citaCreada.responsableNombre}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">SEDE DE LA COMITIVA</span>
              <span className="text-[#FAF6EE] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C59B27]" />
                {citaCreada.sucursalNombre || 'Sede Chicó Real'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">CONTACTO</span>
              <span className="text-[#FAF6EE] font-medium">{citaCreada.responsableTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">FECHA & HORA</span>
              <span className="text-[#E5B869] font-bold">{citaCreada.fecha} @ {citaCreada.hora}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-[#8A796D] uppercase block font-bold">TOTAL INTEGRANTES</span>
              <span className="text-[#FAF6EE] font-medium">{citaCreada.totalPersonas} clientes</span>
            </div>
            {citaCreada.responsableEmail && (
              <div className="col-span-2 pt-2 border-t border-[#2B1F19] flex items-center gap-2">
                <span className="text-[10px] text-[#8A796D] uppercase font-bold">CORREO REGISTRADO:</span>
                <span className="text-[#FAF6EE] font-medium">{citaCreada.responsableEmail}</span>
              </div>
            )}
          </div>

          {citaCreada.detalles && (
            <div className="border-t border-[#2B1F19] pt-3">
              <span className="text-[10px] text-[#C59B27] uppercase block mb-2 font-bold flex items-center gap-1">
                <StraightRazorIcon className="w-3 h-3" />
                <span>DESGLOSE DE INTEGRANTES & SERVICIOS:</span>
              </span>
              <div className="space-y-1.5">
                {citaCreada.detalles.map((d, i) => {
                  const s = servicios.find(serv => serv.id === d.servicioId);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs bg-[#14100E] p-2.5 rounded-lg border border-[#2B1F19]">
                      <span className="text-[#FAF6EE] font-medium">• {d.nombre}</span>
                      <span className="text-[#E5B869] font-mono">{s?.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Google / Apple Calendar Retention Integration */}
        <AddToCalendarButtons
          cita={citaCreada}
          duracionMinutos={citaCreada.totalPersonas * 30}
          className="mb-4"
        />

        {/* WhatsApp Direct Confirmation Button */}
        <WhatsAppConfirmButton
          cita={citaCreada}
          precioTotal={totalCalculado}
          className="mb-5"
        />

        <button
          onClick={() => setCitaCreada(null)}
          className="w-full py-2.5 px-3 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold text-xs font-mono tracking-wider shadow-md transition-all"
        >
          AGENDAR OTRA RESERVA GRUPAL
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#1A1412] border border-[#3D2E26] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#3D2E26] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-sm font-royal font-bold tracking-wide text-[#FAF6EE] uppercase">
              Reserva de Camaradería Grupal
            </h3>
          </div>
          <p className="text-xs text-[#A8988B] mt-0.5">
            Aparta múltiples sillones simultáneos para bodas, celebraciones o grupos de caballeros
          </p>
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

      {errorMensaje && (
        <div className="mb-4 p-3 rounded-lg bg-[#3E161C] border border-[#6B242D] text-[#FCA5A5] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
          <span>{errorMensaje}</span>
        </div>
      )}

      {/* 1. Sede de la Comitiva */}
      <div className="mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>01 // SELECCIONA LA SEDE PARA LA COMITIVA</span>
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
                onClick={() => setSucursalId(s.id)}
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

      {/* Responsable */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27]">
            02 // CABALLERO RESPONSABLE
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
                id="input-responsable-nombre"
                type="text"
                placeholder="Ej. Felipe Gómez"
                value={responsableNombre}
                onChange={(e) => setResponsableNombre(e.target.value)}
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
                id="input-responsable-telefono"
                type="tel"
                placeholder="Ej. +57 310 987 6543"
                value={responsableTelefono}
                onChange={(e) => setResponsableTelefono(e.target.value)}
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
                id="input-responsable-email"
                type="email"
                placeholder="responsable@ejemplo.com"
                value={responsableEmail}
                onChange={(e) => setResponsableEmail(e.target.value)}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2 pl-8 pr-3 text-xs text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <VintageDatePicker
            id="input-grupo-fecha"
            label="03 // FECHA DEL EVENTO (CALENDARIO)"
            value={fecha}
            onChange={setFecha}
            minDate={colClock.fecha}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>HORARIO DESEADO (12 HORAS)</span>
            </span>
            <span className="text-[9px] text-[#A8988B] font-normal">
              9:00 AM – 7:00 PM
            </span>
          </label>
          <select
            id="select-grupo-hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={horasDisponibles.length === 0}
            className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2.5 px-3 text-xs font-mono text-[#FAF6EE] focus:outline-none focus:border-[#C59B27] transition-colors cursor-pointer disabled:opacity-50"
          >
            {horasDisponibles.length === 0 ? (
              <option value="">No hay turnos disponibles para hoy</option>
            ) : (
              HORARIOS_GRUPALES_12H.map(h => {
                const yaPaso = isSlotPassedInColombia(h, fecha);
                return (
                  <option 
                    key={h} 
                    value={h} 
                    disabled={yaPaso} 
                    className={yaPaso ? "bg-[#14100E] text-[#5A4B43]" : "bg-[#1A1412] text-[#FAF6EE]"}
                  >
                    {h} {yaPaso ? '— (Horario ya pasado)' : ''}
                  </option>
                );
              })
            )}
          </select>
          {horasDisponibles.length === 0 && (
            <p className="text-[10px] font-mono text-[#F87171] mt-1.5">
              Todos los turnos de hoy ya han transcurrido. Por favor selecciona una fecha posterior en el calendario.
            </p>
          )}
        </div>
      </div>

      {/* Participantes */}
      <div className="border-t border-[#3D2E26] pt-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#C59B27] flex items-center gap-1.5">
              <VintageBarberPole className="w-3.5 h-3.5" />
              <span>04 // INTEGRANTES DE LA COMITIVA ({participantes.length})</span>
            </label>
            <span className="text-[9px] font-mono text-[#8A796D]">Mínimo: 2 | Máximo: 8 caballeros</span>
          </div>

          <button
            type="button"
            onClick={agregarParticipante}
            disabled={participantes.length >= 8}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#261B16] hover:bg-[#38271E] text-[#E5B869] border border-[#3D2E26] hover:border-[#C59B27] text-xs font-mono transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Sumar Integrante</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {participantes.map((p, index) => (
            <div
              key={p.id}
              className="p-3 rounded-lg bg-[#0E0A09] border border-[#3D2E26] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-inner"
            >
              <div className="w-6 h-6 rounded-md bg-[#261B16] text-[#E5B869] flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border border-[#3D2E26]">
                {index + 1}
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Nombre de caballero #${index + 1}`}
                  value={p.nombre}
                  onChange={(e) => actualizarParticipante(p.id, 'nombre', e.target.value)}
                  className="w-full bg-[#14100E] border border-[#3D2E26] rounded-md py-1.5 px-3 text-xs text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27]"
                  required
                />
              </div>

              <div className="w-full sm:w-60">
                <select
                  value={p.servicioId}
                  onChange={(e) => actualizarParticipante(p.id, 'servicioId', Number(e.target.value))}
                  className="w-full bg-[#14100E] border border-[#3D2E26] rounded-md py-1.5 px-3 text-xs text-[#FAF6EE] focus:outline-none focus:border-[#C59B27] font-mono cursor-pointer"
                >
                  {servicios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({formatPrecio(s.precio)})
                    </option>
                  ))}
                </select>
              </div>

              {participantes.length > 2 && (
                <button
                  type="button"
                  onClick={() => eliminarParticipante(p.id)}
                  className="p-1.5 rounded-md text-[#8A796D] hover:text-[#F87171] hover:bg-[#261B16] transition-colors self-end sm:self-center"
                  title="Eliminar de la lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Campo Honeypot Oculto Anti-Spam */}
        <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label htmlFor="input-empresa-hp-grp">Empresa (no rellenar)</label>
          <input
            id="input-empresa-hp-grp"
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
            id="checkbox-terminos-grupal"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 rounded border-[#3D2E26] bg-[#0E0A09] text-[#C59B27] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#C59B27]"
          />
          <label htmlFor="checkbox-terminos-grupal" className="text-[10px] font-mono text-[#A8988B] leading-tight cursor-pointer select-none">
            Acepto el tratamiento de datos para la gestión del turno grupal y la recepción del folio de comitiva vía WhatsApp / SMS (Ley 1581 de 2012).
          </label>
        </div>
      </div>

      {/* Resumen Total */}
      <div className="p-4 rounded-xl bg-[#0E0A09] border border-[#3D2E26] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="font-mono text-xs">
          <span className="text-[9px] uppercase tracking-widest text-[#8A796D] block font-bold">
            TOTAL GRUPAL ({participantes.length} SERVICIOS)
          </span>
          <span className="text-lg font-bold text-[#E5B869]">
            {formatPrecio(totalCalculado)}
          </span>
          <span className="text-[10px] text-[#A8988B] block mt-0.5">
            {fecha} @ {hora}
          </span>
        </div>

        <button
          type="submit"
          id="btn-confirmar-reserva-grupal"
          disabled={enviando}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 tracking-wider"
        >
          {enviando ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>CONFIRMANDO GRUPO...</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5" />
              <span>CONFIRMAR GRUPO</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
