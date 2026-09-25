import React, { useEffect } from 'react';
import { 
  Scissors, 
  Home, 
  CalendarCheck, 
  Sparkles, 
  ArrowLeft, 
  Store, 
  Phone, 
  MapPin, 
  Clock, 
  Search,
  Compass,
  CornerDownLeft,
  ChevronRight
} from 'lucide-react';
import { 
  VintageCrownIcon, 
  StraightRazorIcon, 
  BarberPoleRibbon,
  VintageBarberPole,
  VintageScissorsIcon
} from './VintageBarberIcons';
import { LOGO_CASA_DEL_REY } from '../utils/assets';
import { track404Error } from '../services/analytics';
import { TabType } from './Navbar';

interface NotFoundPageProps {
  rutaIntentada?: string;
  onGoHome: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  rutaIntentada,
  onGoHome,
  onNavigateTab,
}) => {
  const currentPath = rutaIntentada || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/ruta-no-encontrada');

  useEffect(() => {
    track404Error(currentPath);
  }, [currentPath]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 font-mono text-xs text-[#221A14]">
      {/* Tarjeta Principal de Error 404 */}
      <div className="relative bg-[#FFF8F5] border-2 border-[#DFCBB5] rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Cinta Vintage Superior */}
        <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
          <BarberPoleRibbon className="w-full h-full" />
        </div>

        {/* Marca de agua decorativa de fondo */}
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-[#7C571C]">
          <Scissors className="w-80 h-80 rotate-12" />
        </div>

        {/* Encabezado con Escudo y Badge */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBEBE1] border border-[#C49756] text-[#7C571C] font-bold text-[10px] uppercase tracking-widest shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C49756]" />
            <span>Extravío en el Salón Real</span>
            <Sparkles className="w-3 h-3 text-[#C49756]" />
          </div>

          {/* Número 404 Gigante con Estilo Artesanal */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 my-2">
            <span className="font-serif text-6xl sm:text-8xl font-black text-[#7C571C] tracking-tighter drop-shadow-sm">
              4
            </span>
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#FBEBE1] border-2 border-[#C49756] flex items-center justify-center shadow-inner group">
              <img 
                src={LOGO_CASA_DEL_REY} 
                alt="La Casa del Rey" 
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full border border-[#C49756]/40 shadow-sm"
              />
              <div className="absolute -bottom-2 -right-2 bg-[#7C571C] text-[#FAF6EE] p-1 rounded-full shadow-md">
                <StraightRazorIcon className="w-4 h-4" />
              </div>
            </div>
            <span className="font-serif text-6xl sm:text-8xl font-black text-[#7C571C] tracking-tighter drop-shadow-sm">
              4
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#221A14] uppercase tracking-wide">
            Corte Fuera de Lugar
          </h1>
          <p className="text-sm font-serif italic text-[#7C571C]">
            «Página o Turno No Encontrado en el Registro Real»
          </p>
        </div>

        {/* Caja de Explicación Temática */}
        <div className="mt-6 max-w-xl mx-auto bg-[#FFFFFF] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 text-center shadow-sm space-y-2 relative z-10">
          <p className="text-xs text-[#6F5A4B] leading-relaxed">
            Parece que la dirección solicitada <span className="px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] font-bold break-all">{currentPath}</span> recibió un corte demasiado rasurado o se extravió entre las calles de Bogotá.
          </p>
          <p className="text-[11px] text-[#4F4539]">
            No te preocupes, el maestro barbero no ha guardado la navaja todavía. Puedes regresar al salón principal o elegir una de las opciones a continuación.
          </p>
        </div>

        {/* Acciones Principales y Botón de Retorno */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-98 flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer border border-[#C49756]"
          >
            <Home className="w-4 h-4 text-[#C49756]" />
            <span>Regresar al Salón Principal (Inicio)</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('reservar')}
              className="w-full sm:w-auto px-5 py-3.5 bg-[#FBEBE1] hover:bg-[#F2DCCB] text-[#7C571C] font-mono font-bold text-xs rounded-xl transition-all border border-[#C49756] flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer shadow-sm active:scale-98"
            >
              <CalendarCheck className="w-4 h-4 text-[#7C571C]" />
              <span>Agendar Cita Real</span>
            </button>
          )}
        </div>

        {/* Accesos Rápidos de Navegación */}
        <div className="mt-8 pt-6 border-t border-[#DFCBB5] grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('servicios') : onGoHome()}
            className="p-3 bg-[#FFFFFF] hover:bg-[#FBEBE1] border border-[#DFCBB5] rounded-xl transition-colors text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FBEBE1] flex items-center justify-center text-[#7C571C]">
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-[11px] text-[#221A14] block">Servicios & Tarifas</span>
                <span className="text-[10px] text-[#6F5A4B]">Cortes clásicos y barba</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F5A4B] group-hover:text-[#7C571C] transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('barberos') : onGoHome()}
            className="p-3 bg-[#FFFFFF] hover:bg-[#FBEBE1] border border-[#DFCBB5] rounded-xl transition-colors text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FBEBE1] flex items-center justify-center text-[#7C571C]">
                <VintageCrownIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-[11px] text-[#221A14] block">Nuestros Barberos</span>
                <span className="text-[10px] text-[#6F5A4B]">Maestros de la navaja</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F5A4B] group-hover:text-[#7C571C] transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('agenda') : onGoHome()}
            className="p-3 bg-[#FFFFFF] hover:bg-[#FBEBE1] border border-[#DFCBB5] rounded-xl transition-colors text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FBEBE1] flex items-center justify-center text-[#7C571C]">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-[11px] text-[#221A14] block">Consultar Turnos</span>
                <span className="text-[10px] text-[#6F5A4B]">Agenda del día en vivo</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F5A4B] group-hover:text-[#7C571C] transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Pie de Sedes e Información de Contacto */}
        <div className="mt-6 pt-4 border-t border-[#DFCBB5] flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#6F5A4B] relative z-10">
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>Sedes: Chicó Real • Usaquén Colonial • Chapinero Vintage</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>Línea Directa: +57 (601) 745-8891 / WhatsApp: +57 312 644 1665</span>
          </div>
        </div>
      </div>
    </div>
  );
};
