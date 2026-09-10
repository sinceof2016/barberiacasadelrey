import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Settings, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Wifi, 
  Cable, 
  Volume2, 
  VolumeX, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { 
  ConfiguracionGaveta, 
  MetodoAperturaGaveta, 
  RegistroAperturaGaveta 
} from '../types';
import { 
  getConfiguracionGaveta, 
  guardarConfiguracionGaveta, 
  ejecutarAperturaGaveta, 
  reproducirSonidoCaja,
  isGavetaVisible,
  setGavetaVisible
} from '../services/cashDrawer';
import { VintageCrownIcon, BarberPoleRibbon } from './VintageBarberIcons';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioNombre?: string;
  esAdmin?: boolean;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  usuarioNombre,
  esAdmin = false,
}) => {
  const [config, setConfig] = useState<ConfiguracionGaveta>(getConfiguracionGaveta());
  const [probando, setProbando] = useState<boolean>(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{ exito: boolean; mensaje: string } | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoAperturaGaveta>(config.metodo);
  const [visibilidadActiva, setVisibilidadActiva] = useState<boolean>(isGavetaVisible());

  useEffect(() => {
    if (isOpen) {
      const cfg = getConfiguracionGaveta();
      setConfig(cfg);
      setMetodoSeleccionado(cfg.metodo);
      setVisibilidadActiva(isGavetaVisible());
      setResultadoPrueba(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGuardar = () => {
    const actualizada = guardarConfiguracionGaveta({
      ...config,
      metodo: metodoSeleccionado,
    });
    setConfig(actualizada);
    setGavetaVisible(visibilidadActiva);
    setResultadoPrueba({
      exito: true,
      mensaje: 'Configuración de hardware guardada correctamente.',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleProbarApertura = async (metodoAProbar?: MetodoAperturaGaveta) => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const registro = await ejecutarAperturaGaveta({
        motivo: 'Prueba manual desde panel de configuración',
        usuario: usuarioNombre || 'Administrador',
        metodoPersonalizado: metodoAProbar || metodoSeleccionado,
      });
      setResultadoPrueba({
        exito: registro.exito,
        mensaje: registro.mensaje,
      });
    } catch (err: any) {
      setResultadoPrueba({
        exito: false,
        mensaje: err.message || 'Fallo durante la apertura',
      });
    } finally {
      setProbando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#181210] border border-[#3D2E26] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative font-mono text-xs">
        <BarberPoleRibbon className="h-1.5" />

        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-[#2E2019] flex items-center justify-between bg-[#120E0C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#261B16] border border-[#C59B27] flex items-center justify-center text-[#C59B27] shadow">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-royal font-bold text-sm text-[#FAF6EE] uppercase tracking-wider">
                  Configuración de Gaveta Registradora (POS)
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-[#2A1E18] text-[#E5B869] border border-[#C59B27]/40">
                  ESC/POS
                </span>
              </div>
              <p className="text-[11px] text-[#A8988B] mt-0.5">
                Integración de hardware para apertura automática de caja y solenoide RJ11/RJ12
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#261B16] hover:bg-[#3D2E26] text-[#A8988B] hover:text-[#FAF6EE] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Alerta de Resultado de Prueba */}
          {resultadoPrueba && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                resultadoPrueba.exito
                  ? 'bg-[#132A18] border-[#23532C] text-[#86EFAC]'
                  : 'bg-[#2A1313] border-[#532323] text-[#FCA5A5]'
              }`}
            >
              {resultadoPrueba.exito ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {resultadoPrueba.exito ? 'Señal Transmitida con Éxito' : 'Aviso del Dispositivo'}
                </span>
                <p className="text-[11px] opacity-90 mt-0.5">{resultadoPrueba.mensaje}</p>
              </div>
            </div>
          )}

          {/* Selector de los 3 métodos implementados */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-[#E5B869] uppercase tracking-wider flex items-center gap-1.5 font-royal">
              <Radio className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Selecciona la Vía de Conexión Física (3 Métodos):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Opción 1: Web Serial */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('webserial')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'webserial'
                    ? 'bg-[#261B16] border-[#C59B27] ring-1 ring-[#C59B27] text-[#FAF6EE]'
                    : 'bg-[#120E0C] border-[#2E2019] text-[#A8988B] hover:border-[#3D2E26]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Cable className={`w-4 h-4 ${metodoSeleccionado === 'webserial' ? 'text-[#C59B27]' : 'text-[#8A796D]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1412] text-[#86EFAC] font-bold">
                    Recomendado
                  </span>
                </div>
                <span className="font-bold text-xs text-[#FAF6EE] block">1. Web Serial API</span>
                <p className="text-[10px] text-[#8A796D] mt-1 leading-relaxed">
                  Para impresoras conectadas por puerto COM / USB-Serial en Chrome o Edge.
                </p>
              </button>

              {/* Opción 2: WebUSB */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('webusb')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'webusb'
                    ? 'bg-[#261B16] border-[#C59B27] ring-1 ring-[#C59B27] text-[#FAF6EE]'
                    : 'bg-[#120E0C] border-[#2E2019] text-[#A8988B] hover:border-[#3D2E26]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sliders className={`w-4 h-4 ${metodoSeleccionado === 'webusb' ? 'text-[#C59B27]' : 'text-[#8A796D]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1412] text-[#C59B27] font-bold">
                    Directo USB
                  </span>
                </div>
                <span className="font-bold text-xs text-[#FAF6EE] block">2. WebUSB API</span>
                <p className="text-[10px] text-[#8A796D] mt-1 leading-relaxed">
                  Acceso nativo por USB a la impresora térmica sin drivers COM virtuales.
                </p>
              </button>

              {/* Opción 3: Web API / Red */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('escpos_red')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'escpos_red'
                    ? 'bg-[#261B16] border-[#C59B27] ring-1 ring-[#C59B27] text-[#FAF6EE]'
                    : 'bg-[#120E0C] border-[#2E2019] text-[#A8988B] hover:border-[#3D2E26]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Wifi className={`w-4 h-4 ${metodoSeleccionado === 'escpos_red' ? 'text-[#C59B27]' : 'text-[#8A796D]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1412] text-[#93C5FD] font-bold">
                    Red / WiFi
                  </span>
                </div>
                <span className="font-bold text-xs text-[#FAF6EE] block">3. Web API / Red</span>
                <p className="text-[10px] text-[#8A796D] mt-1 leading-relaxed">
                  Envío de comandos ESC/POS vía IP/Ethernet a la impresora del salón.
                </p>
              </button>
            </div>
          </div>

          {/* Opciones Específicas según el método */}
          <div className="bg-[#120E0C] p-4 rounded-xl border border-[#2E2019] space-y-3">
            <h4 className="font-bold text-[#FAF6EE] uppercase text-[11px] flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Parámetros del Pulso ESC/POS</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-[#8A796D] block mb-1">Pin del Solenoide (RJ11/RJ12):</label>
                <select
                  value={config.pin}
                  onChange={(e) => setConfig({ ...config, pin: Number(e.target.value) as 0 | 1 })}
                  className="w-full bg-[#1A1412] border border-[#3D2E26] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] focus:border-[#C59B27]"
                >
                  <option value={0}>Pin 2 (Estándar Epson / Star / Bixolon / Xprinter)</option>
                  <option value={1}>Pin 5 (Gaveta secundaria o cable invertido)</option>
                </select>
              </div>

              {metodoSeleccionado === 'webserial' && (
                <div>
                  <label className="text-[10px] text-[#8A796D] block mb-1">Velocidad Baud Rate:</label>
                  <select
                    value={config.baudRate}
                    onChange={(e) => setConfig({ ...config, baudRate: Number(e.target.value) })}
                    className="w-full bg-[#1A1412] border border-[#3D2E26] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] focus:border-[#C59B27]"
                  >
                    <option value={9600}>9600 bps (Estándar)</option>
                    <option value={19200}>19200 bps</option>
                    <option value={38400}>38400 bps</option>
                    <option value={115200}>115200 bps</option>
                  </select>
                </div>
              )}

              {metodoSeleccionado === 'escpos_red' && (
                <>
                  <div>
                    <label className="text-[10px] text-[#8A796D] block mb-1">Dirección IP de la Impresora:</label>
                    <input
                      type="text"
                      value={config.ipImpresora || ''}
                      onChange={(e) => setConfig({ ...config, ipImpresora: e.target.value })}
                      placeholder="Ej. 192.168.1.200"
                      className="w-full bg-[#1A1412] border border-[#3D2E26] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] focus:border-[#C59B27]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A796D] block mb-1">Puerto RAW ESC/POS:</label>
                    <input
                      type="number"
                      value={config.puertoImpresora || 9100}
                      onChange={(e) => setConfig({ ...config, puertoImpresora: Number(e.target.value) })}
                      placeholder="9100"
                      className="w-full bg-[#1A1412] border border-[#3D2E26] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF6EE] focus:border-[#C59B27]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Automatizaciones y Disparadores */}
          <div className="bg-[#120E0C] p-4 rounded-xl border border-[#2E2019] space-y-3">
            <h4 className="font-bold text-[#FAF6EE] uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Comportamiento del Disparador Automático</span>
            </h4>

            {/* Checkbox Disparador Efectivo */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.autoAbrirEnEfectivo}
                onChange={(e) => setConfig({ ...config, autoAbrirEnEfectivo: e.target.checked })}
                className="mt-0.5 rounded border-[#3D2E26] text-[#C59B27] focus:ring-0 cursor-pointer accent-[#C59B27]"
              />
              <div>
                <span className="font-bold text-[#FAF6EE] block">
                  Disparador automático al registrar pago en Efectivo
                </span>
                <span className="text-[10px] text-[#8A796D] block mt-0.5">
                  Cuando el cajero guarde un corte o servicio con método "Efectivo", la gaveta salta automáticamente para recibir el dinero.
                </span>
              </div>
            </label>

            {/* Checkbox Sonido Virtual */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-[#261B16]">
              <input
                type="checkbox"
                checked={config.sonidoSimulado}
                onChange={(e) => setConfig({ ...config, sonidoSimulado: e.target.checked })}
                className="mt-0.5 rounded border-[#3D2E26] text-[#C59B27] focus:ring-0 cursor-pointer accent-[#C59B27]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FAF6EE]">
                    Reproducir sonido clásico "Ka-Ching!" (Web Audio API)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      reproducirSonidoCaja();
                    }}
                    className="text-[10px] text-[#C59B27] hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Escuchar demo</span>
                  </button>
                </div>
                <span className="text-[10px] text-[#8A796D] block mt-0.5">
                  Proporciona confirmación acústica instantánea a los clientes y cajeros.
                </span>
              </div>
            </label>
          </div>

          {/* Botón de Prueba en Vivo */}
          <div className="p-3.5 bg-[#1C1512] rounded-xl border border-[#3D2E26] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#FAF6EE] block">Prueba de Apertura en Directo</span>
              <span className="text-[10px] text-[#8A796D]">
                Envía el pulso al instante con la configuración seleccionada
              </span>
            </div>
            <button
              type="button"
              disabled={probando}
              onClick={() => handleProbarApertura()}
              className="px-3.5 py-2 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold text-xs transition-all flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{probando ? 'Enviando pulso...' : '¡Abrir Gaveta Ahora!'}</span>
            </button>
          </div>
        </div>

        {/* Pie con botón Guardar */}
        <div className="p-4 border-t border-[#2E2019] bg-[#120E0C] flex items-center justify-between">
          <span className="text-[10px] text-[#8A796D]">
            Comandos ESC/POS estándares compatibles con Windows, macOS y Linux
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#3D2E26] text-[#A8988B] hover:text-[#FAF6EE] hover:bg-[#261B16] text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-lg bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-bold text-xs transition-all shadow cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
