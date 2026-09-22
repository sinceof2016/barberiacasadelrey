export interface Sucursal {
  id: string; // 'suc-chico' | 'suc-usaquen' | 'suc-chapinero'
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  horario: string;
  color: string;
  descripcion: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  duracionMinutos: number;
  precio: number;
  descripcion?: string;
  categoria?: 'individual' | 'grupal';
}

export interface HorarioJornadaBarbero {
  horaInicio: string; // e.g. '09:00 AM'
  horaFin: string;    // e.g. '06:00 PM'
  recesoInicio?: string; // e.g. '01:00 PM'
  recesoFin?: string;    // e.g. '02:00 PM'
}

export interface ExcepcionCalendarioBarbero {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'Descanso' | 'Vacaciones' | 'Permiso' | 'TurnoEspecial';
  motivo?: string;
  horasEspeciales?: string[];
}

export interface CalendarioBarbero {
  barberoId: number;
  barberoNombre: string;
  sucursalId: string;
  sucursalNombre?: string;
  diasLaborales: number[]; // 0: Dom, 1: Lun, 2: Mar, 3: Mie, 4: Jue, 5: Vie, 6: Sab
  diasDescanso: number[];  // e.g. [0] o [1]
  jornada: HorarioJornadaBarbero;
  excepciones?: ExcepcionCalendarioBarbero[];
}

export interface Barbero {
  id: number;
  nombre: string;
  especialidad: string;
  avatar?: string;
  foto?: string;
  fotoUrl?: string;
  descripcion?: string;
  sucursalId?: string;
  sucursalNombre?: string;
  // Calendario y disponibilidad individualizada
  diasLaborales?: number[];
  diasDescanso?: number[];
  jornada?: HorarioJornadaBarbero;
  calendario?: CalendarioBarbero;
}

export interface ParticipanteGrupal {
  nombre: string;
  servicioId: number;
}

export interface Cita {
  idReserva: string;
  tipo: 'Individual' | 'Grupal';
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  servicioId?: number;
  barberoId?: number | string;
  sucursalId?: string;
  sucursalNombre?: string;
  fecha: string;
  hora: string;
  estado: 'Confirmada' | 'En Espera' | 'Cancelada';
  responsableNombre?: string;
  responsableTelefono?: string;
  responsableEmail?: string;
  totalPersonas?: number;
  detalles?: ParticipanteGrupal[];
  creadoEn?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
}

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
}

export type TipoBloqueoSlot = 
  | 'disponible' 
  | 'pasado' 
  | 'dia_descanso' 
  | 'fuera_jornada' 
  | 'receso' 
  | 'reservado' 
  | 'sin_barberos';

export interface HorarioSlot {
  hora24: string;
  hora12: string;
  disponible: boolean;
  motivoOcupado?: string;
  tipoBloqueo?: TipoBloqueoSlot;
  barberoNombre?: string;
  barberosDisponibles?: { id: number; nombre: string }[];
  esPasado?: boolean;
}

export interface RelojColombiaInfo {
  fecha: string;
  hora12: string;
  hora24: string;
  horaCompleta: string;
  zona: string;
  totalMinutos: number;
}

export interface DisponibilidadResponse {
  exito: boolean;
  negocio: string;
  fecha: string;
  diaSemana?: number;
  diaSemanaNombre?: string;
  esDiaDescansoBarbero?: boolean;
  mensajeEstado?: string;
  barberoId: string;
  barberoNombre?: string;
  sucursalId?: string;
  horariosDisponibles: string[];
  slots?: HorarioSlot[];
  calendarioBarbero?: CalendarioBarbero;
  relojColombia?: RelojColombiaInfo;
}

export interface PruebaResultado {
  paso: string;
  estado: 'ok' | 'error';
  detalle: any;
}

export type MetodoPago = 'Efectivo' | 'Nequi / Daviplata' | 'Tarjeta / Datáfono';

export interface ItemProductoVendido {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CorteDiario {
  id: string;
  fecha: string;
  hora: string;
  barberoId: number;
  barberoNombre: string;
  servicioId: number;
  servicioNombre: string;
  clienteNombre: string;
  precio: number;
  propina: number;
  porcentajeBarbero: number; // e.g. 50%
  montoBarbero: number;
  montoBarberia: number;
  metodoPago: MetodoPago;
  liquidadoAlBarbero: boolean;
  sucursalId?: string;
  sucursalNombre?: string;
  citaIdReserva?: string;
  notas?: string;
  productosVendidos?: ItemProductoVendido[];
  totalProductos?: number;
  totalCobrado?: number; // precio del servicio + totalProductos
  creadoEn: string;
}

export interface GastoDiario {
  id: string;
  fecha: string;
  hora: string;
  concepto: string;
  categoria: 'Insumos / Cuchillas' | 'Aseo y Desinfección' | 'Cafetería / Bebidas' | 'Mantenimiento' | 'Otros';
  monto: number;
  metodoPago: 'Efectivo Caja' | 'Transferencia';
  sucursalId?: string;
  sucursalNombre?: string;
  comprobante?: string;
  creadoEn: string;
}

export interface LiquidacionBarbero {
  barberoId: number;
  barberoNombre: string;
  cortesCount: number;
  totalFacturado: number;
  totalComision: number;
  totalPropinas: number;
  totalALiquidar: number;
  totalYaLiquidado: number;
  pendientePorPagar: number;
  cortes: CorteDiario[];
}

export interface ResumenSucursalDivision {
  sucursalId: string;
  sucursalNombre: string;
  totalServicios: number;
  ingresosBrutos: number;
  totalComisionesBarberos: number;
  totalPropinas: number;
  ingresosNetosBarberia: number;
  totalGastos: number;
  balanceNetoFinal: number;
  saldoEsperadoEnGaveta: number;
}

export interface ResumenContable {
  fecha: string;
  sucursalId?: string; // 'todas' o id específico
  sucursalNombre?: string;
  totalServicios: number;
  ingresosBrutos: number;
  totalComisionesBarberos: number;
  totalPropinas: number;
  ingresosNetosBarberia: number;
  totalGastos: number;
  balanceNetoFinal: number;
  desgloseMediosPago: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
  };
  efectivoCaja: {
    baseInicial: number;
    entradasEfectivo: number;
    salidasEfectivoGastos: number;
    salidasEfectivoComisiones: number;
    saldoEsperadoEnGaveta: number;
  };
  divisionPorSucursal?: ResumenSucursalDivision[];
}

export type RolUsuario = 'SuperAdmin' | 'Administrador' | 'Cajero';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  sucursalAsignada?: string; // 'suc-chico' | 'suc-usaquen' | 'suc-chapinero' | 'todas'
  creadoEn: string;
  avatarUrl?: string;
  puedeVerApi?: boolean;
  activo?: boolean;
  token?: string;
  tokenExpiresAt?: number;
}

/**
 * Determina si un usuario tiene permiso para visualizar y usar la sección de API REST.
 * Requisito: Exclusivo para David Orjuela / SuperAdmin. Los administradores estándar no tienen acceso a la API.
 */
export function puedeUsuarioVerApi(usuario: Usuario | null | undefined): boolean {
  if (!usuario) return false;
  if (usuario.puedeVerApi === true) return true;
  if (usuario.rol === 'SuperAdmin') return true;
  const email = (usuario.email || '').toLowerCase().trim();
  const nombre = (usuario.nombre || '').toLowerCase().trim();
  if (
    email.includes('orjuela') ||
    email.includes('david') ||
    nombre.includes('david') ||
    nombre.includes('orjuela')
  ) {
    return true;
  }
  return false;
}

/**
 * Determina si un usuario tiene facultades administrativas (Admin o SuperAdmin).
 */
export function esUsuarioAdmin(usuario: Usuario | null | undefined): boolean {
  if (!usuario) return false;
  return (
    usuario.rol === 'Administrador' ||
    usuario.rol === 'SuperAdmin' ||
    puedeUsuarioVerApi(usuario)
  );
}

/**
 * Determina si el usuario actual corresponde a David Orjuela (acceso exclusivo a gestión de usuarios y API).
 */
export function esUsuarioDavid(usuario: Usuario | null | undefined): boolean {
  return puedeUsuarioVerApi(usuario);
}

export interface ClienteReporteItem {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  totalReservas: number;
  reservasIndividuales: number;
  reservasGrupales: number;
  totalPersonas: number;
  citasConfirmadas: number;
  citasCanceladas: number;
  gastoEstimado: number;
  primeraReserva: string;
  ultimaReserva: string;
  serviciosSolicitados: { servicioId: number; nombre: string; veces: number }[];
  servicioFavorito: string;
  barberoFavorito: string;
  clasificacion: 'VIP' | 'Frecuente' | 'Nuevo';
  folios: string[];
  historialCitas: Cita[];
}

export interface ReporteClientesResumen {
  totalClientes: number;
  totalReservas: number;
  totalGastoEstimado: number;
  clientesConEmail: number;
  clientesConTelefono: number;
  clientesVIP: number;
  clientesRecurrentes: number;
  clientesNuevos: number;
  promedioGastoCliente: number;
}

export interface ReporteClientesResponse {
  exito: boolean;
  generadoEn: string;
  resumen: ReporteClientesResumen;
  clientes: ClienteReporteItem[];
}

export type MetodoAperturaGaveta = 'webserial' | 'webusb' | 'escpos_red' | 'simulado';

export interface ConfiguracionGaveta {
  metodo: MetodoAperturaGaveta;
  autoAbrirEnEfectivo: boolean;
  pin: 0 | 1;
  baudRate: number;
  ipImpresora?: string;
  puertoImpresora?: number;
  sonidoSimulado: boolean;
}

export interface RegistroAperturaGaveta {
  id: string;
  fecha: string;
  hora: string;
  usuario?: string;
  motivo: string;
  metodo: MetodoAperturaGaveta;
  exito: boolean;
  mensaje: string;
}

// ==========================================
// Inventario y Catálogo de Productos de Venta
// ==========================================
export type CategoriaProducto = 
  | 'Pomadas' 
  | 'Ceras' 
  | 'Geles' 
  | 'Perfumería' 
  | 'Cuidado Barba' 
  | 'Otros';

export interface ProductoVenta {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  precio: number; // Precio de venta al público en COP
  costo: number; // Costo de compra o adquisición en COP
  stock: number; // Unidades disponibles actuales
  stockMinimo: number; // Alerta de reabastecimiento
  sku?: string;
  marca?: string;
  descripcion?: string;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface MovimientoStock {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: 'venta_corte' | 'ingreso_compra' | 'ajuste_manual' | 'merma_muestra';
  cantidad: number; // negativo si descuenta, positivo si suma
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  fecha: string;
  hora: string;
  corteId?: string;
  usuario?: string;
}
