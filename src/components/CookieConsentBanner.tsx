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
      role="region"
      className="fixed z-[55] top-16 sm:top-auto sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md bg-[#FFF8F5]/98 border-2 border-[#7C571C] rounded-2xl shadow-[0_8px_30px_rgba(34,26,20,0.22)] p-3 sm:p-4 font-sans animate-in slide-in-from-top-4 sm:slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Icono Vintage Barber */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#7C571C] text-[#FAF6EE] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Cookie className="w-4 h-4 text-[#FAF6EE]" />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Título y badge legal */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 font-bold font-serif text-xs sm:text-sm text-[#221A14] truncate">
              <span>Cookies en La Casa del Rey</span>
            </div>
            <button
              type="button"
              onClick={handleSoloNecesarias}
              className="p-1 text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] rounded-lg transition-colors cursor-pointer shrink-0"
              title="Continuar solo con cookies técnicas necesarias"
              aria-label="Cerrar y conservar solo necesarias"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-[#4F4539] leading-snug line-clamp-2 sm:line-clamp-none">
            Usamos cookies técnicas para garantizar reservas seguras y opcionales para recordar tu barbero y sede predilecta (Ley 1581 / Habeas Data).
          </p>

          {/* Botonera compacta para mobile */}
          <div className="pt-1 flex items-center gap-1.5 flex-wrap sm:flex-nowrap font-mono text-[11px]">
            <button
              type="button"
              id="btn-aceptar-todas-cookies"
              onClick={handleAceptarTodas}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <Check className="w-3 h-3" />
              <span>Aceptar</span>
            </button>

            <button
              type="button"
              id="btn-solo-necesarias-cookies"
              onClick={handleSoloNecesarias}
              className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg border border-[#DFCBB5] bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#4F4539] font-semibold transition-all cursor-pointer text-center active:scale-95"
            >
              Solo Necesarias
            </button>

            <button
              type="button"
              id="btn-configurar-cookies"
              onClick={handleAbrirConfiguracion}
              className="px-2 py-1.5 rounded-lg text-[#7C571C] hover:bg-[#FBEBE1] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden xs:inline sm:inline">Ajustar</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
