import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  ExternalLink,
  Sparkles,
  Scissors
} from 'lucide-react';
import { LOGO_CASA_DEL_REY } from '../utils/assets';

interface BarbershopQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TARGET_URL = 'https://sinceof2016.github.io/barberiacasadelrey/';

export const BarbershopQrModal: React.FC<BarbershopQrModalProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Render QR Code onto canvas with embedded barbershop logo
    const generateQr = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // High error correction level (H = 30%) allows embedding logo in center without breaking scan
        await QRCode.toCanvas(canvas, TARGET_URL, {
          errorCorrectionLevel: 'H',
          margin: 3,
          width: 320,
          color: {
            dark: '#221A14',
            light: '#FFF8F5',
          },
        });

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load the logo image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = LOGO_CASA_DEL_REY;

        img.onload = () => {
          const qrSize = canvas.width;
          const logoSize = Math.floor(qrSize * 0.24);
          const x = (qrSize - logoSize) / 2;
          const y = (qrSize - logoSize) / 2;
          const radius = logoSize / 2;

          // Outer circular badge background with shadow
          ctx.save();
          ctx.beginPath();
          ctx.arc(qrSize / 2, qrSize / 2, radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF8F5';
          ctx.shadowColor = 'rgba(34, 26, 20, 0.3)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();

          // Golden heritage border
          ctx.save();
          ctx.beginPath();
          ctx.arc(qrSize / 2, qrSize / 2, radius + 3, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#7C571C';
          ctx.stroke();
          ctx.restore();

          // Circular clip and draw logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(qrSize / 2, qrSize / 2, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x, y, logoSize, logoSize);
          ctx.restore();

          // Subtle inner ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(qrSize / 2, qrSize / 2, radius, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.stroke();
          ctx.restore();
        };
      } catch (err) {
        console.error('Error generando código QR:', err);
      }
    };

    const timer = setTimeout(generateQr, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = TARGET_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    }
  };

  const handleCompartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `💈 *Barbería La Casa del Rey*\nReserva tu turno de corte y ritual de barba aquí:\n${TARGET_URL}`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const handleDescargarPng = () => {
    setDescargando(true);
    try {
      // Create high-res poster canvas for printing / sharing
      const posterCanvas = document.createElement('canvas');
      const pWidth = 800;
      const pHeight = 1000;
      posterCanvas.width = pWidth;
      posterCanvas.height = pHeight;
      const ctx = posterCanvas.getContext('2d');

      if (!ctx) return;

      // Background
      ctx.fillStyle = '#FFF8F5';
      ctx.fillRect(0, 0, pWidth, pHeight);

      // Vintage double border
      ctx.strokeStyle = '#DFCBB5';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, pWidth - 40, pHeight - 40);

      ctx.strokeStyle = '#7C571C';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 28, pWidth - 56, pHeight - 56);

      // Top Header
      ctx.fillStyle = '#7C571C';
      ctx.font = 'bold 20px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('BARBERÍA CLÁSICA • EST. 2016', pWidth / 2, 85);

      ctx.fillStyle = '#221A14';
      ctx.font = 'bold 36px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.fillText('LA CASA DEL REY', pWidth / 2, 135);

      ctx.fillStyle = '#6F5A4B';
      ctx.font = 'italic 18px Georgia, serif';
      ctx.fillText('Tradición real & cuidado exclusivo para caballeros', pWidth / 2, 175);

      // Decorative divider line
      ctx.beginPath();
      ctx.moveTo(pWidth / 2 - 120, 195);
      ctx.lineTo(pWidth / 2 + 120, 195);
      ctx.strokeStyle = '#C49756';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the QR Code with logo from current canvas
      if (canvasRef.current) {
        const qrSize = 440;
        const qrX = (pWidth - qrSize) / 2;
        const qrY = 230;

        // Shadow behind QR
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(34, 26, 20, 0.12)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
        ctx.shadowColor = 'transparent';

        // Border around QR container
        ctx.strokeStyle = '#DFCBB5';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);

        // Draw the QR image
        ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);
      }

      // Bottom Instructions
      ctx.fillStyle = '#221A14';
      ctx.font = 'bold 24px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.fillText('ESCANEA PARA AGENDAR TU TURNO', pWidth / 2, 730);

      ctx.fillStyle = '#7C571C';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('sinceof2016.github.io/barberiacasadelrey', pWidth / 2, 765);

      ctx.fillStyle = '#6F5A4B';
      ctx.font = '14px sans-serif';
      ctx.fillText('Cortes • Barba Tradicional • Ritual de Toalla Caliente', pWidth / 2, 820);
      ctx.fillText('Bogotá, Colombia • Cra. 15 # 85-32 Chicó Real', pWidth / 2, 850);
      ctx.fillText('Atención Lunes a Sábado 9:00 AM - 7:30 PM', pWidth / 2, 875);

      // Create download trigger
      const link = document.createElement('a');
      link.download = 'QR_Barberia_LaCasaDelRey.png';
      link.href = posterCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al descargar póster QR:', err);
    } finally {
      setDescargando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#FFF8F5] border-2 border-[#DFCBB5] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 pt-5 pb-3 border-b border-[#DFCBB5] flex items-center justify-between bg-[#FBEBE1]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7C571C] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#221A14] leading-tight">
                Código QR de Reservas
              </h3>
              <p className="text-[10px] text-[#6F5A4B] font-mono">
                Barbería La Casa del Rey
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#F5E5DB] transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Card del QR con marco patrimonial */}
          <div className="relative mx-auto flex flex-col items-center justify-center p-4 rounded-3xl bg-[#FFFFFF] border-2 border-[#DFCBB5] shadow-sm max-w-[280px]">
            {/* Corner vintage marks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#7C571C]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#7C571C]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#7C571C]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#7C571C]" />

            <div className="w-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[240px] h-auto rounded-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="mt-2 text-center">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#7C571C] block">
                ESCANEA CON TU CÁMARA
              </span>
              <span className="text-[11px] text-[#6F5A4B]">
                Acceso directo a la plataforma de citas
              </span>
            </div>
          </div>

          {/* Enlace Oficial & Botón de Copiar */}
          <div className="p-3 rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase font-bold text-[#7C571C] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>DIRECCIÓN DESTINO:</span>
              </span>
              <a
                href={TARGET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#7C571C] hover:underline flex items-center gap-0.5"
              >
                <span>Visitar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={TARGET_URL}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-[#221A14] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copiado
                    ? 'bg-[#15803D] text-[#FFFFFF]'
                    : 'bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF]'
                }`}
                title="Copiar enlace"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Acciones Rápidas: Descargar, WhatsApp, Imprimir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDescargarPng}
              disabled={descargando}
              className="py-2.5 px-3.5 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{descargando ? 'Generando...' : 'Descargar Cartel PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="py-2.5 px-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en WhatsApp</span>
            </button>
          </div>

          <p className="text-[10px] text-center text-[#6F5A4B] leading-tight">
            Ideal para imprimir y ubicar en el mostrador de recepción, espejos del salón o tarjetas de presentación.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#DFCBB5] bg-[#FBEBE1]/50 flex items-center justify-between text-[11px] text-[#6F5A4B]">
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Scissors className="w-3 h-3 text-[#7C571C]" />
            <span>EST. 2016 • BOGOTÁ</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] text-[#221A14] font-medium text-xs cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
