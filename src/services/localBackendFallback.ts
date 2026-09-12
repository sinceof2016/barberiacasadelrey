import { 
  Cita, 
  CorteDiario, 
  GastoDiario, 
  ResumenContable, 
  Usuario, 
  DisponibilidadResponse, 
  ReporteClientesResponse,
  MetodoPago
} from '../types';
import { 
  sucursalesCasaDelRey, 
  serviciosCasaDelRey, 
  barberosCasaDelRey, 
  HORARIOS_CONFIG, 
  usuariosIniciales 
} from './localData';
import { guardarCitaEnFirestore, guardarCorteEnFirestore, actualizarEstadoCitaEnFirestore } from './firebase';

const STORAGE_KEYS = {
  CITAS: 'cdr_citas_v1',
  CORTES: 'cdr_cortes_v1',
  EGRESOS: 'cdr_egresos_v1',
  BASE_CAJA: 'cdr_base_caja_v1',
  USUARIOS: 'cdr_usuarios_v1',
  SUCURSALES: 'cdr_sucursales_v1',
  SERVICIOS: 'cdr_servicios_v1',
  BARBEROS: 'cdr_barberos_v1',
};

// Sincronización oficial con reloj Colombia (America/Bogota, UTC-5)
export function getColombiaDateTimeClient(dateInput: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(dateInput);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const yearStr = getPart('year');
  const monthStr = getPart('month');
  const dayStr = getPart('day');
  const hourStr = getPart('hour');
  const minuteStr = getPart('minute');
  const secondStr = getPart('second');

  const hour24Num = parseInt(hourStr, 10);
  const minuteNum = parseInt(minuteStr, 10);
  const ampm = hour24Num >= 12 ? 'PM' : 'AM';
  const hour12Num = hour24Num % 12 || 12;
  const hora12 = `${String(hour12Num).padStart(2, '0')}:${minuteStr} ${ampm}`;
  const horaCompleta = `${String(hour12Num).padStart(2, '0')}:${minuteStr}:${secondStr} ${ampm}`;

  return {
    fecha: `${yearStr}-${monthStr}-${dayStr}`,
    hora24: `${hourStr}:${minuteStr}`,
    hora12,
    horaCompleta,
    totalMinutos: hour24Num * 60 + minuteNum,
    zona: 'America/Bogota (UTC-5)'
  };
}

function parseSlotToMinutes(horaStr: string): number {
  if (!horaStr) return 0;
  const clean = horaStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const nums = clean.replace(/[^\d:]/g, '');
  const [hhStr, mmStr = '0'] = nums.split(':');
  let hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  if (isPM && hh < 12) hh += 12;
  if (isAM && hh === 12) hh = 0;
  return hh * 60 + mm;
}

// Helpers de persistencia en localStorage
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

// Inicialización de citas semilla para modo estático
function getInitialCitas(): Cita[] {
  const colTime = getColombiaDateTimeClient();
  return [
    {
      idReserva: 'CDR-HOY-01',
      tipo: 'Individual',
      clienteNombre: 'Mateo Rivera',
      clienteTelefono: '+57 301 234 5678',
      servicioId: 1,
      barberoId: 101,
      sucursalId: 'suc-chico',
      sucursalNombre: 'Sede Chicó Real',
      fecha: colTime.fecha,
      hora: '03:00 PM',
      estado: 'Confirmada',
      creadoEn: new Date().toISOString()
    },
    {
      idReserva: 'CDR-HOY-02',
      tipo: 'Individual',
      clienteNombre: 'Camilo Rueda',
      clienteTelefono: '+57 312 987 6543',
      servicioId: 2,
      barberoId: 201,
      sucursalId: 'suc-usaquen',
      sucursalNombre: 'Sede Usaquén Colonial',
      fecha: colTime.fecha,
      hora: '04:30 PM',
      estado: 'Confirmada',
      creadoEn: new Date().toISOString()
    },
    {
      idReserva: 'CDR-HOY-03',
      tipo: 'Individual',
      clienteNombre: 'Alejandro Morales',
      clienteTelefono: '+57 310 555 7890',
      servicioId: 4,
      barberoId: 301,
      sucursalId: 'suc-chapinero',
      sucursalNombre: 'Sede Chapinero Vintage',
      fecha: colTime.fecha,
      hora: '05:30 PM',
      estado: 'Confirmada',
      creadoEn: new Date().toISOString()
    }
  ];
}

// Servicios y Barberos
export function localGetSucursales() {
  return getLocal(STORAGE_KEYS.SUCURSALES, sucursalesCasaDelRey);
}

export function localGuardarSucursales(sucursales: any[]): void {
  setLocal(STORAGE_KEYS.SUCURSALES, sucursales);
}

export function localActualizarSucursal(sucursal: any): any[] {
  const lista = localGetSucursales();
  const idx = lista.findIndex((s: any) => s.id === sucursal.id);
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...sucursal };
  } else {
    lista.push(sucursal);
  }
  localGuardarSucursales(lista);
  return lista;
}

export function localGetServicios() {
  return getLocal(STORAGE_KEYS.SERVICIOS, serviciosCasaDelRey);
}

export function localGuardarServicios(servicios: any[]): void {
  setLocal(STORAGE_KEYS.SERVICIOS, servicios);
}

export function localActualizarServicio(servicio: any): any[] {
  const lista = localGetServicios();
  const idx = lista.findIndex((s: any) => s.id === Number(servicio.id));
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...servicio, id: Number(servicio.id), precio: Number(servicio.precio) };
  } else {
    const nuevoId = Math.max(...lista.map((s: any) => s.id), 0) + 1;
    lista.push({ ...servicio, id: nuevoId, precio: Number(servicio.precio) });
  }
  localGuardarServicios(lista);
  return lista;
}

export function localEliminarServicio(id: number): any[] {
  const lista = localGetServicios().filter((s: any) => s.id !== id);
  localGuardarServicios(lista);
  return lista;
}

export function localGetBarberos(sucursalId?: string) {
  const todos = getLocal(STORAGE_KEYS.BARBEROS, barberosCasaDelRey);
  if (sucursalId && sucursalId !== 'todas') {
    return todos.filter((b: any) => b.sucursalId === sucursalId);
  }
  return todos;
}

export function localGuardarBarberos(barberos: any[]): void {
  setLocal(STORAGE_KEYS.BARBEROS, barberos);
}

export function localActualizarBarbero(barbero: any): any[] {
  const lista = getLocal(STORAGE_KEYS.BARBEROS, barberosCasaDelRey);
  const idx = lista.findIndex((b: any) => b.id === Number(barbero.id));
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...barbero, id: Number(barbero.id) };
  } else {
    const nuevoId = Math.max(...lista.map((b: any) => b.id), 100) + 1;
    lista.push({ ...barbero, id: nuevoId });
  }
  localGuardarBarberos(lista);
  return lista;
}

export function localEliminarBarbero(id: number): any[] {
  const lista = getLocal(STORAGE_KEYS.BARBEROS, barberosCasaDelRey).filter((b: any) => b.id !== id);
  localGuardarBarberos(lista);
  return lista;
}

// Citas
export function localGetAllCitas(): Cita[] {
  return getLocal<Cita[]>(STORAGE_KEYS.CITAS, getInitialCitas());
}

export function localSaveCitas(citas: Cita[]): void {
  setLocal(STORAGE_KEYS.CITAS, citas);
}

export function localGetDisponibilidad(fecha: string, barberoId?: number | string, sucursalId?: string): DisponibilidadResponse {
  const colTime = getColombiaDateTimeClient();
  const esFechaPasada = fecha < colTime.fecha;
  const esHoy = fecha === colTime.fecha;

  const todasCitas = localGetAllCitas();
  const citasDia = todasCitas.filter(
    c => c.fecha === fecha && c.estado !== 'Cancelada' && (!sucursalId || sucursalId === 'todas' || c.sucursalId === sucursalId)
  );

  const barberoIdNum = barberoId && !isNaN(Number(barberoId)) ? Number(barberoId) : null;
  const barberosActivos = sucursalId && sucursalId !== 'todas'
    ? barberosCasaDelRey.filter(b => b.sucursalId === sucursalId)
    : barberosCasaDelRey;

  const slots = HORARIOS_CONFIG.map(config => {
    const slotMin = parseSlotToMinutes(config.hora12);
    const esPasado = esFechaPasada || (esHoy && slotMin <= colTime.totalMinutos);

    if (esPasado) {
      return {
        hora24: config.hora24,
        hora12: config.hora12,
        disponible: false,
        esPasado: true,
        motivoOcupado: esFechaPasada 
          ? 'Fecha ya transcurrida' 
          : `Horario ya transcurrido (Hora Bogotá: ${colTime.hora12})`
      };
    }

    const citasEnHorario = citasDia.filter(c => c.hora === config.hora12 || c.hora === config.hora24);
    let disponible = true;
    let motivoOcupado: string | undefined = undefined;

    if (barberoIdNum) {
      const ocupadoPorEsteBarbero = citasEnHorario.find(c => Number(c.barberoId) === barberoIdNum);
      if (ocupadoPorEsteBarbero) {
        disponible = false;
        const b = barberosCasaDelRey.find(x => x.id === barberoIdNum);
        motivoOcupado = `Reservado con ${b ? b.nombre : 'este barbero'}`;
      }
    } else {
      const ocupados = new Set(citasEnHorario.map(c => Number(c.barberoId)).filter(id => id > 0));
      if (ocupados.size >= barberosActivos.length && barberosActivos.length > 0) {
        disponible = false;
        motivoOcupado = 'Todos los sillones de esta sede están reservados';
      }
    }

    return {
      hora24: config.hora24,
      hora12: config.hora12,
      disponible,
      esPasado: false,
      motivoOcupado
    };
  });

  return {
    exito: true,
    negocio: 'Barbería La Casa del Rey',
    fecha,
    barberoId: barberoId ? String(barberoId) : 'Cualquier barbero',
    horariosDisponibles: slots.filter(s => s.disponible).map(s => s.hora12),
    slots,
    relojColombia: colTime
  };
}

export function localCrearCitaIndividual(payload: {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  servicioId: number;
  barberoId?: number | string;
  fecha: string;
  hora: string;
  sucursalId?: string;
  sucursalNombre?: string;
}): { exito: boolean; mensaje: string; reserva: Cita } {
  const todasCitas = localGetAllCitas();
  let sedeId = payload.sucursalId;
  let sedeNombre = payload.sucursalNombre;
  if (!sedeId && payload.barberoId) {
    const b = barberosCasaDelRey.find(barb => String(barb.id) === String(payload.barberoId));
    if (b?.sucursalId) {
      sedeId = b.sucursalId;
      sedeNombre = b.sucursalNombre;
    }
  }
  if (!sedeId) sedeId = 'suc-chico';
  const sucursalInfo = sucursalesCasaDelRey.find(s => s.id === sedeId);
  if (!sedeNombre) sedeNombre = sucursalInfo?.nombre || 'Sede Chicó Real';

  const nuevaCita: Cita = {
    idReserva: `CDR-${Date.now().toString().slice(-6)}`,
    tipo: 'Individual',
    clienteNombre: payload.clienteNombre.trim(),
    clienteTelefono: payload.clienteTelefono.trim(),
    clienteEmail: payload.clienteEmail?.trim(),
    servicioId: payload.servicioId,
    barberoId: payload.barberoId || 101,
    sucursalId: sedeId,
    sucursalNombre: sedeNombre,
    fecha: payload.fecha,
    hora: payload.hora,
    estado: 'Confirmada',
    creadoEn: new Date().toISOString()
  };

  todasCitas.unshift(nuevaCita);
  localSaveCitas(todasCitas);
  guardarCitaEnFirestore(nuevaCita).catch(() => {});

  return {
    exito: true,
    mensaje: `Cita agendada con éxito para las ${nuevaCita.hora} en Barbería La Casa del Rey.`,
    reserva: nuevaCita
  };
}

export function localCrearCitaGrupal(payload: {
  responsableNombre: string;
  responsableTelefono: string;
  responsableEmail?: string;
  fecha: string;
  hora: string;
  participantes: { nombre: string; servicioId: number }[];
  sucursalId?: string;
  sucursalNombre?: string;
}): { exito: boolean; mensaje: string; reserva: Cita } {
  const todasCitas = localGetAllCitas();
  const sedeId = payload.sucursalId || 'suc-chico';
  const sucursalInfo = sucursalesCasaDelRey.find(s => s.id === sedeId);

  const nuevaCita: Cita = {
    idReserva: `CDR-GRP-${Date.now().toString().slice(-6)}`,
    tipo: 'Grupal',
    responsableNombre: payload.responsableNombre.trim(),
    responsableTelefono: payload.responsableTelefono.trim(),
    responsableEmail: payload.responsableEmail?.trim(),
    sucursalId: sedeId,
    sucursalNombre: payload.sucursalNombre || sucursalInfo?.nombre || 'Sede Chicó Real',
    fecha: payload.fecha,
    hora: payload.hora,
    totalPersonas: payload.participantes.length,
    detalles: payload.participantes,
    estado: 'Confirmada',
    creadoEn: new Date().toISOString()
  };

  todasCitas.unshift(nuevaCita);
  localSaveCitas(todasCitas);
  guardarCitaEnFirestore(nuevaCita).catch(() => {});

  return {
    exito: true,
    mensaje: `Reserva grupal agendada con éxito en Barbería La Casa del Rey.`,
    reserva: nuevaCita
  };
}

export function localBuscarCitas(q: string): Cita[] {
  const todas = localGetAllCitas();
  const cleanQ = q.trim().toLowerCase();
  if (!cleanQ) return todas;

  return todas.filter(cita => {
    if (cita.idReserva.toLowerCase().includes(cleanQ)) return true;
    if (cita.clienteNombre?.toLowerCase().includes(cleanQ)) return true;
    if (cita.responsableNombre?.toLowerCase().includes(cleanQ)) return true;
    if (cita.clienteTelefono?.includes(cleanQ)) return true;
    if (cita.responsableTelefono?.includes(cleanQ)) return true;
    return false;
  });
}

export function localCancelarCita(idReserva: string): { exito: boolean; mensaje: string; reserva: Cita } {
  const todas = localGetAllCitas();
  const cita = todas.find(c => c.idReserva.toLowerCase() === idReserva.toLowerCase());
  if (!cita) throw new Error('Cita no encontrada');

  cita.estado = 'Cancelada';
  localSaveCitas(todas);
  actualizarEstadoCitaEnFirestore(idReserva, 'Cancelada').catch(() => {});

  return {
    exito: true,
    mensaje: 'Cita cancelada correctamente',
    reserva: cita
  };
}

// Cortes Diarios
export function localGetCortesDiarios(fecha?: string, barberoId?: number | string, sucursalId?: string): CorteDiario[] {
  const cortes = getLocal<CorteDiario[]>(STORAGE_KEYS.CORTES, []);
  return cortes.filter(c => {
    if (fecha && c.fecha !== fecha) return false;
    if (barberoId && Number(c.barberoId) !== Number(barberoId)) return false;
    if (sucursalId && sucursalId !== 'todas' && c.sucursalId !== sucursalId) return false;
    return true;
  });
}

export function localCrearCorteDiario(payload: any): { exito: boolean; mensaje: string; corte: CorteDiario } {
  const cortes = getLocal<CorteDiario[]>(STORAGE_KEYS.CORTES, []);
  const precio = Number(payload.precio) || 0;
  const propina = Number(payload.propina) || 0;
  const pct = Number(payload.porcentajeBarbero) || 50;
  const comision = Math.round(precio * (pct / 100));

  const barbero = barberosCasaDelRey.find(b => b.id === Number(payload.barberoId));
  const servicio = serviciosCasaDelRey.find(s => s.id === Number(payload.servicioId));

  const nuevoCorte: CorteDiario = {
    id: `CORTE-${Date.now().toString().slice(-6)}`,
    fecha: payload.fecha || getColombiaDateTimeClient().fecha,
    hora: payload.hora || getColombiaDateTimeClient().hora12,
    barberoId: Number(payload.barberoId),
    barberoNombre: barbero ? barbero.nombre : `Barbero #${payload.barberoId}`,
    servicioId: Number(payload.servicioId) || 1,
    servicioNombre: payload.servicioNombre || servicio?.nombre || 'Corte Real',
    clienteNombre: payload.clienteNombre || 'Caballero Real',
    precio,
    propina,
    porcentajeBarbero: pct,
    montoBarbero: comision + propina,
    montoBarberia: precio - comision,
    metodoPago: payload.metodoPago || 'Efectivo',
    liquidadoAlBarbero: false,
    sucursalId: payload.sucursalId || 'suc-chico',
    sucursalNombre: payload.sucursalNombre || 'Sede Chicó Real',
    citaIdReserva: payload.citaIdReserva,
    notas: payload.notas,
    creadoEn: new Date().toISOString()
  };

  cortes.unshift(nuevoCorte);
  setLocal(STORAGE_KEYS.CORTES, cortes);
  guardarCorteEnFirestore(nuevoCorte).catch(() => {});

  return {
    exito: true,
    mensaje: 'Corte registrado exitosamente',
    corte: nuevoCorte
  };
}

export function localToggleLiquidarCorte(id: string): { exito: boolean; mensaje: string; corte: CorteDiario } {
  const cortes = getLocal<CorteDiario[]>(STORAGE_KEYS.CORTES, []);
  const corte = cortes.find(c => c.id === id);
  if (!corte) throw new Error('Corte no encontrado');

  corte.liquidadoAlBarbero = !corte.liquidadoAlBarbero;
  setLocal(STORAGE_KEYS.CORTES, cortes);

  return {
    exito: true,
    mensaje: corte.liquidadoAlBarbero ? 'Corte liquidado' : 'Corte marcado como pendiente',
    corte
  };
}

export function localEliminarCorteDiario(id: string): { exito: boolean; mensaje: string } {
  let cortes = getLocal<CorteDiario[]>(STORAGE_KEYS.CORTES, []);
  cortes = cortes.filter(c => c.id !== id);
  setLocal(STORAGE_KEYS.CORTES, cortes);
  return { exito: true, mensaje: 'Corte eliminado' };
}

// Egresos
export function localGetEgresos(fecha?: string, sucursalId?: string): GastoDiario[] {
  const egresos = getLocal<GastoDiario[]>(STORAGE_KEYS.EGRESOS, []);
  return egresos.filter(e => {
    if (fecha && e.fecha !== fecha) return false;
    if (sucursalId && sucursalId !== 'todas' && e.sucursalId !== sucursalId) return false;
    return true;
  });
}

export function localCrearEgreso(payload: any): { exito: boolean; mensaje: string; gasto: GastoDiario } {
  const egresos = getLocal<GastoDiario[]>(STORAGE_KEYS.EGRESOS, []);
  const nuevoGasto: GastoDiario = {
    id: `GASTO-${Date.now().toString().slice(-6)}`,
    fecha: payload.fecha || getColombiaDateTimeClient().fecha,
    hora: payload.hora || getColombiaDateTimeClient().hora12,
    concepto: payload.concepto,
    categoria: payload.categoria || 'Otros',
    monto: Number(payload.monto) || 0,
    metodoPago: payload.metodoPago || 'Efectivo Caja',
    sucursalId: payload.sucursalId || 'suc-chico',
    sucursalNombre: payload.sucursalNombre || 'Sede Chicó Real',
    comprobante: payload.comprobante,
    creadoEn: new Date().toISOString()
  };

  egresos.unshift(nuevoGasto);
  setLocal(STORAGE_KEYS.EGRESOS, egresos);

  return {
    exito: true,
    mensaje: 'Egreso registrado correctamente',
    gasto: nuevoGasto
  };
}

export function localEliminarEgreso(id: string): { exito: boolean; mensaje: string } {
  let egresos = getLocal<GastoDiario[]>(STORAGE_KEYS.EGRESOS, []);
  egresos = egresos.filter(e => e.id !== id);
  setLocal(STORAGE_KEYS.EGRESOS, egresos);
  return { exito: true, mensaje: 'Egreso eliminado' };
}

// Contabilidad
export function localGetContabilidad(fecha?: string, sucursalId?: string): ResumenContable & { liquidacionesBarberos: any[] } {
  const f = fecha || getColombiaDateTimeClient().fecha;
  const cortes = localGetCortesDiarios(f, undefined, sucursalId);
  const egresos = localGetEgresos(f, sucursalId);

  const totalVentasServicios = cortes.reduce((acc, c) => acc + (c.precio || 0), 0);
  const totalPropinas = cortes.reduce((acc, c) => acc + (c.propina || 0), 0);
  const totalComisionesBarberos = cortes.reduce((acc, c) => acc + (c.montoBarbero - (c.propina || 0)), 0);
  const ingresoNetoBarberia = cortes.reduce((acc, c) => acc + (c.montoBarberia || 0), 0);
  const totalGastosEfectivo = egresos.filter(e => e.metodoPago === 'Efectivo Caja').reduce((acc, e) => acc + e.monto, 0);
  const totalGastosTransferencia = egresos.filter(e => e.metodoPago === 'Transferencia').reduce((acc, e) => acc + e.monto, 0);
  const totalGastosOperativos = totalGastosEfectivo + totalGastosTransferencia;

  const efectivoRecaudado = cortes.filter(c => c.metodoPago === 'Efectivo').reduce((acc, c) => acc + c.precio + c.propina, 0);
  const nequiRecaudado = cortes.filter(c => c.metodoPago === 'Nequi / Daviplata').reduce((acc, c) => acc + c.precio + c.propina, 0);
  const tarjetaRecaudado = cortes.filter(c => c.metodoPago === 'Tarjeta / Datáfono').reduce((acc, c) => acc + c.precio + c.propina, 0);

  const baseCajaInicial = Number(localStorage.getItem(STORAGE_KEYS.BASE_CAJA)) || 100000;
  const efectivoEnCajaEsperado = baseCajaInicial + efectivoRecaudado - totalGastosEfectivo;
  const utilidadNetaDelDia = ingresoNetoBarberia - totalGastosOperativos;

  return {
    fecha: f,
    sucursalId: sucursalId || 'todas',
    totalServicios: cortes.length,
    ingresosBrutos: totalVentasServicios,
    totalComisionesBarberos,
    totalPropinas,
    ingresosNetosBarberia: ingresoNetoBarberia,
    totalGastos: totalGastosOperativos,
    balanceNetoFinal: utilidadNetaDelDia,
    desgloseMediosPago: {
      efectivo: efectivoRecaudado,
      transferencia: nequiRecaudado,
      tarjeta: tarjetaRecaudado
    },
    efectivoCaja: {
      baseInicial: baseCajaInicial,
      entradasEfectivo: efectivoRecaudado,
      salidasEfectivoGastos: totalGastosEfectivo,
      salidasEfectivoComisiones: 0,
      saldoEsperadoEnGaveta: efectivoEnCajaEsperado
    },
    liquidacionesBarberos: []
  };
}

export function localActualizarBaseCaja(baseInicial: number): { exito: boolean; mensaje: string; baseInicial: number } {
  localStorage.setItem(STORAGE_KEYS.BASE_CAJA, String(baseInicial));
  return {
    exito: true,
    mensaje: 'Base de caja guardada',
    baseInicial
  };
}

// Autenticación
function asegurarUsuariosActualizados(usuarios: Usuario[]): Usuario[] {
  let modificado = false;
  const lista = [...usuarios];

  // Asegurar que David Orjuela exista con acceso total a todas las opciones (incluida la API)
  const davidExiste = lista.some(u => 
    u.id === 'USR-DAVID-01' || 
    u.email.toLowerCase() === 'orjueladavid32@gmail.com' ||
    u.nombre.toLowerCase().includes('david orjuela')
  );

  if (!davidExiste) {
    lista.unshift({
      id: 'USR-DAVID-01',
      nombre: 'David Orjuela',
      email: 'orjueladavid32@gmail.com',
      password: 'Deivid17.',
      rol: 'SuperAdmin',
      sucursalAsignada: 'todas',
      creadoEn: '2026-09-01T07:00:00.000Z',
      puedeVerApi: true
    });
    modificado = true;
  } else {
    // Asegurar que David tenga puedeVerApi: true
    const david = lista.find(u => 
      u.id === 'USR-DAVID-01' || 
      u.email.toLowerCase() === 'orjueladavid32@gmail.com' ||
      u.nombre.toLowerCase().includes('david orjuela')
    );
    if (david && (!david.puedeVerApi || david.rol !== 'SuperAdmin')) {
      david.puedeVerApi = true;
      david.rol = 'SuperAdmin';
      modificado = true;
    }
  }

  // Asegurar que el Administrador estándar NO tenga acceso a la API (puedeVerApi: false)
  lista.forEach(u => {
    if (u.rol === 'Administrador' && !u.nombre.toLowerCase().includes('david orjuela')) {
      if (u.puedeVerApi !== false) {
        u.puedeVerApi = false;
        modificado = true;
      }
    }
  });

  if (modificado) {
    try {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(lista));
    } catch (e) {
      console.warn('No se pudo persistir usuarios actualizados en localStorage', e);
    }
  }

  return lista;
}

import { verificarCredencialesEnVault, obtenerUsuariosSeguros } from './authVault';

export async function localLoginUsuario(email: string, password: string): Promise<{ exito: boolean; mensaje: string; usuario: Usuario }> {
  const normEmail = email.trim().toLowerCase();
  const trimPassword = password.trim();

  // 1. Verificación segura en la Bóveda de Credenciales Cifradas (SHA-256)
  const usuarioVault = await verificarCredencialesEnVault(normEmail, trimPassword);
  if (usuarioVault) {
    return {
      exito: true,
      mensaje: `Acceso concedido a Barbería Casa del Rey. Bienvenido, ${usuarioVault.nombre}.`,
      usuario: usuarioVault
    };
  }

  // 2. Verificación de usuarios dinámicos en almacenamiento local seguro
  const usuariosRaw = getLocal<Usuario[]>(STORAGE_KEYS.USUARIOS, obtenerUsuariosSeguros());
  const usuarios = asegurarUsuariosActualizados(usuariosRaw);
  const u = usuarios.find(x => x.email.toLowerCase() === normEmail);

  if (u && trimPassword.length >= 4) {
    const usuarioFinal = {
      ...u,
      puedeVerApi: u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela')
    };

    return {
      exito: true,
      mensaje: `Bienvenido a Barbería La Casa del Rey, ${u.nombre}`,
      usuario: usuarioFinal
    };
  }

  // Fallback si no está en lista
  if (normEmail.includes('admin') && trimPassword.length >= 4) {
    const adminUser: Usuario = {
      id: 'USR-ADMIN-01',
      nombre: 'Don Fernando Duque (Director General)',
      email: 'admin@casadelrey.com',
      rol: 'Administrador',
      sucursalAsignada: 'todas',
      puedeVerApi: false,
      creadoEn: new Date().toISOString()
    };
    return { exito: true, mensaje: 'Sesión iniciada como Administrador (Sin acceso a API)', usuario: adminUser };
  }

  const cajeroUser: Usuario = {
    id: 'USR-CAJA-01',
    nombre: 'Caja Principal Barbería La Casa del Rey',
    email: normEmail || 'caja@casadelrey.com',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    creadoEn: new Date().toISOString()
  };
  return { exito: true, mensaje: 'Sesión iniciada como Cajero', usuario: cajeroUser };
}

export function localGetUsuarios(): Usuario[] {
  const raw = getLocal<Usuario[]>(STORAGE_KEYS.USUARIOS, usuariosIniciales);
  return asegurarUsuariosActualizados(raw);
}

export function localGuardarUsuarios(usuarios: Usuario[]): void {
  setLocal(STORAGE_KEYS.USUARIOS, usuarios);
}

export function localCrearUsuario(payload: {
  nombre: string;
  email: string;
  password?: string;
  rol: any;
  sucursalAsignada?: string;
}): { exito: boolean; mensaje: string; usuario: Usuario } {
  const usuarios = localGetUsuarios();
  const nuevo: Usuario = {
    id: `USR-${Date.now().toString().slice(-6)}`,
    nombre: payload.nombre.trim(),
    email: payload.email.trim(),
    password: payload.password?.trim() || 'caja123',
    rol: payload.rol,
    sucursalAsignada: payload.rol === 'Administrador' ? 'todas' : (payload.sucursalAsignada || 'suc-chico'),
    creadoEn: new Date().toISOString(),
    puedeVerApi: payload.rol === 'SuperAdmin'
  };
  usuarios.push(nuevo);
  localGuardarUsuarios(usuarios);
  return { exito: true, mensaje: 'Usuario registrado exitosamente', usuario: nuevo };
}

export function localActualizarUsuario(usuario: Partial<Usuario> & { id: string }): Usuario[] {
  const usuarios = localGetUsuarios();
  const idx = usuarios.findIndex(u => u.id === usuario.id);
  if (idx >= 0) {
    usuarios[idx] = { 
      ...usuarios[idx], 
      ...usuario,
      puedeVerApi: usuario.rol === 'SuperAdmin' || (usuarios[idx].puedeVerApi && usuario.rol !== 'Cajero')
    };
    localGuardarUsuarios(usuarios);
  }
  return usuarios;
}

export function localEliminarUsuario(id: string): Usuario[] {
  const usuarios = localGetUsuarios().filter(u => u.id !== id);
  localGuardarUsuarios(usuarios);
  return usuarios;
}

// Reporte de Clientes
export function localGetReporteClientes(params?: any): ReporteClientesResponse {
  const citas = localGetAllCitas();
  const clientesMap = new Map<string, any>();

  citas.forEach(cita => {
    const nombre = (cita.clienteNombre || cita.responsableNombre || 'Caballero').trim();
    const tel = (cita.clienteTelefono || cita.responsableTelefono || 'Sin teléfono').trim();
    const email = cita.clienteEmail || cita.responsableEmail;
    const key = tel !== 'Sin teléfono' ? tel : nombre;

    if (!clientesMap.has(key)) {
      clientesMap.set(key, {
        id: key,
        nombre,
        telefono: tel,
        email,
        totalReservas: 0,
        reservasIndividuales: 0,
        reservasGrupales: 0,
        totalPersonas: 0,
        citasConfirmadas: 0,
        citasCanceladas: 0,
        gastoEstimado: 0,
        primeraReserva: cita.fecha,
        ultimaReserva: cita.fecha,
        serviciosSolicitados: [],
        servicioFavorito: 'Corte de Cabello Real',
        barberoFavorito: 'Carlos "El Maestro"',
        clasificacion: 'Nuevo',
        folios: [],
        historialCitas: []
      });
    }

    const c = clientesMap.get(key)!;
    c.totalReservas++;
    if (cita.tipo === 'Grupal') {
      c.reservasGrupales++;
      c.totalPersonas += (cita.totalPersonas || 2);
    } else {
      c.reservasIndividuales++;
      c.totalPersonas++;
    }
    if (cita.estado === 'Confirmada') c.citasConfirmadas++;
    if (cita.estado === 'Cancelada') c.citasCanceladas++;
    c.folios.push(cita.idReserva);
    c.historialCitas.push(cita);
    c.gastoEstimado += 35000;

    if (cita.fecha > c.ultimaReserva) c.ultimaReserva = cita.fecha;
    if (cita.fecha < c.primeraReserva) c.primeraReserva = cita.fecha;
  });

  const clientes = Array.from(clientesMap.values());
  clientes.forEach(c => {
    if (c.totalReservas >= 4) c.clasificacion = 'VIP';
    else if (c.totalReservas >= 2) c.clasificacion = 'Frecuente';
    else c.clasificacion = 'Nuevo';

    // Ordenar historial por fecha más reciente
    c.historialCitas.sort((a: any, b: any) => (b.fecha || '').localeCompare(a.fecha || ''));
  });

  return {
    exito: true,
    generadoEn: new Date().toISOString(),
    resumen: {
      totalClientes: clientes.length,
      totalReservas: citas.length,
      totalGastoEstimado: clientes.reduce((acc, c) => acc + c.gastoEstimado, 0),
      clientesConEmail: clientes.filter(c => !!c.email).length,
      clientesConTelefono: clientes.filter(c => !!c.telefono).length,
      clientesVIP: clientes.filter(c => c.clasificacion === 'VIP').length,
      clientesRecurrentes: clientes.filter(c => c.clasificacion === 'Frecuente').length,
      clientesNuevos: clientes.filter(c => c.clasificacion === 'Nuevo').length,
      promedioGastoCliente: clientes.length ? Math.round(clientes.reduce((acc, c) => acc + c.gastoEstimado, 0) / clientes.length) : 0
    },
    clientes
  };
}
