/**
 * Servicio de Integración para Gaveta de Dinero (Caja Registradora)
 * Soporta:
 *  1. Web Serial API (Chrome/Edge directo a puerto COM/USB-Serial de impresora térmica)
 *  2. WebUSB API (Chrome/Edge directo a endpoint USB de impresora ESC/POS)
 *  3. ESC/POS directo por Web API / Red (servidor Express o socket TCP)
 *  4. Simulación acústica / Web Audio API ("Ka-Ching") para pruebas y feedback
 */

import { ConfiguracionGaveta, RegistroAperturaGaveta, MetodoAperturaGaveta } from '../types';

/**
 * Control central de visibilidad.
 * Por solicitud del usuario, la funcionalidad permanece implementada pero OCULTA por defecto
 * hasta que el usuario solicite ponerla visible ("ponlo visible").
 */
export const FEATURE_GAVETA_REGISTRADORA_DEFAULT = false;

export const isGavetaVisible = (): boolean => {
  try {
    const override = localStorage.getItem('casa_del_rey_mostrar_gaveta');
    if (override !== null) {
      return override === 'true';
    }
  } catch {}
  return FEATURE_GAVETA_REGISTRADORA_DEFAULT;
};

export const setGavetaVisible = (visible: boolean): void => {
  try {
    localStorage.setItem('casa_del_rey_mostrar_gaveta', String(visible));
  } catch {}
};

/**
 * Comandos de pulsos binarios ESC/POS estándar de la industria
 * ESC p m t1 t2 (27, 112, pin, tiempo_on, tiempo_off)
 * Enciende el solenoide por 25ms (0x19) y espera 250ms (0xFA)
 */
export const ESCPOS_PULSES = {
  PIN_2: new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]), // Pin 2 estándar (Epson, Bixolon, Xprinter)
  PIN_5: new Uint8Array([0x1B, 0x70, 0x01, 0x19, 0xFA]), // Pin 5
  DLE_DC4: new Uint8Array([0x10, 0x14, 0x01, 0x00, 0x01]), // Pulso en tiempo real
  STAR_MICRONICS: new Uint8Array([0x07]), // Comando BEL para Star Micronics
};

const DEFAULT_CONFIG: ConfiguracionGaveta = {
  metodo: 'webserial',
  autoAbrirEnEfectivo: true,
  pin: 0, // Pin 2
  baudRate: 9600,
  ipImpresora: '192.168.1.200',
  puertoImpresora: 9100,
  sonidoSimulado: true,
};

export const getConfiguracionGaveta = (): ConfiguracionGaveta => {
  try {
    const raw = localStorage.getItem('casa_del_rey_cfg_gaveta');
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_CONFIG;
};

export const guardarConfiguracionGaveta = (cfg: Partial<ConfiguracionGaveta>): ConfiguracionGaveta => {
  const actual = getConfiguracionGaveta();
  const nueva = { ...actual, ...cfg };
  try {
    localStorage.setItem('casa_del_rey_cfg_gaveta', JSON.stringify(nueva));
  } catch {}
  return nueva;
};

/**
 * Reproduce un sonido fidedigno de caja registradora mecánica ("Ka-Ching!")
 * utilizando el sintetizador Web Audio API nativo sin requerir archivos mp3 externos.
 */
export const reproducirSonidoCaja = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;

    // Tono 1 (Campana alta)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1480, now); // F#6
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tono 2 (Campana aguda Ka-Ching)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1980, now + 0.08); // B6
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.4, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.7);

    // Ruido de resorte / pestillo metálico
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {
    // Si el navegador tiene restricciones de autoplay, silenciar sin error
  }
};

// Variable en memoria para retener la referencia al puerto WebSerial emparejado
let activeSerialPort: any = null;
let activeUsbDevice: any = null;

/**
 * Método 1: Apertura mediante Web Serial API
 */
export const abrirPorWebSerial = async (pin: 0 | 1 = 0, baudRate: number = 9600): Promise<{ exito: boolean; mensaje: string }> => {
  if (!('serial' in navigator)) {
    throw new Error('Tu navegador no soporta Web Serial API. Se recomienda usar Google Chrome o Microsoft Edge.');
  }

  try {
    let port = activeSerialPort;
    if (!port) {
      port = await (navigator as any).serial.requestPort();
      activeSerialPort = port;
    }

    if (!port.readable || !port.writable) {
      await port.open({ baudRate });
    }

    const writer = port.writable.getWriter();
    const pulseBytes = pin === 1 ? ESCPOS_PULSES.PIN_5 : ESCPOS_PULSES.PIN_2;
    await writer.write(pulseBytes);
    writer.releaseLock();

    return {
      exito: true,
      mensaje: `Pulso ESC/POS enviado por WebSerial (Pin ${pin === 1 ? '5' : '2'}, ${baudRate} baud).`,
    };
  } catch (err: any) {
    activeSerialPort = null;
    throw new Error(`Error en WebSerial: ${err.message || 'No se pudo comunicar con el puerto'}`);
  }
};

/**
 * Método 2: Apertura mediante WebUSB API
 */
export const abrirPorWebUSB = async (pin: 0 | 1 = 0): Promise<{ exito: boolean; mensaje: string }> => {
  if (!('usb' in navigator)) {
    throw new Error('Tu navegador no soporta WebUSB API. Se recomienda usar Google Chrome o Microsoft Edge.');
  }

  try {
    let device = activeUsbDevice;
    if (!device) {
      // Filtrar por dispositivos de clase impresora (0x07) o genéricos
      device = await (navigator as any).usb.requestDevice({
        filters: [] // Permite seleccionar la impresora térmica USB conectada
      });
      activeUsbDevice = device;
    }

    if (!device.opened) {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);
    }

    // Buscar endpoint de salida (OUT)
    const outEndpoint = device.configuration?.interfaces[0]?.alternate?.endpoints?.find(
      (ep: any) => ep.direction === 'out'
    );
    const endpointNumber = outEndpoint ? outEndpoint.endpointNumber : 1;

    const pulseBytes = pin === 1 ? ESCPOS_PULSES.PIN_5 : ESCPOS_PULSES.PIN_2;
    await device.transferOut(endpointNumber, pulseBytes);

    return {
      exito: true,
      mensaje: `Pulso ESC/POS transmitido por WebUSB al dispositivo ${device.productName || 'Impresora POS'}.`,
    };
  } catch (err: any) {
    activeUsbDevice = null;
    throw new Error(`Error en WebUSB: ${err.message || 'No se pudo comunicar con el dispositivo USB'}`);
  }
};

/**
 * Método 3: Apertura mediante Web API del Servidor / Red TCP / ePOS
 */
export const abrirPorWebAPI = async (
  motivo: string,
  usuario?: string,
  ip?: string,
  puerto?: number,
  pin: 0 | 1 = 0
): Promise<{ exito: boolean; mensaje: string }> => {
  const res = await fetch('/api/v1/barberia-casa-del-rey/caja/abrir-gaveta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metodo: 'escpos_red',
      motivo,
      usuario: usuario || 'Cajero',
      ip,
      puerto: puerto || 9100,
      pin,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.mensaje || 'Error en la respuesta del servidor');
  }

  const data = await res.json();
  return {
    exito: true,
    mensaje: data.mensaje || 'Comando ESC/POS procesado por el servidor.',
  };
};

/**
 * Función principal unificada de apertura de gaveta
 */
export const ejecutarAperturaGaveta = async (opciones: {
  motivo: string;
  usuario?: string;
  metodoPersonalizado?: MetodoAperturaGaveta;
  forzar?: boolean;
}): Promise<RegistroAperturaGaveta> => {
  const cfg = getConfiguracionGaveta();
  const metodo = opciones.metodoPersonalizado || cfg.metodo;
  let exito = false;
  let mensaje = '';

  const fechaActual = new Date().toISOString().split('T')[0];
  const horaActual = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Si tiene habilitado sonido, reproducir siempre para confirmación inmediata
  if (cfg.sonidoSimulado) {
    reproducirSonidoCaja();
  }

  try {
    switch (metodo) {
      case 'webserial': {
        const res = await abrirPorWebSerial(cfg.pin, cfg.baudRate);
        exito = res.exito;
        mensaje = res.mensaje;
        break;
      }
      case 'webusb': {
        const res = await abrirPorWebUSB(cfg.pin);
        exito = res.exito;
        mensaje = res.mensaje;
        break;
      }
      case 'escpos_red': {
        const res = await abrirPorWebAPI(opciones.motivo, opciones.usuario, cfg.ipImpresora, cfg.puertoImpresora, cfg.pin);
        exito = res.exito;
        mensaje = res.mensaje;
        break;
      }
      case 'simulado':
      default: {
        reproducirSonidoCaja();
        exito = true;
        mensaje = 'Apertura emulada por Web Audio API con pulso virtual ESC/POS.';
        break;
      }
    }
  } catch (err: any) {
    // Si falla el método físico (por ejemplo, el usuario no conectó la impresora física aún),
    // se hace fallback con notificación y sonido simulado para que la operación de cobro no se bloquee.
    reproducirSonidoCaja();
    exito = true;
    mensaje = `Aviso hardware: ${err.message || 'Dispositivo no disponible'}. (Se emuló la apertura de caja para no interrumpir la operación).`;
  }

  // Notificar al servidor para auditoría en el backend
  try {
    await fetch('/api/v1/barberia-casa-del-rey/caja/abrir-gaveta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metodo,
        motivo: opciones.motivo,
        usuario: opciones.usuario || 'Personal Casa del Rey',
        exito,
        mensaje,
      }),
    });
  } catch {}

  const registro: RegistroAperturaGaveta = {
    id: `GAV-${Date.now()}`,
    fecha: fechaActual,
    hora: horaActual,
    usuario: opciones.usuario,
    motivo: opciones.motivo,
    metodo,
    exito,
    mensaje,
  };

  return registro;
};

/**
 * Disparador automático que salta cuando se registra un pago en efectivo.
 * Si la funcionalidad está oculta, no realiza ninguna acción intrusiva.
 */
export const dispararAperturaPorEfectivo = async (motivo: string, usuario?: string) => {
  const visible = isGavetaVisible();
  if (!visible) {
    // Si está oculta, no interactúa con el hardware
    return;
  }

  const cfg = getConfiguracionGaveta();
  if (!cfg.autoAbrirEnEfectivo) {
    return;
  }

  try {
    await ejecutarAperturaGaveta({
      motivo: motivo || 'Cobro registrado en efectivo',
      usuario: usuario || 'Caja Casa del Rey',
    });
  } catch {
    // Silencioso para no entorpecer el flujo de venta
  }
};
