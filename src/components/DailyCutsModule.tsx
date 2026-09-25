import React, { useState, useEffect } from 'react';
import { CorteDiario, Servicio, Barbero, Cita } from '../types';
import { 
  getCortesDiarios, 
  toggleLiquidarCorte, 
  liquidarBarberoCompleto, 
  liquidarTodosBarberosDia,
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
  Sparkles,
  Coins,
  ChevronLeft,
  ChevronRight,
  Package,
  BookOpen,
  Users
} from 'lucide-react';
import { VintageDatePicker } from './VintageDatePicker';
import { RegisterCutModule } from './RegisterCutModule';
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
  onNavegarRegistrarCorte?: () => void;
}

type DailySubTab = 'libro' | 'liquidacion' | 'turnos' | 'registrar';

export const DailyCutsModule: React.FC<DailyCutsModuleProps> = ({
  servicios,
  barberos,
  citas,
  onDataUpdated,
  onNavegarRegistrarCorte,
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyStr);
  const [cortes, setCortes] = useState<CorteDiario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Subtab switcher for mobile optimization
  const [subTab, setSubTab] = useState<DailySubTab>('libro');

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

  // Confirmation modals state (replaces blocked window.confirm)
  const [liquidandoBarberoId, setLiquidandoBarberoId] = useState<number | null>(null);
  const [liquidandoTodos, setLiquidandoTodos] = useState<boolean>(false);
  const [modalConfirmarLiquidar, setModalConfirmarLiquidar] = useState<{
    barberoId: number;
    nombre: string;
    pendientes: number;
    monto: number;
  } | null>(null);
  const [modalConfirmarLiquidarTodos, setModalConfirmarLiquidarTodos] = useState<{
    totalPendientes: number;
    totalMonto: number;
  } | null>(null);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState<{
    corteId: string;
    clienteNombre: string;
  } | null>(null);

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

  const handleToggleLiquidar = async (corteId: string) => {
    try {
      const res = await toggleLiquidarCorte(corteId);
      if (res.exito) {
        setCortes(prev => prev.map(c => c.id === corteId ? res.corte : c));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado de liquidación');
    }
  };

  const ejecutarLiquidarBarbero = async (bId: number) => {
    const barberoObj = barberos.find(b => b.id === bId);
    const nombre = barberoObj?.nombre || 'el barbero';
    setLiquidandoBarberoId(bId);
    setError(null);

    try {
      const res = await liquidarBarberoCompleto(bId, fechaSeleccionada);
      if (res.exito) {
        setMensajeExito(`Se liquidaron ${res.liquidadosCount || 0} cortes de ${nombre} correctamente.`);
        await cargarCortes(fechaSeleccionada);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Error al liquidar barbero');
    } finally {
      setLiquidandoBarberoId(null);
      setModalConfirmarLiquidar(null);
    }
  };

  const ejecutarLiquidarTodos = async () => {
    setLiquidandoTodos(true);
    setError(null);
    try {
      const res = await liquidarTodosBarberosDia(fechaSeleccionada);
      if (res.exito) {
        setMensajeExito(res.mensaje || 'Se liquidaron todos los cortes del día exitosamente.');
        await cargarCortes(fechaSeleccionada);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Error al liquidar equipo');
    } finally {
      setLiquidandoTodos(false);
      setModalConfirmarLiquidarTodos(null);
    }
  };

  const ejecutarEliminarCorte = async (corteId: string) => {
    try {
      const res = await eliminarCorteDiario(corteId);
      if (res.exito) {
        setCortes(prev => prev.filter(c => c.id !== corteId));
        setMensajeExito('Corte anulado exitosamente.');
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Error al anular corte');
    } finally {
      setModalConfirmarEliminar(null);
    }
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAbrirVoucher = (barbero: Barbero) => {
    const cortesBarbero = cortes.filter(c => c.barberoId === barbero.id);
    const totalBruto = cortesBarbero.reduce((sum, c) => sum + c.precio + (c.totalProductos || 0), 0);
    const totalComision = cortesBarbero.reduce((sum, c) => sum + (c.precio * (c.porcentajeBarbero / 100)), 0);
    const totalPropinas = cortesBarbero.reduce((sum, c) => sum + (c.propina || 0), 0);
    const totalNeto = cortesBarbero.reduce((sum, c) => sum + c.montoBarbero, 0);

    setVoucherBarbero({
      barbero,
      cortes: cortesBarbero,
      totalBruto,
      totalComision,
      totalPropinas,
      totalNeto,
    });
  };

  const copiarVoucherTexto = () => {
    if (!voucherBarbero) return;
    const lineas = [
      `💈 BARBERÍA LA CASA DEL REY 💈`,
      `COMPROBANTE DE LIQUIDACIÓN DE JORNADA`,
      `Fecha: ${fechaSeleccionada}`,
      `Barbero: ${voucherBarbero.barbero.nombre}`,
      `----------------------------------------`,
      `CORTES Y SERVICIOS REALIZADOS (${voucherBarbero.cortes.length}):`,
      ...voucherBarbero.cortes.map(c => 
        `• ${c.hora} - ${c.clienteNombre} (${c.servicioNombre}): ${formatCOP(c.montoBarbero)} [${c.liquidadoAlBarbero ? 'PAGADO' : 'PENDIENTE'}]`
      ),
      `----------------------------------------`,
      `Total Facturado: ${formatCOP(voucherBarbero.totalBruto)}`,
      `Comisión Ganada: ${formatCOP(voucherBarbero.totalComision)}`,
      `Propinas Recibidas: ${formatCOP(voucherBarbero.totalPropinas)}`,
      `TOTAL A PAGAR AL BARBERO: ${formatCOP(voucherBarbero.totalNeto)}`,
      `----------------------------------------`,
      `Generado en el Libro de Cortes Casa del Rey`,
    ];

    navigator.clipboard.writeText(lineas.join('\n'));
    setCopiadoVoucher(true);
    setTimeout(() => setCopiadoVoucher(false), 2000);
  };

  // Citas agendadas para el día seleccionado
  const citasDelDia = citas.filter(c => c.fecha === fechaSeleccionada && c.estado !== 'Cancelada');

  // Cálculos consolidados del día
  const totalFacturadoDia = cortes.reduce((sum, c) => sum + c.precio + (c.totalProductos || 0), 0);
  const totalBarberosDia = cortes.reduce((sum, c) => sum + c.montoBarbero, 0);
  const totalBarberiaDia = cortes.reduce((sum, c) => sum + c.montoBarberia + (c.totalProductos || 0), 0);
  const totalPropinasDia = cortes.reduce((sum, c) => sum + (c.propina || 0), 0);

  // Resumen por barbero
  const resumenBarberos = barberos.map(b => {
    const cortesB = cortes.filter(c => String(c.barberoId) === String(b.id) || Number(c.barberoId) === Number(b.id));
    const totalServicios = cortesB.length;
    const bruto = cortesB.reduce((acc, c) => acc + c.precio + (c.totalProductos || 0), 0);
    const netoBarbero = cortesB.reduce((acc, c) => acc + c.montoBarbero, 0);
    const propinas = cortesB.reduce((acc, c) => acc + (c.propina || 0), 0);
    const pendientes = cortesB.filter(c => !c.liquidadoAlBarbero).length;
    const montoPendiente = cortesB.filter(c => !c.liquidadoAlBarbero).reduce((acc, c) => acc + c.montoBarbero, 0);
    const pagados = cortesB.filter(c => c.liquidadoAlBarbero).length;

    return {
      barbero: b,
      totalServicios,
      bruto,
      netoBarbero,
      propinas,
      pendientes,
      montoPendiente,
      pagados,
      cortes: cortesB,
    };
  });

  const totalPendientesEquipo = resumenBarberos.reduce((acc, rb) => acc + rb.pendientes, 0);
  const totalMontoPendienteEquipo = resumenBarberos.reduce((acc, rb) => acc + (rb.montoPendiente || 0), 0);

  const cortesVisibles = filtroBarbero === 'todos' 
    ? cortes 
    : cortes.filter(c => String(c.barberoId) === filtroBarbero);

  // Si se seleccionó la sub-pestaña de registrar, mostrar el módulo separado
  if (subTab === 'registrar') {
    return (
      <div className="space-y-4">
        <RegisterCutModule
          servicios={servicios}
          barberos={barberos}
          citas={citas}
          onDataUpdated={() => {
            cargarCortes(fechaSeleccionada);
            if (onDataUpdated) onDataUpdated();
          }}
          onVerHistorial={() => setSubTab('libro')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono text-xs text-[#221A14] pb-20 sm:pb-8">
      {/* Header Principal con Fecha y Selector */}
      <div className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <VintageCrownIcon className="w-5 h-5 text-[#7C571C]" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                Libro Maestro de Cortes & Liquidación
              </h2>
            </div>
            <p className="text-[11px] text-[#6F5A4B] font-mono mt-0.5">
              Control de jornada, división de porcentajes y comprobantes para maestros barberos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Destacado: Registrar Nuevo Corte */}
            <button
              type="button"
              onClick={() => {
                if (onNavegarRegistrarCorte) {
                  onNavegarRegistrarCorte();
                } else {
                  setSubTab('registrar');
                }
              }}
              className="px-4 py-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs min-h-[42px]"
            >
              <Scissors className="w-4 h-4" />
              <span>+ REGISTRAR CORTE</span>
            </button>

            {/* Date Picker */}
            <div className="w-44">
              <VintageDatePicker
                id="picker-fecha-cortes"
                label=""
                value={fechaSeleccionada}
                onChange={setFechaSeleccionada}
              />
            </div>
          </div>
        </div>

        {/* Métricas Resumidas del Día */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#DFCBB5]">
          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#6F5A4B] block font-bold">Total Facturado</span>
            <span className="text-sm sm:text-base font-bold text-[#221A14] mt-0.5 block">{formatCOP(totalFacturadoDia)}</span>
            <span className="text-[9px] text-[#7C571C] block">{cortes.length} servicios registrados</span>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#7C571C] block font-bold">Pago a Barberos</span>
            <span className="text-sm sm:text-base font-bold text-[#7C571C] mt-0.5 block">{formatCOP(totalBarberosDia)}</span>
            <span className="text-[9px] text-[#6F5A4B] block">inc. {formatCOP(totalPropinasDia)} prop</span>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#15803D] block font-bold">Casa del Rey</span>
            <span className="text-sm sm:text-base font-bold text-[#15803D] mt-0.5 block">{formatCOP(totalBarberiaDia)}</span>
            <span className="text-[9px] text-[#6F5A4B] block">Margen neto de sala</span>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#6F5A4B] block font-bold">Citas en Agenda</span>
            <span className="text-sm sm:text-base font-bold text-[#221A14] mt-0.5 block">{citasDelDia.length} turnos</span>
            <span className="text-[9px] text-[#15803D] block">
              {citasDelDia.filter(c => c.estado === 'Confirmada').length} confirmadas
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Switcher para Navegación Móvil */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FBEBE1] rounded-2xl border border-[#DFCBB5] overflow-x-auto no-scrollbar shadow-inner">
        <button
          type="button"
          onClick={() => setSubTab('libro')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] ${
            subTab === 'libro'
              ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
              : 'text-[#6F5A4B] hover:text-[#221A14]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Libro de Cortes ({cortes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('liquidacion')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] ${
            subTab === 'liquidacion'
              ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
              : 'text-[#6F5A4B] hover:text-[#221A14]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Liquidación Barberos</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('turnos')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] ${
            subTab === 'turnos'
              ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
              : 'text-[#6F5A4B] hover:text-[#221A14]'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Turnos del Día ({citasDelDia.length})</span>
        </button>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="p-3.5 rounded-xl bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-[#15803D] p-1 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#BA1A1A] p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: LIBRO DE CORTES (Optimizado para Celular y Escritorio) */}
      {/* ========================================================================= */}
      {subTab === 'libro' && (
        <div className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-3">
            <div className="flex items-center gap-2">
              <VintageCrownIcon className="w-4 h-4 text-[#7C571C]" />
              <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                Registros de la Jornada ({cortesVisibles.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {totalPendientesEquipo > 0 && (
                <button
                  type="button"
                  onClick={() => setModalConfirmarLiquidarTodos({ totalPendientes: totalPendientesEquipo, totalMonto: totalMontoPendienteEquipo })}
                  disabled={liquidandoTodos}
                  className="py-1.5 px-3 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
                  title="Liquidar todos los cortes pendientes del equipo de barberos"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{liquidandoTodos ? 'Liquidando...' : `Liquidar Todo (${formatCOP(totalMontoPendienteEquipo)})`}</span>
                </button>
              )}

              <span className="text-[#6F5A4B]">Filtrar Barbero:</span>
              <select
                value={filtroBarbero}
                onChange={(e) => setFiltroBarbero(e.target.value)}
                className="bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
              >
                <option value="todos">Todos los barberos</option>
                {barberos.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="py-12 text-center text-[#6F5A4B]">Cargando libro de cortes...</div>
          ) : cortesVisibles.length === 0 ? (
            <div className="py-12 text-center text-[#6F5A4B] space-y-2">
              <Scissors className="w-8 h-8 mx-auto text-[#DFCBB5]" />
              <p>No hay cortes registrados para la fecha {fechaSeleccionada}.</p>
              <button
                type="button"
                onClick={() => {
                  if (onNavegarRegistrarCorte) onNavegarRegistrarCorte();
                  else setSubTab('registrar');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C571C] text-[#FAF6EE] font-bold rounded-xl text-xs cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primer Corte</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Tarjetas Móviles (visibles en celulares < sm) */}
              <div className="space-y-3 sm:hidden">
                {cortesVisibles.map(corte => (
                  <div 
                    key={corte.id} 
                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[#DFCBB5]/50 pb-2">
                      <div>
                        <span className="text-sm font-bold text-[#221A14] block">
                          {corte.clienteNombre}
                        </span>
                        <span className="text-[10px] text-[#6F5A4B]">
                          {corte.hora} &bull; {corte.servicioNombre}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleLiquidar(corte.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                          corte.liquidadoAlBarbero
                            ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                            : 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30'
                        }`}
                      >
                        {corte.liquidadoAlBarbero ? 'PAGADO' : 'PENDIENTE'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-[#6F5A4B] block uppercase">Barbero:</span>
                        <span className="font-bold text-[#7C571C] truncate block">{corte.barberoNombre}</span>
                        <span className="text-[10px] font-bold text-[#7C571C]">{formatCOP(corte.montoBarbero)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#6F5A4B] block uppercase">Salón:</span>
                        <span className="font-bold text-[#15803D] block">{formatCOP(corte.montoBarberia + (corte.totalProductos || 0))}</span>
                        <span className="text-[9px] text-[#6F5A4B]">{corte.metodoPago}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#6F5A4B] block uppercase">Total:</span>
                        <span className="font-bold text-[#221A14] text-sm block">
                          {formatCOP(corte.precio + (corte.totalProductos || 0))}
                        </span>
                      </div>
                    </div>

                    {corte.productosVendidos && corte.productosVendidos.length > 0 && (
                      <div className="pt-1.5 flex flex-wrap gap-1">
                        {corte.productosVendidos.map((pv, idx) => (
                          <span key={idx} className="text-[9px] bg-[#FAF3E0] text-[#7C571C] border border-[#DFCBB5] px-1.5 py-0.5 rounded font-bold">
                            📦 {pv.cantidad}x {pv.nombre} ({formatCOP(pv.subtotal)})
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-[#DFCBB5]/50">
                      <span className="text-[9px] text-[#8A796D]">ID: {corte.id}</span>
                      <button
                        type="button"
                        onClick={() => setModalConfirmarEliminar({ corteId: corte.id, clienteNombre: corte.clienteNombre })}
                        className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Anular</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla Desktop (visible en pantallas sm o mayores) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DFCBB5] text-[10px] text-[#6F5A4B] uppercase">
                      <th className="pb-2.5 font-bold">Hora / ID</th>
                      <th className="pb-2.5 font-bold">Barbero</th>
                      <th className="pb-2.5 font-bold">Caballero / Servicio</th>
                      <th className="pb-2.5 font-bold">Medio</th>
                      <th className="pb-2.5 font-bold text-right">Precio Total</th>
                      <th className="pb-2.5 font-bold text-right text-[#7C571C]">Barbero</th>
                      <th className="pb-2.5 font-bold text-right text-[#15803D]">Casa del Rey</th>
                      <th className="pb-2.5 font-bold text-center">Liquidado</th>
                      <th className="pb-2.5 font-bold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFCBB5]/50">
                    {cortesVisibles.map(corte => (
                      <tr key={corte.id} className="hover:bg-[#FBEBE1]/50 transition-colors">
                        <td className="py-2.5 whitespace-nowrap">
                          <span className="font-bold text-[#221A14]">{corte.hora}</span>
                          <span className="text-[10px] text-[#6F5A4B] block">{corte.id}</span>
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          <span className="font-medium text-[#221A14]">{corte.barberoNombre}</span>
                          <span className="text-[10px] text-[#7C571C] block">{corte.porcentajeBarbero}% split</span>
                        </td>
                        <td className="py-2.5">
                          <span className="font-bold text-[#221A14]">{corte.clienteNombre}</span>
                          <span className="text-[10px] text-[#6F5A4B] block">{corte.servicioNombre}</span>
                          {corte.productosVendidos && corte.productosVendidos.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {corte.productosVendidos.map((pv, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-[9px] bg-[#FAF3E0] text-[#7C571C] border border-[#DFCBB5] px-1.5 py-0.5 rounded font-bold">
                                  <Package className="w-2.5 h-2.5 text-[#7C571C]" />
                                  <span>{pv.cantidad}x {pv.nombre} ({formatCOP(pv.subtotal)})</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {corte.notas && <span className="text-[9px] text-[#7C571C] italic block mt-0.5">{corte.notas}</span>}
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-[11px] text-[#6F5A4B]">
                          {corte.metodoPago}
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-right font-bold text-[#221A14]">
                          <div>{formatCOP(corte.precio + (corte.totalProductos || 0))}</div>
                          {corte.totalProductos && corte.totalProductos > 0 ? (
                            <div className="text-[9px] text-[#6F5A4B] font-normal">
                              Corte: {formatCOP(corte.precio)} + Prod: {formatCOP(corte.totalProductos)}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-right text-[#7C571C] font-bold">
                          {formatCOP(corte.montoBarbero)}
                          {corte.propina > 0 && (
                            <span className="text-[9px] text-[#15803D] block font-normal">+{formatCOP(corte.propina)} prop</span>
                          )}
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-right text-[#15803D] font-bold">
                          <div>{formatCOP(corte.montoBarberia + (corte.totalProductos || 0))}</div>
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLiquidar(corte.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              corte.liquidadoAlBarbero
                                ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                                : 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30 hover:bg-[#FFB4AB]'
                            }`}
                          >
                            {corte.liquidadoAlBarbero ? 'PAGADO' : 'PENDIENTE'}
                          </button>
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => setModalConfirmarEliminar({ corteId: corte.id, clienteNombre: corte.clienteNombre })}
                            className="p-1 rounded text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: LIQUIDACIÓN DE MAESTROS BARBEROS */}
      {/* ========================================================================= */}
      {subTab === 'liquidacion' && (
        <div className="space-y-4">
          {/* Banner de Liquidación General del Equipo */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#7C571C]" />
                <h3 className="font-serif text-base font-bold text-[#221A14]">
                  Liquidación de Ganancias & Comisiones
                </h3>
              </div>
              <p className="text-xs text-[#6F5A4B] font-mono">
                {totalPendientesEquipo > 0 ? (
                  <span>
                    Hay <strong className="text-[#BA1A1A]">{totalPendientesEquipo} cortes</strong> pendientes de pago en el equipo por un total de <strong className="text-[#7C571C]">{formatCOP(totalMontoPendienteEquipo)}</strong>.
                  </span>
                ) : (
                  <span className="text-[#15803D] font-bold">
                    ✅ Todos los barberos están al día con sus liquidaciones en esta fecha.
                  </span>
                )}
              </p>
            </div>

            {totalPendientesEquipo > 0 && (
              <button
                type="button"
                onClick={() => setModalConfirmarLiquidarTodos({ totalPendientes: totalPendientesEquipo, totalMonto: totalMontoPendienteEquipo })}
                disabled={liquidandoTodos}
                className="py-2.5 px-4 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{liquidandoTodos ? 'Liquidando Todo el Equipo...' : `Liquidar Todo el Equipo (${formatCOP(totalMontoPendienteEquipo)})`}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {resumenBarberos.map(rb => (
              <div 
                key={rb.barbero.id} 
                className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-[#DFCBB5] bg-[#221A14] shrink-0">
                        {rb.barbero.fotoUrl ? (
                          <img src={rb.barbero.fotoUrl} alt={rb.barbero.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#FAF6EE] font-bold text-xs">
                            {rb.barbero.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-serif font-bold text-sm text-[#221A14] block leading-tight">
                          {rb.barbero.nombre}
                        </span>
                        <span className="text-[10px] text-[#7C571C] font-mono">
                          {rb.barbero.especialidad}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#DFCBB5] text-[#221A14]">
                      {rb.totalServicios} cortes
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs">
                    <div className="flex justify-between text-[#6F5A4B]">
                      <span>Facturado Bruto:</span>
                      <span className="font-bold text-[#221A14]">{formatCOP(rb.bruto)}</span>
                    </div>
                    <div className="flex justify-between text-[#6F5A4B]">
                      <span>Propinas:</span>
                      <span className="font-bold text-[#15803D]">+{formatCOP(rb.propinas)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#DFCBB5]/60 text-[#221A14]">
                      <span className="text-[#7C571C]">Ganancia Barbero:</span>
                      <span className="text-[#7C571C]">{formatCOP(rb.netoBarbero)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#15803D] font-bold border border-[#86EFAC]">
                      {rb.pagados} Pagados
                    </span>
                    {rb.pendientes > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFDAD6] text-[#BA1A1A] font-bold border border-[#BA1A1A]/30">
                        {rb.pendientes} Por Liquidar ({formatCOP(rb.montoPendiente)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#DFCBB5]">
                  <button
                    type="button"
                    onClick={() => handleAbrirVoucher(rb.barbero)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#FAF6EE] hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Recibo</span>
                  </button>

                  {rb.pendientes > 0 && (
                    <button
                      type="button"
                      disabled={liquidandoBarberoId === rb.barbero.id}
                      onClick={() => setModalConfirmarLiquidar({
                        barberoId: rb.barbero.id,
                        nombre: rb.barbero.nombre,
                        pendientes: rb.pendientes,
                        monto: rb.montoPendiente
                      })}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-[#15803D] hover:bg-[#10622F] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{liquidandoBarberoId === rb.barbero.id ? 'Liquidando...' : `Liquidar Todo`}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: TURNOS AGENDADOS DEL DÍA */}
      {/* ========================================================================= */}
      {subTab === 'turnos' && (
        <div className="rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2.5">
            <h3 className="font-serif text-sm font-bold uppercase text-[#221A14]">
              Citas Programadas para {fechaSeleccionada} ({citasDelDia.length})
            </h3>
            <span className="text-[10px] text-[#6F5A4B] font-mono">
              Agenda sincronizada con Libro de Turnos
            </span>
          </div>

          {citasDelDia.length === 0 ? (
            <div className="py-8 text-center text-[#6F5A4B]">
              No hay turnos agendados en el sistema para esta fecha.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {citasDelDia.map(c => (
                <div key={c.idReserva} className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DFCBB5] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7C571C] bg-[#FBEBE1] px-2 py-0.5 rounded-lg border border-[#DFCBB5]">
                      ⏰ {c.hora}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                      {c.estado}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-[#221A14] text-xs block">
                      {c.clienteNombre || c.responsableNombre}
                    </span>
                    <span className="text-[10px] text-[#6F5A4B] block">
                      {c.servicioNombre || 'Servicio Barbería'}
                    </span>
                    <span className="text-[9px] text-[#7C571C] block">
                      {c.barberoNombre ? `Barbero: ${c.barberoNombre}` : 'Barbero según asignación'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#DFCBB5]/50 flex items-center justify-between text-[10px]">
                    <span className="text-[#6F5A4B]">{c.clienteTelefono || c.responsableTelefono}</span>
                    <span className="font-bold text-[#221A14]">{formatCOP(c.precioTotal || 35000)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Comprobante / Voucher de Liquidación */}
      {voucherBarbero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-5 sm:p-6 shadow-2xl font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <VintageCrownIcon className="w-5 h-5 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase">
                  Comprobante de Liquidación
                </h3>
              </div>
              <button
                onClick={() => setVoucherBarbero(null)}
                className="text-[#6F5A4B] hover:text-[#221A14] p-1 rounded-lg hover:bg-[#FBEBE1] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3 shadow-2xs">
              <div className="border-b border-[#DFCBB5] pb-2 text-center">
                <p className="font-serif text-base font-bold text-[#221A14]">BARBERÍA LA CASA DEL REY</p>
                <p className="text-[10px] text-[#6F5A4B]">Liquidación Oficial de Jornada • {fechaSeleccionada}</p>
                <p className="text-xs font-bold text-[#7C571C] mt-1">{voucherBarbero.barbero.nombre}</p>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[9px] text-[#6F5A4B] uppercase block font-bold">Cortes ({voucherBarbero.cortes.length}):</span>
                {voucherBarbero.cortes.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] bg-[#FFF8F5] p-1.5 rounded border border-[#DFCBB5]">
                    <div>
                      <span className="text-[#221A14] font-bold">{c.hora} - {c.clienteNombre}</span>
                      <span className="text-[9px] text-[#6F5A4B] block">{c.servicioNombre}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#7C571C] font-bold">{formatCOP(c.montoBarbero)}</span>
                      {c.propina > 0 && <span className="text-[9px] text-[#15803D] block">inc. propina</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#DFCBB5] pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-[#6F5A4B]">
                  <span>Total Facturado Bruto:</span>
                  <span>{formatCOP(voucherBarbero.totalBruto)}</span>
                </div>
                <div className="flex justify-between text-[#6F5A4B]">
                  <span>Comisión Ganada:</span>
                  <span>{formatCOP(voucherBarbero.totalComision)}</span>
                </div>
                <div className="flex justify-between text-[#6F5A4B]">
                  <span>Propinas Recibidas:</span>
                  <span>{formatCOP(voucherBarbero.totalPropinas)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#221A14] pt-1.5 border-t border-[#DFCBB5]">
                  <span className="text-[#7C571C]">TOTAL A PAGAR AL BARBERO:</span>
                  <span className="text-[#7C571C] font-extrabold">{formatCOP(voucherBarbero.totalNeto)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copiarVoucherTexto}
                className="flex-1 py-2 px-3 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer min-h-[44px]"
              >
                {copiadoVoucher ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoVoucher ? '¡COPIADO!' : 'COPIAR RECIBO'}</span>
              </button>
              <button
                type="button"
                onClick={() => setVoucherBarbero(null)}
                className="py-2 px-4 bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] rounded-lg border border-[#DFCBB5] cursor-pointer font-bold min-h-[44px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Liquidar Barbero */}
      {modalConfirmarLiquidar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-md w-full p-5 shadow-xl font-mono space-y-4">
            <div className="flex items-center gap-3 text-[#15803D]">
              <div className="w-10 h-10 rounded-full bg-[#EBF7EE] border border-[#86EFAC] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Confirmar Liquidación de Barbero
                </h4>
                <p className="text-xs text-[#6F5A4B]">
                  {modalConfirmarLiquidar.nombre}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] space-y-2 text-xs">
              <div className="flex justify-between text-[#6F5A4B]">
                <span>Fecha de Liquidación:</span>
                <span className="font-bold text-[#221A14]">{fechaSeleccionada}</span>
              </div>
              <div className="flex justify-between text-[#6F5A4B]">
                <span>Cortes Pendientes:</span>
                <span className="font-bold text-[#BA1A1A]">{modalConfirmarLiquidar.pendientes} cortes</span>
              </div>
              <div className="flex justify-between text-[#221A14] pt-2 border-t border-[#DFCBB5] font-bold text-sm">
                <span>Total a Liquidar / Pagar:</span>
                <span className="text-[#15803D]">{formatCOP(modalConfirmarLiquidar.monto)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6F5A4B]">
              Al confirmar, todos los cortes pendientes de este barbero se marcarán como <strong>PAGADOS</strong> y se reflejará en el libro contable de la fecha.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarLiquidar(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={liquidandoBarberoId !== null}
                onClick={() => ejecutarLiquidarBarbero(modalConfirmarLiquidar.barberoId)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#15803D] hover:bg-[#10622F] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{liquidandoBarberoId !== null ? 'Liquidando...' : 'Confirmar y Pagar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Liquidar Todo el Equipo */}
      {modalConfirmarLiquidarTodos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-md w-full p-5 shadow-xl font-mono space-y-4">
            <div className="flex items-center gap-3 text-[#7C571C]">
              <div className="w-10 h-10 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Liquidar Todo el Equipo de Barberos
                </h4>
                <p className="text-xs text-[#6F5A4B]">
                  Jornada: {fechaSeleccionada}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] space-y-2 text-xs">
              <div className="flex justify-between text-[#6F5A4B]">
                <span>Total Cortes Pendientes:</span>
                <span className="font-bold text-[#BA1A1A]">{modalConfirmarLiquidarTodos.totalPendientes} cortes</span>
              </div>
              <div className="flex justify-between text-[#221A14] pt-2 border-t border-[#DFCBB5] font-bold text-sm">
                <span>Monto Total a Liquidar:</span>
                <span className="text-[#15803D] font-extrabold">{formatCOP(modalConfirmarLiquidarTodos.totalMonto)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6F5A4B]">
              ¿Estás seguro de marcar como PAGADOS todos los cortes de todos los barberos para esta fecha?
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarLiquidarTodos(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={liquidandoTodos}
                onClick={ejecutarLiquidarTodos}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{liquidandoTodos ? 'Liquidando Todo...' : 'Sí, Liquidar Todo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Anular Corte */}
      {modalConfirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-sm w-full p-5 shadow-xl font-mono space-y-4">
            <div className="flex items-center gap-3 text-[#BA1A1A]">
              <div className="w-10 h-10 rounded-full bg-[#FFDAD6] border border-[#BA1A1A]/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#BA1A1A]" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Anular Registro de Corte
                </h4>
                <p className="text-xs text-[#6F5A4B]">
                  ID: {modalConfirmarEliminar.corteId}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#221A14]">
              ¿Deseas anular el registro del corte de <strong>"{modalConfirmarEliminar.clienteNombre}"</strong>? Esta acción recalculará los libros contables y devolverá productos al inventario si aplica.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarEliminar(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => ejecutarEliminarCorte(modalConfirmarEliminar.corteId)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Anular</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
