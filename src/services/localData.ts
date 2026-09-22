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

export const DIAS_SEMANA_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const barberosCasaDelRey: Barbero[] = [
  { 
    id: 101, 
    nombre: 'Carlos "El Maestro"', 
    especialidad: 'Cortes Clásicos & Navaja Libre', 
    sucursalId: 'suc-chico', 
    sucursalNombre: 'Sede Chicó Real',
    descripcion: 'Maestro barbero tradicional con más de 15 años de oficio en barberías británicas y bogotanas.',
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    diasDescanso: [0, 6], // Domingos y Sábados
    jornada: {
      horaInicio: '09:00 AM',
      horaFin: '06:00 PM',
      recesoInicio: '01:00 PM',
      recesoFin: '02:00 PM',
    },
    calendario: {
      barberoId: 101,
      barberoNombre: 'Carlos "El Maestro"',
      sucursalId: 'suc-chico',
      sucursalNombre: 'Sede Chicó Real',
      diasLaborales: [1, 2, 3, 4, 5],
      diasDescanso: [0, 6],
      jornada: {
        horaInicio: '09:00 AM',
        horaFin: '06:00 PM',
        recesoInicio: '01:00 PM',
        recesoFin: '02:00 PM',
      },
      excepciones: []
    }
  },
  { 
    id: 102, 
    nombre: 'Mateo "Lord Fade"', 
    especialidad: 'Degradados & Tendencia Urbana', 
    sucursalId: 'suc-chico', 
    sucursalNombre: 'Sede Chicó Real',
    descripcion: 'Especialista en fades pulidos al milímetro, texturizado moderno y diseños de barba.',
    diasLaborales: [2, 3, 4, 5, 6], // Martes a Sábado
    diasDescanso: [0, 1], // Domingos y Lunes
    jornada: {
      horaInicio: '11:00 AM',
      horaFin: '07:00 PM',
      recesoInicio: '03:00 PM',
      recesoFin: '04:00 PM',
    },
    calendario: {
      barberoId: 102,
      barberoNombre: 'Mateo "Lord Fade"',
      sucursalId: 'suc-chico',
      sucursalNombre: 'Sede Chicó Real',
      diasLaborales: [2, 3, 4, 5, 6],
      diasDescanso: [0, 1],
      jornada: {
        horaInicio: '11:00 AM',
        horaFin: '07:00 PM',
        recesoInicio: '03:00 PM',
        recesoFin: '04:00 PM',
      },
      excepciones: []
    }
  },
  { 
    id: 201, 
    nombre: 'Santi "Perfilado"', 
    especialidad: 'Barbas & Toallas Calientes', 
    sucursalId: 'suc-usaquen', 
    sucursalNombre: 'Sede Usaquén Colonial',
    descripcion: 'Experto en rituales completos de afeitado con toalla caliente y aceites balsámicos esenciales.',
    diasLaborales: [0, 3, 4, 5, 6], // Miércoles a Domingo
    diasDescanso: [1, 2], // Lunes y Martes
    jornada: {
      horaInicio: '09:00 AM',
      horaFin: '05:00 PM',
      recesoInicio: '01:00 PM',
      recesoFin: '02:00 PM',
    },
    calendario: {
      barberoId: 201,
      barberoNombre: 'Santi "Perfilado"',
      sucursalId: 'suc-usaquen',
      sucursalNombre: 'Sede Usaquén Colonial',
      diasLaborales: [0, 3, 4, 5, 6],
      diasDescanso: [1, 2],
      jornada: {
        horaInicio: '09:00 AM',
        horaFin: '05:00 PM',
        recesoInicio: '01:00 PM',
        recesoFin: '02:00 PM',
      },
      excepciones: []
    }
  },
  { 
    id: 202, 
    nombre: 'Javier "Navaja Real"', 
    especialidad: 'Afeitado Tradicional & Bigote', 
    sucursalId: 'suc-usaquen', 
    sucursalNombre: 'Sede Usaquén Colonial',
    descripcion: 'Artesano de la navaja libre, perfilado clásico de barba cuadrada y diseño de bigote.',
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    diasDescanso: [0, 6], // Domingos y Sábados
    jornada: {
      horaInicio: '10:00 AM',
      horaFin: '07:00 PM',
      recesoInicio: '02:00 PM',
      recesoFin: '03:00 PM',
    },
    calendario: {
      barberoId: 202,
      barberoNombre: 'Javier "Navaja Real"',
      sucursalId: 'suc-usaquen',
      sucursalNombre: 'Sede Usaquén Colonial',
      diasLaborales: [1, 2, 3, 4, 5],
      diasDescanso: [0, 6],
      jornada: {
        horaInicio: '10:00 AM',
        horaFin: '07:00 PM',
        recesoInicio: '02:00 PM',
        recesoFin: '03:00 PM',
      },
      excepciones: []
    }
  },
  { 
    id: 301, 
    nombre: 'Andrés "Old School"', 
    especialidad: 'Pompadour & Estilo Británico', 
    sucursalId: 'suc-chapinero', 
    sucursalNombre: 'Sede Chapinero Vintage',
    descripcion: 'Cortes ejecutivos, pompadour pulido y técnicas tradicionales de tijera sobre peine.',
    diasLaborales: [1, 2, 4, 5, 6], // Lunes, Martes, Jueves, Viernes, Sábado
    diasDescanso: [0, 3], // Domingos y Miércoles
    jornada: {
      horaInicio: '09:00 AM',
      horaFin: '06:00 PM',
      recesoInicio: '01:00 PM',
      recesoFin: '02:00 PM',
    },
    calendario: {
      barberoId: 301,
      barberoNombre: 'Andrés "Old School"',
      sucursalId: 'suc-chapinero',
      sucursalNombre: 'Sede Chapinero Vintage',
      diasLaborales: [1, 2, 4, 5, 6],
      diasDescanso: [0, 3],
      jornada: {
        horaInicio: '09:00 AM',
        horaFin: '06:00 PM',
        recesoInicio: '01:00 PM',
        recesoFin: '02:00 PM',
      },
      excepciones: []
    }
  },
  { 
    id: 302, 
    nombre: 'David "El Cirujano"', 
    especialidad: 'Perfilado Quirúrgico & Barboterapia', 
    sucursalId: 'suc-chapinero', 
    sucursalNombre: 'Sede Chapinero Vintage',
    descripcion: 'Precisión milimétrica en contornos, exfoliación facial y tratamiento profundo para barba.',
    diasLaborales: [0, 2, 3, 4, 5, 6], // Martes a Domingo
    diasDescanso: [1], // Lunes
    jornada: {
      horaInicio: '10:00 AM',
      horaFin: '07:00 PM',
      recesoInicio: '02:00 PM',
      recesoFin: '03:00 PM',
    },
    calendario: {
      barberoId: 302,
      barberoNombre: 'David "El Cirujano"',
      sucursalId: 'suc-chapinero',
      sucursalNombre: 'Sede Chapinero Vintage',
      diasLaborales: [0, 2, 3, 4, 5, 6],
      diasDescanso: [1],
      jornada: {
        horaInicio: '10:00 AM',
        horaFin: '07:00 PM',
        recesoInicio: '02:00 PM',
        recesoFin: '03:00 PM',
      },
      excepciones: []
    }
  }
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

import { obtenerUsuariosSeguros } from './authVault';

// Usuarios iniciales protegidos (sin credenciales expuestas en frontend)
export const usuariosIniciales: Usuario[] = obtenerUsuariosSeguros();

