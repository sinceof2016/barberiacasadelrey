import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, ExternalLink, ShieldCheck, BellRing, Smartphone } from 'lucide-react';
import { Cita } from '../types';

// Teléfono oficial de notificaciones y atención de la Barbería La Casa del Rey
export const WHATSAPP_BARBERIA_NUMERO = '573126441665';
export const WHATSAPP_BARBERIA_DISPLAY = '+57 312 644 1665';

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

export const WhatsAppConfirmButton: React.FC<WhatsAppConfirmProps> = () => {
  // Sección invisible para todos los usuarios según requerimiento
  return null;
};
