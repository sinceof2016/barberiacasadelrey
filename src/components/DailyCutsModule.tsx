import React, { useState, useEffect } from 'react';
import { CorteDiario, Servicio, Barbero, Cita, MetodoPago } from '../types';
import { 
  getCortesDiarios, 
  crearCorteDiario, 
  toggleLiquidarCorte, 
  liquidarBarberoCompleto, 
  eliminarCorteDiario 
} from '../services/api';
import { 
  Plus, 
  Calendar, 
  Check, 
  Clock, 
  Trash2, 
  User, 
  DollarSign, 
  Percent, 
  Wallet, 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Scissors,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { VintageDatePicker } from './VintageDatePicker';
import { dispararAperturaPorEfectivo } from '../services/cashDrawer';
import { 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageCrownIcon,
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';

interface DailyCutsModuleProps {
  servicios: Servicio[];
  barberos: Barbero[];
  citas: Cita[];
  onDataUpdated?: () => void;
}

export const DailyCutsModule: React.FC<DailyCutsModuleProps> = ({
  servicios,
  barberos,
  citas,
  onDataUpdated,
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyStr);
  const [cortes, setCortes] = useState<CorteDiario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [barberoId, setBarberoId] = useState<number>(barberos[0]?.id || 101);
  const [servicioId, setServicioId] = useState<number>(servicios[0]?.id || 1);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [precio, setPrecio] = useState<number>(servicios[0]?.precio || 35000);
  const [propina, setPropina] = useState<number>(0);
  const [porcentajeBarbero, setPorcentajeBarbero] = useState<number>(50);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [notas, setNotas] = useState<string>('');
  const [citaSeleccionada, setCitaSeleccionada] = useState<string>('');

  // Voucher modal state
  const [voucherBarbero, setVoucherBarbero] = useState<{
    barbero: Barbero;
    cortes: CorteDiario[];
    totalBruto: number;
    totalComision: number;
    totalPropinas: number;
    totalNeto: number;
  } | null>(null);
  const [copiadoVoucher, setCopiadoVoucher] = useState<boolean>(false);

  // Filter in cuts table
  const [filtroBarbero, setFiltroBarbero] = useState<string>('todos');

  const cargarCortes = async (fecha: string) => {
    setCargando(true);
    setError(null);
    try {
      const data = await getCortesDiarios(fecha);
      setCortes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cortes del día');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCortes(fechaSeleccionada);
  }, [fechaSeleccionada]);

  // When changing service in dropdown, update price
  const handleServicioChange = (id: number) => {
    setServicioId(id);
    const srv = servicios.find(s => s.id === id);
    if (srv) {
      setPrecio(srv.precio);
    }
  };

  // Import appointment info if selected
  const handleSeleccionarCita = (idReserva: string) => {
    setCitaSeleccionada(idReserva);
    if (!idReserva) return;

    const cita = citas.find(c => c.idReserva === idReserva);
    if (cita) {
      if (cita.clienteNombre) setClienteNombre(cita.clienteNombre);
      else if (cita.responsableNombre) setClienteNombre(cita.responsableNombre);

      if (cita.servicioId) {
        setServicioId(cita.servicioId);
        const srv = servicios.find(s => s.id === cita.servicioId);
        if (srv) setPrecio(srv.precio);
      }
      if (cita.barberoId) {
        setBarberoId(Number(cita.barberoId));
      }
    }
  };

  // Calculations preview
  const comisionBruta = Math.round(precio * (porcentajeBarbero / 100));
  const montoBarbero = comisionBruta + (Number(propina) || 0);
  const montoBarberia = precio - comisionBruta;

  const handleCrearCorte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      setError('Por favor ingresa el nombre del cliente');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const srv = servicios.find(s => s.id === servicioId);
      const res = await crearCorteDiario({
        barberoId,
        servicioId,
        servicioNombre: srv?.nombre || 'Corte Personalizado',
        clienteNombre: clienteNombre.trim(),
        precio: Number(precio),
        propina: Number(propina) || 0,
        porcentajeBarbero: Number(porcentajeBarbero),
        metodoPago,
        fecha: fechaSeleccionada,
        citaIdReserva: citaSeleccionada || undefined,
        notas: notas.trim() || undefined,
      });

      setCortes(prev => [res.corte, ...prev]);
      setMensajeExito(`Corte de ${clienteNombre} registrado y dividido con éxito.`);
      setTimeout(() => setMensajeExito(null), 4000);

      // Disparador automático de gaveta registradora si se cobra en Efectivo
      if (metodoPago === 'Efectivo') {
        dispararAperturaPorEfectivo(
          `Cobro en efectivo: ${clienteNombre.trim()} - $${Number(precio).toLocaleString('es-CO')} COP`
        );
      }

      // Reset fields
      setClienteNombre('');
      setPropina(0);
      setNotas('');
      setCitaSeleccionada('');
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al registrar corte');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleLiquidar = async (id: string) => {
    try {
      const res = await toggleLiquidarCorte(id);
      setCortes(prev => prev.map(c => c.id === id ? res.corte : c));
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar liquidación: ' + err.message);
    }
  };

  const handleLiquidarBarbero = async (bId: number, bNombre: string) => {
    if (!window.confirm(`¿Confirmas liquidar y marcar como pagados todos los cortes de ${bNombre} para la fecha ${fechaSeleccionada}?`)) {
      return;
    }

    try {
      const res = await liquidarBarberoCompleto(bId, fechaSeleccionada);
      alert(res.mensaje);
      cargarCortes(fechaSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al liquidar barbero: ' + err.message);
    }
  };

  const handleEliminarCorte = async (id: string, cliente: string) => {
    if (!window.confirm(`¿Estás seguro de anular el corte registrado de "${cliente}"?`)) return;

    try {
      await eliminarCorteDiario(id);
      setCortes(prev => prev.filter(c => c.id !== id));
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al anular corte: ' + err.message);
    }
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Group statistics per barber
  const estadisticasBarberos = barberos.map(barbero => {
    const cortesBarbero = cortes.filter(c => Number(c.barberoId) === barbero.id);
    const count = cortesBarbero.length;
    const bruto = cortesBarbero.reduce((sum, c) => sum + c.precio, 0);
    const comision = cortesBarbero.reduce((sum, c) => sum + (c.montoBarbero - c.propina), 0);
    const propinas = cortesBarbero.reduce((sum, c) => sum + c.propina, 0);
    const totalNeto = cortesBarbero.reduce((sum, c) => sum + c.montoBarbero, 0);
    const pagado = cortesBarbero.filter(c => c.liquidadoAlBarbero).reduce((sum, c) => sum + c.montoBarbero, 0);
    const pendiente = totalNeto - pagado;

    return {
      barbero,
      cortesBarbero,
      count,
      bruto,
      comision,
      propinas,
      totalNeto,
      pagado,
      pendiente,
      estaAlDia: pendiente === 0 && count > 0,
    };
  });

  const abrirVoucher = (stat: typeof estadisticasBarberos[0]) => {
    setVoucherBarbero({
      barbero: stat.barbero,
      cortes: stat.cortesBarbero,
      totalBruto: stat.bruto,
      totalComision: stat.comision,
      totalPropinas: stat.propinas,
      totalNeto: stat.totalNeto,
    });
  };

  const copiarVoucherTexto = () => {
    if (!voucherBarbero) return;
    const texto = `👑 BARBERÍA CASA DEL REY 👑
COMPROBANTE DE LIQUIDACIÓN DIARIA
----------------------------------
Barbero: ${voucherBarbero.barbero.nombre}
Fecha: ${fechaSeleccionada}
Cortes Realizados: ${voucherBarbero.cortes.length}

DETALLE DE SERVICIOS:
${voucherBarbero.cortes.map(c => `• ${c.hora} - ${c.clienteNombre} (${c.servicioNombre}): ${formatCOP(c.precio)} [Comisión: ${formatCOP(c.montoBarbero - c.propina)}${c.propina > 0 ? ` + Propina: ${formatCOP(c.propina)}` : ''}]`).join('\n')}

----------------------------------
Bruto Generado: ${formatCOP(voucherBarbero.totalBruto)}
Comisión Ganada: ${formatCOP(voucherBarbero.totalComision)}
Propinas: ${formatCOP(voucherBarbero.totalPropinas)}
TOTAL A RECIBIR: ${formatCOP(voucherBarbero.totalNeto)}
----------------------------------
¡Gracias por tu honor y maestría!`;

    navigator.clipboard.writeText(texto);
    setCopiadoVoucher(true);
    setTimeout(() => setCopiadoVoucher(false), 2500);
  };

  // Filtered cuts table
  const cortesVisibles = cortes.filter(c => {
    if (filtroBarbero === 'todos') return true;
    return String(c.barberoId) === filtroBarbero;
  });

  // Total summary of today's cuts
  const totalCortesDia = cortes.length;
  const totalBrutoDia = cortes.reduce((sum, c) => sum + c.precio, 0);
  const totalBarberosDia = cortes.reduce((sum, c) => sum + c.montoBarbero, 0);
  const totalBarberiaDia = cortes.reduce((sum, c) => sum + c.montoBarberia, 0);

  // Turnos agendados sincronizados con la fecha seleccionada del calendario interno
  const citasDelDia = citas.filter(
    c => c.fecha === fechaSeleccionada && c.estado !== 'Cancelada'
  );
  const citasAtendidasIds = new Set(cortes.map(c => c.citaIdReserva).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Header & Date selector con Calendario Interno */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <VintageScissorsIcon className="w-5 h-5 text-[#C59B27]" />
              <h2 className="font-royal text-base sm:text-lg font-bold text-[#FAF6EE] uppercase tracking-wide">
                Registro de Cortes & División por Barbero
              </h2>
            </div>
            <p className="text-xs text-[#8A796D] font-mono mt-0.5">
              Control diario sincronizado con el calendario interno de Casa del Rey
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
            <div className="w-full sm:w-64">
              <VintageDatePicker
                id="datepicker-cortes-calendario"
                value={fechaSeleccionada}
                onChange={setFechaSeleccionada}
              />
            </div>
            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="text-[10px] bg-[#261B16] text-[#FAF6EE] px-2.5 py-2 rounded-lg border border-[#3D2E26] hover:border-[#C59B27] hover:bg-[#3D2E26] transition-colors whitespace-nowrap cursor-pointer font-mono font-bold"
              >
                Volver a Hoy
              </button>
            )}
          </div>
        </div>

        {/* Quick Day Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#2A1E18] font-mono">
          <div className="bg-[#120E0C] p-2.5 rounded-lg border border-[#2E2019]">
            <span className="text-[10px] text-[#8A796D] uppercase block">Cortes Realizados</span>
            <span className="text-base sm:text-lg font-bold text-[#FAF6EE]">{totalCortesDia}</span>
          </div>
          <div className="bg-[#120E0C] p-2.5 rounded-lg border border-[#2E2019]">
            <span className="text-[10px] text-[#8A796D] uppercase block">Total Facturado</span>
            <span className="text-base sm:text-lg font-bold text-[#FAF6EE]">{formatCOP(totalBrutoDia)}</span>
          </div>
          <div className="bg-[#120E0C] p-2.5 rounded-lg border border-[#2E2019]">
            <span className="text-[10px] text-[#C59B27] uppercase block">Para Barberos</span>
            <span className="text-base sm:text-lg font-bold text-[#E5B869]">{formatCOP(totalBarberosDia)}</span>
          </div>
          <div className="bg-[#120E0C] p-2.5 rounded-lg border border-[#2E2019]">
            <span className="text-[10px] text-[#86EFAC] uppercase block">Casa del Rey (Neto)</span>
            <span className="text-base sm:text-lg font-bold text-[#86EFAC]">{formatCOP(totalBarberiaDia)}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Turnos del Día (Hoy) sincronizados con el calendario interno */}
      {/* Color de fondo: Blanco Marfil (#FAF6EE) */}
      <div 
        id="seccion-turnos-del-dia"
        className="rounded-2xl bg-[#FAF6EE] border border-[#DDD3C1] shadow-2xl p-4 sm:p-5 relative overflow-hidden text-[#1A1412] font-mono"
      >
        <BarberPoleRibbon className="h-1 absolute top-0 left-0" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pt-1 border-b border-[#E5DCCB] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1412] text-[#E5B869] flex items-center justify-center shrink-0 shadow-sm">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-royal text-sm sm:text-base font-bold uppercase text-[#1A1412] tracking-wider">
                  {fechaSeleccionada === hoyStr ? 'Turnos del Día (Hoy)' : `Turnos del Día (${fechaSeleccionada})`}
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#1A1412] bg-[#EDE5D4] px-2.5 py-0.5 rounded-full border border-[#D5C8B3]">
                  {citasDelDia.length} {citasDelDia.length === 1 ? 'Turno' : 'Turnos'}
                </span>
                {fechaSeleccionada === hoyStr ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                    <span>Sincronizado Hoy</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]">
                    Fecha Calendario: {fechaSeleccionada}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6A574A] font-mono mt-0.5">
                Sincronizado con el calendario interno &bull; {citasDelDia.filter(c => citasAtendidasIds.has(c.idReserva)).length} de {citasDelDia.length} registrados en caja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="px-3 py-1.5 rounded-lg bg-[#1A1412] hover:bg-[#2A1E18] text-[#FAF6EE] font-mono text-[11px] font-bold border border-[#3D2E26] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3 h-3 text-[#C59B27]" />
                <span>Volver a Hoy</span>
              </button>
            )}
            <div className="text-[11px] text-[#7C6656] font-mono bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[#E5DCCB] shadow-2xs">
              📅 {fechaSeleccionada}
            </div>
          </div>
        </div>

        {citasDelDia.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5DCCB] text-center font-mono text-xs shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF6EE] text-[#8A6642] flex items-center justify-center mx-auto border border-[#E5DCCB]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-bold text-[#1A1412]">
              No hay turnos programados en el calendario para {fechaSeleccionada}
            </div>
            <p className="text-[#6A574A] text-[11px] max-w-md mx-auto">
              Puedes seleccionar otra fecha en el calendario superior, registrar clientes de turno directo (walk-ins) en caja o agendar un nuevo turno.
            </p>
            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-[#1A1412] text-[#FAF6EE] text-[11px] font-bold hover:bg-[#C59B27] hover:text-[#120E0C] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver los Turnos de Hoy</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {citasDelDia.map(cita => {
              const yaAtendido = citasAtendidasIds.has(cita.idReserva);
              const srv = servicios.find(s => s.id === cita.servicioId);
              const barbero = barberos.find(b => String(b.id) === String(cita.barberoId));
              const esSeleccionada = citaSeleccionada === cita.idReserva;

              return (
                <div
                  key={cita.idReserva}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between font-mono text-xs shadow-sm ${
                    esSeleccionada
                      ? 'bg-[#FFFFFF] border-[#C59B27] ring-2 ring-[#C59B27]/60 shadow-md'
                      : yaAtendido
                      ? 'bg-[#F4F9F4] border-[#C8E6C9]'
                      : 'bg-[#FFFFFF] border-[#E5DCCB] hover:border-[#C59B27] hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#1A1412] text-[#FAF6EE] font-bold text-[11px]">
                          {cita.hora}
                        </span>
                        <span className="text-[10px] text-[#7C6656] font-medium">
                          #{cita.idReserva}
                        </span>
                      </div>
                      {yaAtendido ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] text-[9px] font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Atendido</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-[9px] font-bold">
                          En Espera
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-[#1A1412] text-sm truncate">
                      {cita.clienteNombre || cita.responsableNombre}
                    </div>

                    <div className="text-[11px] font-bold text-[#8A5812] truncate mt-0.5">
                      {srv ? srv.nombre : 'Servicio Reservado'}
                    </div>

                    <div className="text-[10px] text-[#6A574A] mt-1.5 pt-1.5 border-t border-[#F0E8D9] flex items-center justify-between">
                      <span>Barbero: <strong className="text-[#1A1412]">{barbero ? barbero.nombre : 'Cualquiera'}</strong></span>
                      {srv && <span className="text-[#1A1412] font-bold font-mono">{formatCOP(srv.precio)}</span>}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#F0E8D9] flex items-center justify-end">
                    {yaAtendido ? (
                      <span className="text-[10px] text-[#15803D] font-bold flex items-center gap-1 bg-[#DCFCE7] px-2 py-1 rounded-lg w-full justify-center border border-[#BBF7D0]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Registrado en Caja</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleSeleccionarCita(cita.idReserva);
                          document.getElementById('form-registro-corte')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm ${
                          esSeleccionada
                            ? 'bg-[#C59B27] text-[#120E0C]'
                            : 'bg-[#1A1412] hover:bg-[#C59B27] text-[#FAF6EE] hover:text-[#120E0C]'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{esSeleccionada ? 'Seleccionado en Caja' : 'Atender / Cargar a Caja'}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Form on left, Barber Cards on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Registrar Corte Realizado */}
        <div id="form-registro-corte" className="lg:col-span-5 bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C59B27]" />
              <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                Registrar Corte Realizado
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#261B16] text-[#E5B869] border border-[#3D2E26]">
              DIVISIÓN AUTOMÁTICA
            </span>
          </div>

          {/* Quick Import from Booked Appointments */}
          {citas.length > 0 && (
            <div className="bg-[#120E0C] p-2.5 rounded-lg border border-[#2E2019] space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold">
                  Importar desde Cita Agendada:
                </label>
                <span className="text-[9px] text-[#E5B869] font-mono">
                  {citasDelDia.length} citas hoy
                </span>
              </div>
              <select
                value={citaSeleccionada}
                onChange={(e) => handleSeleccionarCita(e.target.value)}
                className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C59B27]"
              >
                <option value="">-- Corte directo / Walk-in sin cita previa --</option>
                {citasDelDia.length > 0 && (
                  <optgroup label={`📅 Citas de esta fecha (${fechaSeleccionada})`}>
                    {citasDelDia.map(c => (
                      <option key={c.idReserva} value={c.idReserva}>
                        [{c.hora}] {c.clienteNombre || c.responsableNombre} - #{c.idReserva} {citasAtendidasIds.has(c.idReserva) ? '(Atendido)' : '(Pendiente)'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {citas.filter(c => c.fecha !== fechaSeleccionada && c.estado !== 'Cancelada').length > 0 && (
                  <optgroup label="Otras fechas agendadas">
                    {citas
                      .filter(c => c.fecha !== fechaSeleccionada && c.estado !== 'Cancelada')
                      .slice(0, 15)
                      .map(c => (
                        <option key={c.idReserva} value={c.idReserva}>
                          [{c.fecha} {c.hora}] {c.clienteNombre || c.responsableNombre} - #{c.idReserva}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <form onSubmit={handleCrearCorte} className="space-y-3.5">
            {/* Barbero */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Barbero que Realizó el Servicio:
              </label>
              <select
                value={barberoId}
                onChange={(e) => setBarberoId(Number(e.target.value))}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
              >
                {barberos.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.especialidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Nombre del Caballero / Cliente:
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C59B27] placeholder-[#5C4A3E]"
              />
            </div>

            {/* Servicio */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Servicio Aplicado:
              </label>
              <select
                value={servicioId}
                onChange={(e) => handleServicioChange(Number(e.target.value))}
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
              >
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - {formatCOP(s.precio)}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio & Porcentaje de Comisión */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                  Monto Cobrado (COP):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[#8A796D]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    required
                    className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                  % Barbero (Split):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={porcentajeBarbero}
                    onChange={(e) => setPorcentajeBarbero(Number(e.target.value))}
                    className="w-16 bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] text-center rounded-lg py-2 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                  <div className="flex gap-1">
                    {[50, 60, 40].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPorcentajeBarbero(pct)}
                        className={`px-1.5 py-1 rounded text-[10px] border transition-colors ${
                          porcentajeBarbero === pct
                            ? 'bg-[#C59B27] text-[#120E0C] border-[#C59B27] font-bold'
                            : 'bg-[#120E0C] text-[#8A796D] border-[#3D2E26] hover:text-[#FAF6EE]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Propina & Medio de Pago */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                  Propina (100% Barbero):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[#8A796D]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={propina}
                    onChange={(e) => setPropina(Number(e.target.value))}
                    className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nequi / Daviplata">📱 Nequi / Daviplata</option>
                  <option value="Tarjeta / Datáfono">💳 Tarjeta / Datáfono</option>
                </select>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Detalle / Nota Opcional:
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Peinado con pomada mate especial..."
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#C59B27] placeholder-[#5C4A3E]"
              />
            </div>

            {/* LIVE DIVISION PREVIEW BOX */}
            <div className="rounded-xl bg-[#0E0A09] border border-[#C59B27]/40 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#8A796D]">
                <span>DIVISIÓN CALCULADA EN VIVO:</span>
                <span className="font-bold text-[#FAF6EE]">{porcentajeBarbero}% / {100 - porcentajeBarbero}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1A1412] p-2 rounded-lg border border-[#2E2019]">
                  <span className="text-[10px] text-[#C59B27] block font-bold">GANANCIA BARBERO:</span>
                  <span className="text-sm font-bold text-[#E5B869]">{formatCOP(montoBarbero)}</span>
                  {propina > 0 && (
                    <span className="text-[9px] text-[#8A796D] block">Incluye {formatCOP(propina)} propina</span>
                  )}
                </div>
                <div className="bg-[#1A1412] p-2 rounded-lg border border-[#2E2019]">
                  <span className="text-[10px] text-[#86EFAC] block font-bold">CASA DEL REY:</span>
                  <span className="text-sm font-bold text-[#86EFAC]">{formatCOP(montoBarberia)}</span>
                  <span className="text-[9px] text-[#8A796D] block">Margen del salón</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#3E161C] border border-[#6B242D] text-[#FCA5A5] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mensajeExito && (
              <div className="p-2.5 rounded-lg bg-[#1C2C1D] border border-[#2D472F] text-[#86EFAC] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs rounded-lg transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase"
            >
              <Scissors className="w-4 h-4" />
              <span>{guardando ? 'REGISTRANDO...' : 'REGISTRAR CORTE EN LIBRO'}</span>
            </button>
          </form>
        </div>

        {/* Liquidación por Barbero (Cards) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3D2E26] pb-2 font-mono">
            <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide flex items-center gap-2">
              <StraightRazorIcon className="w-4 h-4 text-[#C59B27]" />
              <span>Liquidación & Ganancias por Barbero</span>
            </h3>
            <span className="text-xs text-[#8A796D]">{barberos.length} Barberos activos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {estadisticasBarberos.map(stat => (
              <div 
                key={stat.barbero.id} 
                className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 shadow-lg font-mono text-xs flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between border-b border-[#2E2019] pb-2.5">
                    <div>
                      <h4 className="font-royal text-sm font-bold text-[#FAF6EE]">
                        {stat.barbero.nombre}
                      </h4>
                      <span className="text-[10px] text-[#C59B27] block">
                        {stat.barbero.especialidad}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      stat.count === 0
                        ? 'bg-[#1E1714] text-[#8A796D] border border-[#2E2019]'
                        : stat.pendiente === 0
                        ? 'bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F]'
                        : 'bg-[#3E2D12] text-[#FCD34D] border border-[#6B4E1B]'
                    }`}>
                      {stat.count === 0 ? 'Sin cortes hoy' : stat.pendiente === 0 ? 'Liquidado' : 'Pendiente Pago'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-[#120E0C] p-2 rounded-lg border border-[#2E2019]">
                      <span className="text-[9px] text-[#8A796D] block uppercase">Cortes Atendidos:</span>
                      <span className="text-sm font-bold text-[#FAF6EE]">{stat.count}</span>
                    </div>
                    <div className="bg-[#120E0C] p-2 rounded-lg border border-[#2E2019]">
                      <span className="text-[9px] text-[#8A796D] block uppercase">Bruto Facturado:</span>
                      <span className="text-xs font-bold text-[#FAF6EE]">{formatCOP(stat.bruto)}</span>
                    </div>
                    <div className="bg-[#120E0C] p-2 rounded-lg border border-[#2E2019]">
                      <span className="text-[9px] text-[#8A796D] block uppercase">Comisión Base:</span>
                      <span className="text-xs font-bold text-[#E5B869]">{formatCOP(stat.comision)}</span>
                    </div>
                    <div className="bg-[#120E0C] p-2 rounded-lg border border-[#2E2019]">
                      <span className="text-[9px] text-[#8A796D] block uppercase">Propinas Recibidas:</span>
                      <span className="text-xs font-bold text-[#E5B869]">{formatCOP(stat.propinas)}</span>
                    </div>
                  </div>

                  {/* Total to pay banner */}
                  <div className="bg-[#0E0A09] p-2.5 rounded-lg border border-[#3D2E26] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8A796D] block uppercase font-bold">Total a Entregar:</span>
                      <span className="text-base font-bold text-[#E5B869]">{formatCOP(stat.totalNeto)}</span>
                    </div>
                    {stat.pendiente > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] text-[#F87171] block font-bold uppercase">Por pagar:</span>
                        <span className="text-xs font-bold text-[#F87171]">{formatCOP(stat.pendiente)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#2E2019] mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirVoucher(stat)}
                    disabled={stat.count === 0}
                    className="flex-1 py-1.5 px-2 bg-[#261B16] hover:bg-[#3D2E26] text-[#FAF6EE] border border-[#3D2E26] rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Recibo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLiquidarBarbero(stat.barbero.id, stat.barbero.nombre)}
                    disabled={stat.pendiente === 0 || stat.count === 0}
                    className="flex-1 py-1.5 px-2 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Liquidar Todo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table: Registro Histórico de Cortes del Día */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E2019] pb-3">
          <div className="flex items-center gap-2">
            <VintageCrownIcon className="w-4 h-4 text-[#C59B27]" />
            <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
              Libro Maestro de Cortes Realizados ({cortesVisibles.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8A796D]">Filtrar por Barbero:</span>
            <select
              value={filtroBarbero}
              onChange={(e) => setFiltroBarbero(e.target.value)}
              className="bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C59B27]"
            >
              <option value="todos">Todos los barberos</option>
              {barberos.map(b => (
                <option key={b.id} value={String(b.id)}>{b.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="py-8 text-center text-[#8A796D]">Cargando libro de cortes...</div>
        ) : cortesVisibles.length === 0 ? (
          <div className="py-8 text-center text-[#8A796D]">
            No hay cortes registrados para la fecha {fechaSeleccionada}. Utiliza el formulario superior para añadir el primer corte del día.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2E2019] text-[10px] text-[#8A796D] uppercase">
                  <th className="pb-2.5 font-bold">Hora / ID</th>
                  <th className="pb-2.5 font-bold">Barbero</th>
                  <th className="pb-2.5 font-bold">Caballero / Servicio</th>
                  <th className="pb-2.5 font-bold">Medio</th>
                  <th className="pb-2.5 font-bold text-right">Precio Total</th>
                  <th className="pb-2.5 font-bold text-right text-[#E5B869]">Barbero</th>
                  <th className="pb-2.5 font-bold text-right text-[#86EFAC]">Casa del Rey</th>
                  <th className="pb-2.5 font-bold text-center">Liquidado</th>
                  <th className="pb-2.5 font-bold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#261B16]">
                {cortesVisibles.map(corte => (
                  <tr key={corte.id} className="hover:bg-[#201815] transition-colors">
                    <td className="py-2.5 whitespace-nowrap">
                      <span className="font-bold text-[#FAF6EE]">{corte.hora}</span>
                      <span className="text-[10px] text-[#705F53] block">{corte.id}</span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className="font-medium text-[#FAF6EE]">{corte.barberoNombre}</span>
                      <span className="text-[10px] text-[#C59B27] block">{corte.porcentajeBarbero}% split</span>
                    </td>
                    <td className="py-2.5">
                      <span className="font-bold text-[#FAF6EE]">{corte.clienteNombre}</span>
                      <span className="text-[10px] text-[#8A796D] block">{corte.servicioNombre}</span>
                      {corte.notas && <span className="text-[9px] text-[#E5B869] italic block">{corte.notas}</span>}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-[11px] text-[#A8988B]">
                      {corte.metodoPago}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-right font-bold text-[#FAF6EE]">
                      {formatCOP(corte.precio)}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-right text-[#E5B869] font-bold">
                      {formatCOP(corte.montoBarbero)}
                      {corte.propina > 0 && (
                        <span className="text-[9px] text-[#86EFAC] block font-normal">+{formatCOP(corte.propina)} prop</span>
                      )}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-right text-[#86EFAC] font-bold">
                      {formatCOP(corte.montoBarberia)}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleLiquidar(corte.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          corte.liquidadoAlBarbero
                            ? 'bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F]'
                            : 'bg-[#3E161C] text-[#FCA5A5] border border-[#6B242D] hover:bg-[#521E25]'
                        }`}
                        title="Click para alternar estado de liquidación"
                      >
                        {corte.liquidadoAlBarbero ? 'PAGADO' : 'PENDIENTE'}
                      </button>
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarCorte(corte.id, corte.clienteNombre)}
                        className="p-1 rounded text-[#8A796D] hover:text-[#F87171] hover:bg-[#3E161C] transition-colors"
                        title="Anular corte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barber Receipt / Voucher Modal */}
      {voucherBarbero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090605]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl bg-[#1A1412] border border-[#3D2E26] p-5 sm:p-6 shadow-2xl font-mono text-xs">
            <BarberPoleRibbon className="h-1 absolute top-0 left-0" />

            <div className="flex items-center justify-between border-b border-[#3D2E26] pb-3">
              <div className="flex items-center gap-2">
                <VintageCrownIcon className="w-5 h-5 text-[#C59B27]" />
                <h3 className="font-royal text-sm font-bold text-[#FAF6EE] uppercase">
                  Comprobante de Liquidación
                </h3>
              </div>
              <button
                onClick={() => setVoucherBarbero(null)}
                className="text-[#8A796D] hover:text-[#FAF6EE]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 bg-[#0E0A09] p-4 rounded-xl border border-[#2E2019] space-y-3">
              <div className="border-b border-[#2E2019] pb-2 text-center">
                <p className="font-royal text-base font-bold text-[#FAF6EE]">BARBERÍA CASA DEL REY</p>
                <p className="text-[10px] text-[#8A796D]">Liquidación Oficial de Jornada • {fechaSeleccionada}</p>
                <p className="text-xs font-bold text-[#C59B27] mt-1">{voucherBarbero.barbero.nombre}</p>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[9px] text-[#8A796D] uppercase block font-bold">Cortes ({voucherBarbero.cortes.length}):</span>
                {voucherBarbero.cortes.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] bg-[#14100E] p-1.5 rounded border border-[#261B16]">
                    <div>
                      <span className="text-[#FAF6EE] font-bold">{c.hora} - {c.clienteNombre}</span>
                      <span className="text-[9px] text-[#8A796D] block">{c.servicioNombre}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#E5B869] font-bold">{formatCOP(c.montoBarbero)}</span>
                      {c.propina > 0 && <span className="text-[9px] text-[#86EFAC] block">inc. propina</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2E2019] pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-[#8A796D]">
                  <span>Total Facturado Bruto:</span>
                  <span>{formatCOP(voucherBarbero.totalBruto)}</span>
                </div>
                <div className="flex justify-between text-[#8A796D]">
                  <span>Comisión Ganada:</span>
                  <span>{formatCOP(voucherBarbero.totalComision)}</span>
                </div>
                <div className="flex justify-between text-[#8A796D]">
                  <span>Propinas Recibidas:</span>
                  <span>{formatCOP(voucherBarbero.totalPropinas)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#FAF6EE] pt-1.5 border-t border-[#2E2019]">
                  <span className="text-[#C59B27]">TOTAL A PAGAR AL BARBERO:</span>
                  <span className="text-[#E5B869]">{formatCOP(voucherBarbero.totalNeto)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copiarVoucherTexto}
                className="flex-1 py-2 px-3 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
              >
                {copiadoVoucher ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoVoucher ? '¡COPIADO!' : 'COPIAR RECIBO'}</span>
              </button>
              <button
                type="button"
                onClick={() => setVoucherBarbero(null)}
                className="py-2 px-4 bg-[#261B16] text-[#FAF6EE] hover:bg-[#3D2E26] rounded-lg border border-[#3D2E26]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
