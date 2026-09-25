import React from 'react';
import { Users, MapPin, Sparkles, Scissors, Calendar } from 'lucide-react';
import { HERITAGE_EMBLEM_LOGO } from '../utils/assets';

interface HeroBannerProps {
  bookingType: 'individual' | 'grupal';
  setBookingType: (type: 'individual' | 'grupal') => void;
  onOpenLookup?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  bookingType,
  setBookingType,
}) => {
  return (
    <div className="gsap-hero-container rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] shadow-sm relative overflow-hidden mb-4 sm:mb-6 p-3 sm:p-6 transition-shadow hover:shadow-md max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5 max-w-full">
        <div className="flex items-start gap-3 sm:gap-4 w-full max-w-full min-w-0">
          {/* Emblema Oficial Circular e Íntegro */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#C49756] bg-[#221A14] shadow-md shrink-0 flex items-center justify-center ring-2 ring-[#DFCBB5]/50">
            <img 
              src={HERITAGE_EMBLEM_LOGO} 
              alt="Emblema Oficial Barbería La Casa del Rey" 
              className="w-full h-full object-contain p-0.5 rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0 max-w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 bg-[#FBEBE1] text-[#7C571C] text-[9px] sm:text-[10px] font-mono font-bold rounded-full border border-[#DFCBB5] flex items-center gap-1 max-w-full truncate">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C49756] shrink-0" />
                <span className="truncate">EST. 2016 • TRADICIÓN REAL</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-[#6F5A4B] hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C571C] shrink-0" /> BOGOTÁ • 3 SEDES (CHICÓ, USAQUÉN, CHAPINERO)
              </span>
            </div>

            <h1 className="text-sm sm:text-2xl font-serif font-bold text-[#221A14] mb-1 sm:mb-1.5 leading-tight gsap-parallax-text break-words">
              Reserva de Turno & <span className="text-[#7C571C]">Cuidado Tradicional</span>
            </h1>

            <p className="text-xs text-[#4F4539] leading-relaxed mb-3 sm:mb-4 font-sans hidden sm:block max-w-2xl">
              Selecciona tu sede de preferencia, el maestro barbero de tu confianza y el horario que mejor se adapte a tu agenda. Turnos individuales con toallas al vapor o reservas grupales.
            </p>

            {/* Mode Switcher con ajuste perfecto para móviles */}
            <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1 rounded-xl sm:rounded-full bg-[#FBEBE1] border border-[#DFCBB5] shadow-inner max-w-full">
              <button
                id="btn-switch-individual"
                onClick={() => setBookingType('individual')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer min-w-0 ${
                  bookingType === 'individual'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Cita Individual</span>
              </button>

              <button
                id="btn-switch-grupal"
                onClick={() => setBookingType('grupal')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 rounded-lg sm:rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer min-w-0 ${
                  bookingType === 'grupal'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Reserva Grupal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
