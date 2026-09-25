import React, { useState, useEffect } from 'react';
import { Servicio, Cita } from '../types';
import { crearCitaGrupal } from '../services/api';
import { Users, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Check, Clock, User, Phone, Mail, ShieldCheck, MapPin, MessageSquare, Send, ExternalLink } from 'lucide-react';
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
  VintageBarberPole, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';
import { validarNombre, validarTelefono, validarEmail } from '../utils/security';

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

    // Validación escrita de seguridad del responsable
    const respNomVal = validarNombre(responsableNombre);
    if (!respNomVal.esValido) {
      setErrorMensaje(respNomVal.motivo || 'El nombre del responsable no es válido.');
      return;
    }

    const respTelVal = validarTelefono(responsableTelefono);
    if (!respTelVal.esValido) {
      setErrorMensaje(respTelVal.motivo || 'El teléfono del responsable no es válido.');
      return;
    }

    if (responsableEmail.trim()) {
      const emailVal = validarEmail(responsableEmail);
      if (!emailVal.esValido) {
        setErrorMensaje(emailVal.motivo || 'El correo electrónico no es válido.');
        return;
      }
    }

    // Validar nombres de cada participante
    for (let i = 0; i < participantes.length; i++) {
      const p = participantes[i];
      const partVal = validarNombre(p.nombre);
      if (!partVal.esValido) {
        setErrorMensaje(`Participante #${i + 1}: ${partVal.motivo || 'Nombre no permitido.'}`);
        return;
      }
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
                  RESERVA GRUPAL CONFIRMADA EN SALÓN
                </h3>
                <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-mono font-bold rounded border border-[#86EFAC]">
                  {citaCreada.estado}
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
                FOLIO GRUPAL: {citaCreada.idReserva}
              </p>
            </div>
          </div>
          <VintageWaxSeal text="GRUPO VINTAGE" className="hidden sm:inline-flex" />
        </div>

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
                  title="Copiar folio"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#FBEBE1] text-[#7C571C] rounded-md text-[10px] font-mono border border-[#DFCBB5] font-bold">
              {citaCreada.totalPersonas} CABALLEROS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">RESPONSABLE</span>
              <span className="text-[#221A14] font-medium">{citaCreada.responsableNombre}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">SEDE DE LA COMITIVA</span>
              <span className="text-[#221A14] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C571C]" />
                {citaCreada.sucursalNombre || 'Sede Chicó Real'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">CONTACTO</span>
              <span className="text-[#221A14] font-medium">{citaCreada.responsableTelefono}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">FECHA & HORA</span>
              <span className="text-[#7C571C] font-bold">{citaCreada.fecha} @ {citaCreada.hora}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">TOTAL INTEGRANTES</span>
              <span className="text-[#221A14] font-medium">{citaCreada.totalPersonas} clientes</span>
            </div>
            {citaCreada.responsableEmail && (
              <div className="col-span-2 pt-2 border-t border-[#DFCBB5] flex items-center gap-2">
                <span className="text-[10px] text-[#6F5A4B] uppercase font-bold">CORREO REGISTRADO:</span>
                <span className="text-[#221A14] font-medium">{citaCreada.responsableEmail}</span>
              </div>
            )}
          </div>

          {citaCreada.detalles && (
            <div className="border-t border-[#DFCBB5] pt-3">
              <span className="text-[10px] text-[#7C571C] uppercase block mb-2 font-bold flex items-center gap-1">
                <StraightRazorIcon className="w-3 h-3" />
                <span>DESGLOSE DE INTEGRANTES & SERVICIOS:</span>
              </span>
              <div className="space-y-1.5">
                {citaCreada.detalles.map((d, i) => {
                  const s = servicios.find(serv => serv.id === d.servicioId);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs bg-[#FFF8F5] p-2.5 rounded-lg border border-[#DFCBB5]">
                      <span className="text-[#221A14] font-medium">• {d.nombre}</span>
                      <span className="text-[#7C571C] font-mono font-bold">{s?.nombre}</span>
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

        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block animate-pulse" />
              <span className="text-xs font-bold text-[#221A14]">
                Notificación automática WhatsApp activada
              </span>
            </div>
            <span className="text-[11px] text-[#6F5A4B] block mt-0.5">
              Reserva grupal notificada a la línea oficial {WHATSAPP_BARBERIA_DISPLAY}
            </span>
          </div>
          <WhatsAppConfirmButton cita={citaCreada} autoNotificar={true} className="w-full sm:w-auto" />
        </div>

        <button
          onClick={() => setCitaCreada(null)}
          className="w-full py-2.5 px-3 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs font-mono tracking-wider shadow-sm transition-all cursor-pointer"
        >
          AGENDAR OTRA RESERVA GRUPAL
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-3.5 sm:p-6 shadow-sm relative overflow-hidden font-mono text-xs text-[#221A14]">
      <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

      <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3 sm:pb-4 mb-4 sm:mb-5 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7C571C]" />
            <h3 className="text-sm sm:text-base font-serif font-bold tracking-wide text-[#221A14] uppercase">
              Reserva de Camaradería Grupal
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-[#6F5A4B] font-mono mt-0.5">
            Aparta múltiples sillones simultáneos para bodas, celebraciones o amigos
          </p>
        </div>
      </div>

      {/* Banner de Sincronización con Reloj Colombia */}
      <div className="mb-4 sm:mb-5 p-2.5 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
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
          <span className="px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] text-xs font-mono font-black tracking-wider border border-[#DFCBB5]">
            {colClock.horaCompleta}
          </span>
        </div>
      </div>

      {errorMensaje && (
        <div className="mb-4 p-3 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
          <span>{errorMensaje}</span>
        </div>
      )}

      {/* 1. Sede de la Comitiva */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>01 // SELECCIONA LA SEDE PARA LA COMITIVA</span>
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
                onClick={() => setSucursalId(s.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden active:scale-[0.99] min-h-[95px] ${
                  isSelected
                    ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs ring-1.5 ring-[#7C571C]'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] text-[#6F5A4B] shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs sm:text-sm font-serif font-bold text-[#221A14] tracking-wide">
                      {s.nombre}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#15803D] text-[#FAF6EE] text-[8px] font-bold shrink-0">
                        Elegida
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6F5A4B] line-clamp-2 leading-relaxed font-mono mb-1">
                    {s.direccion}
                  </p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#DFCBB5]/60 flex items-center justify-between text-[9px] font-mono text-[#7C571C]">
                  <span>{s.ciudad}</span>
                  <span className="text-[#6F5A4B]">{s.telefono}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Responsable */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C]">
            02 // CABALLERO RESPONSABLE
          </label>
          <span className="text-[9px] font-mono text-[#6F5A4B]">
            * Obligatorio
          </span>
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
                id="input-responsable-nombre"
                type="text"
                placeholder="Ej. Felipe Gómez"
                value={responsableNombre}
                onChange={(e) => setResponsableNombre(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#A08875] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
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
                id="input-responsable-telefono"
                type="tel"
                placeholder="Ej. +57 310 987 6543"
                value={responsableTelefono}
                onChange={(e) => setResponsableTelefono(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#A08875] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F5A4B]">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-responsable-email"
                type="email"
                placeholder="responsable@ejemplo.com"
                value={responsableEmail}
                onChange={(e) => setResponsableEmail(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 pl-9 pr-3 text-base sm:text-xs text-[#221A14] placeholder-[#A08875] focus:outline-none focus:border-[#7C571C] transition-colors shadow-2xs min-h-[46px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div>
          <VintageDatePicker
            id="input-grupo-fecha"
            label="03 // FECHA DEL EVENTO"
            value={fecha}
            onChange={setFecha}
            minDate={colClock.fecha}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>HORARIO DESEADO</span>
            </span>
            <span className="text-[9px] text-[#6F5A4B] font-normal">
              9:00 AM – 7:00 PM
            </span>
          </label>
          <select
            id="select-grupo-hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={horasDisponibles.length === 0}
            className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl py-2.5 px-3 text-base sm:text-xs font-mono text-[#221A14] focus:outline-none focus:border-[#7C571C] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs min-h-[44px]"
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
                    className={yaPaso ? "bg-[#FBEBE1] text-[#A08875]" : "bg-[#FFFFFF] text-[#221A14]"}
                  >
                    {h} {yaPaso ? '— (Pasado)' : ''}
                  </option>
                );
              })
            )}
          </select>
          {horasDisponibles.length === 0 && (
            <p className="text-[10px] font-mono text-[#BA1A1A] mt-1">
              Todos los turnos de hoy ya han transcurrido. Selecciona otra fecha.
            </p>
          )}
        </div>
      </div>

      {/* Participantes */}
      <div className="border-t border-[#DFCBB5] pt-4 mb-4 sm:mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#7C571C] flex items-center gap-1.5">
              <VintageBarberPole className="w-3.5 h-3.5" />
              <span>04 // INTEGRANTES DE LA COMITIVA ({participantes.length})</span>
            </label>
            <span className="text-[9px] font-mono text-[#6F5A4B]">Mín: 2 | Máx: 8 caballeros</span>
          </div>

          <button
            type="button"
            onClick={agregarParticipante}
            disabled={participantes.length >= 8}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FBEBE1] hover:bg-[#F3DECE] text-[#7C571C] border border-[#DFCBB5] hover:border-[#7C571C] text-xs font-mono transition-colors disabled:opacity-40 shadow-2xs cursor-pointer min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Integrante</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {participantes.map((p, index) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="w-6 h-6 rounded-md bg-[#FBEBE1] text-[#7C571C] flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border border-[#DFCBB5]">
                  {index + 1}
                </div>
                <span className="sm:hidden text-[10px] font-mono text-[#6F5A4B] font-bold">
                  Caballero #{index + 1}
                </span>
                {participantes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => eliminarParticipante(p.id)}
                    className="sm:hidden p-1.5 rounded-lg text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors ml-auto cursor-pointer"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Nombre de caballero #${index + 1}`}
                  value={p.nombre}
                  onChange={(e) => actualizarParticipante(p.id, 'nombre', e.target.value)}
                  className="w-full bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl py-2 px-3 text-base sm:text-xs text-[#221A14] placeholder-[#A08875] focus:outline-none focus:border-[#7C571C] min-h-[42px]"
                  required
                />
              </div>

              <div className="w-full sm:w-60">
                <select
                  value={p.servicioId}
                  onChange={(e) => actualizarParticipante(p.id, 'servicioId', Number(e.target.value))}
                  className="w-full bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl py-2 px-3 text-base sm:text-xs text-[#221A14] focus:outline-none focus:border-[#7C571C] font-mono cursor-pointer min-h-[42px]"
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
                  className="hidden sm:block p-1.5 rounded-lg text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
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
        <div className="mt-3 pt-3 border-t border-[#DFCBB5] flex items-start gap-2.5">
          <input
            id="checkbox-terminos-grupal"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#DFCBB5] bg-[#FFFFFF] text-[#7C571C] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#7C571C]"
          />
          <label htmlFor="checkbox-terminos-grupal" className="text-[10px] font-mono text-[#6F5A4B] leading-tight cursor-pointer select-none">
            Acepto el tratamiento de datos para la gestión del turno grupal y confirmación conforme a la Ley 1581 de 2012.
          </label>
        </div>
      </div>

      {/* Resumen Total */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="font-mono text-xs w-full sm:w-auto text-left">
          <span className="text-[9px] uppercase tracking-widest text-[#6F5A4B] block font-bold">
            TOTAL GRUPAL ({participantes.length} SERVICIOS)
          </span>
          <span className="text-base sm:text-lg font-bold text-[#7C571C]">
            {formatPrecio(totalCalculado)}
          </span>
          <span className="text-[10px] text-[#6F5A4B] block mt-0.5">
            {fecha} @ {hora}
          </span>
        </div>

        <button
          type="submit"
          id="btn-confirmar-reserva-grupal"
          disabled={enviando}
          className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 tracking-wider cursor-pointer min-h-[48px]"
        >
          {enviando ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>CONFIRMANDO GRUPO...</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5" />
              <span>CONFIRMAR RESERVA GRUPAL</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
