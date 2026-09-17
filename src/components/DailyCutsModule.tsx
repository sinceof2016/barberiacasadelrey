import React, { useState, useEffect } from 'react';
import { CorteDiario, Servicio, Barbero, Cita, MetodoPago, ProductoVenta } from '../types';
import { 
  getCortesDiarios, 
  crearCorteDiario, 
  toggleLiquidarCorte, 
  liquidarBarberoCompleto, 
  eliminarCorteDiario,
  getProductos
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
  RotateCcw,
  Coins,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  X
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

  // Productos de venta adicional (Pomadas, ceras, gel, perfumería)
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoVenta[]>([]);
  const [productosAgregados, setProductosAgregados] = useState<{
    producto: ProductoVenta;
    cantidad: number;
  }[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidadProducto, setCantidadProducto] = useState<number>(1);

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

  const cargarProductos = async () => {
    try {
      const res = await getProductos();
      const items = res?.datos || [];
      setProductosDisponibles(items.filter(p => p.activo));
    } catch (e) {
      console.error('Error al cargar productos para corte:', e);
    }
  };

  useEffect(() => {
    cargarCortes(fechaSeleccionada);
    cargarProductos();
  }, [fechaSeleccionada]);

  const safeConfirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch {
      return true;
    }
  };

  const handleAgregarProducto = () => {
    if (!productoSeleccionadoId) return;
    const prod = productosDisponibles.find(p => p.id === productoSeleccionadoId);
    if (!prod) return;

    if (cantidadProducto <= 0) return;
    if (prod.stock <= 0) {
      setError(`El producto "${prod.nombre}" no cuenta con stock disponible en este momento.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setProductosAgregados(prev => {
      const existe = prev.find(item => item.producto.id === prod.id);
      if (existe) {
        const nuevaCantidad = existe.cantidad + cantidadProducto;
        if (nuevaCantidad > prod.stock) {
          setError(`El total solicitado (${nuevaCantidad}) supera las unidades disponibles en inventario (${prod.stock}).`);
          setTimeout(() => setError(null), 4000);
          return prev;
        }
        return prev.map(item => item.producto.id === prod.id ? { ...item, cantidad: nuevaCantidad } : item);
      }
      if (cantidadProducto > prod.stock) {
        setError(`Solo hay ${prod.stock} unidades disponibles en inventario.`);
        setTimeout(() => setError(null), 4000);
        return prev;
      }
      return [...prev, { producto: prod, cantidad: cantidadProducto }];
    });

    setProductoSeleccionadoId('');
    setCantidadProducto(1);
  };

  const handleEliminarProductoAgregado = (prodId: string) => {
    setProductosAgregados(prev => prev.filter(item => item.producto.id !== prodId));
  };

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
  const totalProductosCobro = productosAgregados.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  const totalGeneralCobro = Number(precio) + totalProductosCobro + (Number(propina) || 0);

  const cambiarDia = (offset: number) => {
    try {
      const d = new Date(fechaSeleccionada + 'T12:00:00');
      d.setDate(d.getDate() + offset);
      const nueva = d.toISOString().split('T')[0];
      setFechaSeleccionada(nueva);
    } catch {
      // fallback
    }
  };

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
      const payloadProductos = productosAgregados.map(p => ({
        productoId: p.producto.id,
        cantidad: p.cantidad,
      }));

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
        productos: payloadProductos.length > 0 ? payloadProductos : undefined,
      });

      setCortes(prev => [res.corte, ...prev]);
      setMensajeExito(
        `Corte de ${clienteNombre} registrado con éxito.${
          payloadProductos.length > 0 
            ? ` Se vendieron ${payloadProductos.reduce((acc, i) => acc + i.cantidad, 0)} producto(s) y se descontaron automáticamente del inventario.` 
            : ''
        }`
      );
      setTimeout(() => setMensajeExito(null), 5000);

      // Disparador automático de gaveta registradora si se cobra en Efectivo
      if (metodoPago === 'Efectivo') {
        dispararAperturaPorEfectivo(
          `Cobro en efectivo: ${clienteNombre.trim()} - $${totalGeneralCobro.toLocaleString('es-CO')} COP`
        );
      }

      // Reset fields
      setClienteNombre('');
      setPropina(0);
      setNotas('');
      setCitaSeleccionada('');
      setProductosAgregados([]);
      setProductoSeleccionadoId('');
      setCantidadProducto(1);
      cargarProductos();
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
      setMensajeExito(res.mensaje);
      setTimeout(() => setMensajeExito(null), 3000);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      setError('Error al actualizar liquidación: ' + err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleLiquidarBarbero = async (bId: number, bNombre: string) => {
    if (!safeConfirm(`¿Confirmas liquidar y marcar como pagados todos los cortes de ${bNombre} para la fecha ${fechaSeleccionada}?`)) {
      return;
    }

    try {
      const res = await liquidarBarberoCompleto(bId, fechaSeleccionada);
      setMensajeExito(res.mensaje);
      setTimeout(() => setMensajeExito(null), 4000);
      cargarCortes(fechaSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      setError('Error al liquidar barbero: ' + err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEliminarCorte = async (id: string, cliente: string) => {
    if (!safeConfirm(`¿Estás seguro de anular el corte registrado de "${cliente}"?`)) return;

    try {
      const res = await eliminarCorteDiario(id);
      setCortes(prev => prev.filter(c => c.id !== id));
      cargarProductos();
      setMensajeExito(res.mensaje || `Corte de "${cliente}" anulado exitosamente.`);
      setTimeout(() => setMensajeExito(null), 4000);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      setError('Error al anular corte: ' + err.message);
      setTimeout(() => setError(null), 5000);
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
    const texto = `👑 BARBERÍA LA CASA DEL REY 👑
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
¡Por el honor y la maestría clásica!`;

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
  const totalProductosVendidosDia = cortes.reduce((sum, c) => sum + (c.totalProductos || 0), 0);
  const totalBrutoDia = cortes.reduce((sum, c) => sum + c.precio + (c.totalProductos || 0), 0);
  const totalBarberosDia = cortes.reduce((sum, c) => sum + c.montoBarbero, 0);
  const totalBarberiaDia = cortes.reduce((sum, c) => sum + c.montoBarberia + (c.totalProductos || 0), 0);

  // Turnos agendados sincronizados con la fecha seleccionada del calendario interno
  const citasDelDia = citas.filter(
    c => c.fecha === fechaSeleccionada && c.estado !== 'Cancelada'
  );
  const citasAtendidasIds = new Set(cortes.map(c => c.citaIdReserva).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Header & Date selector con Calendario Optimizado en Despliegue */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm relative z-30">
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-xl">
          <BarberPoleRibbon className="h-full w-full" />
        </div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <VintageScissorsIcon className="w-5 h-5 text-[#7C571C]" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                Registro de Cortes & División por Barbero
              </h2>
            </div>
            <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
              Control diario y división de porcentajes sincronizado con el calendario interno de La Casa del Rey
            </p>
          </div>

          {/* Despliegue del Calendario Optimizado (con navegación directa entre días) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            {/* Controles de navegación de día directo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => cambiarDia(-1)}
                className="p-2 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] border border-[#DFCBB5] font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                title="Día Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => cambiarDia(1)}
                className="p-2 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] border border-[#DFCBB5] font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                title="Día Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full sm:w-64 relative z-50">
              <VintageDatePicker
                id="datepicker-cortes-calendario"
                value={fechaSeleccionada}
                onChange={setFechaSeleccionada}
                align="right"
              />
            </div>

            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="text-[11px] bg-[#FBEBE1] text-[#7C571C] px-3 py-2 rounded-lg border border-[#DFCBB5] hover:bg-[#F5E5DB] transition-colors whitespace-nowrap cursor-pointer font-mono font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                title="Volver a la fecha actual"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hoy</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Day Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#DFCBB5]/60 font-mono">
          <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">Cortes Realizados</span>
            <span className="text-base sm:text-lg font-bold text-[#221A14]">{totalCortesDia}</span>
          </div>
          <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">Total Facturado</span>
            <span className="text-base sm:text-lg font-bold text-[#221A14]">{formatCOP(totalBrutoDia)}</span>
            {totalProductosVendidosDia > 0 && (
              <span className="text-[9px] text-[#7C571C] font-bold block mt-0.5">
                inc. {formatCOP(totalProductosVendidosDia)} productos
              </span>
            )}
          </div>
          <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#7C571C] uppercase block font-bold">Para Barberos</span>
            <span className="text-base sm:text-lg font-bold text-[#7C571C]">{formatCOP(totalBarberosDia)}</span>
          </div>
          <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#15803D] uppercase block font-bold">Casa del Rey (Neto)</span>
            <span className="text-base sm:text-lg font-bold text-[#15803D]">{formatCOP(totalBarberiaDia)}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Turnos del Día sincronizados con la fecha del calendario */}
      <div 
        id="seccion-turnos-del-dia"
        className="rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] shadow-sm p-4 sm:p-5 relative overflow-hidden text-[#221A14] font-mono"
      >
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pt-1 border-b border-[#DFCBB5] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-sm sm:text-base font-bold uppercase text-[#221A14] tracking-wider">
                  {fechaSeleccionada === hoyStr ? 'Turnos del Día (Hoy)' : `Turnos del Día (${fechaSeleccionada})`}
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#7C571C] bg-[#FBEBE1] px-2.5 py-0.5 rounded-full border border-[#DFCBB5]">
                  {citasDelDia.length} {citasDelDia.length === 1 ? 'Turno' : 'Turnos'}
                </span>
                {fechaSeleccionada === hoyStr ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                    <span>Sincronizado Hoy</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]">
                    Fecha: {fechaSeleccionada}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6F5A4B] font-mono mt-0.5">
                Sincronizado con el calendario &bull; {citasDelDia.filter(c => citasAtendidasIds.has(c.idReserva)).length} de {citasDelDia.length} registrados en caja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="px-3 py-1.5 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-mono text-[11px] font-bold border border-[#DFCBB5] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3 text-[#7C571C]" />
                <span>Volver a Hoy</span>
              </button>
            )}
            <div className="text-[11px] text-[#7C571C] font-mono bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[#DFCBB5] shadow-2xs">
              📅 {fechaSeleccionada}
            </div>
          </div>
        </div>

        {citasDelDia.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] text-center font-mono text-xs shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FBEBE1] text-[#7C571C] flex items-center justify-center mx-auto border border-[#DFCBB5]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-bold text-[#221A14]">
              No hay turnos programados en el calendario para {fechaSeleccionada}
            </div>
            <p className="text-[#6F5A4B] text-[11px] max-w-md mx-auto">
              Puedes seleccionar otra fecha en el calendario superior, registrar clientes de turno directo (walk-ins) en caja o agendar un nuevo turno.
            </p>
            {fechaSeleccionada !== hoyStr && (
              <button
                type="button"
                onClick={() => setFechaSeleccionada(hoyStr)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-[#7C571C] text-[#FAF6EE] text-[11px] font-bold hover:bg-[#684815] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
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
              const esSeleccionada = citaSeleccionada === cita.idReserva;

              return (
                <div
                  key={cita.idReserva}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    yaAtendido
                      ? 'bg-[#EBF7EE]/60 border-[#86EFAC]/80 text-[#15803D]'
                      : esSeleccionada
                      ? 'bg-[#FBEBE1] border-[#7C571C] shadow-sm'
                      : 'bg-[#FFFFFF] border-[#DFCBB5] hover:border-[#7C571C] shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#221A14] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#7C571C]" />
                        <span>{cita.hora}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#6F5A4B]">
                        #{cita.idReserva}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="font-bold text-[#221A14] block truncate">
                        {cita.clienteNombre || cita.responsableNombre}
                      </span>
                      <span className="text-[11px] text-[#6F5A4B] block truncate">
                        {cita.servicioNombre || 'Servicio Barbería'}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#7C571C] font-mono pt-1 border-t border-[#DFCBB5]/50 flex items-center justify-between">
                      <span>Barbero: {cita.barberoNombre || 'Sin asignar'}</span>
                      <span className="font-bold">{cita.sucursalNombre || 'Sede Chicó'}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#DFCBB5]/60 flex items-center justify-end">
                    {yaAtendido ? (
                      <span className="text-[10px] text-[#15803D] font-bold flex items-center gap-1 bg-[#EBF7EE] px-2 py-1 rounded-lg w-full justify-center border border-[#86EFAC]">
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
                        className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
                          esSeleccionada
                            ? 'bg-[#7C571C] text-[#FAF6EE]'
                            : 'bg-[#FBEBE1] hover:bg-[#7C571C] text-[#221A14] hover:text-[#FAF6EE] border border-[#DFCBB5]'
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
        <div id="form-registro-corte" className="lg:col-span-5 bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#7C571C]" />
              <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                Registrar Corte Realizado
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold">
              DIVISIÓN AUTOMÁTICA
            </span>
          </div>

          {/* Quick Import from Booked Appointments */}
          {citas.length > 0 && (
            <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DFCBB5] space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">
                  Importar desde Cita Agendada:
                </label>
                <span className="text-[9px] text-[#7C571C] font-mono font-bold">
                  {citasDelDia.length} citas en fecha
                </span>
              </div>
              <select
                value={citaSeleccionada}
                onChange={(e) => handleSeleccionarCita(e.target.value)}
                className="w-full bg-[#FFF8F5] border border-[#DFCBB5] text-[#221A14] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
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
              <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                Barbero que Realizó el Servicio:
              </label>
              <select
                value={barberoId}
                onChange={(e) => setBarberoId(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
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
              <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                Nombre del Caballero / Cliente:
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D]"
              />
            </div>

            {/* Servicio */}
            <div>
              <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                Servicio Aplicado:
              </label>
              <select
                value={servicioId}
                onChange={(e) => handleServicioChange(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
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
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Monto Cobrado (COP):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[#6F5A4B]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    required
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  % Barbero (Split):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={porcentajeBarbero}
                    onChange={(e) => setPorcentajeBarbero(Number(e.target.value))}
                    className="w-16 bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] text-center rounded-lg py-2 text-xs focus:outline-none focus:border-[#7C571C] font-bold"
                  />
                  <div className="flex gap-1">
                    {[50, 60, 40].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPorcentajeBarbero(pct)}
                        className={`px-1.5 py-1 rounded text-[10px] border transition-colors cursor-pointer ${
                          porcentajeBarbero === pct
                            ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] font-bold'
                            : 'bg-[#FBEBE1] text-[#6F5A4B] border-[#DFCBB5] hover:text-[#221A14]'
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
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Propina (100% Barbero):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[#6F5A4B]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={propina}
                    onChange={(e) => setPropina(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nequi / Daviplata">📱 Nequi / Daviplata</option>
                  <option value="Tarjeta / Datáfono">💳 Tarjeta / Datáfono</option>
                </select>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                Detalle / Nota Opcional:
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Peinado con pomada mate especial..."
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D]"
              />
            </div>

            {/* Venta Adicional de Productos (Pomadas, Ceras, Geles, Perfumería) */}
            <div className="bg-[#FAF6EE] border border-[#DFCBB5] rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-[#7C571C] uppercase font-bold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#7C571C]" />
                  <span>Adicionar Productos de Venta (Opcional)</span>
                </label>
                {productosAgregados.length > 0 && (
                  <span className="text-[10px] font-bold text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded border border-[#86EFAC]">
                    +{formatCOP(totalProductosCobro)}
                  </span>
                )}
              </div>

              {/* Selector de producto y cantidad */}
              <div className="flex items-center gap-2">
                <select
                  value={productoSeleccionadoId}
                  onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                  className="flex-1 bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  <option value="">-- Seleccionar producto a llevar --</option>
                  {productosDisponibles.map(p => (
                    <option 
                      key={p.id} 
                      value={p.id} 
                      disabled={p.stock <= 0}
                    >
                      {p.nombre} ({formatCOP(p.precio)}) {p.stock <= 0 ? '- AGOTADO' : `- Disp: ${p.stock}`}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  max="99"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#7C571C]"
                  title="Cantidad a llevar"
                />

                <button
                  type="button"
                  onClick={handleAgregarProducto}
                  disabled={!productoSeleccionadoId}
                  className="px-3 py-1.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Lista de productos agregados a este corte */}
              {productosAgregados.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-[#DFCBB5]/60">
                  {productosAgregados.map(({ producto, cantidad }) => (
                    <div 
                      key={producto.id} 
                      className="flex items-center justify-between bg-[#FFFFFF] px-2.5 py-1.5 rounded-lg border border-[#DFCBB5] text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#7C571C] shrink-0" />
                        <span className="font-medium text-[#221A14] truncate">
                          {producto.nombre}
                        </span>
                        <span className="text-[10px] text-[#6F5A4B] shrink-0">
                          ({cantidad}x {formatCOP(producto.precio)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[#7C571C]">
                          {formatCOP(producto.precio * cantidad)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEliminarProductoAgregado(producto.id)}
                          className="p-0.5 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded transition-colors cursor-pointer"
                          title="Quitar producto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-[10px] text-[#6F5A4B] text-right italic">
                    * El inventario se descontará automáticamente al registrar el corte.
                  </div>
                </div>
              )}
            </div>

            {/* LIVE DIVISION PREVIEW BOX */}
            <div className="rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] text-[#6F5A4B]">
                <span className="font-bold">RESUMEN DE COBRO EN VIVO:</span>
                <span className="font-bold text-[#7C571C]">{porcentajeBarbero}% / {100 - porcentajeBarbero}% (Corte)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FBEBE1] p-2 rounded-lg border border-[#DFCBB5]">
                  <span className="text-[10px] text-[#7C571C] block font-bold">GANANCIA BARBERO:</span>
                  <span className="text-sm font-bold text-[#7C571C]">{formatCOP(montoBarbero)}</span>
                  {propina > 0 && (
                    <span className="text-[9px] text-[#6F5A4B] block">Incluye {formatCOP(propina)} propina</span>
                  )}
                </div>
                <div className="bg-[#EBF7EE] p-2 rounded-lg border border-[#86EFAC]">
                  <span className="text-[10px] text-[#15803D] block font-bold">CASA DEL REY:</span>
                  <span className="text-sm font-bold text-[#15803D]">{formatCOP(montoBarberia + totalProductosCobro)}</span>
                  <span className="text-[9px] text-[#15803D]/80 block">
                    {totalProductosCobro > 0 ? `Corte ${formatCOP(montoBarberia)} + Prod ${formatCOP(totalProductosCobro)}` : 'Margen del salón'}
                  </span>
                </div>
              </div>
              {totalProductosCobro > 0 && (
                <div className="pt-1.5 border-t border-[#DFCBB5] flex items-center justify-between text-xs font-bold text-[#221A14] bg-[#FAF6EE] p-2 rounded-lg">
                  <span>TOTAL A COBRAR AL CLIENTE:</span>
                  <span className="text-sm text-[#7C571C]">{formatCOP(totalGeneralCobro)}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mensajeExito && (
              <div className="p-2.5 rounded-lg bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs rounded-lg transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>{guardando ? 'REGISTRANDO...' : 'REGISTRAR CORTE EN LIBRO'}</span>
            </button>
          </form>
        </div>

        {/* Liquidación por Barbero (Cards) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2 font-mono">
            <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide flex items-center gap-2">
              <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
              <span>Liquidación & Ganancias por Barbero</span>
            </h3>
            <span className="text-xs text-[#6F5A4B]">{barberos.length} Barberos activos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {estadisticasBarberos.map(stat => (
              <div 
                key={stat.barbero.id} 
                className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 shadow-sm font-mono text-xs flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between border-b border-[#DFCBB5]/70 pb-2.5">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#221A14]">
                        {stat.barbero.nombre}
                      </h4>
                      <span className="text-[10px] text-[#7C571C] block font-bold">
                        {stat.barbero.especialidad}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      stat.count === 0
                        ? 'bg-[#FBEBE1] text-[#6F5A4B] border border-[#DFCBB5]'
                        : stat.pendiente === 0
                        ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                        : 'bg-[#FBEBE1] text-[#7C571C] border border-[#7C571C]'
                    }`}>
                      {stat.count === 0 ? 'Sin cortes hoy' : stat.pendiente === 0 ? 'Liquidado' : 'Pendiente Pago'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#DFCBB5] shadow-2xs">
                      <span className="text-[9px] text-[#6F5A4B] block uppercase font-bold">Cortes Atendidos:</span>
                      <span className="text-sm font-bold text-[#221A14]">{stat.count}</span>
                    </div>
                    <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#DFCBB5] shadow-2xs">
                      <span className="text-[9px] text-[#6F5A4B] block uppercase font-bold">Bruto Facturado:</span>
                      <span className="text-xs font-bold text-[#221A14]">{formatCOP(stat.bruto)}</span>
                    </div>
                    <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#DFCBB5] shadow-2xs">
                      <span className="text-[9px] text-[#6F5A4B] block uppercase font-bold">Comisión Base:</span>
                      <span className="text-xs font-bold text-[#7C571C]">{formatCOP(stat.comision)}</span>
                    </div>
                    <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#DFCBB5] shadow-2xs">
                      <span className="text-[9px] text-[#6F5A4B] block uppercase font-bold">Propinas Recibidas:</span>
                      <span className="text-xs font-bold text-[#15803D]">{formatCOP(stat.propinas)}</span>
                    </div>
                  </div>

                  {/* Total to pay banner */}
                  <div className="bg-[#FBEBE1] p-2.5 rounded-lg border border-[#DFCBB5] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Total a Entregar:</span>
                      <span className="text-base font-bold text-[#7C571C]">{formatCOP(stat.totalNeto)}</span>
                    </div>
                    {stat.pendiente > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] text-[#BA1A1A] block font-bold uppercase">Por pagar:</span>
                        <span className="text-xs font-bold text-[#BA1A1A]">{formatCOP(stat.pendiente)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#DFCBB5]/60 mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirVoucher(stat)}
                    disabled={stat.count === 0}
                    className="flex-1 py-1.5 px-2 bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#221A14] border border-[#DFCBB5] rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#7C571C]" />
                    <span>Recibo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLiquidarBarbero(stat.barbero.id, stat.barbero.nombre)}
                    disabled={stat.pendiente === 0 || stat.count === 0}
                    className="flex-1 py-1.5 px-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
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
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-3">
          <div className="flex items-center gap-2">
            <VintageCrownIcon className="w-4 h-4 text-[#7C571C]" />
            <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
              Libro Maestro de Cortes Realizados ({cortesVisibles.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6F5A4B]">Filtrar por Barbero:</span>
            <select
              value={filtroBarbero}
              onChange={(e) => setFiltroBarbero(e.target.value)}
              className="bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
            >
              <option value="todos">Todos los barberos</option>
              {barberos.map(b => (
                <option key={b.id} value={String(b.id)}>{b.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="py-8 text-center text-[#6F5A4B]">Cargando libro de cortes...</div>
        ) : cortesVisibles.length === 0 ? (
          <div className="py-8 text-center text-[#6F5A4B]">
            No hay cortes registrados para la fecha {fechaSeleccionada}. Utiliza el formulario superior para añadir el primer corte del día.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      {corte.totalProductos && corte.totalProductos > 0 ? (
                        <div className="text-[9px] text-[#15803D]/70 font-normal">
                          inc. {formatCOP(corte.totalProductos)} prod
                        </div>
                      ) : null}
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
                        title="Click para alternar estado de liquidación"
                      >
                        {corte.liquidadoAlBarbero ? 'PAGADO' : 'PENDIENTE'}
                      </button>
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarCorte(corte.id, corte.clienteNombre)}
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
        )}
      </div>

      {/* Barber Receipt / Voucher Modal */}
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
                className="flex-1 py-2 px-3 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {copiadoVoucher ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiadoVoucher ? '¡COPIADO!' : 'COPIAR RECIBO'}</span>
              </button>
              <button
                type="button"
                onClick={() => setVoucherBarbero(null)}
                className="py-2 px-4 bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] rounded-lg border border-[#DFCBB5] cursor-pointer font-bold"
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
