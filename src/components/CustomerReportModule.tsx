import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Download, 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  X, 
  Calendar, 
  Mail, 
  Phone, 
  ChevronRight, 
  Coins, 
  Sparkles, 
  User, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { 
  BarberPoleRibbon, 
  VintageCrownIcon, 
  StraightRazorIcon 
} from './VintageBarberIcons';
import { getReporteClientes, getReporteClientesCsvUrl } from '../services/api';
import { ClienteReporteItem, ReporteClientesResumen } from '../types';
import { validarTextoSeguro } from '../utils/security';

interface CustomerReportModuleProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const CustomerReportModule: React.FC<CustomerReportModuleProps> = ({
  isOpen = true,
  onClose,
  isModal = true,
}) => {
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ReporteClientesResumen | null>(null);
  const [clientes, setClientes] = useState<ClienteReporteItem[]>([]);
  const [generadoEn, setGeneradoEn] = useState<string>('');
  
  // Filtros interactivos
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroClasificacion, setFiltroClasificacion] = useState<'todos' | 'VIP' | 'Frecuente' | 'Nuevo'>('todos');
  const [soloConEmail, setSoloConEmail] = useState<boolean>(false);
  const [criterioOrden, setCriterioOrden] = useState<'reservas' | 'gasto' | 'reciente' | 'nombre'>('reservas');
  const [clienteExpandidoId, setClienteExpandidoId] = useState<string | null>(null);

  // Notificación flotante de exportación
  const [notificacion, setNotificacion] = useState<string | null>(null);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const cargarReporte = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getReporteClientes();
      setResumen(data.resumen);
      setClientes(data.clientes || []);
      setGeneradoEn(data.generadoEn || new Date().toLocaleString('es-CO'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al compilar el reporte de la base de datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarReporte();
    }
  }, [isOpen]);

  // Cerrar ventana con la tecla Escape
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtrado local interactivo
  const clientesFiltrados = clientes.filter(c => {
    if (soloConEmail && !c.email) return false;
    if (filtroClasificacion !== 'todos' && c.clasificacion !== filtroClasificacion) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const matchNombre = (c.nombre || '').toLowerCase().includes(q);
      const matchTel = (c.telefono || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchFolio = (c.folios || []).some(f => (f || '').toLowerCase().includes(q));
      if (!matchNombre && !matchTel && !matchEmail && !matchFolio) return false;
    }
    return true;
  });

  // Ordenación interactiva
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (criterioOrden === 'reservas') {
      return (b.totalReservas || 0) - (a.totalReservas || 0) || (b.gastoEstimado || 0) - (a.gastoEstimado || 0);
    }
    if (criterioOrden === 'gasto') {
      return (b.gastoEstimado || 0) - (a.gastoEstimado || 0) || (b.totalReservas || 0) - (a.totalReservas || 0);
    }
    if (criterioOrden === 'reciente') {
      return (b.ultimaReserva || '').localeCompare(a.ultimaReserva || '');
    }
    if (criterioOrden === 'nombre') {
      return (a.nombre || '').localeCompare(b.nombre || '');
    }
    return 0;
  });

  // Exportar archivo CSV con soporte completo para Excel
  const handleDescargarCsv = () => {
    try {
      const headers = [
        'Nombre del Cliente',
        'Teléfono',
        'Correo Electrónico',
        'Clasificación',
        'Total Reservas',
        'Reservas Individuales',
        'Reservas Grupales',
        'Total Personas',
        'Inversión Estimada COP',
        'Última Cita',
        'Servicios Frecuentes',
        'Barberos Frecuentes',
        'Sedes Frecuentes',
        'Folios'
      ];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = clientesOrdenados.map(c => {
        const serviciosStr = (c as any).serviciosFrecuentes?.join('; ') ||
          c.serviciosSolicitados?.map(s => s.nombre).join('; ') ||
          c.servicioFavorito ||
          'Corte Tradicional';

        const barberosStr = (c as any).barberosFrecuentes?.join('; ') ||
          c.barberoFavorito ||
          'Cualquier Barbero';

        const sucursalesStr = (c as any).sucursalesFrecuentes?.join('; ') || 'Sede Principal';
        const totalPers = c.totalPersonas || (c as any).totalPersonasAtendidas || c.totalReservas || 1;

        return [
          escapeCsv(c.nombre),
          escapeCsv(c.telefono),
          escapeCsv(c.email || 'No registrado'),
          escapeCsv(c.clasificacion),
          c.totalReservas,
          c.reservasIndividuales,
          c.reservasGrupales,
          totalPers,
          c.gastoEstimado,
          escapeCsv(c.ultimaReserva || 'Sin fecha'),
          escapeCsv(serviciosStr),
          escapeCsv(barberosStr),
          escapeCsv(sucursalesStr),
          escapeCsv((c.folios || []).join(', '))
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_clientes_casa_del_rey_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      mostrarNotificacion('Reporte exportado exitosamente para Excel.');
    } catch (e: any) {
      console.error(e);
      window.open(getReporteClientesCsvUrl({ busqueda, clasificacion: filtroClasificacion, conEmail: soloConEmail }), '_blank');
    }
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                    Base de Datos de Clientes
                  </h2>
                  <span className="text-[10px] bg-[#F5E8DA] text-[#7C571C] font-mono px-2 py-0.5 rounded-full border border-[#DFCBB5] font-bold">
                    DIRECTORIO MAESTRO
                  </span>
                </div>
                <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
                  Historial de reservas, datos de contacto y fidelidad de los clientes de Casa del Rey
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción de Reporte */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-exportar-clientes-excel"
              onClick={handleDescargarCsv}
              className="px-3.5 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Descargar archivo en formato Excel con codificación UTF-8"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              id="btn-actualizar-reporte-clientes"
              onClick={cargarReporte}
              disabled={cargando}
              className="p-2 rounded-lg bg-[#FFF8F5] hover:bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Actualizar base de datos"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>

            {onClose && (
              <button
                id="btn-cerrar-base-clientes"
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-[#FFDAD6] hover:bg-[#FFB4AB] text-[#BA1A1A] border border-[#BA1A1A]/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ml-1"
                title="Cerrar ventana de base de clientes"
              >
                <X className="w-4 h-4" />
                <span>Cerrar Ventana</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notificación */}
      {notificacion && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl flex items-center justify-between text-xs font-mono text-[#166534] shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            <span>{notificacion}</span>
          </div>
          <button onClick={() => setNotificacion(null)} className="text-[#166534]/70 hover:text-[#166534]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPIs & Tarjetas Ejecutivas */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Clientes Únicos */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#6F5A4B]">
              <span className="font-bold">TOTAL CLIENTES</span>
              <Users className="w-3.5 h-3.5 text-[#7C571C]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#221A14]">
                {resumen.totalClientes}
              </div>
              <div className="text-[10px] text-[#6F5A4B] font-mono mt-0.5">
                {resumen.clientesVIP} VIP • {resumen.clientesRecurrentes} Recurrentes
              </div>
            </div>
          </div>

          {/* 2. Total Reservas */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#6F5A4B]">
              <span className="font-bold">RESERVAS TOTALES</span>
              <Calendar className="w-3.5 h-3.5 text-[#7C571C]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#7C571C]">
                {resumen.totalReservas}
              </div>
              <div className="text-[10px] text-[#6F5A4B] font-mono mt-0.5">
                Turnos generados
              </div>
            </div>
          </div>

          {/* 3. Con Email Registrado */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#6F5A4B]">
              <span className="font-bold">CON CORREO</span>
              <Mail className="w-3.5 h-3.5 text-[#15803D]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#15803D]">
                {resumen.clientesConEmail}
              </div>
              <div className="text-[10px] text-[#6F5A4B] font-mono mt-0.5">
                {resumen.totalClientes > 0 
                  ? `${Math.round((resumen.clientesConEmail / resumen.totalClientes) * 100)}% de cobertura`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* 4. Inversión Estimada */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#6F5A4B]">
              <span className="font-bold">VALOR ESTIMADO</span>
              <Coins className="w-3.5 h-3.5 text-[#7C571C]" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-serif font-bold text-[#7C571C]">
                ${resumen.totalGastoEstimado.toLocaleString('es-CO')}
              </div>
              <div className="text-[10px] text-[#6F5A4B] font-mono mt-0.5">
                COP acumulado
              </div>
            </div>
          </div>

          {/* 5. Ticket Promedio */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#6F5A4B]">
              <span className="font-bold">PROMEDIO CLIENTE</span>
              <Sparkles className="w-3.5 h-3.5 text-[#C49756]" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-serif font-bold text-[#221A14]">
                ${resumen.promedioGastoCliente.toLocaleString('es-CO')}
              </div>
              <div className="text-[10px] text-[#6F5A4B] font-mono mt-0.5">
                Ticket promedio
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-3.5 rounded-xl bg-[#FFF8F5] border border-[#DFCBB5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Búsqueda */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-[#6F5A4B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-buscar-reporte-clientes"
              type="text"
              value={busqueda}
              onChange={(e) => {
                const val = e.target.value;
                const check = validarTextoSeguro(val, { campo: 'Búsqueda de Clientes', longitudMaxima: 80 });
                if (check.esValido) {
                  setBusqueda(val);
                }
              }}
              placeholder="Buscar por nombre, correo o teléfono..."
              className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-[#221A14] placeholder-[#A8988B] focus:outline-none focus:border-[#7C571C] focus:ring-1 focus:ring-[#7C571C]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F5A4B] hover:text-[#221A14]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Clasificación */}
          <div className="flex items-center gap-1 bg-[#FBEBE1] p-1 rounded-lg border border-[#DFCBB5]">
            {(['todos', 'VIP', 'Frecuente', 'Nuevo'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroClasificacion(tipo)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                  filtroClasificacion === tipo
                    ? 'bg-[#7C571C] text-[#FFFFFF] font-bold shadow-sm'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo}
              </button>
            ))}
          </div>

          {/* Toggle Solo con Email */}
          <button
            onClick={() => setSoloConEmail(!soloConEmail)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
              soloConEmail
                ? 'bg-[#EBF7EE] text-[#15803D] border-[#86EFAC] font-bold'
                : 'bg-[#FFF8F5] text-[#6F5A4B] border-[#DFCBB5] hover:text-[#221A14]'
            }`}
            title="Mostrar únicamente clientes con correo registrado"
          >
            <Mail className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Con Email</span>
          </button>
        </div>

        {/* Ordenar por */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs font-mono text-[#6F5A4B]">
          <span>Ordenar:</span>
          <select
            id="select-orden-reporte-clientes"
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value as any)}
            className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#221A14] focus:outline-none focus:border-[#7C571C] cursor-pointer"
          >
            <option value="reservas">Más Reservas</option>
            <option value="gasto">Mayor Inversión ($)</option>
            <option value="reciente">Última Cita (Reciente)</option>
            <option value="nombre">Alfabético (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tabla del Directorio de Clientes */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl overflow-hidden shadow-md relative">
        <div className="px-4 py-3 border-b border-[#DFCBB5] flex items-center justify-between bg-[#FBEBE1]">
          <div className="flex items-center gap-2">
            <StraightRazorIcon className="w-3.5 h-3.5 text-[#7C571C]" />
            <h3 className="text-xs font-serif font-bold uppercase tracking-widest text-[#221A14]">
              REGISTRO DE CLIENTES ({clientesOrdenados.length} encontrados)
            </h3>
          </div>
          <div className="text-[10px] font-mono text-[#6F5A4B]">
            Base de datos verificada
          </div>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs font-mono text-[#6F5A4B] flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#7C571C] animate-spin" />
            <span>Cargando base de datos de clientes...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-mono text-[#B91C1C]">
            <p className="font-bold mb-2">{error}</p>
            <button
              onClick={cargarReporte}
              className="px-3.5 py-1.5 bg-[#7C571C] text-[#FAF6EE] rounded-lg hover:bg-[#684815] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : clientesOrdenados.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#6F5A4B]">
            <User className="w-8 h-8 text-[#DFCBB5] mx-auto mb-2" />
            <p className="text-[#221A14] font-bold">No se encontraron clientes con los filtros actuales</p>
            <p className="text-[11px] mt-1">Prueba cambiando los términos de búsqueda o quitando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#DFCBB5] bg-[#F5E8DA] text-[#4F4539] text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3 text-center">Nivel</th>
                  <th className="px-4 py-3 text-center">Reservas</th>
                  <th className="px-4 py-3 text-right">Inversión Total</th>
                  <th className="px-4 py-3">Preferencias</th>
                  <th className="px-4 py-3">Última Cita</th>
                  <th className="px-4 py-3 text-center">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFCBB5]">
                {clientesOrdenados.map((cliente) => {
                  const estaExpandido = clienteExpandidoId === cliente.id;
                  const initials = cliente.nombre
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const telLimpio = cliente.telefono.replace(/\D/g, '');
                  const whatsappLink = telLimpio.length >= 10
                    ? `https://wa.me/${telLimpio.startsWith('57') ? telLimpio : `57${telLimpio}`}`
                    : null;

                  return (
                    <React.Fragment key={cliente.id}>
                      <tr className="hover:bg-[#FDF3EB] transition-colors group">
                        {/* 1. Cliente */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[10px] font-bold text-[#7C571C] shadow-inner">
                                {initials || 'C'}
                              </div>
                              {cliente.clasificacion === 'VIP' && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#7C571C] rounded-full flex items-center justify-center text-[#FFFFFF]" title="Cliente VIP">
                                  <VintageCrownIcon className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#221A14] text-xs flex items-center gap-1.5">
                                <span>{cliente.nombre}</span>
                              </div>
                              <div className="text-[10px] text-[#6F5A4B] flex items-center gap-1">
                                <span>{cliente.folios.length} {cliente.folios.length === 1 ? 'folio' : 'folios'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contacto */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-[#221A14]">
                              <Phone className="w-3 h-3 text-[#7C571C] shrink-0" />
                              <span>{cliente.telefono}</span>
                              {whatsappLink && (
                                <a
                                  href={whatsappLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] bg-[#EBF7EE] text-[#15803D] hover:underline px-1 py-0.5 rounded font-bold border border-[#86EFAC]/40"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#6F5A4B]">
                              <Mail className="w-3 h-3 text-[#7C571C] shrink-0" />
                              <span>{cliente.email || 'No registrado'}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Nivel */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            cliente.clasificacion === 'VIP'
                              ? 'bg-[#F5E8DA] text-[#7C571C] border-[#DFCBB5]'
                              : cliente.clasificacion === 'Frecuente'
                              ? 'bg-[#EBF7EE] text-[#15803D] border-[#86EFAC]'
                              : 'bg-[#FBEBE1] text-[#6F5A4B] border-[#DFCBB5]'
                          }`}>
                            {cliente.clasificacion}
                          </span>
                        </td>

                        {/* 4. Reservas */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="font-bold text-[#221A14] text-xs">
                            {cliente.totalReservas}
                          </span>
                          <div className="text-[9px] text-[#6F5A4B]">
                            {cliente.reservasIndividuales} ind / {cliente.reservasGrupales} grup
                          </div>
                        </td>

                        {/* 5. Inversión Total */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-bold text-[#7C571C] text-xs">
                            ${cliente.gastoEstimado.toLocaleString('es-CO')}
                          </span>
                          <div className="text-[9px] text-[#6F5A4B]">COP est.</div>
                        </td>

                        {/* 6. Preferencias */}
                        <td className="px-4 py-3 max-w-[180px]">
                          <div
                            className="truncate text-xs text-[#221A14]"
                            title={(cliente as any).serviciosFrecuentes?.join(', ') || cliente.serviciosSolicitados?.map(s => s.nombre).join(', ') || cliente.servicioFavorito || 'Corte Tradicional'}
                          >
                            {(cliente as any).serviciosFrecuentes?.slice(0, 2).join(', ') ||
                             cliente.servicioFavorito ||
                             cliente.serviciosSolicitados?.[0]?.nombre ||
                             'Tradicional'}
                          </div>
                          <div
                            className="truncate text-[10px] text-[#6F5A4B]"
                            title={(cliente as any).barberosFrecuentes?.join(', ') || cliente.barberoFavorito || 'Cualquier Maestro'}
                          >
                            Barbero: {(cliente as any).barberosFrecuentes?.slice(0, 1).join(', ') || cliente.barberoFavorito || 'Cualquiera'}
                          </div>
                        </td>

                        {/* 7. Última Cita */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#4F4539]">
                          {cliente.ultimaReserva || 'Sin fecha'}
                        </td>

                        {/* 8. Botón Historial */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setClienteExpandidoId(estaExpandido ? null : cliente.id)}
                            className="p-1 rounded-lg bg-[#FBEBE1] text-[#7C571C] hover:bg-[#F5E8DA] border border-[#DFCBB5] transition-colors cursor-pointer"
                            title={estaExpandido ? 'Ocultar historial' : 'Ver detalle de citas'}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${estaExpandido ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                      </tr>

                      {/* Expediente Detallado de Citas del Cliente */}
                      {estaExpandido && (
                        <tr className="bg-[#FBEBE1] border-y border-[#DFCBB5]">
                          <td colSpan={8} className="p-4">
                            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-lg p-3 sm:p-4 space-y-3 shadow-inner">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DFCBB5] pb-2 gap-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#7C571C]" />
                                  <span className="font-serif text-xs font-bold text-[#221A14] uppercase tracking-wide">
                                    Historial de Citas del Caballero: {cliente.nombre}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-[#6F5A4B]">
                                  {(cliente.historialCitas || []).length} turnos registrados
                                </span>
                              </div>

                              {(!cliente.historialCitas || cliente.historialCitas.length === 0) ? (
                                <div className="py-4 text-center text-xs font-mono text-[#6F5A4B] bg-[#FBEBE1] rounded-lg border border-[#DFCBB5]">
                                  <Calendar className="w-5 h-5 mx-auto mb-1 text-[#C49756]" />
                                  <p className="text-[#221A14] font-semibold">No hay turnos detallados en el expediente actual.</p>
                                  <p className="text-[10px] text-[#6F5A4B] mt-0.5">Los folios asociados son: {cliente.folios?.join(', ') || 'Ninguno'}</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {(cliente.historialCitas || []).map((cita, idx) => (
                                    <div
                                      key={cita.idReserva || `cita-${idx}`}
                                      className="p-3 rounded-lg bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] flex flex-col justify-between text-xs font-mono transition-colors shadow-sm"
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1.5">
                                        <span className="font-bold text-[#7C571C]">{cita.idReserva || 'CITA'}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                          cita.estado === 'Confirmada'
                                            ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                                            : 'bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]'
                                        }`}>
                                          {cita.estado || 'Confirmada'}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-[#221A14] font-medium flex items-center gap-1.5 my-1">
                                        <Calendar className="w-3 h-3 text-[#7C571C] shrink-0" />
                                        <span>{cita.fecha} @ {cita.hora}</span>
                                      </div>

                                      {cita.sucursalNombre && (
                                        <div className="text-[10px] text-[#6F5A4B] flex items-center gap-1 mb-1">
                                          <span>🏛️ {cita.sucursalNombre}</span>
                                        </div>
                                      )}

                                      <div className="text-[10px] text-[#6F5A4B] flex items-center justify-between pt-1.5 border-t border-[#DFCBB5] mt-1">
                                        <span className="truncate">
                                          {cita.tipo === 'Individual' ? 'Cita Individual' : `Grupal (${cita.totalPersonas || 2} pers.)`}
                                        </span>
                                        {cita.clienteEmail && (
                                          <span className="text-[#15803D]" title={cita.clienteEmail}>✉️ Correo</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Informativo */}
        <div className="px-4 py-2.5 border-t border-[#DFCBB5] bg-[#FBEBE1] flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-[#6F5A4B] gap-2">
          <div>
            Base de datos compilada de forma dinámica a partir de las reservas de Barbería La Casa del Rey.
          </div>
          <div className="flex items-center gap-3">
            <div>
              Última actualización: <span className="text-[#221A14] font-bold">{generadoEn || 'En línea'}</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded bg-[#FFF8F5] hover:bg-[#FFDAD6] text-[#BA1A1A] border border-[#DFCBB5] hover:border-[#BA1A1A]/30 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                title="Cerrar ventana"
              >
                <X className="w-3 h-3" />
                <span>Cerrar Ventana</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-[#221A14]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      >
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              id="btn-cerrar-modal-flotante-clientes"
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#FBEBE1] hover:bg-[#FFDAD6] text-[#6F5A4B] hover:text-[#BA1A1A] border border-[#DFCBB5] hover:border-[#BA1A1A]/40 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Cerrar ventana (Esc)"
              aria-label="Cerrar ventana de base de clientes"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return content;
};
