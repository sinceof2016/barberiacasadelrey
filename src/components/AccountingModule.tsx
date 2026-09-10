import React, { useState, useEffect } from 'react';
import { ResumenContable, GastoDiario, Barbero, Usuario } from '../types';
import { 
  getContabilidad, 
  getEgresos, 
  crearEgreso, 
  eliminarEgreso, 
  actualizarBaseCaja 
} from '../services/api';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Coins, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle, 
  Receipt, 
  Scale, 
  FileSpreadsheet,
  Edit2,
  KeyRound,
  Settings,
  CheckCircle2,
  X,
  Building2,
  Store,
  Lock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  VintageCrownIcon, 
  StraightRazorIcon, 
  VintageScissorsIcon, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';
import { CashDrawerModal } from './CashDrawerModal';
import { isGavetaVisible, ejecutarAperturaGaveta } from '../services/cashDrawer';
import { SUCURSALES_CASA_DEL_REY, getSucursalById } from '../data/sucursales';

interface AccountingModuleProps {
  barberos: Barbero[];
  onDataUpdated?: () => void;
  usuario?: Usuario | null;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  barberos,
  onDataUpdated,
  usuario,
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyStr);
  const [contabilidad, setContabilidad] = useState<(ResumenContable & { liquidacionesBarberos: any[] }) | null>(null);
  const [gastos, setGastos] = useState<GastoDiario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const esAdmin = usuario?.rol === 'Administrador' || usuario?.rol === 'SuperAdmin';
  const esCajero = usuario?.rol === 'Cajero';

  // Determine initial branch based on user role
  const getInitialSucursal = () => {
    if (esCajero && usuario?.sucursalAsignada && usuario.sucursalAsignada !== 'todas') {
      return usuario.sucursalAsignada;
    }
    return 'todas';
  };

  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>(getInitialSucursal);
  const [sucursalGasto, setSucursalGasto] = useState<string>(() => {
    if (esCajero && usuario?.sucursalAsignada && usuario.sucursalAsignada !== 'todas') {
      return usuario.sucursalAsignada;
    }
    return 'suc-chico';
  });

  // Sync state if user logs in / changes
  useEffect(() => {
    if (esCajero && usuario?.sucursalAsignada && usuario.sucursalAsignada !== 'todas') {
      setSucursalSeleccionada(usuario.sucursalAsignada);
      setSucursalGasto(usuario.sucursalAsignada);
    }
  }, [usuario, esCajero]);

  // New Expense form
  const [conceptoGasto, setConceptoGasto] = useState<string>('');
  const [categoriaGasto, setCategoriaGasto] = useState<GastoDiario['categoria']>('Insumos / Cuchillas');
  const [montoGasto, setMontoGasto] = useState<number>(15000);
  const [metodoGasto, setMetodoGasto] = useState<'Efectivo Caja' | 'Transferencia'>('Efectivo Caja');
  const [comprobanteGasto, setComprobanteGasto] = useState<string>('');
  const [guardandoGasto, setGuardandoGasto] = useState<boolean>(false);

  // Cash Register count
  const [conteoEfectivoFisico, setConteoEfectivoFisico] = useState<string>('');
  const [editandoBase, setEditandoBase] = useState<boolean>(false);
  const [nuevaBase, setNuevaBase] = useState<number>(100000);
  const [copiadoReporte, setCopiadoReporte] = useState<boolean>(false);

  // Cash Drawer (Gaveta Registradora) state
  const [drawerModalOpen, setDrawerModalOpen] = useState<boolean>(false);
  const [abriendoGaveta, setAbriendoGaveta] = useState<boolean>(false);
  const [gavetaNotif, setGavetaNotif] = useState<string | null>(null);

  const esAdminOCajero = !usuario || usuario.rol === 'Administrador' || usuario.rol === 'SuperAdmin' || usuario.rol === 'Cajero';
  const visibleGaveta = isGavetaVisible();

  const handleAbrirGavetaManual = async () => {
    setAbriendoGaveta(true);
    setGavetaNotif(null);
    try {
      const sucursalObj = getSucursalById(sucursalSeleccionada);
      const res = await ejecutarAperturaGaveta({
        motivo: `Apertura manual por ${usuario?.nombre || 'Cajero'} en ${sucursalObj.nombre} (Arqueo)`,
        usuario: usuario?.nombre,
      });
      setGavetaNotif(res.mensaje);
      setTimeout(() => setGavetaNotif(null), 5000);
    } catch (err: any) {
      alert('Error al abrir gaveta: ' + err.message);
    } finally {
      setAbriendoGaveta(false);
    }
  };

  const cargarDatosContables = async (fecha: string, sucursalId: string) => {
    setCargando(true);
    setError(null);
    try {
      const [dataConta, dataGastos] = await Promise.all([
        getContabilidad(fecha, sucursalId),
        getEgresos(fecha, sucursalId),
      ]);
      setContabilidad(dataConta);
      setGastos(dataGastos);
      if (dataConta?.efectivoCaja?.baseInicial) {
        setNuevaBase(dataConta.efectivoCaja.baseInicial);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos contables');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
  }, [fechaSeleccionada, sucursalSeleccionada]);

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptoGasto.trim() || Number(montoGasto) <= 0) return;

    setGuardandoGasto(true);
    try {
      const sucursalFinal = esCajero 
        ? (usuario?.sucursalAsignada || 'suc-chico')
        : (sucursalGasto || (sucursalSeleccionada !== 'todas' ? sucursalSeleccionada : 'suc-chico'));
      const sucursalObj = getSucursalById(sucursalFinal);

      const res = await crearEgreso({
        concepto: conceptoGasto.trim(),
        categoria: categoriaGasto,
        monto: Number(montoGasto),
        metodoPago: metodoGasto,
        fecha: fechaSeleccionada,
        sucursalId: sucursalFinal,
        sucursalNombre: sucursalObj?.nombre,
        comprobante: comprobanteGasto.trim() || undefined,
      });

      setGastos(prev => [res.gasto, ...prev]);
      setConceptoGasto('');
      setComprobanteGasto('');
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al registrar egreso: ' + err.message);
    } finally {
      setGuardandoGasto(false);
    }
  };

  const handleEliminarGasto = async (id: string, concepto: string) => {
    if (!window.confirm(`¿Confirmas eliminar el egreso "${concepto}"?`)) return;

    try {
      await eliminarEgreso(id);
      setGastos(prev => prev.filter(g => g.id !== id));
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al eliminar egreso: ' + err.message);
    }
  };

  const handleGuardarBaseCaja = async () => {
    try {
      const sedeParaBase = sucursalSeleccionada !== 'todas' 
        ? sucursalSeleccionada 
        : (usuario?.sucursalAsignada || 'suc-chico');
      await actualizarBaseCaja(Number(nuevaBase), sedeParaBase);
      setEditandoBase(false);
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar base: ' + err.message);
    }
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Arqueo computation
  const saldoEsperado = contabilidad?.efectivoCaja?.saldoEsperadoEnGaveta || 0;
  const fisicoNumerico = conteoEfectivoFisico !== '' ? Number(conteoEfectivoFisico) : null;
  const diferenciaArqueo = fisicoNumerico !== null ? fisicoNumerico - saldoEsperado : null;

  const copiarReporteWhatsApp = () => {
    if (!contabilidad) return;

    const nombreSedeHeader = sucursalSeleccionada === 'todas'
      ? 'CONSOLIDADO GENERAL (3 SUCURSALES)'
      : getSucursalById(sucursalSeleccionada).nombre.toUpperCase();

    const divisionTexto = contabilidad.divisionPorSucursal && contabilidad.divisionPorSucursal.length > 0
      ? `\n🏛️ *DIVISIÓN POR SUCURSAL:*\n` + contabilidad.divisionPorSucursal.map(d => 
          `• *${d.sucursalNombre}*: ${d.totalServicios} serv | Recaudo: ${formatCOP(d.ingresosBrutos + d.totalPropinas)} | Barbero: ${formatCOP(d.totalComisionesBarberos + d.totalPropinas)} | Gastos: ${formatCOP(d.totalGastos)} | *Utilidad: ${formatCOP(d.balanceNetoFinal)}* | Gaveta: ${formatCOP(d.saldoEsperadoEnGaveta)}`
        ).join('\n') + '\n'
      : '';

    const texto = `👑 *BARBERÍA CASA DEL REY - CIERRE CONTABLE* 👑
📍 *Sede:* ${nombreSedeHeader}
📅 *Fecha:* ${fechaSeleccionada}
✂️ *Cortes Totales:* ${contabilidad.totalServicios}
${divisionTexto}
💰 *INGRESOS RECAUDADOS:*
• Bruto Servicios: ${formatCOP(contabilidad.ingresosBrutos)}
• Propinas: ${formatCOP(contabilidad.totalPropinas)}
• *TOTAL RECAUDO:* ${formatCOP(contabilidad.ingresosBrutos + contabilidad.totalPropinas)}

💳 *POR MEDIO DE PAGO:*
• 💵 Efectivo: ${formatCOP(contabilidad.desgloseMediosPago.efectivo)}
• 📱 Nequi/Daviplata: ${formatCOP(contabilidad.desgloseMediosPago.transferencia)}
• 💳 Tarjeta/Datáfono: ${formatCOP(contabilidad.desgloseMediosPago.tarjeta)}

✂️ *LIQUIDACIÓN DE BARBEROS:*
${(contabilidad.liquidacionesBarberos || []).map(b => `• ${b.barberoNombre}: ${b.cortesCount} cortes | Comisión: ${formatCOP(b.totalComision)}${b.totalPropinas > 0 ? ` + Prop: ${formatCOP(b.totalPropinas)}` : ''} = *${formatCOP(b.totalALiquidar)}* [Pagado: ${formatCOP(b.totalYaLiquidado)}]`).join('\n')}
• *Total Comisiones Pagadas/Por Pagar:* ${formatCOP(contabilidad.totalComisionesBarberos + contabilidad.totalPropinas)}

📉 *EGRESOS / GASTOS DE CAJA:*
${gastos.map(g => `• ${g.concepto} (${g.metodoPago}${g.sucursalNombre ? ` - ${g.sucursalNombre}` : ''}): ${formatCOP(g.monto)}`).join('\n') || '• Sin gastos registrados'}
• *Total Egresos:* ${formatCOP(contabilidad.totalGastos)}

🏦 *BALANCE CASA DEL REY:*
• Margen Barbería: ${formatCOP(contabilidad.ingresosNetosBarberia)}
• Menos Gastos: -${formatCOP(contabilidad.totalGastos)}
• *UTILIDAD NETA NEGOCIO:* ${formatCOP(contabilidad.balanceNetoFinal)}

💵 *ARQUEO DE GAVETA (EFECTIVO):*
• Base inicial: ${formatCOP(contabilidad.efectivoCaja.baseInicial)}
• (+) Entradas efectivo: ${formatCOP(contabilidad.efectivoCaja.entradasEfectivo)}
• (-) Salidas gastos: ${formatCOP(contabilidad.efectivoCaja.salidasEfectivoGastos)}
• (-) Comisiones pagadas en efectivo: ${formatCOP(contabilidad.efectivoCaja.salidasEfectivoComisiones)}
• *EFECTIVO ESPERADO EN GAVETA:* ${formatCOP(saldoEsperado)}
${fisicoNumerico !== null ? `• Efectivo contado físico: ${formatCOP(fisicoNumerico)}
• *Diferencia:* ${diferenciaArqueo === 0 ? '✅ CUADRADO EXACTO' : diferenciaArqueo! > 0 ? `🟢 SOBRANTE (+${formatCOP(diferenciaArqueo!)})` : `🔴 FALTANTE (${formatCOP(diferenciaArqueo!)})`}` : ''}
----------------------------------
Generado por el Sistema Contable de Casa del Rey`;

    navigator.clipboard.writeText(texto);
    setCopiadoReporte(true);
    setTimeout(() => setCopiadoReporte(false), 2500);
  };

  const sucursalActualObj = getSucursalById(sucursalSeleccionada);

  return (
    <div className="space-y-6">
      {/* Top Banner with Date & Quick Export */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#C59B27]" />
              <h2 className="font-royal text-base sm:text-lg font-bold text-[#FAF6EE] uppercase tracking-wide">
                Contabilidad & Recaudos de Casa del Rey
              </h2>
            </div>
            <p className="text-xs text-[#8A796D] font-mono mt-0.5">
              Control de ingresos brutos, medios de pago, arqueo de caja física y utilidades netas
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#0E0A09] px-3 py-1.5 rounded-lg border border-[#3D2E26]">
              <Calendar className="w-4 h-4 text-[#C59B27]" />
              <span className="text-[#8A796D]">Fecha:</span>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-transparent text-[#E5B869] font-bold focus:outline-none cursor-pointer"
              />
              {fechaSeleccionada !== hoyStr && (
                <button
                  onClick={() => setFechaSeleccionada(hoyStr)}
                  className="text-[10px] bg-[#261B16] text-[#FAF6EE] px-2 py-0.5 rounded hover:bg-[#3D2E26] transition-colors"
                >
                  Hoy
                </button>
              )}
            </div>

            <button
              onClick={copiarReporteWhatsApp}
              disabled={!contabilidad}
              className="px-3.5 py-1.5 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] rounded-lg font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
              title="Copiar reporte completo para WhatsApp o Gerencia"
            >
              {copiadoReporte ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoReporte ? '¡COPIADO!' : 'EXPORTAR REPORTE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Sucursal (Para Administrador) o Vista Aislada (Para Cajero) */}
      {esCajero ? (
        <div className="bg-[#181310] border border-[#C59B27]/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#261B16] border border-[#C59B27] flex items-center justify-center text-[#C59B27] shrink-0 shadow">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase text-[#E5B869] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Caja Asignada: {sucursalActualObj.nombre}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F] font-bold">
                  VISTA AISLADA
                </span>
              </div>
              <p className="text-[11px] text-[#A8988B] mt-0.5">
                {sucursalActualObj.direccion} • Arqueo, ingresos y egresos restringidos exclusivamente a esta sucursal.
              </p>
            </div>
          </div>

          <div className="text-right text-xs shrink-0 self-end sm:self-center bg-[#0E0A09] px-3 py-1.5 rounded-lg border border-[#261B16]">
            <span className="text-[#8A796D] block text-[9px] uppercase">Cajero en Turno</span>
            <span className="text-[#86EFAC] font-bold">{usuario?.nombre || 'Operador de Caja'}</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-3 sm:p-4 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C59B27]" />
            <span className="font-bold text-[#FAF6EE] uppercase text-xs">Sede Contable:</span>
            <span className="text-[10px] text-[#8A796D] hidden sm:inline">
              (El Administrador puede ver el consolidado total o dividir por cada una de las 3 sucursales)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setSucursalSeleccionada('todas')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sucursalSeleccionada === 'todas'
                  ? 'bg-[#C59B27] text-[#120E0C] border-[#C59B27] shadow'
                  : 'bg-[#0E0A09] text-[#A8988B] border-[#3D2E26] hover:text-[#FAF6EE] hover:border-[#8A796D]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Todas (3 Sedes Consolidadas)</span>
            </button>

            {SUCURSALES_CASA_DEL_REY.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSucursalSeleccionada(s.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sucursalSeleccionada === s.id
                    ? 'bg-[#2A1E18] text-[#E5B869] border-[#C59B27] shadow'
                    : 'bg-[#0E0A09] text-[#A8988B] border-[#3D2E26] hover:text-[#FAF6EE] hover:border-[#8A796D]'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>{s.nombre.replace('Sede ', '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando ? (
        <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-12 text-center font-mono text-xs text-[#8A796D]">
          Calculando libros contables y arqueo de caja...
        </div>
      ) : error ? (
        <div className="bg-[#3E161C] border border-[#6B242D] rounded-xl p-4 text-[#FCA5A5] font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : contabilidad && (
        <>
          {/* Main Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Bruto Recaudado */}
            <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-[#8A796D] text-xs">
                <span className="uppercase font-bold">Total Recaudado</span>
                <DollarSign className="w-4 h-4 text-[#C59B27]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#FAF6EE] mt-1.5">
                {formatCOP(contabilidad.ingresosBrutos + contabilidad.totalPropinas)}
              </div>
              <div className="text-[10px] text-[#8A796D] mt-1 flex justify-between">
                <span>{contabilidad.totalServicios} servicios</span>
                <span>Propinas: {formatCOP(contabilidad.totalPropinas)}</span>
              </div>
            </div>

            {/* Para Barberos */}
            <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-[#8A796D] text-xs">
                <span className="uppercase font-bold text-[#C59B27]">Para Barberos</span>
                <StraightRazorIcon className="w-4 h-4 text-[#C59B27]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#E5B869] mt-1.5">
                {formatCOP(contabilidad.totalComisionesBarberos + contabilidad.totalPropinas)}
              </div>
              <div className="text-[10px] text-[#8A796D] mt-1 flex justify-between">
                <span>Comisión + Propinas</span>
                <span>Reparto del equipo</span>
              </div>
            </div>

            {/* Egresos / Gastos */}
            <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-[#8A796D] text-xs">
                <span className="uppercase font-bold text-[#F87171]">Egresos & Gastos</span>
                <TrendingDown className="w-4 h-4 text-[#F87171]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#F87171] mt-1.5">
                {formatCOP(contabilidad.totalGastos)}
              </div>
              <div className="text-[10px] text-[#8A796D] mt-1 flex justify-between">
                <span>{gastos.length} gastos registrados</span>
                <span>Insumos y caja menor</span>
              </div>
            </div>

            {/* Ganancia Neta Casa del Rey */}
            <div className="bg-[#1A1412] border border-[#2D472F] rounded-xl p-4 shadow-lg bg-gradient-to-br from-[#1A1412] to-[#162217]">
              <div className="flex items-center justify-between text-[#86EFAC] text-xs">
                <span className="uppercase font-bold">Utilidad Neta Negocio</span>
                <TrendingUp className="w-4 h-4 text-[#86EFAC]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#86EFAC] mt-1.5">
                {formatCOP(contabilidad.balanceNetoFinal)}
              </div>
              <div className="text-[10px] text-[#8A796D] mt-1 flex justify-between">
                <span>Margen post-comisiones</span>
                <span>Post-gastos</span>
              </div>
            </div>
          </div>

          {/* Sección de División Contable por Sucursal (Exclusivo Administrador cuando ve consolidado) */}
          {sucursalSeleccionada === 'todas' && contabilidad.divisionPorSucursal && contabilidad.divisionPorSucursal.length > 0 && (
            <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2E2019] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#C59B27]" />
                  <div>
                    <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide flex items-center gap-2">
                      División Contable por Sucursal (3 Sedes Independientes)
                    </h3>
                    <p className="text-[10px] text-[#8A796D]">
                      Comparativa individual de ingresos, comisiones, egresos y utilidad neta por cada sede
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#261B16] text-[#E5B869] text-[10px] border border-[#3D2E26] font-bold">
                  VISTA ADMINISTRADOR
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contabilidad.divisionPorSucursal.map((div) => {
                  const infoSede = getSucursalById(div.sucursalId);
                  return (
                    <div 
                      key={div.sucursalId} 
                      className="bg-[#120E0C] border border-[#2E2019] hover:border-[#C59B27]/60 rounded-xl p-4 transition-all flex flex-col justify-between shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-[#261B16] pb-2.5">
                          <div>
                            <span className="font-bold text-[#FAF6EE] text-sm block flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-[#C59B27]" />
                              {div.sucursalNombre}
                            </span>
                            <span className="text-[10px] text-[#8A796D] block line-clamp-1">
                              {infoSede.direccion}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-[#1C1512] text-[#C59B27] font-bold text-[10px] border border-[#3D2E26] shrink-0">
                            {div.totalServicios} cortes
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[#8A796D]">Total Recaudado:</span>
                            <span className="font-bold text-[#FAF6EE]">
                              {formatCOP(div.ingresosBrutos + div.totalPropinas)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[#E5B869]">
                            <span>Para Barberos:</span>
                            <span className="font-bold">
                              -{formatCOP(div.totalComisionesBarberos + div.totalPropinas)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[#F87171]">
                            <span>Egresos / Gastos:</span>
                            <span className="font-bold">
                              -{formatCOP(div.totalGastos)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-[#261B16] flex justify-between items-center text-[#86EFAC]">
                            <span className="font-bold uppercase text-[11px]">Utilidad Neta:</span>
                            <span className="text-sm font-bold">
                              {formatCOP(div.balanceNetoFinal)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[#A8988B] pt-1">
                            <span>Saldo Gaveta:</span>
                            <span className="font-bold text-[#FAF6EE]">
                              {formatCOP(div.saldoEsperadoEnGaveta)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#261B16]">
                        <button
                          type="button"
                          onClick={() => setSucursalSeleccionada(div.sucursalId)}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#261B16] hover:bg-[#3D2E26] text-[#E5B869] hover:text-[#FAF6EE] border border-[#3D2E26] hover:border-[#C59B27] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Aislar Contabilidad de {div.sucursalNombre.replace('Sede ', '')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breakdown by Payment Methods + Cash Register reconciliation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Medios de Pago */}
            <div className="lg:col-span-5 bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                    Recaudos por Medio de Pago
                  </h3>
                </div>
                <span className="text-[10px] text-[#8A796D]">ARQUEO DE CANALES</span>
              </div>

              <div className="space-y-3">
                {/* Efectivo */}
                <div className="bg-[#120E0C] p-3 rounded-lg border border-[#2E2019] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#261B16] border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                      💵
                    </div>
                    <div>
                      <span className="font-bold text-[#FAF6EE] block">Efectivo Físico</span>
                      <span className="text-[10px] text-[#8A796D]">Gaveta del cajero</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#FAF6EE]">
                      {formatCOP(contabilidad.desgloseMediosPago.efectivo)}
                    </span>
                    <span className="text-[10px] text-[#8A796D] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.efectivo / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Transferencia Nequi/Daviplata */}
                <div className="bg-[#120E0C] p-3 rounded-lg border border-[#2E2019] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#261B16] border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#FAF6EE] block">Nequi / Daviplata</span>
                      <span className="text-[10px] text-[#8A796D]">Transferencias bancarias</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#FAF6EE]">
                      {formatCOP(contabilidad.desgloseMediosPago.transferencia)}
                    </span>
                    <span className="text-[10px] text-[#8A796D] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.transferencia / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Tarjetas */}
                <div className="bg-[#120E0C] p-3 rounded-lg border border-[#2E2019] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#261B16] border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#FAF6EE] block">Tarjetas / Datáfono</span>
                      <span className="text-[10px] text-[#8A796D]">Débito y Crédito</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#FAF6EE]">
                      {formatCOP(contabilidad.desgloseMediosPago.tarjeta)}
                    </span>
                    <span className="text-[10px] text-[#8A796D] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.tarjeta / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liquidaciones de Barberos Summary */}
              <div className="pt-3 border-t border-[#2E2019] space-y-2">
                <span className="text-[10px] text-[#8A796D] uppercase font-bold block">
                  Distribución a Barberos ({contabilidad.liquidacionesBarberos?.length || 0}):
                </span>
                <div className="space-y-1.5">
                  {(contabilidad.liquidacionesBarberos || []).map((b: any) => (
                    <div key={b.barberoId} className="flex justify-between items-center bg-[#120E0C] p-2 rounded border border-[#261B16]">
                      <div>
                        <span className="text-[#FAF6EE] font-medium">{b.barberoNombre}</span>
                        <span className="text-[10px] text-[#8A796D] block">{b.cortesCount} cortes</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#E5B869] font-bold block">{formatCOP(b.totalALiquidar)}</span>
                        <span className={`text-[9px] ${b.pendientePorPagar === 0 ? 'text-[#86EFAC]' : 'text-[#FCD34D]'}`}>
                          {b.pendientePorPagar === 0 ? 'Liquidado' : `Por pagar: ${formatCOP(b.pendientePorPagar)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arqueo y Control de Gaveta en Efectivo */}
            <div className="lg:col-span-7 bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                    Arqueo de Caja & Gaveta Física
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#261B16] text-[#E5B869] border border-[#3D2E26]">
                  CIERRE DE CAJA
                </span>
              </div>

              {/* Notificación de Apertura de Gaveta */}
              {gavetaNotif && (
                <div className="p-3 bg-[#132A18] border border-[#23532C] rounded-xl flex items-center justify-between gap-2 text-xs text-[#86EFAC] shadow-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#86EFAC] shrink-0" />
                    <span>{gavetaNotif}</span>
                  </div>
                  <button onClick={() => setGavetaNotif(null)} className="text-[#86EFAC]/70 hover:text-[#86EFAC]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Botón de Apertura de Gaveta de Dinero (Solo visible si está activo el flag y usuario es Admin/Cajero) */}
              {visibleGaveta && esAdminOCajero && (
                <div className="p-3.5 bg-[#1C1512] rounded-xl border border-[#C59B27]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#261B16] border border-[#C59B27] flex items-center justify-center text-[#C59B27] shrink-0 shadow">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#FAF6EE] text-xs block">
                        Gaveta Registradora (POS ESC/POS)
                      </span>
                      <span className="text-[10px] text-[#A8988B]">
                        Apertura física de solenoide RJ11/RJ12 por WebSerial, WebUSB o Red
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawerModalOpen(true)}
                      className="p-2 rounded-lg bg-[#140E0C] hover:bg-[#261B16] border border-[#3D2E26] text-[#A8988B] hover:text-[#FAF6EE] transition-colors cursor-pointer"
                      title="Configurar métodos de conexión de la gaveta"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={abriendoGaveta}
                      onClick={handleAbrirGavetaManual}
                      className="px-3.5 py-1.5 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Abrir gaveta de dinero"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{abriendoGaveta ? 'Abriendo...' : 'Abrir Gaveta de Dinero'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Formula de Arqueo */}
              <div className="bg-[#0E0A09] rounded-xl p-4 border border-[#2E2019] space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#261B16]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8A796D]">Base Inicial de Cambio:</span>
                    {editandoBase ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={nuevaBase}
                          onChange={(e) => setNuevaBase(Number(e.target.value))}
                          className="w-24 bg-[#1A1412] border border-[#C59B27] px-1.5 py-0.5 rounded text-xs text-[#FAF6EE]"
                        />
                        <button
                          onClick={handleGuardarBaseCaja}
                          className="px-2 py-0.5 bg-[#C59B27] text-[#120E0C] text-[10px] font-bold rounded"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditandoBase(true)}
                        className="text-[#8A796D] hover:text-[#FAF6EE] flex items-center gap-1"
                        title="Editar base de cambio"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="font-bold text-[#FAF6EE]">{formatCOP(contabilidad.efectivoCaja.baseInicial)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#86EFAC]">
                  <span>(+) Entradas de Efectivo por Cortes:</span>
                  <span className="font-bold">+{formatCOP(contabilidad.efectivoCaja.entradasEfectivo)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#F87171]">
                  <span>(-) Salidas de Gastos pagados en Efectivo:</span>
                  <span className="font-bold">-{formatCOP(contabilidad.efectivoCaja.salidasEfectivoGastos)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#E5B869]">
                  <span>(-) Comisiones liquidadas a Barberos en Efectivo:</span>
                  <span className="font-bold">-{formatCOP(contabilidad.efectivoCaja.salidasEfectivoComisiones)}</span>
                </div>

                {/* Saldo Esperado */}
                <div className="pt-2 border-t border-[#261B16] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#C59B27] uppercase">SALDO ESPERADO EN GAVETA:</span>
                  <span className="text-base font-bold text-[#E5B869]">{formatCOP(saldoEsperado)}</span>
                </div>
              </div>

              {/* Verificación de Conteo Físico Real */}
              <div className="bg-[#120E0C] p-4 rounded-xl border border-[#2E2019] space-y-3">
                <label className="text-[10px] text-[#8A796D] block uppercase font-bold">
                  Verificar con conteo físico de billetes y monedas:
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-[#8A796D]">$</span>
                    <input
                      type="number"
                      value={conteoEfectivoFisico}
                      onChange={(e) => setConteoEfectivoFisico(e.target.value)}
                      placeholder="Ingresa el total contado en la caja..."
                      className="w-full bg-[#0E0A09] border border-[#3D2E26] rounded-lg pl-7 pr-3 py-2 text-xs font-bold text-[#FAF6EE] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                  {conteoEfectivoFisico !== '' && (
                    <button
                      type="button"
                      onClick={() => setConteoEfectivoFisico('')}
                      className="px-3 py-2 bg-[#261B16] text-[#8A796D] hover:text-[#FAF6EE] rounded-lg text-xs"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Resultado del Arqueo */}
                {fisicoNumerico !== null && (
                  <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                    diferenciaArqueo === 0
                      ? 'bg-[#1C2C1D] border-[#2D472F] text-[#86EFAC]'
                      : diferenciaArqueo! > 0
                      ? 'bg-[#1C2C1D] border-[#2D472F] text-[#86EFAC]'
                      : 'bg-[#3E161C] border-[#6B242D] text-[#FCA5A5]'
                  }`}>
                    <div>
                      <span className="font-bold block">
                        {diferenciaArqueo === 0
                          ? '✅ CAJA PERFECTAMENTE CUADRADA'
                          : diferenciaArqueo! > 0
                          ? '🟢 SOBRANTE EN CAJA'
                          : '🔴 FALTANTE EN CAJA'}
                      </span>
                      <span className="text-[10px] opacity-80">
                        {diferenciaArqueo === 0
                          ? 'El dinero físico coincide con el registro del sistema'
                          : diferenciaArqueo! > 0
                          ? 'Hay más dinero físico en gaveta del registrado'
                          : 'Falta dinero en la gaveta frente al registro'}
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {diferenciaArqueo === 0 ? '$0' : formatCOP(Math.abs(diferenciaArqueo!))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Módulo de Gastos / Egresos Diarios */}
          <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#2E2019] pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#F87171]" />
                <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                  Libro de Egresos & Gastos Menores ({gastos.length})
                </h3>
              </div>
              <span className="text-xs text-[#F87171] font-bold">
                Total Gastos: {formatCOP(contabilidad.totalGastos)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario de Gasto */}
              <form onSubmit={handleCrearGasto} className="lg:col-span-4 bg-[#0E0A09] p-4 rounded-xl border border-[#2E2019] space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-[#C59B27] font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  <span>REGISTRAR EGRESO DE CAJA</span>
                </div>

                <div>
                  <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                    Concepto / Descripción:
                  </label>
                  <input
                    type="text"
                    value={conceptoGasto}
                    onChange={(e) => setConceptoGasto(e.target.value)}
                    placeholder="Ej. Cuchillas desechables, café, etc."
                    required
                    className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                {/* Sede del Gasto (Dropdown para Admin, Fija para Cajero) */}
                <div>
                  <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                    Sucursal Asignada al Gasto:
                  </label>
                  {esCajero ? (
                    <div className="p-2 rounded bg-[#140E0C] border border-[#2E2019] text-[11px] text-[#A8988B] flex items-center justify-between">
                      <span>Sede:</span>
                      <span className="text-[#E5B869] font-bold">{sucursalActualObj.nombre}</span>
                    </div>
                  ) : (
                    <select
                      value={sucursalGasto}
                      onChange={(e) => setSucursalGasto(e.target.value)}
                      className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#C59B27]"
                    >
                      {SUCURSALES_CASA_DEL_REY.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                      Categoría:
                    </label>
                    <select
                      value={categoriaGasto}
                      onChange={(e) => setCategoriaGasto(e.target.value as any)}
                      className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#C59B27]"
                    >
                      <option value="Insumos / Cuchillas">Insumos/Cuchillas</option>
                      <option value="Aseo y Desinfección">Aseo/Desinfección</option>
                      <option value="Cafetería / Bebidas">Cafetería/Bebidas</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                      Monto (COP):
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={montoGasto}
                      onChange={(e) => setMontoGasto(Number(e.target.value))}
                      required
                      className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                      Medio Pago:
                    </label>
                    <select
                      value={metodoGasto}
                      onChange={(e) => setMetodoGasto(e.target.value as any)}
                      className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#C59B27]"
                    >
                      <option value="Efectivo Caja">Efectivo Caja</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                      Comprobante:
                    </label>
                    <input
                      type="text"
                      value={comprobanteGasto}
                      onChange={(e) => setComprobanteGasto(e.target.value)}
                      placeholder="# Recibo / Factura"
                      className="w-full bg-[#1A1412] border border-[#3D2E26] text-[#FAF6EE] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoGasto}
                  className="w-full py-2 bg-[#3E161C] hover:bg-[#521E25] text-[#FCA5A5] border border-[#6B242D] font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{guardandoGasto ? 'Guardando...' : 'REGISTRAR GASTO'}</span>
                </button>
              </form>

              {/* Lista de Gastos */}
              <div className="lg:col-span-8 overflow-x-auto">
                {gastos.length === 0 ? (
                  <div className="py-8 text-center text-[#8A796D]">
                    No se han registrado egresos o compras en la fecha {fechaSeleccionada}.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2E2019] text-[10px] text-[#8A796D] uppercase">
                        <th className="pb-2 font-bold">Hora / ID</th>
                        <th className="pb-2 font-bold">Concepto</th>
                        <th className="pb-2 font-bold">Sede</th>
                        <th className="pb-2 font-bold">Categoría</th>
                        <th className="pb-2 font-bold">Medio</th>
                        <th className="pb-2 font-bold text-right">Monto</th>
                        <th className="pb-2 font-bold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#261B16]">
                      {gastos.map(g => (
                        <tr key={g.id} className="hover:bg-[#201815] transition-colors">
                          <td className="py-2.5 whitespace-nowrap">
                            <span className="font-bold text-[#FAF6EE]">{g.hora}</span>
                            <span className="text-[10px] text-[#705F53] block">{g.id}</span>
                          </td>
                          <td className="py-2.5">
                            <span className="font-medium text-[#FAF6EE]">{g.concepto}</span>
                            {g.comprobante && (
                              <span className="text-[10px] text-[#8A796D] block">Ref: {g.comprobante}</span>
                            )}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-[#261B16] text-[#E5B869] border border-[#3D2E26]">
                              {g.sucursalNombre ? g.sucursalNombre.replace('Sede ', '') : 'Chicó Real'}
                            </span>
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[11px] text-[#A8988B]">
                            {g.categoria}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[11px] text-[#A8988B]">
                            {g.metodoPago}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-right font-bold text-[#F87171]">
                            -{formatCOP(g.monto)}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarGasto(g.id, g.concepto)}
                              className="p-1 rounded text-[#8A796D] hover:text-[#F87171] hover:bg-[#3E161C] transition-colors"
                              title="Anular egreso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Configuración y Prueba de Gaveta Registradora (ESC/POS) */}
      <CashDrawerModal
        isOpen={drawerModalOpen}
        onClose={() => setDrawerModalOpen(false)}
        usuarioNombre={usuario?.nombre}
        esAdmin={usuario?.rol === 'Administrador'}
      />
    </div>
  );
};
