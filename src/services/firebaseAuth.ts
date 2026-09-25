import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  Auth
} from 'firebase/auth';
import { auth } from './firebase';

export { auth };

// Configure Google Auth Provider with Calendar Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
// Prompt user to select account if needed
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if sign-in is in progress
let isSigningIn = false;

// In-memory access token cache (NEVER stored in localStorage / sessionStorage)
let cachedAccessToken: string | null = null;

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth || typeof onAuthStateChanged !== 'function') {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          // If user is logged in to Firebase but token is not in memory (e.g. page refresh),
          // we keep the user state and can prompt for token or wait for user action
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  } catch (err) {
    console.warn('[FirebaseAuth] Error in onAuthStateChanged:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

/**
 * Initiate Google Sign-In with Calendar scopes on user gesture
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set token in memory (for state sync)
 */
export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Logout from Firebase Auth and wipe cached token
 */
export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
