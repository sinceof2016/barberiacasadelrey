import React, { useState, useEffect } from 'react';
import { ClienteReporteItem, ReporteClientesResumen, Cita, Servicio, Barbero } from '../types';
import { getReporteClientes, getReporteClientesCsvUrl } from '../services/api';
import { 
  Users, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search, 
  RefreshCw, 
  Mail, 
  Phone, 
  Calendar, 
  Coins, 
  Sparkles, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Tag, 
  FileText,
  UserCheck,
  User,
  Scissors
} from 'lucide-react';
import { 
  VintageCrownIcon, 
  StraightRazorIcon, 
  VintageBarberPole, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';

interface CustomerReportModuleProps {
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  servicios?: Servicio[];
  barberos?: Barbero[];
}

export const CustomerReportModule: React.FC<CustomerReportModuleProps> = ({
  isModal = false,
  isOpen = true,
  onClose,
  servicios = [],
  barberos = [],
}) => {
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ReporteClientesResumen | null>(null);
  const [clientes, setClientes] = useState<ClienteReporteItem[]>([]);
  const [generadoEn, setGeneradoEn] = useState<string>('');

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('todos');
  const [soloConEmail, setSoloConEmail] = useState<boolean>(false);
  const [criterioOrden, setCriterioOrden] = useState<'reservas' | 'gasto' | 'reciente' | 'nombre'>('reservas');
  
  // Detalle expandido
  const [clienteExpandidoId, setClienteExpandidoId] = useState<string | null>(null);

  // Notificación breve
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

  // Filtrado local interactivo
  const clientesFiltrados = clientes.filter(c => {
    if (soloConEmail && !c.email) return false;
    if (filtroClasificacion !== 'todos' && c.clasificacion !== filtroClasificacion) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const matchNombre = c.nombre.toLowerCase().includes(q);
      const matchTel = c.telefono.toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchFolio = c.folios.some(f => f.toLowerCase().includes(q));
      if (!matchNombre && !matchTel && !matchEmail && !matchFolio) return false;
    }
    return true;
  });

  // Ordenación interactiva
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (criterioOrden === 'reservas') {
      return b.totalReservas - a.totalReservas || b.gastoEstimado - a.gastoEstimado;
    }
    if (criterioOrden === 'gasto') {
      return b.gastoEstimado - a.gastoEstimado || b.totalReservas - a.totalReservas;
    }
    if (criterioOrden === 'reciente') {
      return b.ultimaReserva.localeCompare(a.ultimaReserva);
    }
    if (criterioOrden === 'nombre') {
      return a.nombre.localeCompare(b.nombre);
    }
    return 0;
  });

  // Exportar archivo CSV
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
        'Citas Confirmadas',
        'Citas Canceladas',
        'Inversión Total Estimada (COP)',
        'Servicio Preferido',
        'Barbero Habitual',
        'Primera Cita',
        'Última Cita',
        'Folios de Reserva'
      ];

      const escapeCsv = (str: any) => {
        if (str === undefined || str === null) return '""';
        const val = String(str).replace(/"/g, '""');
        return `"${val}"`;
      };

      const rows = clientesOrdenados.map(c => [
        escapeCsv(c.nombre),
        escapeCsv(c.telefono),
        escapeCsv(c.email || 'No registrado'),
        escapeCsv(c.clasificacion),
        escapeCsv(c.totalReservas),
        escapeCsv(c.reservasIndividuales),
        escapeCsv(c.reservasGrupales),
        escapeCsv(c.totalPersonas),
        escapeCsv(c.citasConfirmadas),
        escapeCsv(c.citasCanceladas),
        escapeCsv(c.gastoEstimado),
        escapeCsv(c.servicioFavorito),
        escapeCsv(c.barberoFavorito),
        escapeCsv(c.primeraReserva),
        escapeCsv(c.ultimaReserva),
        escapeCsv(c.folios.join('; '))
      ].join(';'));

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_clientes_casa_del_rey_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      mostrarNotificacion('Reporte CSV exportado exitosamente con compatibilidad para Excel.');
    } catch (e: any) {
      console.error(e);
      window.open(getReporteClientesCsvUrl({ busqueda, clasificacion: filtroClasificacion, conEmail: soloConEmail }), '_blank');
    }
  };

  // Exportar archivo JSON estructurado
  const handleDescargarJson = () => {
    const payload = {
      empresa: 'Barbería La Casa del Rey',
      titulo: 'Reporte de Base de Datos de Clientes & Reservas',
      generadoEn: new Date().toISOString(),
      resumen: {
        ...resumen,
        totalClientesFiltrados: clientesOrdenados.length
      },
      clientes: clientesOrdenados
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_base_datos_clientes_casa_del_rey_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarNotificacion('Base de datos JSON descargada con éxito.');
  };

  // Imprimir reporte con estilos limpios
  const handleImprimir = () => {
    window.print();
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#261B16] border border-[#C59B27]/50 flex items-center justify-center text-[#C59B27] shadow">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-royal text-base sm:text-lg font-bold text-[#FAF6EE] uppercase tracking-wide">
                    Base de Datos de Clientes & Reservas
                  </h2>
                  <span className="text-[10px] bg-[#2A1E18] text-[#E5B869] font-mono px-2 py-0.5 rounded border border-[#3D2E26]">
                    MODO ADMINISTRADOR
                  </span>
                </div>
                <p className="text-xs text-[#8A796D] font-mono mt-0.5">
                  Directorio unificado de caballeros, historial de reservas, preferencias y datos de contacto
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción de Reporte */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-exportar-clientes-excel"
              onClick={handleDescargarCsv}
              className="px-3 py-1.5 rounded-lg bg-[#142316] hover:bg-[#1D3521] border border-[#23532C] hover:border-[#86EFAC] text-[#86EFAC] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
              title="Descargar archivo .CSV con formato UTF-8 para Excel o Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </button>

            <button
              id="btn-exportar-clientes-json"
              onClick={handleDescargarJson}
              className="px-3 py-1.5 rounded-lg bg-[#1C1715] hover:bg-[#2A1F1B] border border-[#3D2E26] hover:border-[#C59B27] text-[#FAF6EE] text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar backup estructurado en formato JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden sm:inline">Descargar JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>

            <button
              id="btn-imprimir-clientes"
              onClick={handleImprimir}
              className="px-3 py-1.5 rounded-lg bg-[#241C18] hover:bg-[#33251E] border border-[#3D2E26] hover:border-[#C59B27] text-[#FAF6EE] text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimir reporte membretado oficial"
            >
              <Printer className="w-3.5 h-3.5 text-[#A8988B]" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-actualizar-reporte-clientes"
              onClick={cargarReporte}
              disabled={cargando}
              className="p-1.5 rounded-lg bg-[#1A1412] hover:bg-[#261B16] border border-[#3D2E26] text-[#C59B27] transition-all disabled:opacity-50 cursor-pointer"
              title="Actualizar base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#261B16] text-[#A8988B] hover:text-[#FAF6EE] border border-[#3D2E26] transition-colors ml-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notificación */}
      {notificacion && (
        <div className="p-3 bg-[#142316] border border-[#23532C] rounded-xl flex items-center justify-between text-xs font-mono text-[#86EFAC] shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
            <span>{notificacion}</span>
          </div>
          <button onClick={() => setNotificacion(null)} className="text-[#86EFAC]/70 hover:text-[#86EFAC]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPIs & Tarjetas Ejecutivas */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Clientes Únicos */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A796D]">
              <span>TOTAL CLIENTES</span>
              <Users className="w-3.5 h-3.5 text-[#C59B27]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-royal font-bold text-[#FAF6EE]">
                {resumen.totalClientes}
              </div>
              <div className="text-[10px] text-[#A8988B] font-mono mt-0.5">
                {resumen.clientesVIP} VIP • {resumen.clientesRecurrentes} Recurrentes
              </div>
            </div>
          </div>

          {/* 2. Total Reservas */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A796D]">
              <span>RESERVAS TOTALES</span>
              <Calendar className="w-3.5 h-3.5 text-[#E5B869]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-royal font-bold text-[#E5B869]">
                {resumen.totalReservas}
              </div>
              <div className="text-[10px] text-[#A8988B] font-mono mt-0.5">
                Generadas en la plataforma
              </div>
            </div>
          </div>

          {/* 3. Con Email Registrado */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A796D]">
              <span>CON CORREO</span>
              <Mail className="w-3.5 h-3.5 text-[#86EFAC]" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-royal font-bold text-[#86EFAC]">
                {resumen.clientesConEmail}
              </div>
              <div className="text-[10px] text-[#8A796D] font-mono mt-0.5">
                {resumen.totalClientes > 0 
                  ? `${Math.round((resumen.clientesConEmail / resumen.totalClientes) * 100)}% de cobertura`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* 4. Inversión Estimada */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A796D]">
              <span>VALOR ESTIMADO</span>
              <Coins className="w-3.5 h-3.5 text-[#C59B27]" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-royal font-bold text-[#C59B27]">
                ${resumen.totalGastoEstimado.toLocaleString('es-CO')}
              </div>
              <div className="text-[10px] text-[#A8988B] font-mono mt-0.5">
                COP acumulado en servicios
              </div>
            </div>
          </div>

          {/* 5. Ticket Promedio */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 shadow-md flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A796D]">
              <span>PROMEDIO CLIENTE</span>
              <Sparkles className="w-3.5 h-3.5 text-[#E5B869]" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-royal font-bold text-[#FAF6EE]">
                ${resumen.promedioGastoCliente.toLocaleString('es-CO')}
              </div>
              <div className="text-[10px] text-[#A8988B] font-mono mt-0.5">
                Ticket promedio por caballero
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-3.5 rounded-xl bg-[#1A1412] border border-[#3D2E26] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Búsqueda */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-[#8A796D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-buscar-reporte-clientes"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo, teléfono o folio..."
              className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-[#FAF6EE] placeholder-[#8A796D] focus:outline-none focus:border-[#C59B27]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A796D] hover:text-[#FAF6EE]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Clasificación */}
          <div className="flex items-center gap-1 bg-[#0E0A09] p-0.5 rounded-lg border border-[#3D2E26]">
            {(['todos', 'VIP', 'Frecuente', 'Nuevo'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroClasificacion(tipo)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                  filtroClasificacion === tipo
                    ? 'bg-[#2A1E18] text-[#FAF6EE] font-bold border border-[#C59B27]/60'
                    : 'text-[#8A796D] hover:text-[#FAF6EE]'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo}
              </button>
            ))}
          </div>

          {/* Toggle Solo con Email */}
          <button
            onClick={() => setSoloConEmail(!soloConEmail)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
              soloConEmail
                ? 'bg-[#142316] text-[#86EFAC] border-[#23532C]'
                : 'bg-[#0E0A09] text-[#8A796D] border-[#3D2E26] hover:text-[#FAF6EE]'
            }`}
            title="Mostrar únicamente clientes que dejaron su correo registrado"
          >
            <Mail className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>Solo con Email</span>
          </button>
        </div>

        {/* Ordenar por */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs font-mono text-[#8A796D]">
          <span>Ordenar:</span>
          <select
            id="select-orden-reporte-clientes"
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value as any)}
            className="bg-[#0E0A09] border border-[#3D2E26] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#FAF6EE] focus:outline-none focus:border-[#C59B27] cursor-pointer"
          >
            <option value="reservas">Más Reservas</option>
            <option value="gasto">Mayor Gasto ($)</option>
            <option value="reciente">Última Cita (Reciente)</option>
            <option value="nombre">Alfabético (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tabla del Directorio de Clientes */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="px-4 py-3 border-b border-[#3D2E26] flex items-center justify-between bg-[#14100E]">
          <div className="flex items-center gap-2">
            <StraightRazorIcon className="w-3.5 h-3.5 text-[#C59B27]" />
            <h3 className="text-xs font-royal font-bold uppercase tracking-widest text-[#FAF6EE]">
              REGISTRO MAESTRO DE CLIENTES ({clientesOrdenados.length} encontrados)
            </h3>
          </div>
          <div className="text-[10px] font-mono text-[#8A796D]">
            Exportable en formato oficial
          </div>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs font-mono text-[#A8988B] flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#C59B27] animate-spin" />
            <span>Generando reporte consolidado de base de datos...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-mono text-[#F87171]">
            <p className="font-bold mb-2">{error}</p>
            <button
              onClick={cargarReporte}
              className="px-3 py-1.5 bg-[#261B16] text-[#FAF6EE] rounded-lg border border-[#3D2E26] hover:border-[#C59B27]"
            >
              Reintentar
            </button>
          </div>
        ) : clientesOrdenados.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[#8A796D]">
            <User className="w-8 h-8 text-[#3D2E26] mx-auto mb-2" />
            <p className="text-[#FAF6EE] font-bold">No se encontraron clientes con los filtros actuales</p>
            <p className="text-[11px] mt-1">Prueba cambiando los términos de búsqueda o quitando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#3D2E26] bg-[#171210] text-[#8A796D] text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contacto (Teléfono & Correo)</th>
                  <th className="px-4 py-3 text-center">Nivel</th>
                  <th className="px-4 py-3 text-center">Reservas</th>
                  <th className="px-4 py-3 text-right">Inversión Total</th>
                  <th className="px-4 py-3">Preferencias</th>
                  <th className="px-4 py-3">Última Cita</th>
                  <th className="px-4 py-3 text-center">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2019]">
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
                      <tr className="hover:bg-[#241B17] transition-colors group">
                        {/* 1. Cliente */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-[#261B16] border border-[#C59B27]/40 flex items-center justify-center text-[10px] font-bold text-[#E5B869] shadow-inner">
                                {initials || 'C'}
                              </div>
                              {cliente.clasificacion === 'VIP' && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#C59B27] rounded-full flex items-center justify-center text-[#14100E]" title="Cliente VIP">
                                  <VintageCrownIcon className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-[#FAF6EE] text-xs flex items-center gap-1.5">
                                <span>{cliente.nombre}</span>
                              </div>
                              <div className="text-[10px] text-[#8A796D] flex items-center gap-1">
                                <span>{cliente.folios.length} {cliente.folios.length === 1 ? 'folio registrado' : 'folios registrados'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contacto */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {/* Teléfono */}
                            <div className="flex items-center gap-1.5 text-xs text-[#FAF6EE]">
                              <Phone className="w-3 h-3 text-[#C59B27] shrink-0" />
                              <span>{cliente.telefono}</span>
                              {whatsappLink && (
                                <a
                                  href={whatsappLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#86EFAC] hover:underline ml-1"
                                  title="Contactar por WhatsApp"
                                >
                                  [WhatsApp]
                                </a>
                              )}
                            </div>
                            {/* Correo Electrónico */}
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-[#8A796D] shrink-0" />
                              {cliente.email ? (
                                <span className="text-[#86EFAC] font-medium" title={cliente.email}>
                                  {cliente.email}
                                </span>
                              ) : (
                                <span className="text-[#6A574A] italic">No registrado</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Nivel / Clasificación */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {cliente.clasificacion === 'VIP' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#3E2F13] text-[#FBBF24] border border-[#B45309]">
                              <VintageCrownIcon className="w-2.5 h-2.5" />
                              VIP
                            </span>
                          )}
                          {cliente.clasificacion === 'Frecuente' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#14233C] text-[#60A5FA] border border-[#1E40AF]">
                              <UserCheck className="w-2.5 h-2.5" />
                              Recurrente
                            </span>
                          )}
                          {cliente.clasificacion === 'Nuevo' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#142316] text-[#86EFAC] border border-[#23532C]">
                              Nuevo
                            </span>
                          )}
                        </td>

                        {/* 4. Reservas */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="font-bold text-[#FAF6EE] text-sm">
                            {cliente.totalReservas}
                          </div>
                          <div className="text-[10px] text-[#8A796D]">
                            {cliente.reservasIndividuales > 0 && `${cliente.reservasIndividuales} Ind.`}
                            {cliente.reservasIndividuales > 0 && cliente.reservasGrupales > 0 && ' / '}
                            {cliente.reservasGrupales > 0 && `${cliente.reservasGrupales} Grup.`}
                          </div>
                        </td>

                        {/* 5. Inversión Estimada */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-bold text-[#C59B27] text-sm">
                            ${cliente.gastoEstimado.toLocaleString('es-CO')}
                          </div>
                          <div className="text-[10px] text-[#8A796D]">
                            COP acumulado
                          </div>
                        </td>

                        {/* 6. Preferencias */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-[#FAF6EE] font-medium truncate max-w-[170px]" title={cliente.servicioFavorito}>
                            ✂️ {cliente.servicioFavorito}
                          </div>
                          <div className="text-[10px] text-[#A8988B] truncate max-w-[170px]" title={cliente.barberoFavorito}>
                            👑 {cliente.barberoFavorito}
                          </div>
                        </td>

                        {/* 7. Última Cita */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <div className="text-[#FAF6EE] font-medium">{cliente.ultimaReserva}</div>
                          <div className="text-[10px] text-[#8A796D]">
                            Primera: {cliente.primeraReserva}
                          </div>
                        </td>

                        {/* 8. Acciones / Desplegable */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            id={`btn-expandir-cliente-${cliente.id}`}
                            onClick={() => setClienteExpandidoId(estaExpandido ? null : cliente.id)}
                            className="px-2 py-1 rounded bg-[#261B16] hover:bg-[#3D2E26] text-[#E5B869] border border-[#3D2E26] text-[10px] font-mono transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                            title="Ver expediente y citas registradas"
                          >
                            <span>{estaExpandido ? 'Ocultar' : 'Ver Citas'}</span>
                            {estaExpandido ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expediente Detallado de Citas del Cliente */}
                      {estaExpandido && (
                        <tr className="bg-[#120D0B] border-y border-[#3D2E26]">
                          <td colSpan={8} className="p-4">
                            <div className="bg-[#17110E] border border-[#3D2E26] rounded-lg p-3 sm:p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2E2019] pb-2 gap-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[#C59B27]" />
                                  <span className="font-royal text-xs font-bold text-[#FAF6EE] uppercase tracking-wide">
                                    Historial de Citas del Caballero: {cliente.nombre}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-[#8A796D]">
                                  {(cliente.historialCitas || []).length} turnos registrados
                                </span>
                              </div>

                              {(!cliente.historialCitas || cliente.historialCitas.length === 0) ? (
                                <div className="py-4 text-center text-xs font-mono text-[#8A796D] bg-[#0E0A09] rounded-lg border border-[#261B16]">
                                  <Calendar className="w-5 h-5 mx-auto mb-1 text-[#3D2E26]" />
                                  <p className="text-[#FAF6EE]">No hay turnos detallados en el expediente actual.</p>
                                  <p className="text-[10px] text-[#8A796D] mt-0.5">Los folios asociados son: {cliente.folios?.join(', ') || 'Ninguno'}</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {(cliente.historialCitas || []).map((cita, idx) => (
                                    <div
                                      key={cita.idReserva || `cita-${idx}`}
                                      className="p-3 rounded-lg bg-[#0E0A09] border border-[#2E2019] hover:border-[#C59B27]/40 flex flex-col justify-between text-xs font-mono transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1.5">
                                        <span className="font-bold text-[#C59B27]">{cita.idReserva || 'CITA'}</span>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          cita.estado === 'Confirmada'
                                            ? 'bg-[#142316] text-[#86EFAC] border border-[#23532C]'
                                            : 'bg-[#2A1515] text-[#F87171] border border-[#522525]'
                                        }`}>
                                          {cita.estado || 'Confirmada'}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-[#FAF6EE] font-medium flex items-center gap-1.5 my-1">
                                        <Calendar className="w-3 h-3 text-[#C59B27] shrink-0" />
                                        <span>{cita.fecha} @ {cita.hora}</span>
                                      </div>

                                      {cita.sucursalNombre && (
                                        <div className="text-[10px] text-[#A8988B] flex items-center gap-1 mb-1">
                                          <span>🏛️ {cita.sucursalNombre}</span>
                                        </div>
                                      )}

                                      <div className="text-[10px] text-[#A8988B] flex items-center justify-between pt-1.5 border-t border-[#1C1410] mt-1">
                                        <span className="truncate">
                                          {cita.tipo === 'Individual' ? 'Cita Individual' : `Grupal (${cita.totalPersonas || 2} pers.)`}
                                        </span>
                                        {cita.clienteEmail && (
                                          <span className="text-[#86EFAC]" title={cita.clienteEmail}>✉️ Correo</span>
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
        <div className="px-4 py-2.5 border-t border-[#3D2E26] bg-[#14100E] flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-[#8A796D] gap-2">
          <div>
            Base de datos compilada de forma dinámica a partir de las reservas de Barbería La Casa del Rey.
          </div>
          <div>
            Última actualización: <span className="text-[#FAF6EE]">{generadoEn || 'En línea'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
        <div className="bg-[#14100E] border border-[#3D2E26] rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
