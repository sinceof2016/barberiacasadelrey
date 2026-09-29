import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink,
  Sparkles,
  Scissors,
  ShieldCheck,
  Printer,
  Smartphone,
  CheckCircle2,
  Building2,
  Phone,
  Clock
} from 'lucide-react';
import { LOGO_CASA_DEL_REY } from '../utils/assets';

export const TARGET_URL = 'https://sinceof2016.github.io/barberiacasadelrey/';

export const SuperAdminQrSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [descargandoPoster, setDescargandoPoster] = useState<boolean>(false);
  const [descargandoSoloQr, setDescargandoSoloQr] = useState<boolean>(false);

  useEffect(() => {
    const generateQr = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
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
        console.error('Error generando QR en Super Admin:', err);
      }
    };

    generateQr();
  }, []);

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(TARGET_URL);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
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

  const handleDescargarSoloQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDescargandoSoloQr(true);
    try {
      const link = document.createElement('a');
      link.download = 'QR_LaCasaDelRey_Logo.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al descargar código QR:', err);
    } finally {
      setDescargandoSoloQr(false);
    }
  };

  const handleDescargarPosterPng = () => {
    setDescargandoPoster(true);
    try {
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
      link.download = 'Cartel_Oficial_QR_LaCasaDelRey.png';
      link.href = posterCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al descargar póster QR:', err);
    } finally {
      setDescargandoPoster(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#7C571C] text-[#FFFFFF] flex items-center justify-center shadow-md shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#221A14]">
                  Gestión del Código QR Oficial
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                Generador institucional exclusivo con logotipo central de Barbería La Casa del Rey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[#15803D] font-mono text-xs bg-[#EBF7EE] px-3 py-1.5 rounded-xl border border-[#86EFAC]/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nivel H (30% Corrección)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Vista Previa del Código QR */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#FFFFFF] border-2 border-[#DFCBB5] rounded-3xl p-6 shadow-sm flex flex-col items-center relative">
            {/* Esquinas ornamentales estilo barbería */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#7C571C]" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#7C571C]" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#7C571C]" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#7C571C]" />

            <div className="text-center mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7C571C] font-bold block">
                BARBERÍA LA CASA DEL REY
              </span>
              <h3 className="font-serif font-bold text-base text-[#221A14]">
                Escanea para Agendar Turno
              </h3>
            </div>

            {/* Canvas con el código QR y logo centrado */}
            <div className="p-3 bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[260px] h-auto rounded-xl"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-mono font-bold text-[#7C571C] bg-[#FBEBE1] px-3 py-1 rounded-full border border-[#DFCBB5] inline-block">
                sinceof2016.github.io/barberiacasadelrey
              </span>
              <p className="text-[11px] text-[#6F5A4B] mt-1.5">
                Compatible con la cámara de cualquier teléfono iOS / Android sin instalar apps.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Controles y Herramientas */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card de URL y Enlace */}
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-[#7C571C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>URL DESTINO DEL CÓDIGO QR</span>
              </span>
              <a
                href={TARGET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7C571C] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Abrir en navegador</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={TARGET_URL}
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl px-3 py-2 text-xs font-mono text-[#221A14] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopiarEnlace}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  copiado
                    ? 'bg-[#15803D] text-[#FFFFFF]'
                    : 'bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF]'
                }`}
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

          {/* Botones de Descarga y Difusión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDescargarPosterPng}
              disabled={descargandoPoster}
              className="p-3.5 rounded-2xl bg-[#7C571C] hover:bg-[#684715] text-[#FFFFFF] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{descargandoPoster ? 'Generando...' : 'Descargar Cartel Completo (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarSoloQr}
              disabled={descargandoSoloQr}
              className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <QrCode className="w-4 h-4 text-[#7C571C]" />
              <span>{descargandoSoloQr ? 'Descargando...' : 'Descargar Solo QR (Cuadrado)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="p-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-[#FFFFFF] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#221A14] border border-[#DFCBB5] font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-[#6F5A4B]" />
              <span>Imprimir Vista Rápida</span>
            </button>
          </div>

          {/* Guía Operativa para el Salón */}
          <div className="bg-[#FBEBE1] border border-[#DFCBB5] rounded-2xl p-4 text-xs text-[#4F4539] space-y-2">
            <h4 className="font-serif font-bold text-xs text-[#221A14] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#7C571C]" />
              <span>Recomendaciones de Uso para Don David Orjuela</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-[#6F5A4B] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#7C571C] font-bold">•</span>
                <span><strong>Mostrador de Recepción:</strong> Imprime el cartel en tamaño carta o en un marco de madera vintage para colocarlo junto a la caja.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#7C571C] font-bold">•</span>
                <span><strong>Espejos de Estación:</strong> Puedes descargar la imagen individual del QR para imprimir pequeños stickers en cada puesto de los barberos.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#7C571C] font-bold">•</span>
                <span><strong>Fidelización de Clientes:</strong> Los clientes habituales pueden guardar el link en los favoritos de su teléfono o escanearlo para consultar disponibilidad sin llamar.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
