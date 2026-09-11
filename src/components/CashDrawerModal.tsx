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
  KeyRound, 
  Sparkles
} from 'lucide-react';
import { 
  ConfiguracionGaveta, 
  MetodoAperturaGaveta 
} from '../types';
import { 
  getConfiguracionGaveta, 
  guardarConfiguracionGaveta, 
  ejecutarAperturaGaveta, 
  reproducirSonidoCaja,
  isGavetaVisible,
  setGavetaVisible
} from '../services/cashDrawer';
import { BarberPoleRibbon } from './VintageBarberIcons';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative font-mono text-xs">
        <BarberPoleRibbon className="h-1.5" />

        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-[#DFCBB5] flex items-center justify-between bg-[#FBEBE1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#221A14] uppercase tracking-wider">
                  Configuración de Gaveta Registradora (POS)
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-[#FFFFFF] text-[#7C571C] border border-[#DFCBB5] font-bold">
                  ESC/POS
                </span>
              </div>
              <p className="text-[11px] text-[#6F5A4B] mt-0.5">
                Integración de hardware para apertura automática de caja y solenoide RJ11/RJ12
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FFFFFF] hover:bg-[#F5E8DA] text-[#6F5A4B] hover:text-[#221A14] flex items-center justify-center transition-colors cursor-pointer border border-[#DFCBB5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 bg-[#FFF8F5]">
          {/* Alerta de Resultado de Prueba */}
          {resultadoPrueba && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                resultadoPrueba.exito
                  ? 'bg-[#EBF7EE] border-[#86EFAC] text-[#15803D]'
                  : 'bg-[#FDF2F2] border-[#F87171] text-[#991B1B]'
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
            <label className="text-[11px] font-bold text-[#7C571C] uppercase tracking-wider flex items-center gap-1.5 font-serif">
              <Radio className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Selecciona la Vía de Conexión Física (3 Métodos):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Opción 1: Web Serial */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('webserial')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'webserial'
                    ? 'bg-[#FFFFFF] border-[#7C571C] ring-1 ring-[#7C571C] text-[#221A14] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] text-[#6F5A4B] hover:border-[#7C571C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Cable className={`w-4 h-4 ${metodoSeleccionado === 'webserial' ? 'text-[#7C571C]' : 'text-[#6F5A4B]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EBF7EE] text-[#15803D] font-bold">
                    Recomendado
                  </span>
                </div>
                <span className="font-bold text-xs text-[#221A14] block">1. Web Serial API</span>
                <p className="text-[10px] text-[#6F5A4B] mt-1 leading-relaxed">
                  Para impresoras conectadas por puerto COM / USB-Serial en Chrome o Edge.
                </p>
              </button>

              {/* Opción 2: WebUSB */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('webusb')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'webusb'
                    ? 'bg-[#FFFFFF] border-[#7C571C] ring-1 ring-[#7C571C] text-[#221A14] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] text-[#6F5A4B] hover:border-[#7C571C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sliders className={`w-4 h-4 ${metodoSeleccionado === 'webusb' ? 'text-[#7C571C]' : 'text-[#6F5A4B]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] font-bold">
                    Directo USB
                  </span>
                </div>
                <span className="font-bold text-xs text-[#221A14] block">2. WebUSB API</span>
                <p className="text-[10px] text-[#6F5A4B] mt-1 leading-relaxed">
                  Acceso nativo por USB a la impresora térmica sin drivers COM virtuales.
                </p>
              </button>

              {/* Opción 3: Web API / Red */}
              <button
                type="button"
                onClick={() => setMetodoSeleccionado('escpos_red')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  metodoSeleccionado === 'escpos_red'
                    ? 'bg-[#FFFFFF] border-[#7C571C] ring-1 ring-[#7C571C] text-[#221A14] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#DFCBB5] text-[#6F5A4B] hover:border-[#7C571C]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Wifi className={`w-4 h-4 ${metodoSeleccionado === 'escpos_red' ? 'text-[#7C571C]' : 'text-[#6F5A4B]'}`} />
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] font-bold">
                    Red / WiFi
                  </span>
                </div>
                <span className="font-bold text-xs text-[#221A14] block">3. Web API / Red</span>
                <p className="text-[10px] text-[#6F5A4B] mt-1 leading-relaxed">
                  Envío de comandos ESC/POS vía IP/Ethernet a la impresora del salón.
                </p>
              </button>
            </div>
          </div>

          {/* Opciones Específicas según el método */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3 shadow-2xs">
            <h4 className="font-bold text-[#221A14] uppercase text-[11px] flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Parámetros del Pulso ESC/POS</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block mb-1">Pin del Solenoide (RJ11/RJ12):</label>
                <select
                  value={config.pin}
                  onChange={(e) => setConfig({ ...config, pin: Number(e.target.value) as 0 | 1 })}
                  className="w-full bg-[#FDF6F0] border border-[#DFCBB5] rounded-lg px-2.5 py-1.5 text-xs text-[#221A14] focus:border-[#7C571C]"
                >
                  <option value={0}>Pin 2 (Estándar Epson / Star / Bixolon / Xprinter)</option>
                  <option value={1}>Pin 5 (Gaveta secundaria o cable invertido)</option>
                </select>
              </div>

              {metodoSeleccionado === 'webserial' && (
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block mb-1">Velocidad Baud Rate:</label>
                  <select
                    value={config.baudRate}
                    onChange={(e) => setConfig({ ...config, baudRate: Number(e.target.value) })}
                    className="w-full bg-[#FDF6F0] border border-[#DFCBB5] rounded-lg px-2.5 py-1.5 text-xs text-[#221A14] focus:border-[#7C571C]"
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
                    <label className="text-[10px] text-[#6F5A4B] block mb-1">Dirección IP de la Impresora:</label>
                    <input
                      type="text"
                      value={config.ipImpresora || ''}
                      onChange={(e) => setConfig({ ...config, ipImpresora: e.target.value })}
                      placeholder="Ej. 192.168.1.200"
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] rounded-lg px-2.5 py-1.5 text-xs text-[#221A14] focus:border-[#7C571C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6F5A4B] block mb-1">Puerto RAW ESC/POS:</label>
                    <input
                      type="number"
                      value={config.puertoImpresora || 9100}
                      onChange={(e) => setConfig({ ...config, puertoImpresora: Number(e.target.value) })}
                      placeholder="9100"
                      className="w-full bg-[#FDF6F0] border border-[#DFCBB5] rounded-lg px-2.5 py-1.5 text-xs text-[#221A14] focus:border-[#7C571C]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Automatizaciones y Disparadores */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3 shadow-2xs">
            <h4 className="font-bold text-[#221A14] uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#7C571C]" />
              <span>Comportamiento del Disparador Automático</span>
            </h4>

            {/* Checkbox Disparador Efectivo */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.autoAbrirEnEfectivo}
                onChange={(e) => setConfig({ ...config, autoAbrirEnEfectivo: e.target.checked })}
                className="mt-0.5 rounded border-[#DFCBB5] text-[#7C571C] focus:ring-0 cursor-pointer accent-[#7C571C]"
              />
              <div>
                <span className="font-bold text-[#221A14] block">
                  Disparador automático al registrar pago en Efectivo
                </span>
                <span className="text-[10px] text-[#6F5A4B] block mt-0.5">
                  Cuando el cajero guarde un corte o servicio con método "Efectivo", la gaveta salta automáticamente.
                </span>
              </div>
            </label>

            {/* Checkbox Sonido Virtual */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-[#DFCBB5]">
              <input
                type="checkbox"
                checked={config.sonidoSimulado}
                onChange={(e) => setConfig({ ...config, sonidoSimulado: e.target.checked })}
                className="mt-0.5 rounded border-[#DFCBB5] text-[#7C571C] focus:ring-0 cursor-pointer accent-[#7C571C]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#221A14]">
                    Reproducir sonido clásico "Ka-Ching!" (Web Audio API)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      reproducirSonidoCaja();
                    }}
                    className="text-[10px] text-[#7C571C] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Escuchar demo</span>
                  </button>
                </div>
                <span className="text-[10px] text-[#6F5A4B] block mt-0.5">
                  Proporciona confirmación acústica instantánea a los clientes y cajeros.
                </span>
              </div>
            </label>
          </div>

          {/* Botón de Prueba en Vivo */}
          <div className="p-3.5 bg-[#FBEBE1] rounded-xl border border-[#DFCBB5] flex items-center justify-between shadow-2xs">
            <div>
              <span className="font-bold text-[#221A14] block">Prueba de Apertura en Directo</span>
              <span className="text-[10px] text-[#6F5A4B]">
                Envía el pulso al instante con la configuración seleccionada
              </span>
            </div>
            <button
              type="button"
              disabled={probando}
              onClick={() => handleProbarApertura()}
              className="px-3.5 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{probando ? 'Enviando pulso...' : '¡Abrir Gaveta Ahora!'}</span>
            </button>
          </div>
        </div>

        {/* Pie con botón Guardar */}
        <div className="p-4 border-t border-[#DFCBB5] bg-[#FBEBE1] flex items-center justify-between">
          <span className="text-[10px] text-[#6F5A4B]">
            Comandos ESC/POS estándares compatibles con Windows, macOS y Linux
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#F5E8DA] text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
