/**
 * Configuración Comercial y Legal de Barbería La Casa del Rey
 * Centraliza los datos del titular, NIT, sedes y números de contacto
 * para evitar duplicación y permitir configuración por cliente.
 */

export interface SedeConfig {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
}

export interface BusinessConfig {
  nombreComercial: string;
  razonSocial: string;
  nit: string;
  telefonoPrincipal: string;
  emailContacto: string;
  sitioWeb: string;
  sedes: SedeConfig[];
}

export const BUSINESS_CONFIG: BusinessConfig = {
  nombreComercial: 'Barbería La Casa del Rey',
  razonSocial: 'Barbería La Casa del Rey S.A.S.',
  nit: '901.458.932-1',
  telefonoPrincipal: '+57 312 644 1665',
  emailContacto: 'contacto@casadelrey.com',
  sitioWeb: 'https://casadelrey.com',
  sedes: [
    {
      id: 'suc-chico',
      nombre: 'Sede Chicó Real',
      direccion: 'Cra. 15 #93-47, Chicó Norte',
      ciudad: 'Bogotá D.C.',
      telefono: '+57 312 644 1665'
    },
    {
      id: 'suc-usaquen',
      nombre: 'Sede Usaquén Colonial',
      direccion: 'Cl. 119 #6-18, Usaquén',
      ciudad: 'Bogotá D.C.',
      telefono: '+57 312 644 1665'
    },
    {
      id: 'suc-chapinero',
      nombre: 'Sede Chapinero Vintage',
      direccion: 'Cl. 63 #8-24, Chapinero Alto',
      ciudad: 'Bogotá D.C.',
      telefono: '+57 312 644 1665'
    }
  ]
};
