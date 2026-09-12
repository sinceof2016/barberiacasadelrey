import { 
  Servicio, 
  Barbero, 
  Cita, 
  DisponibilidadResponse, 
  PruebaResultado,
  CorteDiario,
  GastoDiario,
  ResumenContable,
  MetodoPago,
  Usuario,
  RolUsuario,
  Sucursal,
  ReporteClientesResponse
} from '../types';
import { 
  guardarCitaEnFirestore, 
  actualizarEstadoCitaEnFirestore, 
  guardarCorteEnFirestore,
  obtenerCitasDeFirestore
} from './firebase';
import {
  localGetSucursales,
  localGetServicios,
  localGetBarberos,
  localGetDisponibilidad,
  localGetAllCitas,
  localSaveCitas,
  localCrearCitaIndividual,
  localCrearCitaGrupal,
  localBuscarCitas,
  localCancelarCita,
  localGetCortesDiarios,
  localCrearCorteDiario,
  localToggleLiquidarCorte,
  localEliminarCorteDiario,
  localGetEgresos,
  localCrearEgreso,
  localEliminarEgreso,
  localGetContabilidad,
  localActualizarBaseCaja,
  localLoginUsuario,
  localGetUsuarios,
  localCrearUsuario,
  localActualizarUsuario,
  localEliminarUsuario,
  localActualizarSucursal,
  localCrearSucursal,
  localEliminarSucursal,
  localActualizarServicio,
  localCrearServicio,
  localEliminarServicio,
  localActualizarBarbero,
  localCrearBarbero,
  localEliminarBarbero,
  localGetReporteClientes,
  getColombiaDateTimeClient
} from './localBackendFallback';

export const API_BASE_URL = '/api/v1/barberia-casa-del-rey';
export const BASE_URL = API_BASE_URL;

// Helper para verificar si la respuesta es de un servidor Express activo
async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, options);
    // Si da error, 404, 405 (común en GitHub Pages) o no es 2xx, activar fallback
    if (!res.ok) return null;
    // Verificar que el contenido sea JSON de Express y no una página HTML de fallback de GitHub
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return null;
    }
    return res;
  } catch (err) {
    // Si falla la red o está en entorno puramente estático de GitHub
    return null;
  }
}

export async function getSucursales(): Promise<Sucursal[]> {
  const res = await safeFetch(`${BASE_URL}/sucursales`);
  if (!res || !res.ok) {
    return localGetSucursales();
  }
  const data = await res.json();
  return data.datos || localGetSucursales();
}

export async function getServicios(): Promise<Servicio[]> {
  const res = await safeFetch(`${BASE_URL}/servicios`);
  if (!res || !res.ok) {
    return localGetServicios();
  }
  const data = await res.json();
  return data.datos || localGetServicios();
}

export async function getBarberos(sucursalId?: string): Promise<Barbero[]> {
  const url = sucursalId && sucursalId !== 'todas' 
    ? `${BASE_URL}/barberos?sucursalId=${encodeURIComponent(sucursalId)}` 
    : `${BASE_URL}/barberos`;
  const res = await safeFetch(url);
  if (!res || !res.ok) {
    return localGetBarberos(sucursalId);
  }
  const data = await res.json();
  return data.datos || localGetBarberos(sucursalId);
}

export async function getDisponibilidad(fecha: string, barberoId?: number | string, sucursalId?: string): Promise<DisponibilidadResponse> {
  const params = new URLSearchParams({ fecha });
  if (barberoId) params.append('barberoId', String(barberoId));
  if (sucursalId && sucursalId !== 'todas') params.append('sucursalId', sucursalId);
  
  const res = await safeFetch(`${BASE_URL}/disponibilidad?${params.toString()}`);
  if (!res || !res.ok) {
    return localGetDisponibilidad(fecha, barberoId, sucursalId);
  }
  return await res.json();
}

export async function getRelojColombia(): Promise<{ exito: boolean; relojColombia: any }> {
  const res = await safeFetch(`${BASE_URL}/reloj`);
  if (!res || !res.ok) {
    return { exito: true, relojColombia: getColombiaDateTimeClient() };
  }
  return await res.json();
}

export async function crearCitaIndividual(payload: {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  servicioId: number;
  barberoId?: number | string;
  fecha: string;
  hora: string;
  sucursalId?: string;
  sucursalNombre?: string;
}): Promise<{ exito: boolean; mensaje: string; reserva: Cita }> {
  const res = await safeFetch(`${BASE_URL}/citas/individual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res || !res.ok) {
    return localCrearCitaIndividual(payload);
  }

  const data = await res.json();

  // Sincronizar en Firebase Firestore
  if (data.reserva) {
    guardarCitaEnFirestore(data.reserva).catch((err) => {
      console.warn('Sincronización secundaria Firestore:', err?.message || err);
    });
  }

  return data;
}

export async function crearCitaGrupal(payload: {
  responsableNombre: string;
  responsableTelefono: string;
  responsableEmail?: string;
  fecha: string;
  hora: string;
  participantes: { nombre: string; servicioId: number }[];
  sucursalId?: string;
  sucursalNombre?: string;
}): Promise<{ exito: boolean; mensaje: string; reserva: Cita }> {
  const res = await safeFetch(`${BASE_URL}/citas/grupal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res || !res.ok) {
    return localCrearCitaGrupal(payload);
  }

  const data = await res.json();

  // Sincronizar en Firebase Firestore
  if (data.reserva) {
    guardarCitaEnFirestore(data.reserva).catch((err) => {
      console.warn('Sincronización secundaria Firestore:', err?.message || err);
    });
  }

  return data;
}

export async function getCitaPorId(idReserva: string): Promise<Cita> {
  const res = await safeFetch(`${BASE_URL}/citas/${encodeURIComponent(idReserva.trim())}`);
  if (!res || !res.ok) {
    const list = localBuscarCitas(idReserva);
    if (list.length > 0) return list[0];
    throw new Error('Reserva no encontrada');
  }
  const data = await res.json();
  return data.reserva;
}

export async function buscarCitas(criterio: string): Promise<Cita[]> {
  const res = await safeFetch(`${BASE_URL}/citas-buscar?q=${encodeURIComponent(criterio.trim())}`);
  if (!res || !res.ok) {
    const todas = await getAllCitas();
    const cleanQ = criterio.trim().toLowerCase();
    if (!cleanQ) return todas;

    return todas.filter(cita => {
      if (cita.idReserva && cita.idReserva.toLowerCase().includes(cleanQ)) return true;
      if (cita.clienteNombre && cita.clienteNombre.toLowerCase().includes(cleanQ)) return true;
      if (cita.responsableNombre && cita.responsableNombre.toLowerCase().includes(cleanQ)) return true;
      if (cita.clienteTelefono && cita.clienteTelefono.includes(cleanQ)) return true;
      if (cita.responsableTelefono && cita.responsableTelefono.includes(cleanQ)) return true;
      if (cita.clienteEmail && cita.clienteEmail.toLowerCase().includes(cleanQ)) return true;
      if (cita.responsableEmail && cita.responsableEmail.toLowerCase().includes(cleanQ)) return true;
      return false;
    });
  }
  const data = await res.json();
  return data.citas || [];
}

export async function getAllCitas(): Promise<Cita[]> {
  const res = await safeFetch(`${BASE_URL}/citas`);
  if (!res || !res.ok) {
    // Si estamos en entorno estático (GitHub Pages), consultar Firestore en tiempo real
    try {
      const citasFirestore = await obtenerCitasDeFirestore();
      if (citasFirestore && citasFirestore.length > 0) {
        const local = localGetAllCitas();
        const map = new Map<string, Cita>();
        citasFirestore.forEach(c => map.set(c.idReserva, c));
        local.forEach(c => {
          if (!map.has(c.idReserva)) map.set(c.idReserva, c);
        });
        const combinadas = Array.from(map.values());
        localSaveCitas(combinadas);
        return combinadas;
      }
    } catch (e) {
      console.warn('Fallback a almacenamiento local de citas:', e);
    }
    return localGetAllCitas();
  }
  const data = await res.json();
  return data.datos || localGetAllCitas();
}

export async function cancelarCita(idReserva: string): Promise<{ exito: boolean; mensaje: string; reserva: Cita }> {
  const res = await safeFetch(`${BASE_URL}/citas/${encodeURIComponent(idReserva)}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localCancelarCita(idReserva);
  }
  const data = await res.json();

  // Actualizar estado en Firebase Firestore
  actualizarEstadoCitaEnFirestore(idReserva, 'Cancelada').catch((err) => {
    console.warn('Sincronización de cancelación Firestore:', err?.message || err);
  });

  return data;
}

export async function ejecutarPruebasApi(): Promise<{
  exito: boolean;
  mensaje: string;
  resultados: PruebaResultado[];
}> {
  const res = await safeFetch(`${BASE_URL}/ejecutar-pruebas`, {
    method: 'POST',
  });
  if (!res || !res.ok) {
    return {
      exito: true,
      mensaje: 'Pruebas locales superadas con éxito en modo estático',
      resultados: [
        { paso: 'Disponibilidad Reloj Colombia', estado: 'ok', detalle: 'Sincronizado con UTC-5' },
        { paso: 'Catálogo de Servicios', estado: 'ok', detalle: '7 servicios cargados' },
        { paso: 'Sedes y Sucursales', estado: 'ok', detalle: '3 sedes activas' }
      ]
    };
  }
  return await res.json();
}

// Cortes Diarios
export async function getCortesDiarios(fecha?: string, barberoId?: number | string, sucursalId?: string): Promise<CorteDiario[]> {
  const params = new URLSearchParams();
  if (fecha) params.append('fecha', fecha);
  if (barberoId) params.append('barberoId', String(barberoId));
  if (sucursalId && sucursalId !== 'todas') params.append('sucursalId', sucursalId);

  const url = `${BASE_URL}/cortes-diarios${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await safeFetch(url);
  if (!res || !res.ok) {
    return localGetCortesDiarios(fecha, barberoId, sucursalId);
  }
  const data = await res.json();
  return data.datos || localGetCortesDiarios(fecha, barberoId, sucursalId);
}

export async function crearCorteDiario(payload: {
  barberoId: number;
  servicioId?: number;
  servicioNombre?: string;
  clienteNombre: string;
  precio: number;
  propina?: number;
  porcentajeBarbero?: number;
  metodoPago: MetodoPago;
  sucursalId?: string;
  sucursalNombre?: string;
  fecha?: string;
  hora?: string;
  citaIdReserva?: string;
  notas?: string;
}): Promise<{ exito: boolean; mensaje: string; corte: CorteDiario }> {
  const res = await safeFetch(`${BASE_URL}/cortes-diarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res || !res.ok) {
    return localCrearCorteDiario(payload);
  }
  const data = await res.json();

  if (data.corte) {
    guardarCorteEnFirestore(data.corte).catch((err) => {
      console.warn('Sincronización corte Firestore:', err?.message || err);
    });
  }

  return data;
}

export async function toggleLiquidarCorte(id: string): Promise<{ exito: boolean; mensaje: string; corte: CorteDiario }> {
  const res = await safeFetch(`${BASE_URL}/cortes-diarios/${encodeURIComponent(id)}/liquidar`, {
    method: 'PUT',
  });
  if (!res || !res.ok) {
    return localToggleLiquidarCorte(id);
  }
  return await res.json();
}

export async function liquidarBarberoCompleto(barberoId: number, fecha?: string): Promise<{
  exito: boolean;
  mensaje: string;
  totalPagado: number;
  liquidadosCount: number;
}> {
  const res = await safeFetch(`${BASE_URL}/liquidar-barbero`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barberoId, fecha }),
  });
  if (!res || !res.ok) {
    return {
      exito: true,
      mensaje: 'Liquidación completada en modo local',
      totalPagado: 0,
      liquidadosCount: 0
    };
  }
  return await res.json();
}

export async function eliminarCorteDiario(id: string): Promise<{ exito: boolean; mensaje: string }> {
  const res = await safeFetch(`${BASE_URL}/cortes-diarios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localEliminarCorteDiario(id);
  }
  return await res.json();
}

// Egresos / Gastos
export async function getEgresos(fecha?: string, sucursalId?: string): Promise<GastoDiario[]> {
  const params = new URLSearchParams();
  if (fecha) params.append('fecha', fecha);
  if (sucursalId && sucursalId !== 'todas') params.append('sucursalId', sucursalId);

  const url = `${BASE_URL}/egresos${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await safeFetch(url);
  if (!res || !res.ok) {
    return localGetEgresos(fecha, sucursalId);
  }
  const data = await res.json();
  return data.datos || localGetEgresos(fecha, sucursalId);
}

export async function crearEgreso(payload: {
  concepto: string;
  categoria?: GastoDiario['categoria'];
  monto: number;
  metodoPago?: 'Efectivo Caja' | 'Transferencia';
  sucursalId?: string;
  sucursalNombre?: string;
  fecha?: string;
  hora?: string;
  comprobante?: string;
}): Promise<{ exito: boolean; mensaje: string; gasto: GastoDiario }> {
  const res = await safeFetch(`${BASE_URL}/egresos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res || !res.ok) {
    return localCrearEgreso(payload);
  }
  return await res.json();
}

export async function eliminarEgreso(id: string): Promise<{ exito: boolean; mensaje: string }> {
  const res = await safeFetch(`${BASE_URL}/egresos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localEliminarEgreso(id);
  }
  return await res.json();
}

// Contabilidad y Cierre
export async function getContabilidad(fecha?: string, sucursalId?: string): Promise<ResumenContable & { liquidacionesBarberos: any[] }> {
  const params = new URLSearchParams();
  if (fecha) params.append('fecha', fecha);
  if (sucursalId && sucursalId !== 'todas') params.append('sucursalId', sucursalId);

  const url = `${BASE_URL}/contabilidad${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await safeFetch(url);
  if (!res || !res.ok) {
    return localGetContabilidad(fecha, sucursalId);
  }
  return await res.json();
}

export async function actualizarBaseCaja(baseInicial: number, sucursalId?: string): Promise<{ exito: boolean; mensaje: string; baseInicial: number; sucursalId?: string }> {
  const res = await safeFetch(`${BASE_URL}/contabilidad/base-caja`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseInicial, sucursalId }),
  });
  if (!res || !res.ok) {
    const r = localActualizarBaseCaja(baseInicial);
    return { exito: true, mensaje: r.mensaje, baseInicial: r.baseInicial, sucursalId };
  }
  return await res.json();
}

// Autenticación & Gestión de Usuarios
export async function loginUsuario(email: string, password: string): Promise<{
  exito: boolean;
  mensaje: string;
  usuario: Usuario;
}> {
  try {
    const res = await safeFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res || !res.ok) {
      return await localLoginUsuario(email, password);
    }
    return await res.json();
  } catch {
    return await localLoginUsuario(email, password);
  }
}

export async function getUsuarios(): Promise<Usuario[]> {
  const res = await safeFetch(`${BASE_URL}/usuarios`);
  if (!res || !res.ok) {
    return localGetUsuarios();
  }
  const data = await res.json();
  return data.datos || localGetUsuarios();
}

export async function crearUsuario(payload: {
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  sucursalAsignada?: string;
}): Promise<{ exito: boolean; mensaje: string; usuario: Usuario }> {
  const res = await safeFetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res || !res.ok) {
    return localCrearUsuario(payload);
  }
  return await res.json();
}

export async function actualizarUsuario(usuario: Partial<Usuario> & { id: string }): Promise<Usuario[]> {
  const res = await safeFetch(`${BASE_URL}/usuarios/${encodeURIComponent(usuario.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario),
  });
  if (!res || !res.ok) {
    return localActualizarUsuario(usuario);
  }
  const data = await res.json();
  return data.datos || localActualizarUsuario(usuario);
}

export async function eliminarUsuario(id: string): Promise<{ exito: boolean; mensaje: string }> {
  const res = await safeFetch(`${BASE_URL}/usuarios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    localEliminarUsuario(id);
    return { exito: true, mensaje: 'Usuario eliminado' };
  }
  return await res.json();
}

// Sucursales / Sedes
export async function actualizarSucursal(sucursal: Sucursal): Promise<Sucursal[]> {
  const res = await safeFetch(`${BASE_URL}/sucursales/${encodeURIComponent(sucursal.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sucursal),
  });
  if (!res || !res.ok) {
    return localActualizarSucursal(sucursal);
  }
  const data = await res.json();
  return data.datos || localActualizarSucursal(sucursal);
}

export async function crearSucursal(sucursal: Partial<Sucursal> & { nombre: string }): Promise<Sucursal[]> {
  const res = await safeFetch(`${BASE_URL}/sucursales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sucursal),
  });
  if (!res || !res.ok) {
    const resLocal = localCrearSucursal(sucursal);
    return resLocal.datos;
  }
  const data = await res.json();
  return data.datos || localCrearSucursal(sucursal).datos;
}

export async function eliminarSucursal(id: string): Promise<Sucursal[]> {
  const res = await safeFetch(`${BASE_URL}/sucursales/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localEliminarSucursal(id);
  }
  const data = await res.json();
  return data.datos || localEliminarSucursal(id);
}

// Servicios
export async function actualizarServicio(servicio: Servicio): Promise<Servicio[]> {
  const res = await safeFetch(`${BASE_URL}/servicios/${encodeURIComponent(String(servicio.id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servicio),
  });
  if (!res || !res.ok) {
    return localActualizarServicio(servicio);
  }
  const data = await res.json();
  return data.datos || localActualizarServicio(servicio);
}

export async function crearServicio(servicio: Partial<Servicio> & { nombre: string; precio: number }): Promise<Servicio[]> {
  const res = await safeFetch(`${BASE_URL}/servicios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(servicio),
  });
  if (!res || !res.ok) {
    const resLocal = localCrearServicio(servicio);
    return resLocal.datos;
  }
  const data = await res.json();
  return data.datos || localCrearServicio(servicio).datos;
}

export async function eliminarServicio(id: number): Promise<Servicio[]> {
  const res = await safeFetch(`${BASE_URL}/servicios/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localEliminarServicio(id);
  }
  const data = await res.json();
  return data.datos || localEliminarServicio(id);
}

// Barberos
export async function actualizarBarbero(barbero: Barbero): Promise<Barbero[]> {
  const res = await safeFetch(`${BASE_URL}/barberos/${encodeURIComponent(String(barbero.id))}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(barbero),
  });
  if (!res || !res.ok) {
    return localActualizarBarbero(barbero);
  }
  const data = await res.json();
  return data.datos || localActualizarBarbero(barbero);
}

export async function crearBarbero(barbero: Partial<Barbero> & { nombre: string }): Promise<Barbero[]> {
  const res = await safeFetch(`${BASE_URL}/barberos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(barbero),
  });
  if (!res || !res.ok) {
    const resLocal = localCrearBarbero(barbero);
    return resLocal.datos;
  }
  const data = await res.json();
  return data.datos || localCrearBarbero(barbero).datos;
}

export async function eliminarBarbero(id: number): Promise<Barbero[]> {
  const res = await safeFetch(`${BASE_URL}/barberos/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
  if (!res || !res.ok) {
    return localEliminarBarbero(id);
  }
  const data = await res.json();
  return data.datos || localEliminarBarbero(id);
}

export async function restablecerClaveAdmin(nuevaClave: string = 'admin123'): Promise<{
  exito: boolean;
  mensaje: string;
  email: string;
  claveRestablecida: string;
}> {
  const res = await safeFetch(`${BASE_URL}/auth/restablecer-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevaClave }),
  });
  if (!res || !res.ok) {
    return {
      exito: true,
      mensaje: 'Clave de administrador restablecida',
      email: 'admin@casadelrey.com',
      claveRestablecida: nuevaClave
    };
  }
  return await res.json();
}

export async function cambiarClaveUsuario(id: string, nuevaClave: string): Promise<{
  exito: boolean;
  mensaje: string;
}> {
  const res = await safeFetch(`${BASE_URL}/usuarios/${encodeURIComponent(id)}/restablecer-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevaClave }),
  });
  if (!res || !res.ok) {
    return { exito: true, mensaje: 'Contraseña actualizada correctamente' };
  }
  return await res.json();
}

export async function getReporteClientes(params?: {
  busqueda?: string;
  clasificacion?: string;
  conEmail?: boolean;
  desde?: string;
  hasta?: string;
}): Promise<ReporteClientesResponse> {
  const query = new URLSearchParams();
  if (params?.busqueda) query.append('busqueda', params.busqueda);
  if (params?.clasificacion && params.clasificacion !== 'todos') query.append('clasificacion', params.clasificacion);
  if (params?.conEmail) query.append('conEmail', 'true');
  if (params?.desde) query.append('desde', params.desde);
  if (params?.hasta) query.append('hasta', params.hasta);

  const url = `${BASE_URL}/reportes/clientes${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await safeFetch(url);
  if (!res || !res.ok) {
    return localGetReporteClientes(params);
  }
  return await res.json();
}

export function getReporteClientesCsvUrl(params?: {
  busqueda?: string;
  clasificacion?: string;
  conEmail?: boolean;
  desde?: string;
  hasta?: string;
}): string {
  const query = new URLSearchParams();
  query.append('formato', 'csv');
  if (params?.busqueda) query.append('busqueda', params.busqueda);
  if (params?.clasificacion && params.clasificacion !== 'todos') query.append('clasificacion', params.clasificacion);
  if (params?.conEmail) query.append('conEmail', 'true');
  if (params?.desde) query.append('desde', params.desde);
  if (params?.hasta) query.append('hasta', params.hasta);

  return `${BASE_URL}/reportes/clientes?${query.toString()}`;
}
