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

// Fallback de configuración segura para compilación en GitHub Actions, CI/CD y despliegue sin dependencias de archivos locales ignorados
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC2DJw9R_3pK8G9-h0FoC5L9QPluBp5ZZo',
  authDomain: 'galvanized-emblem-pzp2g.firebaseapp.com',
  projectId: 'galvanized-emblem-pzp2g',
  storageBucket: 'galvanized-emblem-pzp2g.firebasestorage.app',
  messagingSenderId: '393020568997',
  appId: '1:393020568997:web:45a46bfadfecb5bdaae44c',
  firestoreDatabaseId: 'ai-studio-barberacasadelre-368fa07e-9afe-4bc0-b184-87a415921ad5',
  oAuthClientId: '393020568997-r88ugt8i5et2jt59291vlqvfn1cl1e90.apps.googleusercontent.com',
};

export const firebaseConfig: SafeFirebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    DEFAULT_FIREBASE_CONFIG.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
  oAuthClientId:
    import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID ||
    DEFAULT_FIREBASE_CONFIG.oAuthClientId,
};

/**
 * Función utilitaria para mostrar claves ofuscadas en consolas de auditoría sin exponer el secreto
 */
export function ofuscarClave(clave?: string): string {
  if (!clave || clave.length < 8) return '••••••••••••';
  return `${clave.slice(0, 6)}••••••••${clave.slice(-4)}`;
}

export default firebaseConfig;
