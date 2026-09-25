import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  Cloud, 
  RefreshCw, 
  Lock, 
  FileText, 
  Users, 
  Calendar,
  Sparkles,
  Layers,
  ArrowDownCircle,
  FileCheck
} from 'lucide-react';
import { 
  MetadataRespaldo, 
  EstadoSistemaRespaldo, 
  getEstadoRespaldos, 
  getListaRespaldos, 
  ejecutarRespaldoInmediato, 
  restaurarRespaldo, 
  descargarArchivoRespaldo 
} from '../services/backupService';
import { VintageCrownIcon, BarberPoleRibbon } from './VintageBarberIcons';

interface BackupManagementModuleProps {
  onDataRestored?: () => void;
}

export const BackupManagementModule: React.FC<BackupManagementModuleProps> = ({ onDataRestored }) => {
  const [estado, setEstado] = useState<EstadoSistemaRespaldo | null>(null);
  const [respaldos, setRespaldos] = useState<MetadataRespaldo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);
  const [modalConfirmarRestauracion, setModalConfirmarRestauracion] = useState<MetadataRespaldo | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [est, list] = await Promise.all([
        getEstadoRespaldos(),
        getListaRespaldos()
      ]);
      setEstado(est);
      setRespaldos(list);
    } catch (err: any) {
      setError(err.message || 'Error al cargar información de respaldos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000); // Refrescar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleCrearRespaldo = async () => {
    setEjecutando(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await ejecutarRespaldoInmediato();
      if (res.exito) {
        setMensajeExito(res.mensaje || 'Respaldo generado y custodiado en el bucket exitosamente.');
        await cargarDatos();
      } else {
        setError(res.mensaje || 'No se pudo generar el respaldo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setEjecutando(false);
    }
  };

  const handleConfirmarRestauracion = async () => {
    if (!modalConfirmarRestauracion) return;
    setRestaurandoId(modalConfirmarRestauracion.id);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await restaurarRespaldo(modalConfirmarRestauracion.id);
      if (res.exito) {
        setMensajeExito(`✓ ${res.mensaje} (${res.registrosRestaurados || 0} registros recuperados)`);
        setModalConfirmarRestauracion(null);
        await cargarDatos();
        if (onDataRestored) onDataRestored();
      } else {
        setError(res.mensaje || 'Error al restaurar respaldo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar restauración.');
    } finally {
      setRestaurandoId(null);
    }
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5 font-mono text-xs text-[#221A14]">
      {/* Banner Principal de Respaldo de 24 Horas */}
      <div className="bg-[#FFF8F5] border-2 border-[#DFCBB5] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden">
          <BarberPoleRibbon className="w-full h-full" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-1">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FBEBE1] border border-[#7C571C] flex items-center justify-center text-[#7C571C] shrink-0 shadow-sm">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base font-bold uppercase text-[#221A14] tracking-wide">
                  Resguardo Continuo de Base de Datos Firestore
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
                  CICLO ACTIVO (24 HORAS)
                </span>
              </div>
              <p className="text-[11px] text-[#6F5A4B] mt-0.5 leading-relaxed">
                Copias de seguridad automáticas de citas, clientes, finanzas y configuración alojadas en Google Cloud Storage con verificación criptográfica SHA-256.
              </p>
            </div>
          </div>

          {/* Botón de Ejecución Inmediata */}
          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
            <button
              type="button"
              onClick={handleCrearRespaldo}
              disabled={ejecutando || cargando}
              className="px-4 py-2.5 bg-[#7C571C] hover:bg-[#634516] disabled:opacity-50 text-[#FAF6EE] font-bold rounded-xl transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer uppercase text-[11px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ejecutando ? 'animate-spin' : ''}`} />
              <span>{ejecutando ? 'Respaldando...' : 'Crear Respaldo Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Métricas y Estado del Bucket */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#DFCBB5]">
          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] block uppercase">Frecuencia Programada</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-[#221A14]">
              <Clock className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Cada 24 Horas (02:00 AM)</span>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] block uppercase">Bucket de Almacenamiento</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px] text-[#221A14] truncate" title={estado?.bucketDestino || 'galvanized-emblem-pzp2g.firebasestorage.app'}>
              <HardDrive className="w-3.5 h-3.5 text-[#7C571C] shrink-0" />
              <span className="truncate">{estado?.bucketDestino || 'Firebase Storage Bucket'}</span>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] block uppercase">Respaldos Custodiados</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-[#221A14]">
              <Layers className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>{respaldos.length} Snapshots Disponibles</span>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DFCBB5] shadow-2xs">
            <span className="text-[10px] text-[#6F5A4B] block uppercase">Protección Criptográfica</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px] text-[#15803D]">
              <Lock className="w-3.5 h-3.5 text-[#15803D]" />
              <span>AES-256-GCM + SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {mensajeExito && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span className="font-medium text-xs">{mensajeExito}</span>
          </div>
          <button type="button" onClick={() => setMensajeExito(null)} className="text-[#166534] font-bold text-xs p-1">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FEE2E2] border border-[#F87171] text-[#991B1B] rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="font-medium text-xs">{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-[#991B1B] font-bold text-xs p-1">✕</button>
        </div>
      )}

      {/* Historial de Respaldos */}
      <div className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#7C571C]" />
            <h4 className="font-serif text-sm font-bold uppercase text-[#221A14]">
              Historial de Copias de Seguridad Disponibles ({respaldos.length})
            </h4>
          </div>
          <span className="text-[10px] text-[#6F5A4B]">RECUPERACIÓN ANTE DESASTRES</span>
        </div>

        {cargando && respaldos.length === 0 ? (
          <div className="py-8 text-center text-[#6F5A4B]">Cargando inventario de respaldos en el bucket...</div>
        ) : respaldos.length === 0 ? (
          <div className="py-8 text-center text-[#6F5A4B] space-y-2">
            <p>No se encontraron respaldos previos registrados.</p>
            <button
              type="button"
              onClick={handleCrearRespaldo}
              className="px-3 py-1.5 bg-[#7C571C] text-[#FAF6EE] rounded-lg font-bold text-[10px]"
            >
              Generar Primer Respaldo Ahora
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {respaldos.map((b) => (
              <div
                key={b.id}
                className="bg-[#FFF8F5] border border-[#DFCBB5] hover:border-[#7C571C] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors shadow-2xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#221A14]">{b.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      b.origen === 'automatico_24h'
                        ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                        : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                    }`}>
                      {b.origen === 'automatico_24h' ? 'Automático 24H' : 'Manual SuperAdmin'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
                      {b.tamanoLegible}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#6F5A4B] pt-1">
                    <span>📅 {formatearFecha(b.fechaGeneracion)}</span>
                    <span>✂️ {b.totalCitas} Citas / {b.totalClientes} Clientes</span>
                    <span>💰 {b.totalCortes} Cortes / {b.totalArqueos} Arqueos</span>
                    <span>💈 {b.totalBarberos} Barberos / {b.totalServicios} Servicios</span>
                  </div>

                  <div className="text-[9px] text-[#A8988B] flex items-center gap-1 font-mono truncate">
                    <span className="font-bold">SHA-256:</span>
                    <span className="truncate">{b.checksumSha256}</span>
                  </div>
                </div>

                {/* Acciones de Respaldo */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => descargarArchivoRespaldo(b.id)}
                    className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Descargar copia local cifrada"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalConfirmarRestauracion(b)}
                    disabled={restaurandoId === b.id}
                    className="px-3 py-1.5 bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#7C571C] border border-[#7C571C] rounded-lg transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Restaurar toda la base de datos a este punto en el tiempo"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${restaurandoId === b.id ? 'animate-spin' : ''}`} />
                    <span>Restaurar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Doble Confirmación de Restauración */}
      {modalConfirmarRestauracion && (
        <div className="fixed inset-0 z-50 bg-[#221A14]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] border border-[#F87171] text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#221A14] uppercase">
                  Confirmar Restauración Crítica
                </h3>
                <p className="text-[11px] text-[#6F5A4B]">Recuperación de Base de Datos</p>
              </div>
            </div>

            <p className="text-xs text-[#4F4539] leading-relaxed">
              ¿Estás seguro de restaurar el snapshot <strong className="text-[#221A14]">#{modalConfirmarRestauracion.id}</strong> del <strong className="text-[#221A14]">{formatearFecha(modalConfirmarRestauracion.fechaGeneracion)}</strong>?
            </p>

            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[11px] text-[#991B1B] space-y-1">
              <p className="font-bold">⚠️ Advertencia de Sobrescritura:</p>
              <p>Esta acción recuperará {modalConfirmarRestauracion.totalCitas} citas, {modalConfirmarRestauracion.totalCortes} cortes y {modalConfirmarRestauracion.totalClientes} clientes. Los registros posteriores serán actualizados.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFCBB5]">
              <button
                type="button"
                onClick={() => setModalConfirmarRestauracion(null)}
                className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F2EAE1] text-[#221A14] border border-[#DFCBB5] rounded-lg font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRestauracion}
                disabled={Boolean(restaurandoId)}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${restaurandoId ? 'animate-spin' : ''}`} />
                <span>{restaurandoId ? 'Restaurando...' : 'Confirmar y Restaurar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
