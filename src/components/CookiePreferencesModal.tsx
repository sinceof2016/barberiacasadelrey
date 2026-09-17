/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Cookie, 
  Sliders, 
  Check, 
  Lock, 
  Info, 
  Calendar,
  Sparkles,
  BarChart3,
  HelpCircle,
  Clock
} from 'lucide-react';
import { 
  CookieConsent, 
  CATALOGO_COOKIES, 
  obtenerConsentimientoCookies, 
  guardarConsentimientoCookies,
  aceptarTodasLasCookies,
  aceptarSoloNecesarias
} from '../services/cookieService';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesSaved?: (consent: CookieConsent) => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesSaved
}) => {
  const [funcionales, setFuncionales] = useState<boolean>(true);
  const [analiticas, setAnaliticas] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);
  const [tabDetalles, setTabDetalles] = useState<boolean>(false);
  const [fechaPrevia, setFechaPrevia] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const actual = obtenerConsentimientoCookies();
      if (actual) {
        setFuncionales(actual.funcionales);
        setAnaliticas(actual.analiticas);
        setMarketing(actual.marketing);
        setFechaPrevia(actual.fechaDecision);
      } else {
        setFuncionales(true);
        setAnaliticas(false);
        setMarketing(false);
        setFechaPrevia(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGuardarPersonalizado = () => {
    const nuevo = guardarConsentimientoCookies({
      funcionales,
      analiticas,
      marketing
    });
    if (onPreferencesSaved) onPreferencesSaved(nuevo);
    onClose();
  };

  const handleAceptarTodas = () => {
    const nuevo = aceptarTodasLasCookies();
    if (onPreferencesSaved) onPreferencesSaved(nuevo);
    onClose();
  };

  const handleSoloNecesarias = () => {
    const nuevo = aceptarSoloNecesarias();
    if (onPreferencesSaved) onPreferencesSaved(nuevo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-cookie-title"
      >
        {/* Cabecera Vintage */}
        <div className="p-4 sm:p-5 border-b border-[#DFCBB5] bg-[#FBEBE1] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#7C571C] text-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-cookie-title" className="font-serif font-bold text-base sm:text-lg text-[#221A14]">
                Centro de Preferencias de Cookies
              </h2>
              <p className="text-[11px] font-mono text-[#6F5A4B]">
                Barbería La Casa del Rey • Política de Privacidad & Habeas Data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#F5E5DB] rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#221A14] leading-relaxed">
          {/* Explicación de Habeas Data & Transparencia */}
          <div className="p-3 bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl text-[#4F4539] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#7C571C] font-mono text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Compromiso de Privacidad y Confianza</span>
            </div>
            <p>
              En <strong>La Casa del Rey</strong> tratamos tus datos personales y dispositivos con los más altos estándares de honor y seguridad, en cumplimiento con la <strong>Ley 1581 de 2012 de Colombia</strong> y normativas internacionales. Tú decides qué tecnologías de almacenamiento y cookies deseas habilitar.
            </p>
            {fechaPrevia && (
              <p className="text-[10px] font-mono text-[#6F5A4B] pt-1 border-t border-[#DFCBB5]/50 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#7C571C]" />
                <span>Última decisión registrada: {new Date(fechaPrevia).toLocaleDateString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            )}
          </div>

          {/* Selector de pestañas: Categorías vs Catálogo detallado */}
          <div className="flex items-center gap-2 border-b border-[#DFCBB5] pb-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setTabDetalles(false)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                !tabDetalles 
                  ? 'bg-[#7C571C] text-[#FAF6EE] shadow-xs' 
                  : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              Categorías de Cookies
            </button>
            <button
              type="button"
              onClick={() => setTabDetalles(true)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                tabDetalles 
                  ? 'bg-[#7C571C] text-[#FAF6EE] shadow-xs' 
                  : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              Inventario Técnico ({CATALOGO_COOKIES.length})
            </button>
          </div>

          {!tabDetalles ? (
            <div className="space-y-3">
              {/* 1. Categoría Esenciales (Siempre Activa) */}
              <div className="p-3.5 bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#7C571C]" />
                    <span className="font-bold font-serif text-sm text-[#221A14]">
                      Cookies Técnicas y Esenciales
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] font-mono text-[10px] font-bold uppercase">
                    Siempre Activas
                  </span>
                </div>
                <p className="text-[#6F5A4B]">
                  Son estrictamente requeridas para el funcionamiento técnico de la plataforma: preservan la sesión del personal del salón, evitan duplicación de reservas, gestionan la seguridad contra bots y almacenan tu elección de privacidad.
                </p>
              </div>

              {/* 2. Categoría Funcionales y Preferencias */}
              <div className="p-3.5 bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C571C]" />
                    <div>
                      <span className="font-bold font-serif text-sm text-[#221A14]">
                        Funcionales & Preferencias Personales
                      </span>
                      <span className="block text-[10px] font-mono text-[#7C571C]">
                        Recomendado para caballeros recurrentes
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={funcionales}
                      onChange={(e) => setFuncionales(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E0D3C3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C4B5A5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C571C]"></div>
                  </label>
                </div>
                <p className="text-[#6F5A4B]">
                  Permiten al sitio recordar tu nombre, teléfono y correo electrónico para que no tengas que escribirlos cada vez que reserves turno, además de recordar tu sede favorita (Chicó, Cedritos o Usaquén).
                </p>
              </div>

              {/* 3. Categoría Analíticas y Rendimiento */}
              <div className="p-3.5 bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#7C571C]" />
                    <span className="font-bold font-serif text-sm text-[#221A14]">
                      Analítica y Rendimiento del Salón
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analiticas}
                      onChange={(e) => setAnaliticas(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E0D3C3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C4B5A5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C571C]"></div>
                  </label>
                </div>
                <p className="text-[#6F5A4B]">
                  Nos ayudan a entender de manera 100% anónima qué servicios de barbería tienen mayor demanda y cuáles horarios son los preferidos, optimizando los tiempos de preparación y disponibilidad de poltronas.
                </p>
              </div>

              {/* 4. Categoría Marketing y Beneficios */}
              <div className="p-3.5 bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-[#7C571C]" />
                    <span className="font-bold font-serif text-sm text-[#221A14]">
                      Personalización & Beneficios Exclusivos
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E0D3C3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C4B5A5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C571C]"></div>
                  </label>
                </div>
                <p className="text-[#6F5A4B]">
                  Permiten gestionar la frecuencia con la que te mostramos promociones de cortesía, beneficios de membresía del club y novedades de productos para el cuidado de barba.
                </p>
              </div>
            </div>
          ) : (
            /* Vista del Inventario Técnico de Cookies */
            <div className="space-y-2.5">
              <p className="text-[11px] text-[#6F5A4B]">
                A continuación se detalla cada identificador técnico empleado en el dominio de Barbería La Casa del Rey:
              </p>
              <div className="overflow-x-auto border border-[#DFCBB5] rounded-xl bg-[#FFFFFF]">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-[#FBEBE1] text-[#7C571C] border-b border-[#DFCBB5]">
                    <tr>
                      <th className="p-2.5 font-bold">Cookie / Clave</th>
                      <th className="p-2.5 font-bold">Categoría</th>
                      <th className="p-2.5 font-bold">Propósito</th>
                      <th className="p-2.5 font-bold">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFCBB5]">
                    {CATALOGO_COOKIES.map((c) => (
                      <tr key={c.nombre} className="hover:bg-[#FFF8F5]">
                        <td className="p-2.5 font-bold text-[#221A14]">{c.nombre}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.categoria === 'necesarias' 
                              ? 'bg-[#EBF7EE] text-[#15803D]' 
                              : c.categoria === 'funcionales'
                              ? 'bg-[#FBEBE1] text-[#7C571C]'
                              : 'bg-[#F3EDE6] text-[#4F4539]'
                          }`}>
                            {c.categoria}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#6F5A4B] font-sans">{c.proposito}</td>
                        <td className="p-2.5 text-[#4F4539]">{c.duracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Acciones del Footer */}
        <div className="p-4 sm:p-5 border-t border-[#DFCBB5] bg-[#FBEBE1] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={handleSoloNecesarias}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#DFCBB5] bg-[#FFFFFF] hover:bg-[#FFF8F5] text-[#4F4539] font-bold transition-all cursor-pointer text-center"
          >
            Rechazar Opcionales
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleGuardarPersonalizado}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#7C571C] bg-[#F5E5DB] hover:bg-[#EBD6C7] text-[#7C571C] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Selección</span>
            </button>
            <button
              type="button"
              onClick={handleAceptarTodas}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold transition-all cursor-pointer text-center shadow-sm"
            >
              Aceptar Todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
