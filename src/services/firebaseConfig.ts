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

// Configuración provista a través de la capa de Bóveda Segura y variables de entorno
export const firebaseConfig: SafeFirebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || DEFAULT_PUBLIC_CONFIG.apiKey || 'AIzaSyC2DJw9R_3pK8G9-h0FoC5L9QPluBp5ZZo',
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || DEFAULT_PUBLIC_CONFIG.authDomain || 'galvanized-emblem-pzp2g.firebaseapp.com',
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || DEFAULT_PUBLIC_CONFIG.projectId || 'galvanized-emblem-pzp2g',
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_PUBLIC_CONFIG.storageBucket || 'galvanized-emblem-pzp2g.firebasestorage.app',
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_PUBLIC_CONFIG.messagingSenderId || '393020568997',
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || DEFAULT_PUBLIC_CONFIG.appId || '1:393020568997:web:45a46bfadfecb5bdaae44c',
  firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) || DEFAULT_PUBLIC_CONFIG.firestoreDatabaseId || 'ai-studio-barberacasadelre-368fa07e-9afe-4bc0-b184-87a415921ad5',
  oAuthClientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_OAUTH_CLIENT_ID) || DEFAULT_PUBLIC_CONFIG.oAuthClientId || '393020568997-r88ugt8i5et2jt59291vlqvfn1cl1e90.apps.googleusercontent.com',
};

/**
 * Función utilitaria para mostrar claves ofuscadas en consolas de auditoría sin exponer el secreto
 */
export function ofuscarClave(clave?: string): string {
  return enmascararSecreto(clave);
}

export default firebaseConfig;

