import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProductoVenta, 
  CategoriaProducto, 
  MovimientoStock 
} from '../types';
import { 
  getProductos, 
  crearProducto, 
  actualizarProducto, 
  ajustarStockProducto, 
  eliminarProducto,
  ResumenInventario 
} from '../services/api';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  Archive, 
  X, 
  PlusCircle, 
  MinusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert,
  Tag,
  Check
} from 'lucide-react';
import { 
  VintageCrownIcon, 
  VintageWaxSeal 
} from './VintageBarberIcons';
import { validarTextoSeguro } from '../utils/security';

interface InventoryManagementSectionProps {
  onDataUpdated?: () => void;
}

const CATEGORIAS_PRODUCTO: CategoriaProducto[] = [
  'Pomadas', 
  'Ceras', 
  'Geles', 
  'Perfumería', 
  'Cuidado Barba', 
  'Otros'
];

export const InventoryManagementSection: React.FC<InventoryManagementSectionProps> = ({
  onDataUpdated
}) => {
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');
  const [soloBajoStock, setSoloBajoStock] = useState<boolean>(false);

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<ProductoVenta | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<CategoriaProducto>('Pomadas');
  const [formPrecio, setFormPrecio] = useState<number>(45000);
  const [formCosto, setFormCosto] = useState<number>(22000);
  const [formStock, setFormStock] = useState<number>(10);
  const [formStockMinimo, setFormStockMinimo] = useState<number>(4);
  const [formSku, setFormSku] = useState<string>('');
  const [formMarca, setFormMarca] = useState<string>('La Casa del Rey Grooming');
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formActivo, setFormActivo] = useState<boolean>(true);

  // Modal Ajuste Rápido de Stock
  const [modalAjusteStock, setModalAjusteStock] = useState<ProductoVenta | null>(null);
  const [deltaAjuste, setDeltaAjuste] = useState<number>(1);
  const [tipoOperacionAjuste, setTipoOperacionAjuste] = useState<'sumar' | 'restar'>('sumar');
  const [motivoAjuste, setMotivoAjuste] = useState<string>('Reabastecimiento de proveedor');

  // Vista activa: 'catalogo' | 'movimientos'
  const [vista, setVista] = useState<'catalogo' | 'movimientos'>('catalogo');

  const cargarInventario = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await getProductos({
        categoria: categoriaFiltro !== 'todas' ? categoriaFiltro : undefined,
        buscar: busqueda.trim() || undefined
      });
      setProductos(res.datos || []);
      setResumen(res.resumen || null);
      setMovimientos(res.movimientosRecientes || []);
    } catch (err: any) {
      setError(err.message || 'Error al consultar inventario');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, [categoriaFiltro, busqueda]);

  const abrirModalCrear = () => {
    setProductoEnEdicion(null);
    setFormNombre('');
    setFormCategoria('Pomadas');
    setFormPrecio(45000);
    setFormCosto(22000);
    setFormStock(12);
    setFormStockMinimo(4);
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormMarca('La Casa del Rey Grooming');
    setFormDescripcion('');
    setFormActivo(true);
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod: ProductoVenta) => {
    setProductoEnEdicion(prod);
    setFormNombre(prod.nombre);
    setFormCategoria(prod.categoria);
    setFormPrecio(prod.precio);
    setFormCosto(prod.costo || 0);
    setFormStock(prod.stock);
    setFormStockMinimo(prod.stockMinimo || 4);
    setFormSku(prod.sku || '');
    setFormMarca(prod.marca || 'La Casa del Rey Grooming');
    setFormDescripcion(prod.descripcion || '');
    setFormActivo(prod.activo);
    setModalAbierto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    const valNombre = validarTextoSeguro(formNombre, { campo: 'Nombre del Producto', longitudMaxima: 100 });
    if (!valNombre.esValido) {
      setError(valNombre.motivo || 'El nombre contiene caracteres o comandos no permitidos.');
      return;
    }

    if (formSku.trim()) {
      const valSku = validarTextoSeguro(formSku, { campo: 'Código SKU', longitudMaxima: 50 });
      if (!valSku.esValido) {
        setError(valSku.motivo || 'El SKU contiene código o comandos no válidos.');
        return;
      }
    }

    if (formMarca.trim()) {
      const valMarca = validarTextoSeguro(formMarca, { campo: 'Marca del Producto', longitudMaxima: 80 });
      if (!valMarca.esValido) {
        setError(valMarca.motivo || 'La marca contiene código o comandos no válidos.');
        return;
      }
    }

    if (formDescripcion.trim()) {
      const valDesc = validarTextoSeguro(formDescripcion, { campo: 'Descripción', longitudMaxima: 500 });
      if (!valDesc.esValido) {
        setError(valDesc.motivo || 'La descripción contiene código malicioso no permitido.');
        return;
      }
    }

    if (formPrecio <= 0) {
      setError('El precio de venta debe ser superior a 0.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      if (productoEnEdicion) {
        await actualizarProducto(productoEnEdicion.id, {
          nombre: formNombre.trim(),
          categoria: formCategoria,
          precio: Number(formPrecio),
          costo: Number(formCosto),
          stock: Number(formStock),
          stockMinimo: Number(formStockMinimo),
          sku: formSku.trim(),
          marca: formMarca.trim(),
          descripcion: formDescripcion.trim(),
          activo: formActivo
        });
        setMensajeExito(`Producto "${formNombre}" actualizado exitosamente.`);
      } else {
        await crearProducto({
          nombre: formNombre.trim(),
          categoria: formCategoria,
          precio: Number(formPrecio),
          costo: Number(formCosto),
          stock: Number(formStock),
          stockMinimo: Number(formStockMinimo),
          sku: formSku.trim(),
          marca: formMarca.trim(),
          descripcion: formDescripcion.trim(),
          activo: formActivo
        });
        setMensajeExito(`Producto "${formNombre}" creado y añadido al inventario.`);
      }

      setModalAbierto(false);
      cargarInventario();
      if (onDataUpdated) onDataUpdated();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  const notificarError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const safeConfirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch {
      return true;
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (!safeConfirm(`¿Confirmas que deseas eliminar definitivamente "${nombre}" del catálogo de inventario?`)) {
      return;
    }

    try {
      await eliminarProducto(id);
      setMensajeExito(`Producto "${nombre}" eliminado del catálogo.`);
      cargarInventario();
      if (onDataUpdated) onDataUpdated();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      notificarError('Error al eliminar producto: ' + err.message);
    }
  };

  const handleAjusteRapido = async (prod: ProductoVenta, delta: number, motivo: string) => {
    try {
      await ajustarStockProducto(prod.id, delta, motivo);
      cargarInventario();
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      notificarError('Error al ajustar stock: ' + err.message);
    }
  };

  const handleEjecutarModalAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAjusteStock) return;

    if (motivoAjuste.trim()) {
      const valMotivo = validarTextoSeguro(motivoAjuste, { campo: 'Motivo del Ajuste', longitudMaxima: 150 });
      if (!valMotivo.esValido) {
        notificarError(valMotivo.motivo || 'El motivo contiene código o comandos no permitidos.');
        return;
      }
    }

    const finalDelta = tipoOperacionAjuste === 'sumar' ? Math.abs(deltaAjuste) : -Math.abs(deltaAjuste);

    try {
      await ajustarStockProducto(modalAjusteStock.id, finalDelta, motivoAjuste);
      setMensajeExito(`Stock de "${modalAjusteStock.nombre}" ajustado exitosamente.`);
      setModalAjusteStock(null);
      cargarInventario();
      if (onDataUpdated) onDataUpdated();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      notificarError('Error al ajustar stock: ' + err.message);
    }
  };

  // Filtrado en memoria si se activa el toggle de solo bajo stock
  const productosMostrados = useMemo(() => {
    if (!soloBajoStock) return productos;
    return productos.filter(p => p.stock <= p.stockMinimo);
  }, [productos, soloBajoStock]);

  const obtenerColorCategoria = (cat: CategoriaProducto) => {
    switch (cat) {
      case 'Pomadas':
        return 'bg-[#FAF3E0] text-[#7C571C] border-[#DFCBB5]';
      case 'Ceras':
        return 'bg-[#FBEBE1] text-[#9A3412] border-[#FDBA74]';
      case 'Geles':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'Perfumería':
        return 'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]';
      case 'Cuidado Barba':
        return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
      default:
        return 'bg-[#F5F5F4] text-[#57534E] border-[#D6D3D1]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Cabecera */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <VintageCrownIcon className="w-64 h-64 text-[#7C571C]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-[#221A14] tracking-wide">
                Inventario & Catálogo de Productos
              </h2>
            </div>
            <p className="text-xs text-[#6F5A4B] font-mono mt-1 max-w-2xl">
              Control centralizado de existencias para pomadas capilares, ceras, geles, perfumería y cuidado de barba. 
              Descuento automático en tiempo real cuando se adiciona un producto al corte del cliente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#FBEBE1] p-0.5 rounded-lg border border-[#DFCBB5]">
              <button
                type="button"
                onClick={() => setVista('catalogo')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vista === 'catalogo'
                    ? 'bg-[#7C571C] text-[#FAF6EE] shadow-xs'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                Catálogo & Stock
              </button>
              <button
                type="button"
                onClick={() => setVista('movimientos')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vista === 'movimientos'
                    ? 'bg-[#7C571C] text-[#FAF6EE] shadow-xs'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                Kárdex & Salidas
              </button>
            </div>

            <button
              type="button"
              onClick={cargarInventario}
              disabled={cargando}
              className="p-2 rounded-lg bg-[#FFFFFF] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] hover:border-[#7C571C] transition-colors cursor-pointer"
              title="Recargar inventario"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-[#7C571C]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={abrirModalCrear}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-serif font-bold text-xs rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes de Alerta / Éxito */}
      {mensajeExito && (
        <div className="flex items-center gap-2 p-3 bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] text-xs rounded-lg font-mono animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
          <span>{mensajeExito}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FFDAD6] border border-[#FFB4AB] text-[#BA1A1A] text-xs rounded-lg font-mono animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Métricas de Inventario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-[11px] font-mono text-[#6F5A4B] uppercase tracking-wider font-bold">Total Referencias</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-serif font-bold text-[#221A14]">
              {resumen?.totalReferencias ?? productos.length}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] font-bold">
              {resumen?.referenciasActivas ?? productos.filter(p => p.activo).length} Activos
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-[11px] font-mono text-[#6F5A4B] uppercase tracking-wider font-bold">Unidades en Stock</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-serif font-bold text-[#7C571C]">
              {resumen?.unidadesTotales ?? productos.reduce((a, b) => a + b.stock, 0)}
            </span>
            <span className="text-[10px] font-mono text-[#6F5A4B]">Unidades físicas</span>
          </div>
        </div>

        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-[11px] font-mono text-[#6F5A4B] uppercase tracking-wider font-bold">Valoración Venta</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-serif font-bold text-[#221A14]">
              ${(resumen?.valorTotalVenta ?? productos.reduce((a, b) => a + (b.stock * b.precio), 0)).toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] font-mono text-[#15803D] font-bold">PVP Est.</span>
          </div>
        </div>

        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 flex flex-col justify-between shadow-2xs">
          <span className="text-[11px] font-mono text-[#6F5A4B] uppercase tracking-wider font-bold">Alertas de Stock</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-serif font-bold ${
              (resumen?.stockBajo || 0) + (resumen?.agotados || 0) > 0 ? 'text-[#B45309]' : 'text-[#15803D]'
            }`}>
              {(resumen?.stockBajo || 0) + (resumen?.agotados || 0)}
            </span>
            <button
              type="button"
              onClick={() => setSoloBajoStock(!soloBajoStock)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                soloBajoStock 
                  ? 'bg-[#7C571C] text-[#FAF6EE] border-[#7C571C] font-bold'
                  : 'bg-[#FBEBE1] text-[#7C571C] border-[#DFCBB5] hover:border-[#7C571C]'
              }`}
            >
              {soloBajoStock ? 'Ver Todo' : 'Filtrar Críticos'}
            </button>
          </div>
        </div>
      </div>

      {vista === 'catalogo' ? (
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl overflow-hidden shadow-xs">
          {/* Barra de Filtros y Búsqueda */}
          <div className="p-4 border-b border-[#DFCBB5] bg-[#FBEBE1]/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F5A4B]" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por pomada, cera, gel, marca, SKU..."
                className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-xs text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C] font-mono"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Categorías en Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                  categoriaFiltro === 'todas'
                    ? 'bg-[#7C571C] text-[#FAF6EE] font-bold shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#6F5A4B] border border-[#DFCBB5] hover:text-[#221A14] hover:bg-[#FAF6EE]'
                }`}
              >
                Todas ({productos.length})
              </button>
              {CATEGORIAS_PRODUCTO.map(cat => {
                const count = productos.filter(p => p.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaFiltro(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                      categoriaFiltro === cat
                        ? 'bg-[#7C571C] text-[#FAF6EE] font-bold shadow-2xs'
                        : 'bg-[#FFFFFF] text-[#6F5A4B] border border-[#DFCBB5] hover:text-[#221A14] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    {cat} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DFCBB5] bg-[#FBEBE1] text-[11px] font-mono uppercase tracking-wider text-[#6F5A4B] font-bold">
                  <th className="py-3 px-4">Producto & SKU</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">PVP Venta</th>
                  <th className="py-3 px-3">Costo / Margen</th>
                  <th className="py-3 px-3 text-center">Stock Actual</th>
                  <th className="py-3 px-3 text-center">Ajuste Rápido</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFCBB5]/60 text-xs font-mono">
                {cargando && productosMostrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#6F5A4B]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C571C] mb-2" />
                      Consultando inventario de productos...
                    </td>
                  </tr>
                ) : productosMostrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#6F5A4B]">
                      <Package className="w-8 h-8 mx-auto text-[#DFCBB5] mb-2" />
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  productosMostrados.map((prod) => {
                    const margenPesos = prod.precio - (prod.costo || 0);
                    const margenPorcentaje = prod.precio > 0 
                      ? Math.round((margenPesos / prod.precio) * 100) 
                      : 0;

                    const esAgotado = prod.stock === 0;
                    const esBajo = prod.stock > 0 && prod.stock <= prod.stockMinimo;

                    return (
                      <tr 
                        key={prod.id} 
                        className={`hover:bg-[#FBEBE1]/40 transition-colors ${
                          !prod.activo ? 'opacity-50 bg-[#F5EFEB]/50' : ''
                        }`}
                      >
                        {/* Producto & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center shrink-0 text-[#7C571C]">
                              {prod.categoria === 'Pomadas' && <Sparkles className="w-4 h-4" />}
                              {prod.categoria === 'Ceras' && <VintageWaxSeal className="w-4 h-4" />}
                              {prod.categoria === 'Geles' && <Package className="w-4 h-4" />}
                              {prod.categoria === 'Perfumería' && <Tag className="w-4 h-4" />}
                              {prod.categoria === 'Cuidado Barba' && <VintageCrownIcon className="w-4 h-4" />}
                              {prod.categoria === 'Otros' && <Archive className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-serif font-bold text-sm text-[#221A14]">
                                {prod.nombre}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#6F5A4B] mt-0.5">
                                <span className="text-[#7C571C] font-semibold">{prod.marca || 'La Casa del Rey'}</span>
                                <span>•</span>
                                <span className="bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DFCBB5] text-[#6F5A4B]">{prod.sku}</span>
                                {!prod.activo && (
                                  <span className="text-[#BA1A1A] font-bold">[INACTIVO]</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${obtenerColorCategoria(prod.categoria)}`}>
                            {prod.categoria}
                          </span>
                        </td>

                        {/* PVP Venta */}
                        <td className="py-3.5 px-3">
                          <span className="font-serif font-bold text-[#221A14] text-sm">
                            ${prod.precio.toLocaleString('es-CO')}
                          </span>
                          <span className="text-[10px] text-[#6F5A4B] block">COP</span>
                        </td>

                        {/* Costo / Margen */}
                        <td className="py-3.5 px-3">
                          <div className="text-[#6F5A4B] text-xs">
                            ${(prod.costo || 0).toLocaleString('es-CO')} COP
                          </div>
                          <span className="text-[10px] text-[#15803D] font-bold">
                            +{margenPorcentaje}% (${margenPesos.toLocaleString('es-CO')})
                          </span>
                        </td>

                        {/* Stock Actual */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold font-mono">
                            {esAgotado ? (
                              <span className="bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB] px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-[#BA1A1A]" />
                                AGOTADO (0)
                              </span>
                            ) : esBajo ? (
                              <span className="bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-[#B45309]" />
                                {prod.stock} un. (Bajo &le; {prod.stockMinimo})
                              </span>
                            ) : (
                              <span className="bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] px-2 py-0.5 rounded flex items-center gap-1">
                                <Check className="w-3 h-3 text-[#15803D]" />
                                {prod.stock} un.
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ajuste Rápido */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-lg border border-[#DFCBB5]">
                            <button
                              type="button"
                              onClick={() => handleAjusteRapido(prod, -1, 'Ajuste rápido (-1)')}
                              disabled={prod.stock <= 0}
                              className="p-1 rounded text-[#6F5A4B] hover:text-[#BA1A1A] disabled:opacity-30 transition-colors cursor-pointer"
                              title="Restar 1 unidad"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-1 text-[11px] font-bold text-[#221A14]">
                              {prod.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAjusteRapido(prod, 1, 'Ajuste rápido (+1 reposición)')}
                              className="p-1 rounded text-[#6F5A4B] hover:text-[#15803D] transition-colors cursor-pointer"
                              title="Sumar 1 unidad"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModalAjusteStock(prod);
                                setDeltaAjuste(5);
                                setTipoOperacionAjuste('sumar');
                                setMotivoAjuste('Ingreso por compra a proveedor');
                              }}
                              className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-[#FBEBE1] text-[#7C571C] hover:bg-[#DFCBB5] font-bold transition-colors cursor-pointer"
                              title="Ajuste avanzado con motivo"
                            >
                              + Lote
                            </button>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(prod)}
                              className="p-1.5 rounded-md text-[#6F5A4B] hover:text-[#7C571C] hover:bg-[#FBEBE1] transition-colors cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(prod.id, prod.nombre)}
                              className="p-1.5 rounded-md text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista de Kárdex / Movimientos de Stock */
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl overflow-hidden shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#DFCBB5] pb-3">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#221A14] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7C571C]" />
                Kárdex de Movimientos & Auditoría de Ventas
              </h3>
              <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
                Registro inmutable de salidas automáticas por venta de cortes, reposiciones y ajustes de inventario.
              </p>
            </div>
            <span className="text-xs font-mono text-[#7C571C] bg-[#FBEBE1] px-2.5 py-1 rounded border border-[#DFCBB5] font-bold">
              {movimientos.length} Eventos Recientes
            </span>
          </div>

          {movimientos.length === 0 ? (
            <div className="text-center py-12 text-[#6F5A4B] font-mono text-xs">
              <Archive className="w-8 h-8 mx-auto text-[#DFCBB5] mb-2" />
              Aún no hay movimientos registrados en la bitácora de stock.
            </div>
          ) : (
            <div className="space-y-2">
              {movimientos.map((mov) => {
                const esSalida = mov.cantidad < 0;
                return (
                  <div
                    key={mov.id}
                    className="p-3 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        esSalida ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFB4AB]' : 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                      }`}>
                        {esSalida ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#221A14]">
                          {mov.productoNombre}
                        </div>
                        <div className="text-[11px] text-[#6F5A4B]">
                          {mov.motivo} {mov.usuario ? `• Por: ${mov.usuario}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className={`text-sm font-bold ${
                          esSalida ? 'text-[#BA1A1A]' : 'text-[#15803D]'
                        }`}>
                          {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad} un.
                        </span>
                        <div className="text-[10px] text-[#6F5A4B]">
                          Saldo: {mov.stockAnterior} &rarr; <span className="text-[#221A14] font-bold">{mov.stockNuevo}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#6F5A4B] border-l border-[#DFCBB5] pl-3">
                        <div>{mov.fecha}</div>
                        <div>{mov.hora}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Crear / Editar Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header Modal */}
            <div className="p-4 border-b border-[#DFCBB5] bg-[#FBEBE1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VintageWaxSeal className="w-5 h-5 text-[#7C571C]" />
                <h3 className="font-serif font-bold text-sm text-[#221A14]">
                  {productoEnEdicion ? 'Editar Ficha de Producto' : 'Dar de Alta Nuevo Producto en Inventario'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-md text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarProducto} className="p-5 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="ej. Pomada King Matte Acabado Real 100g"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Categoría *</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaProducto)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] focus:outline-none focus:border-[#7C571C] cursor-pointer"
                  >
                    {CATEGORIAS_PRODUCTO.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    placeholder="La Casa del Rey Grooming"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Precio Venta Público (COP) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#7C571C] focus:outline-none focus:border-[#7C571C] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Costo Adquisición (COP)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={formCosto}
                    onChange={(e) => setFormCosto(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Stock Físico</label>
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#15803D] focus:outline-none focus:border-[#7C571C] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min={1}
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] focus:outline-none focus:border-[#7C571C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">SKU / Ref</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="POM-01"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Descripción / Beneficios para el Cliente</label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalla fijación, textura, brillo, aroma o modo de uso..."
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] placeholder-[#8A796D] focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodActivoCheck"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-[#DFCBB5] text-[#7C571C] focus:ring-[#7C571C] bg-[#FFFFFF] cursor-pointer"
                />
                <label htmlFor="prodActivoCheck" className="text-[#221A14] text-xs cursor-pointer select-none font-medium">
                  Producto activo para venta en caja y registro de cortes
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFCBB5]">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] rounded-lg font-mono border border-[#DFCBB5] hover:bg-[#DFCBB5] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-serif font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {guardando ? 'Guardando...' : productoEnEdicion ? 'Actualizar Producto' : 'Registrar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajuste de Lote / Stock */}
      {modalAjusteStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-4 border-b border-[#DFCBB5] bg-[#FBEBE1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#7C571C]" />
                <h3 className="font-serif font-bold text-sm text-[#221A14]">
                  Ajuste de Existencias Físicas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAjusteStock(null)}
                className="p-1 rounded-md text-[#6F5A4B] hover:text-[#221A14] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEjecutarModalAjuste} className="p-5 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#DFCBB5]">
                <div className="font-serif font-bold text-sm text-[#221A14]">
                  {modalAjusteStock.nombre}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[#6F5A4B]">
                  <span>Stock Actual: <strong className="text-[#7C571C]">{modalAjusteStock.stock} un.</strong></span>
                  <span>SKU: {modalAjusteStock.sku}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoOperacionAjuste('sumar')}
                  className={`py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                    tipoOperacionAjuste === 'sumar'
                      ? 'bg-[#EBF7EE] text-[#15803D] border-[#86EFAC] shadow-2xs'
                      : 'bg-[#FFFFFF] text-[#6F5A4B] border-[#DFCBB5]'
                  }`}
                >
                  + Ingresar / Comprar
                </button>
                <button
                  type="button"
                  onClick={() => setTipoOperacionAjuste('restar')}
                  className={`py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                    tipoOperacionAjuste === 'restar'
                      ? 'bg-[#FFDAD6] text-[#BA1A1A] border-[#FFB4AB] shadow-2xs'
                      : 'bg-[#FFFFFF] text-[#6F5A4B] border-[#DFCBB5]'
                  }`}
                >
                  - Retirar / Merma
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Cantidad a {tipoOperacionAjuste === 'sumar' ? 'ingresar' : 'descontar'}</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={deltaAjuste}
                  onChange={(e) => setDeltaAjuste(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] text-sm font-bold focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Motivo del Ajuste *</label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg text-[#221A14] focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  {tipoOperacionAjuste === 'sumar' ? (
                    <>
                      <option value="Reabastecimiento de proveedor">Reabastecimiento de proveedor</option>
                      <option value="Conteo físico / Ajuste sobrante">Conteo físico / Ajuste sobrante</option>
                      <option value="Devolución de cliente">Devolución de cliente</option>
                    </>
                  ) : (
                    <>
                      <option value="Merma por producto dañado o vencido">Merma por producto dañado o vencido</option>
                      <option value="Muestra o uso interno de barbero">Muestra o uso interno de barbero</option>
                      <option value="Conteo físico / Ajuste faltante">Conteo físico / Ajuste faltante</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-2.5 rounded bg-[#FBEBE1] border border-[#DFCBB5] text-[11px] text-[#6F5A4B]">
                Nuevo saldo proyectado:{' '}
                <strong className="text-[#221A14]">
                  {tipoOperacionAjuste === 'sumar' 
                    ? modalAjusteStock.stock + deltaAjuste 
                    : Math.max(0, modalAjusteStock.stock - deltaAjuste)} unidades
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFCBB5]">
                <button
                  type="button"
                  onClick={() => setModalAjusteStock(null)}
                  className="px-4 py-2 bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] rounded-lg border border-[#DFCBB5] hover:bg-[#DFCBB5] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-serif font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
