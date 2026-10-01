/**
 * Auth Vault - Catálogo de Usuarios y Perfiles de Barbería La Casa del Rey
 * Define los perfiles iniciales del sistema sin almacenar contraseñas ni hashes en el cliente.
 */

import { Usuario } from '../types';

export interface VaultAccount {
  id: string;
  email: string;
  nombre: string;
  rol: 'SuperAdmin' | 'Administrador' | 'Cajero';
  sucursalAsignada: string;
  puedeVerApi: boolean;
  creadoEn: string;
}

// Catálogo de cuentas iniciales del sistema (sin secretos ni contraseñas)
const CREDENTIALS_VAULT: VaultAccount[] = [
  {
    id: 'USR-DAVID-01',
    email: 'orjueladavid32@gmail.com',
    nombre: 'David Orjuela',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    puedeVerApi: true,
    creadoEn: '2026-09-01T07:00:00.000Z',
  },
  {
    id: 'USR-DAVID-02',
    email: 'david.orjuela@casadelrey.com',
    nombre: 'David Orjuela (Corporativo)',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    puedeVerApi: true,
    creadoEn: '2026-09-01T07:00:00.000Z',
  },
  {
    id: 'USR-ADMIN-01',
    email: 'admin@casadelrey.com',
    nombre: 'Don Fernando Duque (Director General)',
    rol: 'Administrador',
    sucursalAsignada: 'todas',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'USR-CAJA-01',
    email: 'caja.chico@casadelrey.com',
    nombre: 'Valentina Restrepo (Caja Chicó)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:15:00.000Z',
  },
  {
    id: 'USR-CAJA-02',
    email: 'caja.usaquen@casadelrey.com',
    nombre: 'Santiago Morales (Caja Usaquén)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-usaquen',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:30:00.000Z',
  },
  {
    id: 'USR-CAJA-03',
    email: 'caja.chapinero@casadelrey.com',
    nombre: 'Camila Rojas (Caja Chapinero)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chapinero',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:45:00.000Z',
  },
  {
    id: 'USR-CAJA-GEN',
    email: 'caja@casadelrey.com',
    nombre: 'Caja General (Recepción)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    creadoEn: '2026-09-01T09:00:00.000Z',
  }
];

/**
 * Calcula el digest SHA-256 de una cadena de texto
 */
export async function sha256Hex(plainText: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return String(hash);
}

/**
 * Verifica si una cuenta existe en el catálogo de perfiles
 */
export async function verificarCredencialesEnVault(email: string, _pass: string): Promise<Usuario | null> {
  const normEmail = email.trim().toLowerCase();
  const cuenta = CREDENTIALS_VAULT.find(c => c.email.toLowerCase() === normEmail);
  if (!cuenta) {
    return null;
  }
  // La autenticación real es gestionada por el servidor / Firebase Auth
  return null;
}

/**
 * Retorna los perfiles públicos de usuarios (sin hashes ni secretos)
 */
export function obtenerUsuariosSeguros(): Usuario[] {
  return CREDENTIALS_VAULT.map(c => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    rol: c.rol,
    sucursalAsignada: c.sucursalAsignada,
    puedeVerApi: c.puedeVerApi,
    creadoEn: c.creadoEn,
  }));
}
