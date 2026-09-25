import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, ExternalLink, ShieldCheck, BellRing, Smartphone } from 'lucide-react';
import { Cita } from '../types';

// Teléfono oficial de notificaciones y atención de la Barbería La Casa del Rey (desde .env)
const RAW_ENV_NOTIFY_NUM = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WHATSAPP_NOTIFY_NUMBER) || '573126441665';
const RAW_CLEAN_DIGITS = RAW_ENV_NOTIFY_NUM.replace(/\D/g, '');
export const WHATSAPP_BARBERIA_NUMERO = RAW_CLEAN_DIGITS.length === 10 ? `57${RAW_CLEAN_DIGITS}` : (RAW_CLEAN_DIGITS || '573126441665');
export const WHATSAPP_BARBERIA_DISPLAY = ((): string => {
  if (WHATSAPP_BARBERIA_NUMERO.startsWith('57') && WHATSAPP_BARBERIA_NUMERO.length === 12) {
    const cel = WHATSAPP_BARBERIA_NUMERO.slice(2);
    return `+57 ${cel.slice(0, 3)} ${cel.slice(3, 6)} ${cel.slice(6)}`;
  }
  return `+${WHATSAPP_BARBERIA_NUMERO}`;
})();

// Construir mensaje elegante y oficial para WhatsApp
export const generarTextoMensajeReserva = (
  cita: Cita,
  servicioNombre?: string,
  barberoNombre?: string,
  precioTotal?: number
): string => {
  const sedeTexto = cita.sucursalNombre 
    ? `${cita.sucursalNombre}` 
    : 'Sede Chicó Real (Calle 72 # 11-45, Bogotá D.C.)';

  const precioFormateado = precioTotal
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precioTotal)
    : undefined;

  if (cita.tipo === 'Grupal') {
    const nombresParticipantes = cita.detalles?.map(d => `• ${d.nombre}`).join('\n') || '';
    return (
      `👑 *NUEVA RESERVA GRUPAL - BARBERÍA LA CASA DEL REY*\n\n` +
      `¡Hola! Se ha generado una nueva reserva grupal desde la app web:\n\n` +
      `🔖 *Folio de Reserva:* ${cita.idReserva}\n` +
      `👤 *Responsable:* ${cita.responsableNombre || 'Comitiva'}\n` +
      `📱 *Teléfono:* ${cita.responsableTelefono || 'No especificado'}\n` +
      `📅 *Fecha:* ${cita.fecha}\n` +
      `⏰ *Hora:* ${cita.hora}\n` +
      `👥 *Integrantes (${cita.totalPersonas || 2} caballeros):*\n${nombresParticipantes}\n\n` +
      `📍 *Sede:* ${sedeTexto}\n` +
      (precioFormateado ? `💰 *Valor Estimado:* ${precioFormateado}\n` : '') +
      `\n💈 Notificación automática enviada a la administración.`
    );
  }

  return (
    `👑 *NUEVA RESERVA DE TURNO - BARBERÍA LA CASA DEL REY*\n\n` +
    `¡Hola! Se ha generado una nueva reserva de turno desde la app web:\n\n` +
    `🔖 *Folio de Reserva:* ${cita.idReserva}\n` +
    `👤 *Caballero:* ${cita.clienteNombre}\n` +
    `📱 *Teléfono del Cliente:* ${cita.clienteTelefono}\n` +
    (cita.clienteEmail ? `✉️ *Correo:* ${cita.clienteEmail}\n` : '') +
    `💈 *Servicio:* ${servicioNombre || 'Servicio de Barbería Clásica'}\n` +
    `✂️ *Barbero Asignado:* ${barberoNombre || 'Maestro Barbero'}\n` +
    `📅 *Fecha:* ${cita.fecha}\n` +
    `⏰ *Hora:* ${cita.hora}\n` +
    (precioFormateado ? `💰 *Valor:* ${precioFormateado}\n` : '') +
    `📍 *Sede:* ${sedeTexto}\n\n` +
    `💈 Notificación automática enviada a la administración.`
  );
};

export const generarUrlWhatsAppBarberia = (mensaje: string): string => {
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_BARBERIA_NUMERO}&text=${encodeURIComponent(mensaje)}`;
};

export const generarUrlWaMeBarberia = (mensaje: string): string => {
  return `https://wa.me/${WHATSAPP_BARBERIA_NUMERO}?text=${encodeURIComponent(mensaje)}`;
};

export const generarUrlWhatsAppCliente = (telefono: string, mensaje: string): string | null => {
  const telClienteLimpio = telefono.replace(/\D/g, '');
  if (!telClienteLimpio) return null;
  const telClienteFormateado = telClienteLimpio.startsWith('57') 
    ? telClienteLimpio 
    : telClienteLimpio.length === 10 
    ? `57${telClienteLimpio}` 
    : telClienteLimpio;
  return `https://api.whatsapp.com/send?phone=${telClienteFormateado}&text=${encodeURIComponent(mensaje)}`;
};

interface WhatsAppConfirmProps {
  cita: Cita;
  servicioNombre?: string;
  barberoNombre?: string;
  precioTotal?: number;
  className?: string;
  autoNotificar?: boolean;
}

export const WhatsAppConfirmButton: React.FC<WhatsAppConfirmProps> = ({
  cita,
  servicioNombre,
  barberoNombre,
  precioTotal,
  className = '',
  autoNotificar = true
}) => {
  const [enviando, setEnviando] = useState(false);
  const [despachado, setDespachado] = useState(Boolean(autoNotificar));
  const [errorEnvio, setErrorEnvio] = useState(false);

  useEffect(() => {
    if (autoNotificar) {
      setDespachado(true);
    }
  }, [autoNotificar]);

  const mensajeTexto = generarTextoMensajeReserva(cita, servicioNombre, barberoNombre, precioTotal);
  const urlWhatsAppBarberia = generarUrlWhatsAppBarberia(mensajeTexto);

  const telClienteRaw = cita.clienteTelefono || cita.telefono || cita.responsableTelefono;
  const urlWhatsAppCliente = telClienteRaw ? generarUrlWhatsAppCliente(telClienteRaw, mensajeTexto) : null;

  const handleReenviar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnviando(true);
    setErrorEnvio(false);

    try {
      // Intentar despacho directo vía UltraMsg API a cliente y barbería
      const { despacharUltraMsgDirecto, normalizarNumeroWhatsApp } = await import('../services/ultraMsgClient');
      const numerosDestino: string[] = [];

      if (telClienteRaw) {
        const normCliente = normalizarNumeroWhatsApp(telClienteRaw);
        if (normCliente && normCliente.length >= 10) numerosDestino.push(normCliente);
      }
      numerosDestino.push(normalizarNumeroWhatsApp(WHATSAPP_BARBERIA_NUMERO));

      const res = await despacharUltraMsgDirecto({
        texto: mensajeTexto,
        idReserva: cita.idReserva,
        clienteNombre: cita.clienteNombre || cita.responsableNombre || 'Caballero Casa del Rey',
        tipo: cita.tipo || 'Individual',
        numerosDestino: Array.from(new Set(numerosDestino))
      });

      if (res.exito) {
        setDespachado(true);
      } else {
        // Fallback fluido: abrir directamente la App de WhatsApp
        const targetUrl = urlWhatsAppCliente || urlWhatsAppBarberia;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        setDespachado(true);
      }
    } catch {
      const targetUrl = urlWhatsAppCliente || urlWhatsAppBarberia;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setDespachado(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <button
        type="button"
        id={`btn-reenviar-whatsapp-${cita.idReserva}`}
        onClick={handleReenviar}
        disabled={enviando || despachado}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
          despachado
            ? 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
            : errorEnvio
            ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30 hover:bg-[#FFDAD6]/80'
            : 'bg-[#15803D] hover:bg-[#166534] text-[#FFFFFF]'
        }`}
        title="Enviar o Reenviar notificación automática por WhatsApp"
      >
        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
        <span>
          {enviando
            ? 'Enviando...'
            : despachado
            ? 'Notificado ✓'
            : errorEnvio
            ? 'Reintentar WhatsApp'
            : 'Enviar WhatsApp'}
        </span>
      </button>

      {/* Enlace de WhatsApp directo al cliente si existe número */}
      {urlWhatsAppCliente && (
        <a
          id={`link-directo-wa-cliente-${cita.idReserva}`}
          href={urlWhatsAppCliente}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-[#EBF7EE] hover:bg-[#25D366] text-[#15803D] hover:text-[#0A180E] border border-[#86EFAC] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          title={`Abrir chat directo en WhatsApp con el cliente (${telClienteRaw})`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Chat Cliente</span>
        </a>
      )}

      {/* Enlace de WhatsApp directo a la Barbería Admin */}
      <a
        id={`link-directo-wa-barberia-${cita.idReserva}`}
        href={urlWhatsAppBarberia}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-[#FBEBE1] hover:bg-[#F4DCC7] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] transition-all flex items-center justify-center gap-1 cursor-pointer"
        title={`Abrir chat directo en WhatsApp con Barbería La Casa del Rey (${WHATSAPP_BARBERIA_DISPLAY})`}
      >
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Chat Barbería</span>
      </a>
    </div>
  );
};
