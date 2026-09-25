import React, { useState, useEffect } from 'react';
import { ResumenContable, GastoDiario, Barbero, Usuario, ArqueoCaja, DesgloseEfectivoArqueo } from '../types';
import { 
  getContabilidad, 
  getEgresos, 
  crearEgreso, 
  eliminarEgreso, 
  actualizarBaseCaja,
  getHistorialArqueos,
  registrarArqueoCaja,
  eliminarArqueoCaja,
  liquidarBarberoCompleto,
  liquidarTodosBarberosDia
} from '../services/api';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Smartphone, 
  Coins, 
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
  AlertCircle,
  X,
  Building2,
  Store,
  Lock,
  ArrowRight,
  Calculator,
  Printer,
  FileText,
  History,
  CheckCheck,
  Save,
  Wallet
} from 'lucide-react';
import { 
  StraightRazorIcon, 
  BarberPoleRibbon
} from './VintageBarberIcons';
import { CashDrawerModal } from './CashDrawerModal';
import { isGavetaVisible, ejecutarAperturaGaveta } from '../services/cashDrawer';
import { SUCURSALES_CASA_DEL_REY, getSucursalById } from '../data/sucursales';
import { validarTextoSeguro } from '../utils/security';

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
  const [exportadoExcel, setExportadoExcel] = useState<boolean>(false);

  // Arqueos de caja registrados
  const [historialArqueos, setHistorialArqueos] = useState<ArqueoCaja[]>([]);
  const [cargandoArqueos, setCargandoArqueos] = useState<boolean>(false);
  const [guardandoArqueo, setGuardandoArqueo] = useState<boolean>(false);
  const [observacionesArqueo, setObservacionesArqueo] = useState<string>('');
  const [modalDesgloseBilletes, setModalDesgloseBilletes] = useState<boolean>(false);
  const [comprobanteModalArqueo, setComprobanteModalArqueo] = useState<ArqueoCaja | null>(null);
  const [copiadoArqueoTicket, setCopiadoArqueoTicket] = useState<boolean>(false);
  const [modalConfirmarEliminarArqueo, setModalConfirmarEliminarArqueo] = useState<ArqueoCaja | null>(null);
  const [desgloseBilletes, setDesgloseBilletes] = useState<DesgloseEfectivoArqueo>({
    billetes100k: 0,
    billetes50k: 0,
    billetes20k: 0,
    billetes10k: 0,
    billetes5k: 0,
    billetes2k: 0,
    monedas: 0
  });

  // Liquidación directa desde módulo contable
  const [liquidandoBarberoIdAcc, setLiquidandoBarberoIdAcc] = useState<number | null>(null);
  const [modalConfirmarLiquidarAcc, setModalConfirmarLiquidarAcc] = useState<{
    barberoId: number;
    nombre: string;
    monto: number;
  } | null>(null);
  const [modalConfirmarLiquidarTodosAcc, setModalConfirmarLiquidarTodosAcc] = useState<{
    totalMonto: number;
    totalBarberos: number;
  } | null>(null);
  const [liquidandoTodosAcc, setLiquidandoTodosAcc] = useState<boolean>(false);

  // Cash Drawer (Gaveta Registradora) state
  const [drawerModalOpen, setDrawerModalOpen] = useState<boolean>(false);
  const [abriendoGaveta, setAbriendoGaveta] = useState<boolean>(false);
  const [gavetaNotif, setGavetaNotif] = useState<string | null>(null);

  const esAdminOCajero = !usuario || usuario.rol === 'Administrador' || usuario.rol === 'SuperAdmin' || usuario.rol === 'Cajero';
  const visibleGaveta = isGavetaVisible();

  const notificarError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const notificarExito = (msg: string) => {
    setGavetaNotif(msg);
    setTimeout(() => setGavetaNotif(null), 4500);
  };

  const safeConfirm = (msg: string): boolean => {
    try {
      return window.confirm(msg);
    } catch {
      return true;
    }
  };

  const handleAbrirGavetaManual = async () => {
    setAbriendoGaveta(true);
    setGavetaNotif(null);
    try {
      const sucursalObj = getSucursalById(sucursalSeleccionada);
      const res = await ejecutarAperturaGaveta({
        motivo: `Apertura manual por ${usuario?.nombre || 'Cajero'} en ${sucursalObj.nombre} (Arqueo)`,
        usuario: usuario?.nombre,
      });
      notificarExito(res.mensaje);
    } catch (err: any) {
      notificarError('Error al abrir gaveta: ' + err.message);
    } finally {
      setAbriendoGaveta(false);
    }
  };

  const cargarArqueos = async (fecha: string, sucursalId: string) => {
    setCargandoArqueos(true);
    try {
      const data = await getHistorialArqueos(fecha, sucursalId);
      setHistorialArqueos(data);
    } catch {
      // Keep state if offline
    } finally {
      setCargandoArqueos(false);
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
      await cargarArqueos(fecha, sucursalId);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos contables');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
  }, [fechaSeleccionada, sucursalSeleccionada]);

  const calcularTotalDesglose = (d: DesgloseEfectivoArqueo) => {
    return (
      (Number(d.billetes100k) || 0) * 100000 +
      (Number(d.billetes50k) || 0) * 50000 +
      (Number(d.billetes20k) || 0) * 20000 +
      (Number(d.billetes10k) || 0) * 10000 +
      (Number(d.billetes5k) || 0) * 5000 +
      (Number(d.billetes2k) || 0) * 2000 +
      (Number(d.monedas) || 0)
    );
  };

  const aplicarDesgloseAConteo = () => {
    const total = calcularTotalDesglose(desgloseBilletes);
    setConteoEfectivoFisico(String(total));
    setModalDesgloseBilletes(false);
    notificarExito(`Monto contado aplicado: ${formatCOP(total)}`);
  };

  const handleRegistrarArqueo = async () => {
    if (fisicoNumerico === null || isNaN(fisicoNumerico) || fisicoNumerico < 0) {
      notificarError('Debes ingresar el total de efectivo contado físicamente en caja antes de registrar el arqueo.');
      return;
    }

    if (observacionesArqueo.trim()) {
      const valObs = validarTextoSeguro(observacionesArqueo, { campo: 'Observaciones del Arqueo', longitudMaxima: 500 });
      if (!valObs.esValido) {
        notificarError(valObs.motivo || 'Observaciones no permitidas.');
        return;
      }
    }

    setGuardandoArqueo(true);
    try {
      const sucursalObj = getSucursalById(sucursalSeleccionada !== 'todas' ? sucursalSeleccionada : (usuario?.sucursalAsignada || 'suc-chico'));
      const res = await registrarArqueoCaja({
        fecha: fechaSeleccionada,
        sucursalId: sucursalObj.id,
        sucursalNombre: sucursalObj.nombre,
        usuarioId: usuario?.id,
        usuarioNombre: usuario?.nombre || 'Cajero de Turno',
        baseInicial: contabilidad?.efectivoCaja?.baseInicial || 0,
        entradasEfectivo: contabilidad?.efectivoCaja?.entradasEfectivo || 0,
        salidasEfectivoGastos: contabilidad?.efectivoCaja?.salidasEfectivoGastos || 0,
        salidasEfectivoComisiones: contabilidad?.efectivoCaja?.salidasEfectivoComisiones || 0,
        saldoEsperado: saldoEsperado,
        efectivoContado: fisicoNumerico,
        observaciones: observacionesArqueo.trim(),
        desgloseEfectivo: desgloseBilletes
      });

      if (res.exito) {
        notificarExito(res.mensaje || '¡Arqueo oficial de caja registrado con éxito!');
        setObservacionesArqueo('');
        await cargarArqueos(fechaSeleccionada, sucursalSeleccionada);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      notificarError(err.message || 'Error al registrar arqueo de caja');
    } finally {
      setGuardandoArqueo(false);
    }
  };

  const handleEliminarArqueoConfirmado = async (id: string) => {
    try {
      const res = await eliminarArqueoCaja(id);
      if (res.exito) {
        notificarExito(res.mensaje || 'Registro de arqueo eliminado');
        setHistorialArqueos(prev => prev.filter(a => a.id !== id));
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      notificarError(err.message || 'Error al anular arqueo');
    } finally {
      setModalConfirmarEliminarArqueo(null);
    }
  };

  const ejecutarLiquidarDesdeContabilidad = async (barberoId: number) => {
    setLiquidandoBarberoIdAcc(barberoId);
    try {
      const res = await liquidarBarberoCompleto(barberoId, fechaSeleccionada);
      if (res.exito) {
        notificarExito(res.mensaje || 'Liquidación completada');
        await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      notificarError(err.message || 'Error al liquidar barbero');
    } finally {
      setLiquidandoBarberoIdAcc(null);
      setModalConfirmarLiquidarAcc(null);
    }
  };

  const ejecutarLiquidarTodosDesdeContabilidad = async () => {
    setLiquidandoTodosAcc(true);
    try {
      const res = await liquidarTodosBarberosDia(fechaSeleccionada);
      if (res.exito) {
        notificarExito(res.mensaje || 'Se liquidaron todos los cortes del día exitosamente.');
        await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
        if (onDataUpdated) onDataUpdated();
      }
    } catch (err: any) {
      notificarError(err.message || 'Error al liquidar equipo');
    } finally {
      setLiquidandoTodosAcc(false);
      setModalConfirmarLiquidarTodosAcc(null);
    }
  };

  const copiarTicketArqueo = (a: ArqueoCaja) => {
    const texto = `🏛️ *BARBERÍA LA CASA DEL REY - COMPROBANTE DE ARQUEO OFICIAL* 🏛️
Folio: #${a.id}
📅 *Fecha:* ${a.fecha} | ⏰ *Hora:* ${a.hora}
📍 *Sede:* ${a.sucursalNombre}
👤 *Responsable:* ${a.usuarioNombre}
----------------------------------------
💵 *Base Inicial:* ${formatCOP(a.baseInicial)}
(+) Entradas Efectivo: ${formatCOP(a.entradasEfectivo)}
(-) Egresos Efectivo: ${formatCOP(a.salidasEfectivoGastos)}
(-) Comisiones Efectivo: ${formatCOP(a.salidasEfectivoComisiones)}
----------------------------------------
📌 *Saldo Esperado en Sistema:* ${formatCOP(a.saldoEsperado)}
💰 *Efectivo Real en Mano:* ${formatCOP(a.efectivoContado)}
⚖️ *Diferencia:* ${a.diferencia === 0 ? '✅ CUADRADO EXACTO ($0 COP)' : a.diferencia > 0 ? `🟢 SOBRANTE (+${formatCOP(a.diferencia)})` : `🔴 FALTANTE (${formatCOP(a.diferencia)})`}
📝 *Estado:* ${a.estado}
${a.observaciones ? `💬 *Observaciones:* ${a.observaciones}` : ''}
----------------------------------------
Generado en Sistema La Casa del Rey`;

    navigator.clipboard.writeText(texto);
    setCopiadoArqueoTicket(true);
    setTimeout(() => setCopiadoArqueoTicket(false), 2000);
    notificarExito('¡Comprobante copiado al portapapeles!');
  };

  const handleCrearGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptoGasto.trim()) {
      notificarError('Por favor describe el concepto del egreso.');
      return;
    }

    const valConcepto = validarTextoSeguro(conceptoGasto, { campo: 'Concepto del Egreso', longitudMaxima: 150 });
    if (!valConcepto.esValido) {
      notificarError(valConcepto.motivo || 'El concepto contiene caracteres no permitidos o comandos sospechosos.');
      return;
    }

    if (comprobanteGasto.trim()) {
      const valComp = validarTextoSeguro(comprobanteGasto, { campo: 'Número de Comprobante', longitudMaxima: 80 });
      if (!valComp.esValido) {
        notificarError(valComp.motivo || 'El número de comprobante contiene código o comandos no permitidos.');
        return;
      }
    }

    if (Number(montoGasto) <= 0) {
      notificarError('El monto del egreso debe ser superior a cero.');
      return;
    }

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
      notificarExito(`Egreso "${res.gasto.concepto}" registrado correctamente.`);
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      notificarError('Error al registrar egreso: ' + err.message);
    } finally {
      setGuardandoGasto(false);
    }
  };

  const handleEliminarGasto = async (id: string, concepto: string) => {
    if (!safeConfirm(`¿Confirmas eliminar el egreso "${concepto}"?`)) return;

    try {
      await eliminarEgreso(id);
      setGastos(prev => prev.filter(g => g.id !== id));
      notificarExito(`Egreso "${concepto}" eliminado.`);
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      notificarError('Error al eliminar egreso: ' + err.message);
    }
  };

  const handleGuardarBaseCaja = async () => {
    try {
      const sedeParaBase = sucursalSeleccionada !== 'todas' 
        ? sucursalSeleccionada 
        : (usuario?.sucursalAsignada || 'suc-chico');
      await actualizarBaseCaja(Number(nuevaBase), sedeParaBase);
      setEditandoBase(false);
      notificarExito('Base de caja actualizada con éxito.');
      await cargarDatosContables(fechaSeleccionada, sucursalSeleccionada);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      notificarError('Error al actualizar base: ' + err.message);
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

    const texto = `👑 *BARBERÍA LA CASA DEL REY - CIERRE CONTABLE* 👑
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

🏦 *BALANCE LA CASA DEL REY:*
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
Generado por el Sistema Contable de La Casa del Rey`;

    navigator.clipboard.writeText(texto);
    setCopiadoReporte(true);
    setTimeout(() => setCopiadoReporte(false), 2500);
  };

  // Exportar reporte contable a Excel (.CSV estructurado y compatible)
  const handleExportarExcel = () => {
    if (!contabilidad) return;

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const nombreSede = sucursalSeleccionada === 'todas'
      ? 'Consolidado General (3 Sedes)'
      : getSucursalById(sucursalSeleccionada).nombre;

    const lines: string[] = [];

    // Metadatos y Título
    lines.push(`"REPORTE DE CIERRE CONTABLE - BARBERÍA LA CASA DEL REY"`);
    lines.push(`"Sede:",${escapeCsv(nombreSede)}`);
    lines.push(`"Fecha de Corte:",${escapeCsv(fechaSeleccionada)}`);
    lines.push(`"Total Servicios / Cortes:",${contabilidad.totalServicios}`);
    lines.push(`"Generado En:",${escapeCsv(new Date().toLocaleString('es-CO'))}`);
    lines.push('');

    // Resumen Financiero
    lines.push('"RESUMEN FINANCIERO EJECUTIVO","VALOR COP"');
    lines.push(`"Ingresos Brutos por Servicios",${contabilidad.ingresosBrutos}`);
    lines.push(`"Total Propinas Recaudadas",${contabilidad.totalPropinas}`);
    lines.push(`"TOTAL RECAUDADO (Bruto + Propinas)",${contabilidad.ingresosBrutos + contabilidad.totalPropinas}`);
    lines.push(`"Total Comisiones y Propinas a Barberos",-${contabilidad.totalComisionesBarberos + contabilidad.totalPropinas}`);
    lines.push(`"Margen Bruto de la Barbería",${contabilidad.ingresosNetosBarberia}`);
    lines.push(`"Total Egresos y Gastos de Caja",-${contabilidad.totalGastos}`);
    lines.push(`"UTILIDAD NETA FINAL NEGOCIO",${contabilidad.balanceNetoFinal}`);
    lines.push('');

    // Canales de Pago
    lines.push('"MEDIO DE PAGO","MONTO COP"');
    lines.push(`"Efectivo en Caja",${contabilidad.desgloseMediosPago.efectivo}`);
    lines.push(`"Transferencias (Nequi / Daviplata / Bancos)",${contabilidad.desgloseMediosPago.transferencia}`);
    lines.push(`"Tarjetas de Crédito / Débito / Datáfono",${contabilidad.desgloseMediosPago.tarjeta}`);
    lines.push('');

    // Arqueo de Caja
    lines.push('"ARQUEO DE GAVETA EN EFECTIVO","MONTO COP"');
    lines.push(`"Base Inicial de Apertura",${contabilidad.efectivoCaja.baseInicial}`);
    lines.push(`"(+) Entradas en Efectivo por Servicios",${contabilidad.efectivoCaja.entradasEfectivo}`);
    lines.push(`"(-) Salidas por Gastos en Efectivo",-${contabilidad.efectivoCaja.salidasEfectivoGastos}`);
    lines.push(`"(-) Salidas por Comisiones en Efectivo",-${contabilidad.efectivoCaja.salidasEfectivoComisiones}`);
    lines.push(`"SALDO ESPERADO EN GAVETA",${saldoEsperado}`);
    if (fisicoNumerico !== null) {
      lines.push(`"Efectivo Físico Contado",${fisicoNumerico}`);
      lines.push(`"Diferencia de Arqueo",${diferenciaArqueo}`);
    }
    lines.push('');

    // Liquidación por Barbero
    lines.push('"LIQUIDACIÓN DE BARBEROS","CORTES","COMISIÓN COP","PROPINAS COP","TOTAL A LIQUIDAR COP","ESTADO"');
    (contabilidad.liquidacionesBarberos || []).forEach(b => {
      lines.push([
        escapeCsv(b.barberoNombre),
        b.cortesCount,
        b.totalComision,
        b.totalPropinas,
        b.totalALiquidar,
        escapeCsv(b.pendientePorPagar === 0 ? 'Liquidado Completo' : `Pendiente por Pagar: ${b.pendientePorPagar}`)
      ].join(','));
    });
    lines.push('');

    // Registro de Egresos
    lines.push('"DETALLE DE EGRESOS Y GASTOS DE CAJA"');
    lines.push('"Hora","ID","Concepto","Sede","Categoría","Medio de Pago","Monto COP","Comprobante"');
    gastos.forEach(g => {
      lines.push([
        escapeCsv(g.hora),
        escapeCsv(g.id),
        escapeCsv(g.concepto),
        escapeCsv(g.sucursalNombre || 'Chicó Real'),
        escapeCsv(g.categoria),
        escapeCsv(g.metodoPago),
        g.monto,
        escapeCsv(g.comprobante || 'N/A')
      ].join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre_contable_casa_del_rey_${fechaSeleccionada}_${sucursalSeleccionada}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportadoExcel(true);
    setTimeout(() => setExportadoExcel(false), 2500);
  };

  const sucursalActualObj = getSucursalById(sucursalSeleccionada);

  return (
    <div className="space-y-6">
      {/* Top Banner with Date & Quick Export */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#7C571C]" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                Contabilidad & Recaudos de La Casa del Rey
              </h2>
            </div>
            <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
              Control de ingresos brutos, medios de pago, arqueo de caja física y utilidades netas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Selector de Fecha */}
            <div className="flex items-center gap-2 bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#DFCBB5] shadow-xs">
              <Calendar className="w-4 h-4 text-[#7C571C]" />
              <span className="text-[#6F5A4B]">Fecha:</span>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="bg-transparent text-[#221A14] font-bold focus:outline-none cursor-pointer"
              />
              {fechaSeleccionada !== hoyStr && (
                <button
                  onClick={() => setFechaSeleccionada(hoyStr)}
                  className="text-[10px] bg-[#FBEBE1] text-[#7C571C] px-2 py-0.5 rounded hover:bg-[#DFCBB5] transition-colors cursor-pointer"
                >
                  Hoy
                </button>
              )}
            </div>

            {/* Botón Exportar a Excel */}
            <button
              id="btn-exportar-contabilidad-excel"
              onClick={handleExportarExcel}
              disabled={!contabilidad}
              className="px-3.5 py-1.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] rounded-lg font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar libro contable estructurado en Excel (.csv)"
            >
              {exportadoExcel ? <Check className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>{exportadoExcel ? 'DESCARGADO' : 'EXPORTAR EXCEL'}</span>
            </button>

            {/* Botón WhatsApp / Copiar */}
            <button
              onClick={copiarReporteWhatsApp}
              disabled={!contabilidad}
              className="px-3 py-1.5 bg-[#FBEBE1] hover:bg-[#F5E8DA] border border-[#DFCBB5] text-[#221A14] rounded-lg font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Copiar reporte completo para WhatsApp o Gerencia"
            >
              {copiadoReporte ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4 text-[#7C571C]" />}
              <span>{copiadoReporte ? '¡COPIADO!' : 'COPIAR REPORTE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notificaciones Globales de Contabilidad */}
      {gavetaNotif && (
        <div className="p-3 bg-[#EBF7EE] border border-[#86EFAC] rounded-xl flex items-center justify-between gap-2 text-xs font-mono text-[#15803D] shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{gavetaNotif}</span>
          </div>
          <button onClick={() => setGavetaNotif(null)} className="text-[#15803D]/70 hover:text-[#15803D] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FFDAD6] border border-[#BA1A1A]/30 rounded-xl flex items-center justify-between gap-2 text-xs font-mono text-[#BA1A1A] shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#BA1A1A]/70 hover:text-[#BA1A1A] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selector de Sucursal (Para Administrador) o Vista Aislada (Para Cajero) */}
      {esCajero ? (
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase text-[#221A14] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#7C571C]" />
                  Caja Asignada: {sucursalActualObj.nombre}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] font-bold">
                  VISTA AISLADA
                </span>
              </div>
              <p className="text-[11px] text-[#6F5A4B] mt-0.5">
                {sucursalActualObj.direccion} • Arqueo, ingresos y egresos restringidos exclusivamente a esta sucursal.
              </p>
            </div>
          </div>

          <div className="text-right text-xs shrink-0 self-end sm:self-center bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#DFCBB5]">
            <span className="text-[#6F5A4B] block text-[9px] uppercase">Cajero en Turno</span>
            <span className="text-[#15803D] font-bold">{usuario?.nombre || 'Operador de Caja'}</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#7C571C]" />
            <span className="font-bold text-[#221A14] uppercase text-xs">Sede Contable:</span>
            <span className="text-[10px] text-[#6F5A4B] hidden sm:inline">
              (El Administrador puede ver el consolidado total o filtrar por cada sede)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setSucursalSeleccionada('todas')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sucursalSeleccionada === 'todas'
                  ? 'bg-[#7C571C] text-[#FFFFFF] border-[#7C571C] shadow-xs'
                  : 'bg-[#FFFFFF] text-[#6F5A4B] border-[#DFCBB5] hover:text-[#221A14]'
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
                    ? 'bg-[#7C571C] text-[#FFFFFF] border-[#7C571C] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#6F5A4B] border-[#DFCBB5] hover:text-[#221A14]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>{s.nombre.replace('Sede ', '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando ? (
        <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-12 text-center font-mono text-xs text-[#6F5A4B]">
          Calculando libros contables y arqueo de caja...
        </div>
      ) : error ? (
        <div className="bg-[#FDF2F2] border border-[#F87171] rounded-xl p-4 text-[#991B1B] font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : contabilidad && (
        <>
          {/* Main Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Bruto Recaudado */}
            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#6F5A4B] text-xs">
                <span className="uppercase font-bold">Total Recaudado</span>
                <DollarSign className="w-4 h-4 text-[#7C571C]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#221A14] mt-1.5">
                {formatCOP(contabilidad.ingresosBrutos + contabilidad.totalPropinas)}
              </div>
              <div className="text-[10px] text-[#6F5A4B] mt-1 flex justify-between">
                <span>{contabilidad.totalServicios} servicios</span>
                <span>Propinas: {formatCOP(contabilidad.totalPropinas)}</span>
              </div>
            </div>

            {/* Para Barberos */}
            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#6F5A4B] text-xs">
                <span className="uppercase font-bold text-[#7C571C]">Para Barberos</span>
                <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#7C571C] mt-1.5">
                {formatCOP(contabilidad.totalComisionesBarberos + contabilidad.totalPropinas)}
              </div>
              <div className="text-[10px] text-[#6F5A4B] mt-1 flex justify-between">
                <span>Comisión + Propinas</span>
                <span>Reparto del equipo</span>
              </div>
            </div>

            {/* Egresos / Gastos */}
            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-[#6F5A4B] text-xs">
                <span className="uppercase font-bold text-[#991B1B]">Egresos & Gastos</span>
                <TrendingDown className="w-4 h-4 text-[#991B1B]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#991B1B] mt-1.5">
                {formatCOP(contabilidad.totalGastos)}
              </div>
              <div className="text-[10px] text-[#6F5A4B] mt-1 flex justify-between">
                <span>{gastos.length} gastos registrados</span>
                <span>Insumos y caja menor</span>
              </div>
            </div>

            {/* Ganancia Neta Casa del Rey */}
            <div className="bg-[#FFF8F5] border border-[#86EFAC] rounded-xl p-4 shadow-sm bg-gradient-to-br from-[#FFF8F5] to-[#EBF7EE]">
              <div className="flex items-center justify-between text-[#15803D] text-xs">
                <span className="uppercase font-bold">Utilidad Neta Negocio</span>
                <TrendingUp className="w-4 h-4 text-[#15803D]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#15803D] mt-1.5">
                {formatCOP(contabilidad.balanceNetoFinal)}
              </div>
              <div className="text-[10px] text-[#6F5A4B] mt-1 flex justify-between">
                <span>Margen post-comisiones</span>
                <span>Post-gastos</span>
              </div>
            </div>
          </div>

          {/* Sección de División Contable por Sucursal (Exclusivo Administrador cuando ve consolidado) */}
          {sucursalSeleccionada === 'todas' && contabilidad.divisionPorSucursal && contabilidad.divisionPorSucursal.length > 0 && (
            <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#DFCBB5] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#7C571C]" />
                  <div>
                    <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide flex items-center gap-2">
                      División Contable por Sucursal (3 Sedes)
                    </h3>
                    <p className="text-[10px] text-[#6F5A4B]">
                      Comparativa individual de ingresos, comisiones, egresos y utilidad neta por cada sede
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] text-[10px] border border-[#DFCBB5] font-bold">
                  VISTA CONSOLIDADA
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contabilidad.divisionPorSucursal.map((div) => {
                  const infoSede = getSucursalById(div.sucursalId);
                  return (
                    <div 
                      key={div.sucursalId} 
                      className="bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] rounded-xl p-4 transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-[#DFCBB5] pb-2.5">
                          <div>
                            <span className="font-bold text-[#221A14] text-sm block flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-[#7C571C]" />
                              {div.sucursalNombre}
                            </span>
                            <span className="text-[10px] text-[#6F5A4B] block line-clamp-1">
                              {infoSede.direccion}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] font-bold text-[10px] border border-[#DFCBB5] shrink-0">
                            {div.totalServicios} cortes
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[#6F5A4B]">Total Recaudado:</span>
                            <span className="font-bold text-[#221A14]">
                              {formatCOP(div.ingresosBrutos + div.totalPropinas)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[#7C571C]">
                            <span>Para Barberos:</span>
                            <span className="font-bold">
                              -{formatCOP(div.totalComisionesBarberos + div.totalPropinas)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[#991B1B]">
                            <span>Egresos / Gastos:</span>
                            <span className="font-bold">
                              -{formatCOP(div.totalGastos)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-[#DFCBB5] flex justify-between items-center text-[#15803D]">
                            <span className="font-bold uppercase text-[11px]">Utilidad Neta:</span>
                            <span className="text-sm font-bold">
                              {formatCOP(div.balanceNetoFinal)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[#6F5A4B] pt-1">
                            <span>Saldo Gaveta:</span>
                            <span className="font-bold text-[#221A14]">
                              {formatCOP(div.saldoEsperadoEnGaveta)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#DFCBB5]">
                        <button
                          type="button"
                          onClick={() => setSucursalSeleccionada(div.sucursalId)}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E8DA] text-[#7C571C] hover:text-[#221A14] border border-[#DFCBB5] text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Ver Contabilidad de {div.sucursalNombre.replace('Sede ', '')}</span>
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
            <div className="lg:col-span-5 bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#7C571C]" />
                  <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                    Recaudos por Medio de Pago
                  </h3>
                </div>
                <span className="text-[10px] text-[#6F5A4B]">ARQUEO DE CANALES</span>
              </div>

              <div className="space-y-3">
                {/* Efectivo */}
                <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C]">
                      💵
                    </div>
                    <div>
                      <span className="font-bold text-[#221A14] block">Efectivo Físico</span>
                      <span className="text-[10px] text-[#6F5A4B]">Gaveta del cajero</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#221A14]">
                      {formatCOP(contabilidad.desgloseMediosPago.efectivo)}
                    </span>
                    <span className="text-[10px] text-[#6F5A4B] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.efectivo / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Transferencia Nequi/Daviplata */}
                <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#221A14] block">Nequi / Daviplata</span>
                      <span className="text-[10px] text-[#6F5A4B]">Transferencias</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#221A14]">
                      {formatCOP(contabilidad.desgloseMediosPago.transferencia)}
                    </span>
                    <span className="text-[10px] text-[#6F5A4B] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.transferencia / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>

                {/* Tarjetas */}
                <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DFCBB5] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#221A14] block">Tarjetas / Datáfono</span>
                      <span className="text-[10px] text-[#6F5A4B]">Débito y Crédito</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#221A14]">
                      {formatCOP(contabilidad.desgloseMediosPago.tarjeta)}
                    </span>
                    <span className="text-[10px] text-[#6F5A4B] block">
                      {contabilidad.ingresosBrutos > 0 
                        ? `${Math.round((contabilidad.desgloseMediosPago.tarjeta / (contabilidad.ingresosBrutos + contabilidad.totalPropinas)) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liquidaciones de Barberos Summary */}
              {(() => {
                const barberosConPendiente = (contabilidad.liquidacionesBarberos || []).filter((b: any) => (b.pendientePorPagar || 0) > 0);
                const totalPendienteBarberosAcc = barberosConPendiente.reduce((acc: number, b: any) => acc + (b.pendientePorPagar || 0), 0);
                return (
                  <div className="pt-3 border-t border-[#DFCBB5] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                      <span className="text-[10px] text-[#6F5A4B] uppercase font-bold block">
                        Distribución a Barberos ({contabilidad.liquidacionesBarberos?.length || 0}):
                      </span>
                      {barberosConPendiente.length > 0 && esAdminOCajero && (
                        <button
                          type="button"
                          onClick={() => setModalConfirmarLiquidarTodosAcc({
                            totalMonto: totalPendienteBarberosAcc,
                            totalBarberos: barberosConPendiente.length
                          })}
                          disabled={liquidandoTodosAcc}
                          className="py-1 px-2.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 disabled:opacity-50"
                          title="Liquidar todas las comisiones pendientes del equipo"
                        >
                          <Wallet className="w-3 h-3" />
                          <span>{liquidandoTodosAcc ? 'Liquidando...' : `Liquidar Todo el Equipo (${formatCOP(totalPendienteBarberosAcc)})`}</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(contabilidad.liquidacionesBarberos || []).map((b: any) => (
                        <div key={b.barberoId} className="flex justify-between items-center bg-[#FFFFFF] p-2 rounded border border-[#DFCBB5]">
                          <div>
                            <span className="text-[#221A14] font-medium">{b.barberoNombre}</span>
                            <span className="text-[10px] text-[#6F5A4B] block">{b.cortesCount} cortes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-[#7C571C] font-bold block">{formatCOP(b.totalALiquidar)}</span>
                              <span className={`text-[9px] ${b.pendientePorPagar === 0 ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                                {b.pendientePorPagar === 0 ? 'Liquidado' : `Por pagar: ${formatCOP(b.pendientePorPagar)}`}
                              </span>
                            </div>
                            {b.pendientePorPagar > 0 && esAdminOCajero && (
                              <button
                                type="button"
                                disabled={liquidandoBarberoIdAcc === b.barberoId}
                                onClick={() => setModalConfirmarLiquidarAcc({
                                  barberoId: b.barberoId,
                                  nombre: b.barberoNombre,
                                  monto: b.pendientePorPagar
                                })}
                                className="py-1 px-2 rounded-lg bg-[#15803D] hover:bg-[#10622F] text-[#FAF6EE] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>{liquidandoBarberoIdAcc === b.barberoId ? '...' : 'Liquidar'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Arqueo y Control de Gaveta en Efectivo */}
            <div className="lg:col-span-7 bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#7C571C]" />
                  <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                    Arqueo de Caja & Gaveta Física
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold">
                  CIERRE DE CAJA
                </span>
              </div>

              {/* Notificación de Apertura de Gaveta */}
              {gavetaNotif && (
                <div className="p-3 bg-[#EBF7EE] border border-[#86EFAC] rounded-xl flex items-center justify-between gap-2 text-xs text-[#15803D] shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                    <span>{gavetaNotif}</span>
                  </div>
                  <button onClick={() => setGavetaNotif(null)} className="text-[#15803D]/70 hover:text-[#15803D]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Botón de Apertura de Gaveta de Dinero */}
              {visibleGaveta && esAdminOCajero && (
                <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shrink-0 shadow-xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#221A14] text-xs block">
                        Gaveta Registradora (POS ESC/POS)
                      </span>
                      <span className="text-[10px] text-[#6F5A4B]">
                        Apertura física de solenoide RJ11/RJ12
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawerModalOpen(true)}
                      className="p-2 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E8DA] border border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14] transition-colors cursor-pointer"
                      title="Configurar métodos de conexión de la gaveta"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleAbrirGavetaManual}
                      disabled={abriendoGaveta}
                      className="px-3 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{abriendoGaveta ? 'Abriendo...' : 'Abrir Gaveta'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Flujo de Efectivo en la Gaveta */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-2.5 shadow-2xs">
                {/* Base Inicial */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#6F5A4B]">Base Inicial en Gaveta:</span>
                    {editandoBase ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="10000"
                          value={nuevaBase}
                          onChange={(e) => setNuevaBase(Number(e.target.value))}
                          className="w-24 bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleGuardarBaseCaja}
                          className="px-2 py-0.5 bg-[#7C571C] text-[#FAF6EE] rounded text-[10px] font-bold hover:bg-[#684815]"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoBase(false)}
                          className="text-[#6F5A4B] text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#221A14]">
                          {formatCOP(contabilidad.efectivoCaja.baseInicial)}
                        </span>
                        {esAdmin && (
                          <button
                            onClick={() => setEditandoBase(true)}
                            className="text-[#7C571C] hover:text-[#221A14]"
                            title="Editar base de apertura"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6F5A4B]">Fondo fijo</span>
                </div>

                {/* (+) Entradas Efectivo */}
                <div className="flex items-center justify-between text-[#15803D]">
                  <span>(+) Entradas por Servicios en Efectivo:</span>
                  <span className="font-bold">+{formatCOP(contabilidad.efectivoCaja.entradasEfectivo)}</span>
                </div>

                {/* (-) Salidas Gastos */}
                <div className="flex items-center justify-between text-[#991B1B]">
                  <span>(-) Egresos / Gastos Pagados en Efectivo:</span>
                  <span className="font-bold">-{formatCOP(contabilidad.efectivoCaja.salidasEfectivoGastos)}</span>
                </div>

                {/* (-) Salidas Comisiones */}
                <div className="flex items-center justify-between text-[#991B1B]">
                  <span>(-) Comisiones Pagadas a Barberos en Efectivo:</span>
                  <span className="font-bold">-{formatCOP(contabilidad.efectivoCaja.salidasEfectivoComisiones)}</span>
                </div>

                {/* Saldo Esperado */}
                <div className="pt-2 border-t border-[#DFCBB5] flex items-center justify-between text-sm">
                  <span className="font-bold text-[#221A14]">SALDO ESPERADO EN GAVETA:</span>
                  <span className="font-bold text-base text-[#7C571C]">
                    {formatCOP(saldoEsperado)}
                  </span>
                </div>
              </div>

              {/* Verificación de Cuadre Físico & Registro Oficial */}
              <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFCBB5] pb-2">
                  <span className="text-[10px] text-[#6F5A4B] uppercase font-bold block">
                    Verificación de Cuadre (Conteo Físico en Mano):
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalDesgloseBilletes(true)}
                    className="py-1 px-2.5 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] border border-[#DFCBB5] text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
                    title="Abrir calculadora y desglose de billetes y monedas"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Desglose Billetes & Monedas</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#6F5A4B] block mb-1 font-bold">
                      Efectivo Total Contado Físicamente en Gaveta:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#7C571C] font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Ingresa el monto total contado..."
                        value={conteoEfectivoFisico}
                        onChange={(e) => setConteoEfectivoFisico(e.target.value)}
                        className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#7C571C]"
                      />
                    </div>
                  </div>

                  {fisicoNumerico !== null && (
                    <div className="sm:w-1/2 p-2.5 rounded-lg border text-xs">
                      {diferenciaArqueo === 0 ? (
                        <div className="text-[#15803D] bg-[#EBF7EE] border-[#86EFAC] p-2 rounded flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold block">¡CAJA CUADRADA!</span>
                            <span className="text-[10px]">El dinero coincide exactamente ($0 diferencia).</span>
                          </div>
                        </div>
                      ) : diferenciaArqueo! > 0 ? (
                        <div className="text-[#15803D] bg-[#EBF7EE] border-[#86EFAC] p-2 rounded flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold block">SOBRANTE DE DINERO</span>
                            <span className="text-[10px]">Hay +{formatCOP(diferenciaArqueo!)} de más en gaveta.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#991B1B] bg-[#FDF2F2] border-[#F87171] p-2 rounded flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold block">FALTANTE DE DINERO</span>
                            <span className="text-[10px]">Faltan {formatCOP(Math.abs(diferenciaArqueo!))} en gaveta.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Observaciones de Cierre */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#6F5A4B] block font-bold">
                    Observaciones / Motivo de Descuadre (Opcional):
                  </label>
                  <input
                    type="text"
                    value={observacionesArqueo}
                    onChange={(e) => setObservacionesArqueo(e.target.value)}
                    placeholder="Ej. Cierre de turno tarde, billetes guardados en sobre, cambio devuelto..."
                    maxLength={500}
                    className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>

                {/* Botón Acción Principal: Registrar Arqueo */}
                <button
                  type="button"
                  disabled={fisicoNumerico === null || isNaN(fisicoNumerico) || guardandoArqueo}
                  onClick={handleRegistrarArqueo}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {guardandoArqueo
                      ? 'Registrando Arqueo en el Sistema...'
                      : fisicoNumerico === null
                      ? 'Digita el conteo arriba para Registrar Arqueo'
                      : `Registrar Arqueo Oficial de Caja (${formatCOP(fisicoNumerico)})`}
                  </span>
                </button>

                {/* Historial de Arqueos Registrados */}
                <div className="pt-3 border-t border-[#DFCBB5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#6F5A4B] uppercase font-bold flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#7C571C]" />
                      <span>Arqueos Oficiales Registrados ({historialArqueos.length}):</span>
                    </span>
                    {cargandoArqueos && (
                      <span className="text-[9px] text-[#6F5A4B]">Cargando arqueos...</span>
                    )}
                  </div>

                  {historialArqueos.length === 0 ? (
                    <div className="p-3 rounded-lg bg-[#FAF6EE] border border-[#DFCBB5] text-center text-xs text-[#6F5A4B]">
                      No hay arqueos registrados aún para esta fecha y sede. Realiza el conteo físico arriba y presiona "Registrar Arqueo Oficial de Caja".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {historialArqueos.map((arq) => (
                        <div
                          key={arq.id}
                          className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DFCBB5] shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#221A14] text-xs">#{arq.id}</span>
                                <span className="text-[10px] text-[#6F5A4B] font-mono">{arq.hora}</span>
                              </div>
                              <span className="text-[10px] text-[#7C571C] block">
                                Responsable: {arq.usuarioNombre} &bull; {arq.sucursalNombre.replace('Sede ', '')}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                arq.estado === 'CUADRADO'
                                  ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                                  : arq.estado === 'SOBRANTE'
                                  ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                                  : 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30'
                              }`}
                            >
                              {arq.estado === 'CUADRADO'
                                ? 'Caja Cuadrada'
                                : arq.estado === 'SOBRANTE'
                                ? `+${formatCOP(arq.diferencia)} Sobrante`
                                : `${formatCOP(arq.diferencia)} Faltante`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#DFCBB5]/50">
                            <div>
                              <span className="text-[9px] text-[#6F5A4B] block">Esperado:</span>
                              <span className="font-bold text-[#221A14]">{formatCOP(arq.saldoEsperado)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#6F5A4B] block">Contado Físico:</span>
                              <span className="font-bold text-[#7C571C]">{formatCOP(arq.efectivoContado)}</span>
                            </div>
                          </div>

                          {arq.observaciones && (
                            <p className="text-[10px] text-[#6F5A4B] italic bg-[#FAF6EE] p-1.5 rounded border border-[#DFCBB5]/50">
                              "{arq.observaciones}"
                            </p>
                          )}

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setComprobanteModalArqueo(arq)}
                              className="py-1 px-2 rounded bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Ver comprobante e imprimir ticket"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Comprobante</span>
                            </button>
                            {esAdminOCajero && (
                              <button
                                type="button"
                                onClick={() => setModalConfirmarEliminarArqueo(arq)}
                                className="p-1 text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] rounded transition-colors cursor-pointer"
                                title="Anular arqueo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Egresos y Gastos de Caja */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DFCBB5] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#991B1B]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                  Egresos & Compras del Día ({fechaSeleccionada})
                </h3>
              </div>
              <span className="text-[10px] text-[#6F5A4B]">
                Total Egresos: <span className="font-bold text-[#991B1B]">{formatCOP(contabilidad.totalGastos)}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulario Registrar Gasto */}
              <form onSubmit={handleCrearGasto} className="lg:col-span-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-2">
                  <span className="font-bold text-[#221A14] uppercase text-[11px] flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#991B1B]" />
                    Nuevo Gasto de Caja
                  </span>
                  <span className="text-[9px] text-[#6F5A4B]">SALIDA INMEDIATA</span>
                </div>

                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Concepto / Descripción:
                  </label>
                  <input
                    type="text"
                    value={conceptoGasto}
                    onChange={(e) => setConceptoGasto(e.target.value)}
                    placeholder="Ej. Cuchillas desechables, café..."
                    required
                    className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>

                {/* Sede del Gasto */}
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Sucursal Asignada al Gasto:
                  </label>
                  {esCajero ? (
                    <div className="p-2 rounded bg-[#FDF6F0] border border-[#DFCBB5] text-[11px] text-[#6F5A4B] flex items-center justify-between">
                      <span>Sede:</span>
                      <span className="text-[#221A14] font-bold">{sucursalActualObj.nombre}</span>
                    </div>
                  ) : (
                    <select
                      value={sucursalGasto}
                      onChange={(e) => setSucursalGasto(e.target.value)}
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#7C571C]"
                    >
                      {SUCURSALES_CASA_DEL_REY.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                      Categoría:
                    </label>
                    <select
                      value={categoriaGasto}
                      onChange={(e) => setCategoriaGasto(e.target.value as any)}
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#7C571C]"
                    >
                      <option value="Insumos / Cuchillas">Insumos/Cuchillas</option>
                      <option value="Aseo y Desinfección">Aseo/Desinfección</option>
                      <option value="Cafetería / Bebidas">Cafetería/Bebidas</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                      Monto (COP):
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={montoGasto}
                      onChange={(e) => setMontoGasto(Number(e.target.value))}
                      required
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#7C571C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                      Medio Pago:
                    </label>
                    <select
                      value={metodoGasto}
                      onChange={(e) => setMetodoGasto(e.target.value as any)}
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#7C571C]"
                    >
                      <option value="Efectivo Caja">Efectivo Caja</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                      Comprobante:
                    </label>
                    <input
                      type="text"
                      value={comprobanteGasto}
                      onChange={(e) => setComprobanteGasto(e.target.value)}
                      placeholder="# Recibo / Factura"
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] text-[#221A14] rounded px-2 py-1.5 text-[11px] focus:outline-none focus:border-[#7C571C]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoGasto}
                  className="w-full py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-[#FAF6EE] font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{guardandoGasto ? 'Guardando...' : 'REGISTRAR GASTO'}</span>
                </button>
              </form>

              {/* Lista de Gastos */}
              <div className="lg:col-span-8 overflow-x-auto bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] shadow-2xs">
                {gastos.length === 0 ? (
                  <div className="py-8 text-center text-[#6F5A4B]">
                    No se han registrado egresos o compras en la fecha {fechaSeleccionada}.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DFCBB5] text-[10px] text-[#6F5A4B] uppercase">
                        <th className="pb-2 font-bold">Hora / ID</th>
                        <th className="pb-2 font-bold">Concepto</th>
                        <th className="pb-2 font-bold">Sede</th>
                        <th className="pb-2 font-bold">Categoría</th>
                        <th className="pb-2 font-bold">Medio</th>
                        <th className="pb-2 font-bold text-right">Monto</th>
                        <th className="pb-2 font-bold text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFCBB5]">
                      {gastos.map(g => (
                        <tr key={g.id} className="hover:bg-[#FDF3EB] transition-colors">
                          <td className="py-2.5 whitespace-nowrap">
                            <span className="font-bold text-[#221A14]">{g.hora}</span>
                            <span className="text-[10px] text-[#6F5A4B] block">{g.id}</span>
                          </td>
                          <td className="py-2.5">
                            <span className="font-medium text-[#221A14]">{g.concepto}</span>
                            {g.comprobante && (
                              <span className="text-[10px] text-[#6F5A4B] block">Ref: {g.comprobante}</span>
                            )}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]">
                              {g.sucursalNombre ? g.sucursalNombre.replace('Sede ', '') : 'Chicó Real'}
                            </span>
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[11px] text-[#6F5A4B]">
                            {g.categoria}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-[11px] text-[#6F5A4B]">
                            {g.metodoPago}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-right font-bold text-[#991B1B]">
                            -{formatCOP(g.monto)}
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarGasto(g.id, g.concepto)}
                              className="p-1 rounded text-[#6F5A4B] hover:text-[#991B1B] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
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

      {/* Modal 1: Desglose de Billetes y Monedas (Calculadora de Arqueo) */}
      {modalDesgloseBilletes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl font-mono space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2 text-[#7C571C]">
                <Calculator className="w-5 h-5" />
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Desglose de Efectivo Físico
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalDesgloseBilletes(false)}
                className="text-[#6F5A4B] hover:text-[#221A14] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6F5A4B]">
              Digita la cantidad de billetes y monedas que tienes en la gaveta física para calcular el monto exacto:
            </p>

            <div className="space-y-2 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DFCBB5]">
              {[
                { label: 'Billetes de $100.000 COP', key: 'billetes100k', valor: 100000 },
                { label: 'Billetes de $50.000 COP', key: 'billetes50k', valor: 50000 },
                { label: 'Billetes de $20.000 COP', key: 'billetes20k', valor: 20000 },
                { label: 'Billetes de $10.000 COP', key: 'billetes10k', valor: 10000 },
                { label: 'Billetes de $5.000 COP', key: 'billetes5k', valor: 5000 },
                { label: 'Billetes de $2.000 COP', key: 'billetes2k', valor: 2000 },
              ].map(item => {
                const cant = (desgloseBilletes as any)[item.key] || 0;
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-[#221A14] flex-1">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6F5A4B]">Cant:</span>
                      <input
                        type="number"
                        min="0"
                        value={cant === 0 ? '' : cant}
                        placeholder="0"
                        onChange={(e) => setDesgloseBilletes(prev => ({
                          ...prev,
                          [item.key]: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        className="w-16 bg-[#FDF6F0] border border-[#DFCBB5] text-center text-[#221A14] rounded px-2 py-1 font-bold focus:outline-none focus:border-[#7C571C]"
                      />
                      <span className="w-24 text-right font-bold text-[#7C571C]">
                        {formatCOP(cant * item.valor)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Monedas sueltas */}
              <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-[#DFCBB5]">
                <span className="font-medium text-[#221A14] flex-1">Monedas Sueltas (Total en pesos):</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6F5A4B]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={desgloseBilletes.monedas === 0 ? '' : desgloseBilletes.monedas}
                    placeholder="0"
                    onChange={(e) => setDesgloseBilletes(prev => ({
                      ...prev,
                      monedas: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="w-24 bg-[#FDF6F0] border border-[#DFCBB5] text-right text-[#221A14] rounded px-2 py-1 font-bold focus:outline-none focus:border-[#7C571C]"
                  />
                  <span className="w-24 text-right font-bold text-[#7C571C]">
                    {formatCOP(desgloseBilletes.monedas || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Calculado */}
            <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#DFCBB5] flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-[#221A14]">Total Conteo Físico:</span>
              <span className="text-base font-extrabold text-[#7C571C]">
                {formatCOP(calcularTotalDesglose(desgloseBilletes))}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalDesgloseBilletes(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={aplicarDesgloseAConteo}
                className="flex-1 py-2 px-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar al Conteo ({formatCOP(calcularTotalDesglose(desgloseBilletes))})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Comprobante Oficial de Arqueo de Caja (Impresión y WhatsApp) */}
      {comprobanteModalArqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl font-mono space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header del Ticket */}
            <div className="text-center border-b border-[#DFCBB5] pb-3 space-y-1">
              <h4 className="font-serif text-base font-bold text-[#221A14] tracking-wide">
                BARBERÍA LA CASA DEL REY
              </h4>
              <p className="text-[10px] text-[#7C571C] font-bold tracking-widest uppercase">
                COMPROBANTE OFICIAL DE ARQUEO DE CAJA
              </p>
              <div className="text-[11px] text-[#6F5A4B] pt-1">
                <span>Folio: <strong>#{comprobanteModalArqueo.id}</strong></span> &bull; <span>{comprobanteModalArqueo.fecha} {comprobanteModalArqueo.hora}</span>
              </div>
            </div>

            {/* Datos Generales */}
            <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6F5A4B]">Sede Barbería:</span>
                <span className="font-bold text-[#221A14]">{comprobanteModalArqueo.sucursalNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F5A4B]">Cajero / Responsable:</span>
                <span className="font-bold text-[#221A14]">{comprobanteModalArqueo.usuarioNombre}</span>
              </div>
            </div>

            {/* Desglose Numérico */}
            <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#DFCBB5] space-y-2 text-xs">
              <div className="flex justify-between text-[#6F5A4B]">
                <span>Base Inicial Gaveta:</span>
                <span className="font-bold text-[#221A14]">{formatCOP(comprobanteModalArqueo.baseInicial)}</span>
              </div>
              <div className="flex justify-between text-[#15803D]">
                <span>(+) Entradas por Servicios:</span>
                <span className="font-bold">+{formatCOP(comprobanteModalArqueo.entradasEfectivo)}</span>
              </div>
              <div className="flex justify-between text-[#991B1B]">
                <span>(-) Egresos / Gastos Caja:</span>
                <span className="font-bold">-{formatCOP(comprobanteModalArqueo.salidasEfectivoGastos)}</span>
              </div>
              {comprobanteModalArqueo.salidasEfectivoComisiones > 0 && (
                <div className="flex justify-between text-[#991B1B]">
                  <span>(-) Comisiones Pagadas:</span>
                  <span className="font-bold">-{formatCOP(comprobanteModalArqueo.salidasEfectivoComisiones)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#DFCBB5] flex justify-between font-bold text-sm">
                <span className="text-[#221A14]">Saldo Esperado en Sistema:</span>
                <span className="text-[#7C571C]">{formatCOP(comprobanteModalArqueo.saldoEsperado)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span className="text-[#221A14]">Efectivo Contado en Mano:</span>
                <span className="text-[#221A14]">{formatCOP(comprobanteModalArqueo.efectivoContado)}</span>
              </div>

              {/* Diagnóstico */}
              <div className={`p-2 rounded-lg text-center font-bold text-xs mt-2 ${
                comprobanteModalArqueo.estado === 'CUADRADO'
                  ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                  : comprobanteModalArqueo.estado === 'SOBRANTE'
                  ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                  : 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30'
              }`}>
                {comprobanteModalArqueo.estado === 'CUADRADO'
                  ? '✅ ¡CAJA CUADRADA EXACTA!'
                  : comprobanteModalArqueo.estado === 'SOBRANTE'
                  ? `📈 SOBRANTE EN GAVETA: +${formatCOP(comprobanteModalArqueo.diferencia)}`
                  : `📉 FALTANTE EN GAVETA: ${formatCOP(comprobanteModalArqueo.diferencia)}`}
              </div>
            </div>

            {/* Observaciones */}
            {comprobanteModalArqueo.observaciones && (
              <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#DFCBB5] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#6F5A4B] block">Observaciones:</span>
                <p className="text-[#221A14] italic mt-0.5">"{comprobanteModalArqueo.observaciones}"</p>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    copiarTicketArqueo(comprobanteModalArqueo);
                    setCopiadoArqueoTicket(true);
                    setTimeout(() => setCopiadoArqueoTicket(false), 2500);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] font-bold text-xs border border-[#DFCBB5] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiadoArqueoTicket ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoArqueoTicket ? 'Copiado al Portapapeles' : 'Copiar para WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-3 rounded-xl bg-[#FAF6EE] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Imprimir ticket físico"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setComprobanteModalArqueo(null)}
                className="w-full py-2 px-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirmar Anular Registro de Arqueo */}
      {modalConfirmarEliminarArqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-sm w-full p-5 shadow-xl font-mono space-y-4">
            <div className="flex items-center gap-3 text-[#BA1A1A]">
              <div className="w-10 h-10 rounded-full bg-[#FFDAD6] border border-[#BA1A1A]/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#BA1A1A]" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Anular Registro de Arqueo
                </h4>
                <p className="text-xs text-[#6F5A4B]">
                  ID: #{modalConfirmarEliminarArqueo.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#221A14]">
              ¿Estás seguro de anular el arqueo oficial registrado a las <strong>{modalConfirmarEliminarArqueo.hora}</strong> por <strong>{modalConfirmarEliminarArqueo.usuarioNombre}</strong>?
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarEliminarArqueo(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleEliminarArqueoConfirmado(modalConfirmarEliminarArqueo.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Anular</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Confirmar Liquidación de Barbero Individual */}
      {modalConfirmarLiquidarAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl max-w-sm w-full p-5 shadow-xl font-mono space-y-4">
            <div className="flex items-center gap-3 text-[#15803D]">
              <div className="w-10 h-10 rounded-full bg-[#EBF7EE] border border-[#86EFAC] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-[#15803D]" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#221A14]">
                  Liquidar Comisiones
                </h4>
                <p className="text-xs text-[#7C571C] font-bold">
                  {modalConfirmarLiquidarAcc.nombre}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#221A14]">
              ¿Confirmas el pago y liquidación de comisiones por valor de <strong>{formatCOP(modalConfirmarLiquidarAcc.monto)}</strong> a <strong>{modalConfirmarLiquidarAcc.nombre}</strong>?
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarLiquidarAcc(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={liquidandoBarberoIdAcc !== null}
                onClick={() => ejecutarLiquidarDesdeContabilidad(modalConfirmarLiquidarAcc.barberoId)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#15803D] hover:bg-[#10622F] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{liquidandoBarberoIdAcc !== null ? 'Liquidando...' : 'Confirmar y Pagar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Confirmar Liquidación de TODO el Equipo de Barberos */}
      {modalConfirmarLiquidarTodosAcc && (
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
                <span>Barberos con comisiones pendientes:</span>
                <span className="font-bold text-[#BA1A1A]">{modalConfirmarLiquidarTodosAcc.totalBarberos} barberos</span>
              </div>
              <div className="flex justify-between text-[#221A14] pt-2 border-t border-[#DFCBB5] font-bold text-sm">
                <span>Monto Total a Liquidar:</span>
                <span className="text-[#15803D] font-extrabold">{formatCOP(modalConfirmarLiquidarTodosAcc.totalMonto)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#6F5A4B]">
              ¿Estás seguro de marcar como PAGADOS todos los cortes de todos los barberos para esta fecha? Esta acción actualizará los libros contables de inmediato.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConfirmarLiquidarTodosAcc(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] font-bold text-xs border border-[#DFCBB5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={liquidandoTodosAcc}
                onClick={ejecutarLiquidarTodosDesdeContabilidad}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{liquidandoTodosAcc ? 'Liquidando Todo...' : 'Sí, Liquidar Todo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
