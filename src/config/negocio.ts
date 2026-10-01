/**
 * Configuración oficial y unificada de datos del negocio: Barbería La Casa del Rey
 * Todos los módulos de interfaz y servicios leen estos valores centralizados.
 */

export interface DatosNegocio {
  nombre: string;
  razonSocial: string;
  nit: string;
  eslogan: string;
  telefonoPrincipal: string;
  telefonoSecundario: string;
  whatsappNumero: string;
  whatsappDisplay: string;
  emailContacto: string;
  emailSoporte: string;
  sitioWeb: string;
  ciudad: string;
  pais: string;
  horarioAtencion: {
    lunesASabado: string;
    domingosYFestivos: string;
  };
  sedes: {
    id: string;
    nombre: string;
    direccion: string;
    barrio: string;
    telefono: string;
  }[];
}

export const CONFIG_NEGOCIO: DatosNegocio = {
  nombre: 'Barbería La Casa del Rey',
  razonSocial: 'Barbería La Casa del Rey S.A.S.',
  nit: '901.458.932-1',
  eslogan: 'Tradición, distinción y maestría en cada corte',
  telefonoPrincipal: '+57 312 644 1665',
  telefonoSecundario: '+57 300 123 4567',
  whatsappNumero: '573126441665',
  whatsappDisplay: '+57 312 644 1665',
  emailContacto: 'contacto@casadelrey.com',
  emailSoporte: 'soporte@casadelrey.com',
  sitioWeb: 'https://casadelrey.com',
  ciudad: 'Bogotá D.C.',
  pais: 'Colombia',
  horarioAtencion: {
    lunesASabado: '8:00 AM - 8:00 PM',
    domingosYFestivos: '9:00 AM - 6:00 PM'
  },
  sedes: [
    {
      id: 'suc-chico',
      nombre: 'Sede Chicó Real',
      direccion: 'Carrera 15 # 88-34, Bogotá',
      barrio: 'Chicó Norte',
      telefono: '+57 312 644 1665'
    },
    {
      id: 'suc-usaquen',
      nombre: 'Sede Usaquén Colonial',
      direccion: 'Calle 119 # 6-18, Bogotá',
      barrio: 'Usaquén',
      telefono: '+57 312 644 1665'
    },
    {
      id: 'suc-chapinero',
      nombre: 'Sede Chapinero Alto',
      direccion: 'Carrera 7 # 54-20, Bogotá',
      barrio: 'Chapinero Alto',
      telefono: '+57 312 644 1665'
    }
  ]
};
