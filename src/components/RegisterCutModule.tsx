import React, { useState, useEffect } from 'react';
import { Servicio, Barbero, Cita, MetodoPago, ProductoVenta, CorteDiario, Sucursal } from '../types';
import { 
  crearCorteDiario, 
  getProductos,
  getCortesDiarios
} from '../services/api';
import { 
  Scissors, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  User, 
  DollarSign, 
  Percent, 
  Wallet, 
  Package, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { sucursalesCasaDelRey } from '../services/localData';
import { dispararAperturaPorEfectivo } from '../services/cashDrawer';
import { 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  VintageCrownIcon,
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';

interface RegisterCutModuleProps {
  servicios: Servicio[];
  barberos: Barbero[];
  citas: Cita[];
  onDataUpdated?: () => void;
  onVerHistorial?: () => void;
  sucursalPreseleccionada?: string;
}

export const RegisterCutModule: React.FC<RegisterCutModuleProps> = ({
  servicios,
  barberos,
  citas,
  onDataUpdated,
  onVerHistorial,
  sucursalPreseleccionada,
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];

  // Sede
  const [sucursalId, setSucursalId] = useState<string>(
    sucursalPreseleccionada && sucursalPreseleccionada !== 'todas'
      ? sucursalPreseleccionada
      : 'suc-chico'
  );

  // Form states
  const [barberoId, setBarberoId] = useState<number>(barberos[0]?.id || 101);
  const [servicioId, setServicioId] = useState<number>(servicios[0]?.id || 1);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [precio, setPrecio] = useState<number>(servicios[0]?.precio || 35000);
  const [propina, setPropina] = useState<number>(0);
  const [porcentajeBarbero, setPorcentajeBarbero] = useState<number>(50);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [notas, setNotas] = useState<string>('');
  const [citaSeleccionada, setCitaSeleccionada] = useState<string>('');

  // Productos de venta adicional
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoVenta[]>([]);
  const [productosAgregados, setProductosAgregados] = useState<{
    producto: ProductoVenta;
    cantidad: number;
  }[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidadProducto, setCantidadProducto] = useState<number>(1);

  // Status & Feedback
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ultimoCorteRegistrado, setUltimoCorteRegistrado] = useState<CorteDiario | null>(null);

  // Sincronizar precio al cambiar de servicio
  const handleServicioChange = (id: number) => {
    setServicioId(id);
    const serv = servicios.find(s => s.id === id);
    if (serv) {
      setPrecio(serv.precio);
    }
  };

  // Cargar inventario de productos para venta
  useEffect(() => {
    let isMounted = true;
    async function loadProductos() {
      try {
        const res = await getProductos();
        if (isMounted) {
          const items = res?.datos || [];
          setProductosDisponibles(items.filter(p => p.activo));
        }
      } catch (e) {
        console.error('Error al cargar productos en RegisterCutModule:', e);
      }
    }
    loadProductos();
    return () => { isMounted = false; };
  }, []);

  // Citas agendadas para hoy
  const citasHoy = citas.filter(c => c.fecha === hoyStr && c.estado !== 'Cancelada');

  // Importar datos de una cita programada
  const handleSeleccionarCita = (citaIdRes: string) => {
    setCitaSeleccionada(citaIdRes);
    if (!citaIdRes) {
      setClienteNombre('');
      return;
    }

    const cita = citas.find(c => c.idReserva === citaIdRes);
    if (cita) {
      setClienteNombre(cita.clienteNombre || cita.responsableNombre || '');
      if (cita.servicioId) {
        handleServicioChange(cita.servicioId);
      }
      if (cita.barberoId) {
        const bIdNum = Number(cita.barberoId);
        if (!isNaN(bIdNum) && barberos.some(b => b.id === bIdNum)) {
          setBarberoId(bIdNum);
        }
      }
      if (cita.sucursalId) {
        setSucursalId(cita.sucursalId);
      }
    }
  };

  // Agregar producto adicional al corte
  const handleAgregarProducto = () => {
    if (!productoSeleccionadoId) return;
    const prod = productosDisponibles.find(p => p.id === productoSeleccionadoId);
    if (!prod) return;

    setProductosAgregados(prev => {
      const existe = prev.find(p => p.producto.id === prod.id);
      if (existe) {
        return prev.map(p => 
          p.producto.id === prod.id 
            ? { ...p, cantidad: Math.min(prod.stock, p.cantidad + cantidadProducto) } 
            : p
        );
      }
      return [...prev, { producto: prod, cantidad: Math.min(prod.stock, cantidadProducto) }];
    });

    setProductoSeleccionadoId('');
    setCantidadProducto(1);
  };

  const handleModificarCantidadProducto = (prodId: string, delta: number) => {
    setProductosAgregados(prev => {
      return prev.map(item => {
        if (item.producto.id !== prodId) return item;
        const nuevaCantidad = item.cantidad + delta;
        return {
          ...item,
          cantidad: Math.max(1, Math.min(item.producto.stock, nuevaCantidad))
        };
      });
    });
  };

  const handleEliminarProductoAgregado = (prodId: string) => {
    setProductosAgregados(prev => prev.filter(p => p.producto.id !== prodId));
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Cálculos en vivo
  const totalProductosCobro = productosAgregados.reduce(
    (sum, item) => sum + (item.producto.precio * item.cantidad), 
    0
  );
  const totalGeneralCobro = precio + totalProductosCobro;
  const montoBarbero = Math.round((precio * (porcentajeBarbero / 100)) + propina);
  const montoBarberia = Math.round(precio * ((100 - porcentajeBarbero) / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      setError('Por favor indica el nombre del caballero atendido.');
      return;
    }
    if (precio <= 0) {
      setError('El valor del corte debe ser mayor a cero.');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const barberoObj = barberos.find(b => b.id === Number(barberoId));
      const servicioObj = servicios.find(s => s.id === Number(servicioId));
      const sucursalObj = sucursalesCasaDelRey.find(s => s.id === sucursalId);

      const payloadProductos = productosAgregados.map(pa => ({
        productoId: pa.producto.id,
        cantidad: pa.cantidad
      }));

      const res = await crearCorteDiario({
        barberoId: Number(barberoId),
        servicioId: Number(servicioId),
        servicioNombre: servicioObj?.nombre || 'Corte Real Clásico',
        clienteNombre: clienteNombre.trim(),
        precio: Number(precio),
        propina: Number(propina) || 0,
        porcentajeBarbero: Number(porcentajeBarbero),
        metodoPago,
        sucursalId,
        sucursalNombre: sucursalObj?.nombre || 'Sede Chicó Real',
        fecha: hoyStr,
        citaIdReserva: citaSeleccionada || undefined,
        notas: notas.trim() || undefined,
        productos: payloadProductos.length > 0 ? payloadProductos : undefined
      });

      if (res.exito) {
        setUltimoCorteRegistrado(res.corte);
        setMensajeExito(
          `Corte de "${clienteNombre}" registrado con éxito. Total cobrado: ${formatCOP(totalGeneralCobro)}`
        );

        // Si el pago es en efectivo, disparar apertura automática de cajón si está configurado
        if (metodoPago === 'Efectivo') {
          dispararAperturaPorEfectivo(`Corte registrado - ${clienteNombre}`);
        }

        // Limpiar formulario para el siguiente corte
        setClienteNombre('');
        setPropina(0);
        setNotas('');
        setCitaSeleccionada('');
        setProductosAgregados([]);

        if (onDataUpdated) onDataUpdated();

        // Scroll al tope del formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.mensaje || 'No fue posible registrar el corte en el libro.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión al registrar el corte.');
    } finally {
      setGuardando(false);
    }
  };

  const barberosFiltrados = barberos.filter(
    b => !b.sucursalId || b.sucursalId === sucursalId
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 sm:pb-8 font-mono text-xs text-[#221A14]">
      {/* Header del Terminal de Registro */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
          <BarberPoleRibbon className="h-full w-full" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C571C] text-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                  Registrar Corte Realizado
                </h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] hidden sm:inline-block">
                  Caja Rápida
                </span>
              </div>
              <p className="text-[11px] text-[#6F5A4B] font-mono mt-0.5">
                Terminal móvil para liquidación inmediata y registro en libro contable
              </p>
            </div>
          </div>

          {onVerHistorial && (
            <button
              type="button"
              onClick={onVerHistorial}
              className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-98"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ver Libro de Cortes</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Confirmación del Último Corte Registrado */}
      {mensajeExito && (
        <div className="p-4 rounded-2xl bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] flex items-start justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#15803D]" />
            <div>
              <span className="font-bold block text-sm">{mensajeExito}</span>
              {ultimoCorteRegistrado && (
                <span className="text-[11px] font-mono text-[#15803D]/90 block mt-0.5">
                  ID: #{ultimoCorteRegistrado.id} &bull; Barbero: {ultimoCorteRegistrado.barberoNombre} ({formatCOP(ultimoCorteRegistrado.montoBarbero)}) &bull; Casa del Rey: {formatCOP(ultimoCorteRegistrado.montoBarberia)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-[#15803D] hover:text-[#0D5326] p-1 rounded-lg hover:bg-[#D3F0D9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#BA1A1A] p-1 rounded-lg hover:bg-[#FFB4AB] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulario Principal Optimizado para Móvil */}
      <form onSubmit={handleSubmit} className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        {/* Paso A: Selección de Sede */}
        <div>
          <label className="text-[10px] text-[#7C571C] uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>01 // SEDE DE ATENCIÓN</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {sucursalesCasaDelRey.map(suc => {
              const activa = sucursalId === suc.id;
              return (
                <button
                  key={suc.id}
                  type="button"
                  onClick={() => setSucursalId(suc.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[52px] active:scale-95 ${
                    activa
                      ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] shadow-sm font-bold ring-1 ring-[#7C571C]'
                      : 'bg-[#FFFFFF] text-[#4F4539] border-[#DFCBB5] hover:bg-[#FBEBE1]'
                  }`}
                >
                  <span className="text-xs font-serif font-bold block truncate w-full">
                    {suc.nombre.replace('Sede ', '')}
                  </span>
                  <span className={`text-[9px] font-mono block truncate ${activa ? 'text-[#FAF6EE]/80' : 'text-[#6F5A4B]'}`}>
                    {suc.ciudad}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paso B: Cargar Cita del Día (Walk-in vs Cita Agendada) */}
        {citasHoy.length > 0 && (
          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#7C571C]" />
                <span>Importar Cita Agendada de Hoy (Opcional):</span>
              </label>
              <span className="text-[9px] text-[#7C571C] font-mono font-bold bg-[#FBEBE1] px-2 py-0.5 rounded-full border border-[#DFCBB5]">
                {citasHoy.length} turnos hoy
              </span>
            </div>
            <select
              value={citaSeleccionada}
              onChange={(e) => handleSeleccionarCita(e.target.value)}
              className="w-full bg-[#FFF8F5] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer min-h-[44px]"
            >
              <option value="">-- Turno Directo / Walk-in en Salón (Sin Cita Previa) --</option>
              {citasHoy.map(c => (
                <option key={c.idReserva} value={c.idReserva}>
                  ⏰ {c.hora} - {c.clienteNombre || c.responsableNombre} (#{c.idReserva}) - {c.servicioNombre || 'Servicio'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Paso C: Barbero & Servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Barbero */}
          <div>
            <label className="text-[10px] text-[#7C571C] uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1.5">
              <StraightRazorIcon className="w-3.5 h-3.5" />
              <span>02 // MAESTRO BARBERO</span>
            </label>
            <select
              value={barberoId}
              onChange={(e) => setBarberoId(Number(e.target.value))}
              className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7C571C] cursor-pointer min-h-[44px] shadow-2xs"
            >
              {barberosFiltrados.map(b => (
                <option key={b.id} value={b.id}>
                  ✂️ {b.nombre} ({b.especialidad})
                </option>
              ))}
            </select>
          </div>

          {/* Servicio Realizado */}
          <div>
            <label className="text-[10px] text-[#7C571C] uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1.5">
              <VintageScissorsIcon className="w-3.5 h-3.5" />
              <span>03 // SERVICIO REALIZADO</span>
            </label>
            <select
              value={servicioId}
              onChange={(e) => handleServicioChange(Number(e.target.value))}
              className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7C571C] cursor-pointer min-h-[44px] shadow-2xs"
            >
              {servicios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre} - {formatCOP(s.precio)} ({s.duracionMinutos} min)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Paso D: Nombre del Caballero & Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#6F5A4B] uppercase font-bold block mb-1">
              Nombre del Caballero <span className="text-[#7C571C]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6F5A4B]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ej. Carlos Martínez"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#7C571C] min-h-[44px] shadow-2xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#6F5A4B] uppercase font-bold block mb-1">
              Tarifa del Corte (COP) <span className="text-[#7C571C]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#6F5A4B] font-bold text-xs">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#7C571C] min-h-[44px] shadow-2xs"
                required
              />
            </div>
          </div>
        </div>

        {/* Paso E: Porcentaje del Barbero & Propina */}
        <div className="bg-[#FAF6EE] p-3.5 rounded-xl border border-[#DFCBB5] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Porcentaje */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#6F5A4B] uppercase font-bold">
                  Comisión Barbero (%):
                </label>
                <span className="text-[10px] text-[#7C571C] font-bold">
                  {porcentajeBarbero}% Barbero / {100 - porcentajeBarbero}% Salón
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={porcentajeBarbero}
                  onChange={(e) => setPorcentajeBarbero(Number(e.target.value))}
                  className="w-16 bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] text-center rounded-xl py-2 text-xs font-bold focus:outline-none focus:border-[#7C571C] min-h-[40px]"
                />
                <div className="flex gap-1.5 flex-1">
                  {[50, 60, 40].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setPorcentajeBarbero(pct)}
                      className={`flex-1 py-2 rounded-xl text-xs border font-bold transition-all cursor-pointer min-h-[40px] active:scale-95 ${
                        porcentajeBarbero === pct
                          ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] shadow-sm'
                          : 'bg-[#FFFFFF] text-[#6F5A4B] border-[#DFCBB5] hover:bg-[#FBEBE1]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Propina */}
            <div>
              <label className="text-[10px] text-[#6F5A4B] uppercase font-bold block mb-1">
                Propina (100% Barbero):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#6F5A4B] text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={propina}
                  onChange={(e) => setPropina(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-[#7C571C] min-h-[40px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Paso F: Medio de Pago */}
        <div>
          <label className="text-[10px] text-[#7C571C] uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>04 // MEDIO DE PAGO</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Efectivo', 'Nequi / Daviplata', 'Tarjeta / Datáfono'] as MetodoPago[]).map(metodo => {
              const sel = metodoPago === metodo;
              return (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setMetodoPago(metodo)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px] active:scale-95 ${
                    sel
                      ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] shadow-sm font-bold ring-1 ring-[#7C571C]'
                      : 'bg-[#FFFFFF] text-[#4F4539] border-[#DFCBB5] hover:bg-[#FBEBE1]'
                  }`}
                >
                  <span className="text-xs font-bold block">
                    {metodo === 'Efectivo' ? '💵 Efectivo' : metodo === 'Nequi / Daviplata' ? '📱 Nequi / Dav' : '💳 Tarjeta'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paso G: Venta Adicional de Productos (Pomadas, Ceras, Cuidado Barba) */}
        <div className="bg-[#FAF6EE] border border-[#DFCBB5] rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[#7C571C] uppercase font-bold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Adicionar Productos de Venta (Opcional)</span>
            </label>
            {productosAgregados.length > 0 && (
              <span className="text-[10px] font-bold text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                +{formatCOP(totalProductosCobro)}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Selector de producto con ancho completo y truncado seguro */}
            <div className="w-full min-w-0">
              <select
                id="select-producto-corte"
                value={productoSeleccionadoId}
                onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                className="w-full min-w-0 bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer min-h-[44px] truncate shadow-2xs"
              >
                <option value="">-- Seleccionar producto a llevar --</option>
                {productosDisponibles.map(p => (
                  <option 
                    key={p.id} 
                    value={p.id} 
                    disabled={p.stock <= 0}
                  >
                    {p.nombre} ({formatCOP(p.precio)}) {p.stock <= 0 ? '- AGOTADO' : `- Stock: ${p.stock}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Fila de controles: Cantidad con stepper táctil y botón Agregar Producto */}
            <div className="flex items-center gap-2 w-full">
              {/* Selector de cantidad compacto y táctil */}
              <div className="flex items-center border border-[#DFCBB5] rounded-xl bg-[#FFFFFF] h-[44px] px-1 shrink-0 shadow-2xs">
                <button
                  type="button"
                  id="btn-disminuir-cantidad-prod"
                  onClick={() => setCantidadProducto(Math.max(1, cantidadProducto - 1))}
                  disabled={cantidadProducto <= 1}
                  className="w-8 h-8 flex items-center justify-center text-[#6F5A4B] hover:text-[#221A14] disabled:opacity-30 cursor-pointer rounded-lg hover:bg-[#FAF6EE] transition-colors"
                  title="Disminuir cantidad"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  id="input-cantidad-prod"
                  min="1"
                  max="99"
                  value={cantidadProducto}
                  onChange={(e) => setCantidadProducto(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-[#221A14] text-xs text-center font-bold focus:outline-none bg-transparent"
                  title="Cantidad a llevar"
                />
                <button
                  type="button"
                  id="btn-aumentar-cantidad-prod"
                  onClick={() => setCantidadProducto(cantidadProducto + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6F5A4B] hover:text-[#221A14] cursor-pointer rounded-lg hover:bg-[#FAF6EE] transition-colors"
                  title="Aumentar cantidad"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Botón para añadir producto */}
              <button
                type="button"
                id="btn-agregar-producto-corte"
                onClick={handleAgregarProducto}
                disabled={!productoSeleccionadoId}
                className="flex-1 px-4 py-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95 shadow-sm whitespace-nowrap min-w-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Agregar Producto</span>
              </button>
            </div>
          </div>

          {/* Lista de productos agregados */}
          {productosAgregados.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#DFCBB5]/60">
              {productosAgregados.map(({ producto, cantidad }) => (
                <div 
                  key={producto.id} 
                  className="flex items-center justify-between bg-[#FFFFFF] px-3 py-2 rounded-xl border border-[#DFCBB5] text-xs gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ShoppingBag className="w-4 h-4 text-[#7C571C] shrink-0" />
                    <span className="font-bold text-[#221A14] truncate">
                      {producto.nombre}
                    </span>
                    <span className="text-[10px] text-[#6F5A4B] shrink-0">
                      ({formatCOP(producto.precio)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-[#DFCBB5] rounded-lg bg-[#FAF6EE]">
                      <button
                        type="button"
                        onClick={() => handleModificarCantidadProducto(producto.id, -1)}
                        className="p-1 text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
                        title="Restar 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 font-bold text-xs">{cantidad}</span>
                      <button
                        type="button"
                        onClick={() => handleModificarCantidadProducto(producto.id, 1)}
                        className="p-1 text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
                        title="Sumar 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-[#7C571C] min-w-[70px] text-right">
                      {formatCOP(producto.precio * cantidad)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleEliminarProductoAgregado(producto.id)}
                      className="p-1 text-[#BA1A1A] hover:bg-[#FFDAD6] rounded-lg transition-colors cursor-pointer"
                      title="Quitar producto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalle o Notas */}
        <div>
          <label className="text-[10px] text-[#6F5A4B] uppercase font-bold block mb-1">
            Nota Opcional del Corte:
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej. Corte degradado alto con navaja y barba perfilada..."
            className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D] shadow-2xs"
          />
        </div>

        {/* Resumen en Vivo de la División de Ganancias */}
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#DFCBB5] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-[#6F5A4B] border-b border-[#DFCBB5] pb-2">
            <span className="font-bold uppercase tracking-wider">División de Fondos en Caja:</span>
            <span className="font-bold text-[#7C571C]">{porcentajeBarbero}% Barbero / {100 - porcentajeBarbero}% Salón</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-[#FBEBE1] p-3 rounded-xl border border-[#DFCBB5]">
              <span className="text-[10px] text-[#7C571C] block font-bold uppercase tracking-wide">Comisión Barbero:</span>
              <span className="text-base font-bold text-[#7C571C]">{formatCOP(montoBarbero)}</span>
              {propina > 0 && (
                <span className="text-[9px] text-[#15803D] block mt-0.5">+{formatCOP(propina)} propina incluida</span>
              )}
            </div>

            <div className="bg-[#EBF7EE] p-3 rounded-xl border border-[#86EFAC]">
              <span className="text-[10px] text-[#15803D] block font-bold uppercase tracking-wide">Casa del Rey:</span>
              <span className="text-base font-bold text-[#15803D]">
                {formatCOP(montoBarberia + totalProductosCobro)}
              </span>
              <span className="text-[9px] text-[#15803D]/80 block mt-0.5">
                {totalProductosCobro > 0 ? `Corte ${formatCOP(montoBarberia)} + Prod ${formatCOP(totalProductosCobro)}` : 'Margen neto salón'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#DFCBB5] flex items-center justify-between text-xs font-bold text-[#221A14] bg-[#FAF6EE] p-3 rounded-xl">
            <span className="uppercase tracking-wider">TOTAL A COBRAR EN CAJA:</span>
            <span className="text-base text-[#7C571C] font-extrabold">{formatCOP(totalGeneralCobro)}</span>
          </div>
        </div>

        {/* Botón Principal de Registro */}
        <button
          type="submit"
          disabled={guardando || !clienteNombre.trim() || precio <= 0}
          className="w-full py-3.5 px-4 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer min-h-[48px]"
        >
          <Scissors className="w-4 h-4" />
          <span>{guardando ? 'REGISTRANDO EN LIBRO...' : 'REGISTRAR CORTE EN LIBRO'}</span>
        </button>
      </form>
    </div>
  );
};
