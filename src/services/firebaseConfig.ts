/**
 * Gestión Segura de Credenciales Firebase - Barbería La Casa del Rey
 * Las credenciales se leen preferentemente desde variables de entorno (VITE_FIREBASE_*)
 * para prevenir fugas accidentales en repositorios públicos de GitHub.
 */

interface SafeFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

// Importación estática del JSON de configuración local
import localJsonConfigRaw from '../../firebase-applet-config.json';

const localJsonConfig: any = localJsonConfigRaw || {};

export const firebaseConfig: SafeFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    localJsonConfig.apiKey ||
    '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    localJsonConfig.authDomain ||
    'galvanized-emblem-pzp2g.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    localJsonConfig.projectId ||
    'galvanized-emblem-pzp2g',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    localJsonConfig.storageBucket ||
    'galvanized-emblem-pzp2g.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    localJsonConfig.messagingSenderId ||
    '393020568997',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    localJsonConfig.appId ||
    '1:393020568997:web:45a46bfadfecb5bdaae44c',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    localJsonConfig.firestoreDatabaseId ||
    'ai-studio-barberacasadelre-368fa07e-9afe-4bc0-b184-87a415921ad5',
  oAuthClientId:
    import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID ||
    localJsonConfig.oAuthClientId ||
    '393020568997-r88ugt8i5et2jt59291vlqvfn1cl1e90.apps.googleusercontent.com',
};

/**
 * Función utilitaria para mostrar claves ofuscadas en consolas de auditoría sin exponer el secreto
 */
export function ofuscarClave(clave?: string): string {
  if (!clave || clave.length < 8) return '••••••••••••';
  return `${clave.slice(0, 6)}••••••••${clave.slice(-4)}`;
}

export default firebaseConfig;
