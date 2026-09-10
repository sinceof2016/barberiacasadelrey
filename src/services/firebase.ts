import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
import firebaseConfig from '../../firebase-applet-config.json';
import { Cita, Barbero, CorteDiario } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(cita)) {
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
