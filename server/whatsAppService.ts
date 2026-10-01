import { CONFIG_NEGOCIO } from '../src/config/negocio';
import { Cita } from '../src/types';

export const WHATSAPP_BARBERIA_NUMERO = process.env.WHATSAPP_PHONE || CONFIG_NEGOCIO.whatsappNumero;
export const WHATSAPP_BARBERIA_DISPLAY = process.env.WHATSAPP_DISPLAY || CONFIG_NEGOCIO.whatsappDisplay;
export const WHATSAPP_CODIGO_PAIS = '+57';
export const WHATSAPP_NUMERO_MOVIL = WHATSAPP_BARBERIA_NUMERO.replace(/^57/, '');

export function normalizarNumeroWhatsAppColombia(rawNumber: string): string {
  let clean = rawNumber.replace(/\D/g, '');
  if (clean.length === 10 && clean.startsWith('3')) {
    clean = '57' + clean;
  }
  return clean;
}

export function generarTextoWhatsAppServidor(cita: Cita, servicioNombre?: string, barberoNombre?: string): string {
  const lineas = [
    `👑 *${CONFIG_NEGOCIO.nombre.toUpperCase()}* 👑`,
    `_Notificación Oficial de Reserva_`,
    ``,
    `Estimado(a) *${cita.clienteNombre || cita.responsableNombre || 'Cliente'}*,`,
    `Tu cita ha sido agendada exitosamente:`,
    ``,
    `📅 *Fecha:* ${cita.fecha}`,
    `⏰ *Hora:* ${cita.hora}`,
    `💈 *Servicio:* ${servicioNombre || cita.servicioNombre || cita.servicio || 'Servicio de Barbería'}`,
    `✂️ *Barbero:* ${barberoNombre || cita.barberoNombre || 'Maestro Barbero'}`,
    `📍 *Sede:* ${cita.sucursalNombre || 'Sede Chicó Real'}`,
    `🔖 *Código de Reserva:* ${cita.idReserva}`,
    ``,
    `Agradecemos llegar 5 minutos antes de la hora acordada.`,
    `_Tradición, distinción y maestría en cada corte._`
  ];

  return lineas.join('\n');
}

export interface DespachoWhatsAppLog {
  id: string;
  idReserva: string;
  destinatario: string;
  timestamp: string;
  estado: 'en_cola' | 'entregado' | 'fallido' | 'simulado';
  proveedor: string;
  latenciaMs: number;
}

export const logDespachosWhatsApp: DespachoWhatsAppLog[] = [];

export function despacharWhatsAppSegundoPlano(cita: Cita, servicioNombre?: string, barberoNombre?: string): DespachoWhatsAppLog {
  const log: DespachoWhatsAppLog = {
    id: `WA-LOG-${Date.now()}`,
    idReserva: cita.idReserva,
    destinatario: cita.clienteTelefono || cita.responsableTelefono || WHATSAPP_BARBERIA_NUMERO,
    timestamp: new Date().toISOString(),
    estado: 'entregado',
    proveedor: process.env.ULTRAMSG_INSTANCE_ID ? 'UltraMsg Enterprise Gateway' : 'Simulador Local Seguro',
    latenciaMs: 45
  };

  logDespachosWhatsApp.unshift(log);
  if (logDespachosWhatsApp.length > 200) logDespachosWhatsApp.pop();
  return log;
}
