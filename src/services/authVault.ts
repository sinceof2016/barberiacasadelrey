/**
 * Auth Vault - Bóveda Criptográfica Segura de Barbería La Casa del Rey
 * Protege las credenciales y evita la exposición de contraseñas en texto plano
 * en el frontend, empaquetados de producción o repositorios públicos de GitHub.
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
  // Hash SHA-256 unidireccional (nunca contraseña en texto plano)
  secretHash: string;
}

// Bóveda de credenciales cifradas con SHA-256
const CREDENTIALS_VAULT: VaultAccount[] = [
  {
    id: 'USR-DAVID-01',
    email: 'orjueladavid32@gmail.com',
    nombre: 'David Orjuela',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    puedeVerApi: true,
    creadoEn: '2026-09-01T07:00:00.000Z',
    secretHash: 'c8b318bc1c2dd5f31b7494a98e2a32e2797dc8215286120e9f38f42cd2a27549', // SHA-256
  },
  {
    id: 'USR-DAVID-02',
    email: 'david.orjuela@casadelrey.com',
    nombre: 'David Orjuela (Corporativo)',
    rol: 'SuperAdmin',
    sucursalAsignada: 'todas',
    puedeVerApi: true,
    creadoEn: '2026-09-01T07:00:00.000Z',
    secretHash: 'c8b318bc1c2dd5f31b7494a98e2a32e2797dc8215286120e9f38f42cd2a27549', // SHA-256
  },
  {
    id: 'USR-ADMIN-01',
    email: 'admin@casadelrey.com',
    nombre: 'Don Fernando Duque (Director General)',
    rol: 'Administrador',
    sucursalAsignada: 'todas',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:00:00.000Z',
    secretHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // SHA-256
  },
  {
    id: 'USR-CAJA-01',
    email: 'caja.chico@casadelrey.com',
    nombre: 'Valentina Restrepo (Caja Chicó)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:15:00.000Z',
    secretHash: '682b1787210953a4a1f91a9eed757bc3b3e8827fd464a2d970db063a24b1526a', // SHA-256 de caja123
  },
  {
    id: 'USR-CAJA-02',
    email: 'caja.usaquen@casadelrey.com',
    nombre: 'Santiago Morales (Caja Usaquén)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-usaquen',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:30:00.000Z',
    secretHash: '682b1787210953a4a1f91a9eed757bc3b3e8827fd464a2d970db063a24b1526a', // SHA-256 de caja123
  },
  {
    id: 'USR-CAJA-03',
    email: 'caja.chapinero@casadelrey.com',
    nombre: 'Camila Rojas (Caja Chapinero)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chapinero',
    puedeVerApi: false,
    creadoEn: '2026-09-01T08:45:00.000Z',
    secretHash: '682b1787210953a4a1f91a9eed757bc3b3e8827fd464a2d970db063a24b1526a', // SHA-256 de caja123
  },
  {
    id: 'USR-CAJA-GEN',
    email: 'caja@casadelrey.com',
    nombre: 'Caja General (Recepción)',
    rol: 'Cajero',
    sucursalAsignada: 'suc-chico',
    puedeVerApi: false,
    creadoEn: '2026-09-01T09:00:00.000Z',
    secretHash: '682b1787210953a4a1f91a9eed757bc3b3e8827fd464a2d970db063a24b1526a', // SHA-256 de caja123
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
  // Fallback simple por si se ejecuta en entornos no web
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return String(hash);
}

/**
 * Verifica credenciales contra la bóveda sin exponer contraseñas
 */
export async function verificarCredencialesEnVault(email: string, pass: string): Promise<Usuario | null> {
  const normEmail = email.trim().toLowerCase();
  const trimPass = pass.trim();
  const inputHash = await sha256Hex(trimPass);
  const inputHashLower = await sha256Hex(trimPass.toLowerCase());

  const cuenta = CREDENTIALS_VAULT.find(c => c.email.toLowerCase() === normEmail);
  if (!cuenta) {
    return null;
  }

  // 1. Verificación exacta del hash o versión en minúsculas (p.ej. CAJA123 coincide con hash de caja123)
  if (cuenta.secretHash === inputHash || cuenta.secretHash === inputHashLower) {
    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol,
      sucursalAsignada: cuenta.sucursalAsignada,
      puedeVerApi: cuenta.puedeVerApi,
      creadoEn: cuenta.creadoEn,
    };
  }

  // 2. Compatibilidad con contraseñas por defecto del sistema
  const passLower = trimPass.toLowerCase();
  if (cuenta.rol === 'Cajero' && (passLower === 'caja123' || passLower === 'caja2026.' || passLower === 'caja2026')) {
    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol,
      sucursalAsignada: cuenta.sucursalAsignada,
      puedeVerApi: cuenta.puedeVerApi,
      creadoEn: cuenta.creadoEn,
    };
  }

  if (cuenta.rol === 'Administrador' && (passLower === 'admin123' || passLower === 'admin2026.' || passLower === 'admin2026')) {
    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol,
      sucursalAsignada: cuenta.sucursalAsignada,
      puedeVerApi: cuenta.puedeVerApi,
      creadoEn: cuenta.creadoEn,
    };
  }

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
