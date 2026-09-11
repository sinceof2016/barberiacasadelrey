import React, { useState } from 'react';
import { MessageSquare, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { Cita } from '../types';

interface WhatsAppConfirmProps {
  cita: Cita;
  servicioNombre?: string;
  barberoNombre?: string;
  precioTotal?: number;
  className?: string;
}

// Teléfono oficial de atención de la Barbería La Casa del Rey
export const WHATSAPP_BARBERIA_NUMERO = '573001234567';

export const WhatsAppConfirmButton: React.FC<WhatsAppConfirmProps> = ({
  cita,
  servicioNombre,
  barberoNombre,
  precioTotal,
  className = '',
}) => {
  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  // Formato de moneda colombiana
  const precioFormateado = precioTotal
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precioTotal)
    : undefined;

  // Construir mensaje elegante y oficial
  const generarTextoMensaje = () => {
    const sedeTexto = cita.sucursalNombre 
      ? `${cita.sucursalNombre}` 
      : 'Sede Chicó Real (Calle 72 # 11-45, Bogotá D.C.)';

    if (cita.tipo === 'Grupal') {
      const nombresParticipantes = cita.detalles?.map(d => `• ${d.nombre}`).join('\n') || '';
      return (
        `👑 *CONFIRMACIÓN DE RESERVA GRUPAL - BARBERÍA LA CASA DEL REY*\n\n` +
        `¡Hola! Confirmo mi reserva grupal realizada en la plataforma web:\n\n` +
        `🔖 *Folio de Reserva:* ${cita.idReserva}\n` +
        `👤 *Responsable:* ${cita.responsableNombre || 'Comitiva'}\n` +
        `📅 *Fecha:* ${cita.fecha}\n` +
        `⏰ *Hora:* ${cita.hora}\n` +
        `👥 *Integrantes (${cita.totalPersonas || 2} caballeros):*\n${nombresParticipantes}\n\n` +
        `📍 *Sede:* ${sedeTexto}\n` +
        `💈 ¡Muchas gracias! Nos vemos a la hora pactada.`
      );
    }

    return (
      `👑 *CONFIRMACIÓN DE TURNO - BARBERÍA LA CASA DEL REY*\n\n` +
      `¡Hola! Confirmo mi turno reservado en la plataforma web:\n\n` +
      `🔖 *Folio:* ${cita.idReserva}\n` +
      `👤 *Caballero:* ${cita.clienteNombre}\n` +
      `💈 *Servicio:* ${servicioNombre || 'Servicio de Barbería Clásica'}\n` +
      `✂️ *Barbero Asignado:* ${barberoNombre || 'Maestro Barbero'}\n` +
      `📅 *Fecha:* ${cita.fecha}\n` +
      `⏰ *Hora:* ${cita.hora}\n` +
      (precioFormateado ? `💰 *Valor:* ${precioFormateado}\n` : '') +
      `\n📍 *Sede:* ${sedeTexto}\n` +
      `💈 ¡Muchas gracias! Quedo atento a mi turno.`
    );
  };

  const textoMensaje = generarTextoMensaje();
  // Usar endpoint directo api.whatsapp.com para evitar el error de re-codificación UTF-8 de wa.me que corrompe emojis en 
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_BARBERIA_NUMERO}&text=${encodeURIComponent(textoMensaje)}`;

  // Enlace directo al chat con el propio cliente (para enviarse su propio recordatorio)
  const telClienteLimpio = (cita.clienteTelefono || cita.responsableTelefono || '').replace(/\D/g, '');
  const telClienteFormateado = telClienteLimpio.startsWith('57') 
    ? telClienteLimpio 
    : telClienteLimpio.length === 10 
    ? `57${telClienteLimpio}` 
    : telClienteLimpio;

  const urlParaCliente = telClienteFormateado 
    ? `https://api.whatsapp.com/send?phone=${telClienteFormateado}&text=${encodeURIComponent(textoMensaje)}` 
    : null;

  const handleCopiarMensaje = () => {
    navigator.clipboard.writeText(textoMensaje);
    setMensajeCopiado(true);
    setTimeout(() => setMensajeCopiado(false), 2500);
  };

  return (
    <div className={`p-4 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] shadow-2xs ${className}`}>
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#DFCBB5]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#25D366] text-[#0A180E] flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-[#221A14] tracking-wide flex items-center gap-1.5">
              <span>CONFIRMACIÓN DIRECTA VÍA WHATSAPP</span>
              <span className="px-1.5 py-0.2 text-[8px] font-bold bg-[#EBF7EE] text-[#15803D] rounded border border-[#86EFAC]">
                1 CLIC
              </span>
            </h4>
            <p className="text-[10px] text-[#6F5A4B] font-mono">
              Envía tu comprobante oficial al barbero de turno o guárdalo en tu chat
            </p>
          </div>
        </div>
        <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Botón principal: Notificar a Barbería La Casa del Rey */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="btn-whatsapp-barberia"
          className="flex-1 py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-[#0A180E] font-mono font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>CONFIRMAR CON LA BARBERÍA</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>

        {/* Botón secundario: Enviar recordatorio al propio cliente si tiene WhatsApp */}
        {urlParaCliente && (
          <a
            href={urlParaCliente}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-whatsapp-cliente"
            title="Abrir WhatsApp para enviarte este comprobante"
            className="py-2.5 px-3 rounded-lg bg-[#EBF7EE] hover:bg-[#DCF3E2] text-[#15803D] border border-[#86EFAC] font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>ENVIARME A MI NÚMERO</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}

        {/* Botón copiar texto completo */}
        <button
          type="button"
          onClick={handleCopiarMensaje}
          id="btn-copiar-mensaje-whatsapp"
          className="py-2.5 px-3 rounded-lg bg-[#FBEBE1] hover:bg-[#F3DECE] text-[#7C571C] border border-[#DFCBB5] font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          title="Copiar texto formateado para pegarlo en WhatsApp"
        >
          {mensajeCopiado ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#15803D]" />
              <span className="text-[#15803D]">¡COPIADO!</span>
            </>
          ) : (
            <span>COPIAR TEXTO</span>
          )}
        </button>
      </div>
    </div>
  );
};
