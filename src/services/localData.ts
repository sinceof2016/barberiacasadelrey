import { Servicio, Sucursal, Barbero, Usuario } from '../types';

export const sucursalesCasaDelRey: Sucursal[] = [
  {
    id: 'suc-chico',
    nombre: 'Sede Chicó Real',
    ciudad: 'Bogotá D.C.',
    direccion: 'Cl. 93 # 13-45, Chicó Norte / Parque de la 93',
    telefono: '+57 (601) 745-8891',
    horario: 'Lun - Sáb: 09:00 AM - 07:00 PM',
    color: '#C59B27',
    descripcion: 'Sede insignia con exclusivo salón VIP, toalla caliente y bar de cortesía con whisky y café de origen.'
  },
  {
    id: 'suc-usaquen',
    nombre: 'Sede Usaquén Colonial',
    ciudad: 'Bogotá D.C.',
    direccion: 'Cra. 6 # 119-32, Plaza Colonial de Usaquén',
    telefono: '+57 (601) 620-4412',
    horario: 'Lun - Sáb: 09:00 AM - 07:00 PM',
    color: '#D4AF37',
    descripcion: 'Tradición y arquitectura colonial, sillones de cuero capitoneado y rituales de afeitado con navaja libre.'
  },
  {
    id: 'suc-chapinero',
    nombre: 'Sede Chapinero Vintage',
    ciudad: 'Bogotá D.C.',
    direccion: 'Cl. 67 # 5-20, Zona G / Chapinero Alto',
    telefono: '+57 (601) 310-9944',
    horario: 'Lun - Sáb: 09:00 AM - 07:00 PM',
    color: '#E5C07B',
    descripcion: 'Espacio vintage industrial con barbería clásica británica, música jazz y cuidado capilar premium.'
  }
];

export const serviciosCasaDelRey: Servicio[] = [
  { 
    id: 1, 
    nombre: 'Corte de Cabello Real', 
    duracionMinutos: 40, 
    precio: 35000,
    descripcion: 'Lavado premium, asesoría personalizada, corte a navaja y peinado con cera mate.'
  },
  { 
    id: 2, 
    nombre: 'Arreglo de Barba Imperial', 
    duracionMinutos: 30, 
    precio: 25000,
    descripcion: 'Toallas calientes aromatizadas, perfilado fino a navaja y tratamiento con aceites nutritivos.'
  },
  { 
    id: 3, 
    nombre: 'Diseño & Perfilado de Cejas', 
    duracionMinutos: 20, 
    precio: 15000,
    descripcion: 'Delineado masculino tradicional con navaja clásica, limpieza de arco y tónico calmante refrescante.'
  },
  { 
    id: 4, 
    nombre: 'Combo Cabello + Barba', 
    duracionMinutos: 60, 
    precio: 55000,
    descripcion: 'La combinación estelar: corte de precisión artesanal y ritual completo de barba con toallas calientes.'
  },
  { 
    id: 5, 
    nombre: 'Combo Cabello + Cejas', 
    duracionMinutos: 50, 
    precio: 45000,
    descripcion: 'Corte de cabello personalizado más diseño y perfilado de cejas tradicional con navaja barbera.'
  },
  { 
    id: 6, 
    nombre: 'Combo Cejas + Barba', 
    duracionMinutos: 45, 
    precio: 35000,
    descripcion: 'Ritual de toallas calientes, perfilado fino de barba y delineado sobrio de cejas masculinas.'
  },
  { 
    id: 7, 
    nombre: 'Combo Tríada Real (Cabello + Barba + Cejas)', 
    duracionMinutos: 75, 
    precio: 65000,
    descripcion: 'Experiencia total para caballeros: corte clásico de cabello, ritual de barba completo y perfilado de cejas.'
  }
];

export const barberosCasaDelRey: Barbero[] = [
  { id: 101, nombre: 'Carlos "El Maestro"', especialidad: 'Cortes Clásicos & Navaja Libre', sucursalId: 'suc-chico', sucursalNombre: 'Sede Chicó Real' },
  { id: 102, nombre: 'Mateo "Lord Fade"', especialidad: 'Degradados & Tendencia Urbana', sucursalId: 'suc-chico', sucursalNombre: 'Sede Chicó Real' },
  { id: 201, nombre: 'Santi "Perfilado"', especialidad: 'Barbas & Toallas Calientes', sucursalId: 'suc-usaquen', sucursalNombre: 'Sede Usaquén Colonial' },
  { id: 202, nombre: 'Javier "Navaja Real"', especialidad: 'Afeitado Tradicional & Bigote', sucursalId: 'suc-usaquen', sucursalNombre: 'Sede Usaquén Colonial' },
  { id: 301, nombre: 'Andrés "Old School"', especialidad: 'Pompadour & Estilo Británico', sucursalId: 'suc-chapinero', sucursalNombre: 'Sede Chapinero Vintage' },
  { id: 302, nombre: 'David "El Cirujano"', especialidad: 'Perfilado Quirúrgico & Barboterapia', sucursalId: 'suc-chapinero', sucursalNombre: 'Sede Chapinero Vintage' }
];

export const HORARIOS_CONFIG = [
  { hora24: '09:00', hora12: '09:00 AM' },
  { hora24: '10:00', hora12: '10:00 AM' },
  { hora24: '11:00', hora12: '11:00 AM' },
  { hora24: '12:00', hora12: '12:00 PM' },
  { hora24: '13:00', hora12: '01:00 PM' },
  { hora24: '14:00', hora12: '02:00 PM' },
  { hora24: '15:00', hora12: '03:00 PM' },
  { hora24: '16:00', hora12: '04:00 PM' },
  { hora24: '17:00', hora12: '05:00 PM' },
  { hora24: '18:00', hora12: '06:00 PM' },
  { hora24: '19:00', hora12: '07:00 PM' },
];

export const usuariosIniciales: Usuario[] = [
  {
    id: 'USR-DAVID-01',
    nombre: 'David Orjuela',
    email: 'orjueladavid32@gmail.com',
    password: 'Deivid17.',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    creadoEn: '2026-09-01T07:00:00.000Z',
    puedeVerApi: true
  },
  {
    id: 'USR-DAVID-02',
    nombre: 'David Orjuela (Corporativo)',
    email: 'david.orjuela@casadelrey.com',
    password: 'Deivid17.',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    creadoEn: '2026-09-01T07:00:00.000Z',
    puedeVerApi: true
  },
  {
    id: 'USR-ADMIN-01',
    nombre: 'Don Fernando Duque (Director General)',
    email: 'admin@casadelrey.com',
    password: 'admin123',
    rol: 'Administrador',
    sucursalAsignada: 'todas',
    creadoEn: '2026-09-01T08:00:00.000Z',
    puedeVerApi: false
  },
  {
    id: 'USR-CAJA-01',
    nombre: 'Valentina Restrepo (Caja Chicó)',
    email: 'caja.chico@casadelrey.com',
    password: 'caja123',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    creadoEn: '2026-09-01T08:15:00.000Z',
    puedeVerApi: false
  },
  {
    id: 'USR-CAJA-GEN',
    nombre: 'Caja General (Recepción)',
    email: 'caja@casadelrey.com',
    password: 'caja123',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    creadoEn: '2026-09-01T09:00:00.000Z',
    puedeVerApi: false
  }
];
