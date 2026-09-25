import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Cita, Barbero, CorteDiario, ArqueoCaja } from '../types';
import { encryptSensitiveCitaData } from './dbEncryption';

// Initialize Firebase App safely with official config and graceful error recovery
let appInstance: any;
let dbInstance: any;
let authInstance: any;
let storageInstance: any;

try {
  appInstance = initializeApp(firebaseConfig);
} catch (err: any) {
  console.warn('[Firebase] initializeApp recovery:', err?.message || err);
}

try {
  dbInstance = appInstance ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId) : ({} as any);
} catch (err: any) {
  console.warn('[Firebase] getFirestore recovery:', err?.message || err);
  dbInstance = {} as any;
}

try {
  authInstance = appInstance ? getAuth(appInstance) : ({} as any);
} catch (err: any) {
  console.warn('[Firebase] getAuth recovery:', err?.message || err);
  authInstance = {} as any;
}

try {
  storageInstance = appInstance ? getStorage(appInstance, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined) : ({} as any);
} catch (err: any) {
  console.warn('[Firebase] getStorage recovery:', err?.message || err);
  storageInstance = {} as any;
}

export const db = dbInstance;
export const auth = authInstance;
export const storage = storageInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Prueba la conexión directa al iniciar la aplicación
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore conectado exitosamente.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Aviso: el cliente está offline o conectando a Firestore.');
    }
    return false;
  }
}

// Ejecutar prueba de conexión al cargar módulo
testConnection();

/**
 * Sincronizar / Guardar una Cita en Firestore
 */
export async function guardarCitaEnFirestore(cita: Cita): Promise<void> {
  const id = cita.idReserva || (cita as any).id || `CITA-${Date.now()}`;
  const path = `citas/${id}`;
  try {
    const citaEncriptada = await encryptSensitiveCitaData(cita);
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(citaEncriptada)) {
      if (value !== undefined) {
        sanitizedData[key] = value;
      }
    }
    sanitizedData.idReserva = id;
    sanitizedData.fechaGuardado = new Date().toISOString();

    await setDoc(doc(db, 'citas', id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener todas las citas desde Firestore
 */
export async function obtenerCitasDeFirestore(): Promise<Cita[]> {
  const path = 'citas';
  try {
    const q = query(collection(db, 'citas'), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    const citas: Cita[] = [];
    snapshot.forEach((docSnap) => {
      citas.push(docSnap.data() as Cita);
    });
    return citas;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Actualizar estado de una cita en Firestore
 */
export async function actualizarEstadoCitaEnFirestore(citaId: string, nuevoEstado: Cita['estado']): Promise<void> {
  const path = `citas/${citaId}`;
  try {
    await updateDoc(doc(db, 'citas', citaId), {
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Guardar registro de corte diario en Firestore
 */
export async function guardarCorteEnFirestore(corte: CorteDiario): Promise<void> {
  const path = `cortes_diarios/${corte.id}`;
  try {
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(corte)) {
      if (value !== undefined) {
        sanitizedData[key] = value;
      }
    }
    await setDoc(doc(db, 'cortes_diarios', corte.id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener todos los cortes de una fecha desde Firestore
 */
export async function obtenerCortesDeFirestore(fecha: string): Promise<CorteDiario[]> {
  const path = 'cortes_diarios';
  try {
    const snapshot = await getDocs(collection(db, 'cortes_diarios'));
    const cortes: CorteDiario[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as CorteDiario;
      if (data.fecha === fecha) {
        cortes.push(data);
      }
    });
    return cortes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Guardar registro de arqueo oficial de caja en Firestore
 */
export async function guardarArqueoEnFirestore(arqueo: ArqueoCaja): Promise<void> {
  const path = `caja_arqueos/${arqueo.id}`;
  try {
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(arqueo)) {
      if (value !== undefined) {
        sanitizedData[key] = value;
      }
    }
    await setDoc(doc(db, 'caja_arqueos', arqueo.id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener todos los arqueos de una fecha o sucursal desde Firestore
 */
export async function obtenerArqueosDeFirestore(fecha?: string): Promise<ArqueoCaja[]> {
  const path = 'caja_arqueos';
  try {
    const snapshot = await getDocs(collection(db, 'caja_arqueos'));
    const arqueos: ArqueoCaja[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ArqueoCaja;
      if (!fecha || data.fecha === fecha) {
        arqueos.push(data);
      }
    });
    return arqueos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
