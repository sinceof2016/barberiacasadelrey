import { Sucursal, Servicio, Barbero, CorteDiario, ArqueoCaja, GastoDiario, Cita, Usuario } from '../src/types';
import { CONFIG_NEGOCIO } from '../src/config/negocio';

export const sucursalesCasaDelRey: Sucursal[] = CONFIG_NEGOCIO.sedes.map(s => ({
  id: s.id,
  nombre: s.nombre,
  ciudad: CONFIG_NEGOCIO.ciudad,
  direccion: s.direccion,
  telefono: s.telefono,
  horario: 'Lunes a Sábado 8:00 AM - 8:00 PM',
  color: '#D4AF37',
  descripcion: `Sede oficial ${s.nombre} de Barbería La Casa del Rey`
}));

export const serviciosCasaDelRey: Servicio[] = [
  { id: 1, nombre: 'Corte Clásico Gentleman', descripcion: 'Corte de cabello tradicional con tijera y máquina, lavado con champú artesanal y peinado con pomada premium.', precio: 45000, duracionMinutos: 45, categoria: 'individual' },
  { id: 2, nombre: 'Perfilado de Barba Ritual', descripcion: 'Diseño y perfilado de barba con navaja clásica, toallas calientes con aceites esenciales y loción aftershave.', precio: 38000, duracionMinutos: 35, categoria: 'individual' },
  { id: 3, nombre: 'Combo Soberano (Corte + Barba)', descripcion: 'El ritual completo de la casa: Corte Gentleman y Perfilado de Barba con vapor y toallas calientes.', precio: 75000, duracionMinutos: 75, categoria: 'grupal' },
  { id: 4, nombre: 'Afeitado Clásico Real', descripcion: 'Afeitado tradicional completo al ras con navaja, espuma caliente y masaje facial relajante.', precio: 40000, duracionMinutos: 40, categoria: 'individual' },
  { id: 5, nombre: 'Corte + Cejas con Navaja', descripcion: 'Corte tradicional de cabello y perfilado impecable de cejas con navaja.', precio: 50000, duracionMinutos: 50, categoria: 'individual' },
  { id: 6, nombre: 'Mascarilla Negra & Limpieza', descripcion: 'Limpieza facial profunda con mascarilla de carbón activado para eliminación de puntos negros y toxinas.', precio: 35000, duracionMinutos: 30, categoria: 'individual' },
  { id: 7, nombre: 'Combo Completo Supremo (Corte + Barba + Cejas + Facial)', descripcion: 'La máxima experiencia de distinción: corte, barba, cejas y mascarilla facial purificante.', precio: 105000, duracionMinutos: 90, categoria: 'grupal' }
];

export const barberosCasaDelRey: Barbero[] = [
  { id: 101, nombre: 'David "El Cirujano"', especialidad: 'Cortes clásicos, desvanecidos y navaja libre', sucursalId: 'suc-chico' },
  { id: 102, nombre: 'Mateo "Tijera de Oro"', especialidad: 'Estilos modernos, texturizados y barbería contemporánea', sucursalId: 'suc-usaquen' },
  { id: 103, nombre: 'Santiago "El Maestro"', especialidad: 'Afeitados rituales con toalla caliente y barbas esculpidas', sucursalId: 'suc-chapinero' },
  { id: 104, nombre: 'Alejandro "The Fade"', especialidad: 'Fade impecable, pompadour y diseño capilar', sucursalId: 'suc-chico' }
];

export const usuariosRegistrados: Usuario[] = [
  {
    id: 'USR-ADMIN-01',
    nombre: 'Administrador General',
    email: 'admin@casadelrey.com',
    rol: 'Administrador',
    sucursalAsignada: 'todas',
    puedeVerApi: false,
    activo: true,
    creadoEn: '2026-09-01T07:00:00.000Z'
  },
  {
    id: 'USR-CAJA-01',
    nombre: 'Cajero Chicó',
    email: 'caja@casadelrey.com',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    activo: true,
    creadoEn: '2026-09-01T07:00:00.000Z'
  }
];

export const citasRegistradas: Cita[] = [];
export const cortesRegistrados: CorteDiario[] = [];
export const gastosRegistrados: GastoDiario[] = [];
export const arqueosRegistrados: ArqueoCaja[] = [];
