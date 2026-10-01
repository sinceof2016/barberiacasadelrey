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
  where,
  orderBy 
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { Cita, Barbero, CorteDiario, ArqueoCaja, GastoDiario } from '../types';
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
 * Obtener citas desde Firestore (Solo para personal autenticado; con filtro por sede si corresponde)
 */
export async function obtenerCitasDeFirestore(sucursalId?: string): Promise<Cita[]> {
  const path = 'citas';
  if (!authInstance?.currentUser) {
    return [];
  }
  try {
    let q;
    if (sucursalId && sucursalId !== 'todas') {
      q = query(
        collection(db, 'citas'),
        where('sucursalId', '==', sucursalId),
        orderBy('fecha', 'desc')
      );
    } else {
      q = query(collection(db, 'citas'), orderBy('fecha', 'desc'));
    }
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
    // Asegurar sede por defecto si no viene explícita
    if (!sanitizedData.sucursalId) {
      sanitizedData.sucursalId = 'suc-chico';
    }
    await setDoc(doc(db, 'cortes_diarios', corte.id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener cortes desde Firestore (filtrado por fecha y sucursal si corresponde)
 */
export async function obtenerCortesDeFirestore(fecha?: string, sucursalId?: string): Promise<CorteDiario[]> {
  const path = 'cortes_diarios';
  try {
    let q;
    if (sucursalId && sucursalId !== 'todas' && fecha) {
      q = query(
        collection(db, 'cortes_diarios'),
        where('sucursalId', '==', sucursalId),
        where('fecha', '==', fecha)
      );
    } else if (sucursalId && sucursalId !== 'todas') {
      q = query(
        collection(db, 'cortes_diarios'),
        where('sucursalId', '==', sucursalId)
      );
    } else if (fecha) {
      q = query(
        collection(db, 'cortes_diarios'),
        where('fecha', '==', fecha)
      );
    } else {
      q = query(collection(db, 'cortes_diarios'));
    }
    const snapshot = await getDocs(q);
    const cortes: CorteDiario[] = [];
    snapshot.forEach((docSnap) => {
      cortes.push(docSnap.data() as CorteDiario);
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
    if (!sanitizedData.sucursalId) {
      sanitizedData.sucursalId = 'suc-chico';
    }
    await setDoc(doc(db, 'caja_arqueos', arqueo.id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener arqueos desde Firestore (filtrado por sucursal y fecha si corresponde)
 */
export async function obtenerArqueosDeFirestore(fecha?: string, sucursalId?: string): Promise<ArqueoCaja[]> {
  const path = 'caja_arqueos';
  try {
    let q;
    if (sucursalId && sucursalId !== 'todas' && fecha) {
      q = query(
        collection(db, 'caja_arqueos'),
        where('sucursalId', '==', sucursalId),
        where('fecha', '==', fecha)
      );
    } else if (sucursalId && sucursalId !== 'todas') {
      q = query(
        collection(db, 'caja_arqueos'),
        where('sucursalId', '==', sucursalId)
      );
    } else if (fecha) {
      q = query(
        collection(db, 'caja_arqueos'),
        where('fecha', '==', fecha)
      );
    } else {
      q = query(collection(db, 'caja_arqueos'));
    }
    const snapshot = await getDocs(q);
    const arqueos: ArqueoCaja[] = [];
    snapshot.forEach((docSnap) => {
      arqueos.push(docSnap.data() as ArqueoCaja);
    });
    return arqueos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Guardar registro de gasto operativo en Firestore
 */
export async function guardarGastoEnFirestore(gasto: GastoDiario): Promise<void> {
  const path = `gastos/${gasto.id}`;
  try {
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(gasto)) {
      if (value !== undefined) {
        sanitizedData[key] = value;
      }
    }
    if (!sanitizedData.sucursalId) {
      sanitizedData.sucursalId = 'suc-chico';
    }
    await setDoc(doc(db, 'gastos', gasto.id), sanitizedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Obtener gastos operativos desde Firestore
 */
export async function obtenerGastosDeFirestore(fecha?: string, sucursalId?: string): Promise<GastoDiario[]> {
  const path = 'gastos';
  try {
    let q;
    if (sucursalId && sucursalId !== 'todas' && fecha) {
      q = query(
        collection(db, 'gastos'),
        where('sucursalId', '==', sucursalId),
        where('fecha', '==', fecha)
      );
    } else if (sucursalId && sucursalId !== 'todas') {
      q = query(
        collection(db, 'gastos'),
        where('sucursalId', '==', sucursalId)
      );
    } else if (fecha) {
      q = query(
        collection(db, 'gastos'),
        where('fecha', '==', fecha)
      );
    } else {
      q = query(collection(db, 'gastos'));
    }
    const snapshot = await getDocs(q);
    const gastos: GastoDiario[] = [];
    snapshot.forEach((docSnap) => {
      gastos.push(docSnap.data() as GastoDiario);
    });
    return gastos;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
