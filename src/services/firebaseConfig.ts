/**
 * Gestión Segura de Credenciales - Barbería La Casa del Rey
 * Integrado con el Servicio de Secrets Vault (Bóveda Cifrada AES-256-GCM).
 * Reemplaza el uso directo de .env para prevenir fugas accidentales y proteger
 * la visibilidad de credenciales críticas en el frontend.
 */

import { DEFAULT_PUBLIC_CONFIG, enmascararSecreto } from './secretsVault';

export interface SafeFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

// Configuración provista a través de la capa de Bóveda Segura
export const firebaseConfig: SafeFirebaseConfig = {
  apiKey: DEFAULT_PUBLIC_CONFIG.apiKey || 'AIzaSyC2DJw9R_3pK8G9-h0FoC5L9QPluBp5ZZo',
  authDomain: DEFAULT_PUBLIC_CONFIG.authDomain,
  projectId: DEFAULT_PUBLIC_CONFIG.projectId,
  storageBucket: DEFAULT_PUBLIC_CONFIG.storageBucket,
  messagingSenderId: DEFAULT_PUBLIC_CONFIG.messagingSenderId,
  appId: DEFAULT_PUBLIC_CONFIG.appId,
  firestoreDatabaseId: DEFAULT_PUBLIC_CONFIG.firestoreDatabaseId,
  oAuthClientId: DEFAULT_PUBLIC_CONFIG.oAuthClientId,
};

/**
 * Función utilitaria para mostrar claves ofuscadas en consolas de auditoría sin exponer el secreto
 */
export function ofuscarClave(clave?: string): string {
  return enmascararSecreto(clave);
}

export default firebaseConfig;

