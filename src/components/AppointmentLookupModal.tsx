import React, { useState, useEffect } from 'react';
import { Cita, Servicio } from '../types';
import { buscarCitas, cancelarCita, getAllCitas } from '../services/api';
import { Search, X, AlertTriangle, Copy, Check, Trash2, Calendar, Phone, User, Tag, Mail, CalendarCheck, RotateCcw } from 'lucide-react';
import { AddToCalendarButtons } from './AddToCalendarButtons';
import { 
  StraightRazorIcon, 
  VintageWaxSeal, 
  BarberPoleRibbon,
  VintageScissorsIcon 
} from './VintageBarberIcons';
import { LOGO_CASA_DEL_REY } from '../utils/assets';

interface AppointmentLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicios: Servicio[];
  onCitaUpdated: () => void;
  citas?: Cita[];
}

export const AppointmentLookupModal: React.FC<AppointmentLookupModalProps> = ({
  isOpen,
  onClose,
  servicios,
  onCitaUpdated,
  citas = [],
}) => {
  const [criterio, setCriterio] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [citasEncontradas, setCitasEncontradas] = useState<Cita[]>([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [confirmandoCancelacionId, setConfirmandoCancelacionId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Auto-cargar citas al abrir el modal para que el usuario las pueda ver inmediatamente
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setConfirmandoCancelacionId(null);

    // Si ya tenemos citas en props, usarlas como estado inicial visible
    if (citas && citas.length > 0) {
      setCitasEncontradas(citas);
      setBusquedaRealizada(false);
    }

    // Cargar además en tiempo real para traer datos frescos de Firestore / servidor
    setCargando(true);
    getAllCitas()
      .then((data) => {
        if (data && data.length > 0) {
          setCitasEncontradas(data);
        } else if (citas && citas.length > 0) {
          setCitasEncontradas(citas);
        }
      })
      .catch(() => {
        if (citas && citas.length > 0) {
          setCitasEncontradas(citas);
        }
      })
      .finally(() => {
        setCargando(false);
      });
  }, [isOpen, citas]);

  if (!isOpen) return null;

  const handleBuscar = async (e?: React.FormEvent, terminoParam?: string) => {
    if (e) e.preventDefault();
    const query = (terminoParam ?? criterio).trim();

    setCargando(true);
    setError(null);
    setBusquedaRealizada(true);

    try {
      if (!query) {
        // Si la búsqueda está vacía, mostrar todas las citas
        const data = await getAllCitas();
        setCitasEncontradas(data);
      } else {
        const data = await buscarCitas(query);
        setCitasEncontradas(data);
        if (data.length === 0) {
          setError(`No se encontraron reservas que coincidan con "${query}".`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la búsqueda en el registro.');
    } finally {
      setCargando(false);
    }
  };

  const handleRestablecerVerTodas = async () => {
    setCriterio('');
    setError(null);
    setBusquedaRealizada(false);
    setCargando(true);
    try {
      const data = await getAllCitas();
      setCitasEncontradas(data.length > 0 ? data : citas);
    } catch {
      setCitasEncontradas(citas);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelarCita = async (idReserva: string) => {
    setCancelandoId(idReserva);
    try {
      const resp = await cancelarCita(idReserva);
      // Actualizar la cita en la lista local
      setCitasEncontradas(prev =>
        prev.map(c => (c.idReserva === idReserva ? resp.reserva : c))
      );
      setConfirmandoCancelacionId(null);
      onCitaUpdated();
    } catch (err: any) {
      setError('Error al cancelar la cita: ' + (err.message || 'Inténtalo de nuevo.'));
    } finally {
      setCancelandoId(null);
    }
  };

  const handleCopiarId = (idReserva: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(idReserva);
    }
    setCopiadoId(idReserva);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(precio);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#090605]/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-[#1A1412] border border-[#3D2E26] p-4 sm:p-6 shadow-2xl overflow-hidden">
        <BarberPoleRibbon className="h-1.5 absolute top-0 left-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#3D2E26] pt-1 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#C59B27]/50 bg-[#0E0A09] shadow shrink-0 flex items-center justify-center">
              <img 
                src={LOGO_CASA_DEL_REY} 
                alt="Barbería La Casa del Rey" 
                className="w-full h-full object-cover object-center" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-royal font-bold text-[#FAF6EE] uppercase tracking-wide">
                  Citas Agendadas & Consultas
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.2 bg-[#241C18] border border-[#C59B27]/40 text-[#E5B869] text-[9px] font-mono font-bold rounded">
                  LIBRO EN VIVO
                </span>
              </div>
              <p className="text-[#8A796D] text-xs mt-0.5 font-mono">
                Revisa tus turnos agendados o busca por nombre, teléfono y folio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#FAF6EE] hover:bg-[#241C18] border border-transparent hover:border-[#3D2E26] transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input & Action Bar */}
        <form onSubmit={(e) => handleBuscar(e)} className="mt-4 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8A796D]">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={criterio}
                onChange={(e) => {
                  setCriterio(e.target.value);
                  // Búsqueda en vivo si el usuario borra el texto
                  if (e.target.value.trim() === '') {
                    handleBuscar(undefined, '');
                  }
                }}
                placeholder="Buscar por Nombre, Teléfono, Correo o Folio..."
                className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg py-2 pl-8 pr-3 text-xs font-mono text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 shadow cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{cargando ? 'Buscando...' : 'BUSCAR'}</span>
            </button>
            {(criterio.trim() || busquedaRealizada) && (
              <button
                type="button"
                onClick={handleRestablecerVerTodas}
                className="px-3 py-2 bg-[#261B16] hover:bg-[#34241D] text-[#E5B869] font-mono font-bold text-xs rounded-lg border border-[#3D2E26] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Ver todas las citas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VER TODAS</span>
              </button>
            )}
          </div>
        </form>

        {/* Quick Demo suggestions */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#8A796D] shrink-0">
          <span>Sugerencias rápidas:</span>
          <button
            type="button"
            onClick={() => {
              setCriterio('Mateo');
              handleBuscar(undefined, 'Mateo');
            }}
            className="text-[#E5B869] hover:text-[#FAF6EE] underline cursor-pointer"
          >
            "Mateo"
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setCriterio('Camilo');
              handleBuscar(undefined, 'Camilo');
            }}
            className="text-[#E5B869] hover:text-[#FAF6EE] underline cursor-pointer"
          >
            "Camilo"
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setCriterio('301');
              handleBuscar(undefined, '301');
            }}
            className="text-[#E5B869] hover:text-[#FAF6EE] underline cursor-pointer"
          >
            Teléfono: "301"
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-[#3E161C] border border-[#6B242D] text-[#FCA5A5] text-xs flex items-center gap-2 font-mono shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results count label */}
        <div className="mt-3 text-[11px] font-mono text-[#E5B869] flex items-center justify-between border-b border-[#2E2019] pb-2 shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <CalendarCheck className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>{citasEncontradas.length} {citasEncontradas.length === 1 ? 'cita registrada' : 'citas registradas en el libro'}</span>
          </span>
          {cargando && <span className="text-[10px] text-[#A8988B] animate-pulse">Actualizando...</span>}
        </div>

        {/* Results List (scrollable) */}
        <div className="mt-3 space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          {citasEncontradas.length === 0 && !cargando ? (
            <div className="p-8 text-center border border-dashed border-[#3D2E26] rounded-xl bg-[#0E0A09]">
              <CalendarCheck className="w-8 h-8 text-[#C59B27]/60 mx-auto mb-2" />
              <p className="text-xs font-mono text-[#FAF6EE] font-bold">No hay citas para mostrar</p>
              <p className="text-[11px] text-[#8A796D] mt-1 font-mono">
                {criterio ? `No se encontraron coincidencias para "${criterio}".` : 'No hay reservas registradas en este momento.'}
              </p>
              <button
                type="button"
                onClick={handleRestablecerVerTodas}
                className="mt-3 px-3 py-1.5 bg-[#C59B27] text-[#120E0C] text-xs font-bold font-mono rounded-lg hover:bg-[#D4A373] transition-colors cursor-pointer"
              >
                Cargar todas las citas
              </button>
            </div>
          ) : (
            citasEncontradas.map((cita) => {
              const servicio = cita.servicioId ? servicios.find(s => s.id === cita.servicioId) : null;
              const esCancelada = cita.estado === 'Cancelada';
              const estaConfirmando = confirmandoCancelacionId === cita.idReserva;

              return (
                <div
                  key={cita.idReserva}
                  className="rounded-xl bg-[#0E0A09] p-4 border border-[#3D2E26] space-y-3 font-mono text-xs shadow-inner transition-all hover:border-[#8A6642]"
                >
                  <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
                    <div>
                      <span className="text-[9px] text-[#8A796D] uppercase tracking-wider block font-bold">
                        FOLIO REGISTRADO
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-base font-bold text-[#E5B869]">{cita.idReserva}</span>
                        <button
                          type="button"
                          onClick={() => handleCopiarId(cita.idReserva)}
                          className="text-[#8A796D] hover:text-[#FAF6EE] p-0.5 transition-colors cursor-pointer"
                          title="Copiar folio"
                        >
                          {copiadoId === cita.idReserva ? (
                            <Check className="w-3.5 h-3.5 text-[#86EFAC]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        cita.estado === 'Confirmada'
                          ? 'bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F]'
                          : 'bg-[#3E161C] text-[#F87171] border border-[#6B242D]'
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-[9px] text-[#8A796D] block uppercase font-bold flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        FORMATO:
                      </span>
                      <span className="font-bold text-[#FAF6EE]">{cita.tipo}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8A796D] block uppercase font-bold flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        CABALLERO:
                      </span>
                      <span className="font-medium text-[#FAF6EE]">
                        {cita.clienteNombre || cita.responsableNombre}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8A796D] block uppercase font-bold flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        FECHA & HORA:
                      </span>
                      <span className="font-bold text-[#E5B869]">
                        {cita.fecha} @ {cita.hora}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#8A796D] block uppercase font-bold flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        CONTACTO:
                      </span>
                      <span className="font-medium text-[#FAF6EE]">
                        {cita.clienteTelefono || cita.responsableTelefono}
                      </span>
                    </div>
                    {(cita.clienteEmail || cita.responsableEmail) && (
                      <div className="col-span-2 pt-1 border-t border-[#2E2019] flex items-center gap-1.5 text-xs text-[#A8988B]">
                        <Mail className="w-3 h-3 text-[#C59B27] shrink-0" />
                        <span className="text-[9px] uppercase font-bold text-[#8A796D]">CORREO:</span>
                        <span className="text-[#FAF6EE] font-medium">{cita.clienteEmail || cita.responsableEmail}</span>
                      </div>
                    )}
                  </div>

                  {cita.tipo === 'Individual' && servicio && (
                    <div className="pt-2.5 border-t border-[#2E2019] flex justify-between items-center text-xs">
                      <span className="text-[#A8988B]">Servicio: {servicio.nombre}</span>
                      <span className="font-bold text-[#FAF6EE]">{formatPrecio(servicio.precio)}</span>
                    </div>
                  )}

                  {cita.tipo === 'Grupal' && cita.detalles && (
                    <div className="pt-2.5 border-t border-[#2E2019]">
                      <span className="text-[9px] text-[#C59B27] block mb-1.5 font-bold uppercase flex items-center gap-1">
                        <VintageScissorsIcon className="w-3 h-3" />
                        <span>INTEGRANTES ({cita.totalPersonas}):</span>
                      </span>
                      <div className="space-y-1.5">
                        {cita.detalles.map((d, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-xs text-[#A8988B] bg-[#14100E] p-2 rounded-lg border border-[#2E2019]"
                          >
                            <span className="text-[#FAF6EE]">• {d.nombre}</span>
                            <span className="text-[#E5B869]">
                              {servicios.find(s => s.id === d.servicioId)?.nombre || 'Servicio'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!esCancelada && (
                    <div className="pt-3 border-t border-[#2E2019] space-y-2.5">
                      <AddToCalendarButtons
                        cita={cita}
                        servicioNombre={servicio?.nombre}
                        duracionMinutos={servicio?.duracionMinutos}
                      />
                      
                      {estaConfirmando ? (
                        <div className="p-2.5 rounded-lg bg-[#2E1216] border border-[#6B242D] space-y-2">
                          <p className="text-[11px] text-[#FCA5A5] font-bold text-center">
                            ¿Estás seguro de cancelar la cita #{cita.idReserva}?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCancelarCita(cita.idReserva)}
                              disabled={cancelandoId === cita.idReserva}
                              className="flex-1 py-1.5 px-2 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-[#FAF6EE] font-bold text-xs transition-colors cursor-pointer"
                            >
                              {cancelandoId === cita.idReserva ? 'Cancelando...' : 'Sí, Cancelar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmandoCancelacionId(null)}
                              className="flex-1 py-1.5 px-2 rounded bg-[#261B16] hover:bg-[#3D2E26] text-[#FAF6EE] font-bold text-xs transition-colors cursor-pointer"
                            >
                              Volver
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmandoCancelacionId(cita.idReserva)}
                          disabled={cancelandoId === cita.idReserva}
                          className="w-full py-2 px-3 rounded-lg bg-[#3E161C] hover:bg-[#521E25] text-[#F87171] border border-[#6B242D] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancelar Cita en Registro</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

