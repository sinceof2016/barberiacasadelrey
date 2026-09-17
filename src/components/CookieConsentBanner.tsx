/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Sliders, Check, X } from 'lucide-react';
import { 
  obtenerConsentimientoCookies, 
  aceptarTodasLasCookies, 
  aceptarSoloNecesarias,
  CookieConsent 
} from '../services/cookieService';

interface CookieConsentBannerProps {
  onOpenPreferences: () => void;
  onConsentGiven?: (consent: CookieConsent) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenPreferences,
  onConsentGiven
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si ya existe consentimiento
    const consent = obtenerConsentimientoCookies();
    if (!consent) {
      // Entrada sutil con retardo
      const timer = setTimeout(() => {
        setVisible(true);
      }, 400);
      return () => clearTimeout(timer);
    }

    // Escuchar si cambia el consentimiento en otra parte o modal
    const syncHandler = (e: any) => {
      if (e.detail) {
        setVisible(false);
      }
    };

    window.addEventListener('cdr_cookie_consent_changed', syncHandler);
    return () => window.removeEventListener('cdr_cookie_consent_changed', syncHandler);
  }, []);

  if (!visible) return null;

  const handleAceptarTodas = () => {
    const nuevo = aceptarTodasLasCookies();
    setVisible(false);
    if (onConsentGiven) onConsentGiven(nuevo);
  };

  const handleSoloNecesarias = () => {
    const nuevo = aceptarSoloNecesarias();
    setVisible(false);
    if (onConsentGiven) onConsentGiven(nuevo);
  };

  const handleAbrirConfiguracion = () => {
    onOpenPreferences();
  };

  return (
    <aside
      id="cdr-cookie-consent-banner"
      aria-label="Aviso de Cookies y Privacidad"
      className="fixed z-[60] bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-lg bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl shadow-[0_12px_36px_rgba(34,26,20,0.25)] p-4 sm:p-5 font-sans animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        {/* Icono Vintage Barber */}
        <div className="w-10 h-10 rounded-xl bg-[#7C571C] text-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Cookie className="w-5 h-5 text-[#FAF6EE]" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Título y badge legal */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold font-serif text-sm sm:text-base text-[#221A14] truncate">
              <span>Uso de Cookies en La Casa del Rey</span>
            </div>
            <button
              type="button"
              onClick={handleSoloNecesarias}
              className="p-1 text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] rounded-lg transition-colors cursor-pointer shrink-0"
              title="Continuar solo con cookies técnicas necesarias"
              aria-label="Cerrar y conservar solo necesarias"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-[#15803D] bg-[#EBF7EE] px-2 py-0.5 rounded-full border border-[#86EFAC] flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3 text-[#15803D]" />
              <span>Ley 1581 / Habeas Data</span>
            </span>
            <span className="text-[10px] font-mono text-[#6F5A4B]">
              • Privacidad y Control
            </span>
          </div>

          <p className="text-xs text-[#4F4539] leading-relaxed">
            Utilizamos cookies técnicas para el funcionamiento seguro de la plataforma y cookies opcionales para recordar tu sede y estilista predilecto, agilizando tus próximas reservas de barbería.
          </p>

          {/* Botonera adaptativa y ergonómica */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
            <button
              type="button"
              id="btn-aceptar-todas-cookies"
              onClick={handleAceptarTodas}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 text-xs active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aceptar Todas</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-solo-necesarias-cookies"
                onClick={handleSoloNecesarias}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-[#DFCBB5] bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#4F4539] font-bold transition-all cursor-pointer text-xs text-center active:scale-[0.98]"
              >
                Solo Necesarias
              </button>

              <button
                type="button"
                id="btn-configurar-cookies"
                onClick={handleAbrirConfiguracion}
                className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-[#7C571C] hover:bg-[#FBEBE1] border border-transparent hover:border-[#DFCBB5] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Personalizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
