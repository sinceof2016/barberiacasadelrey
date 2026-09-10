import { Sucursal } from '../types';

export const SUCURSALES_CASA_DEL_REY: Sucursal[] = [
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

export function getSucursalById(id?: string): Sucursal {
  const found = SUCURSALES_CASA_DEL_REY.find(s => s.id === id);
  return found || SUCURSALES_CASA_DEL_REY[0];
}
