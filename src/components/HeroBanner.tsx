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
    <div className="rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] shadow-sm relative overflow-hidden mb-6 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
          {/* Emblema Oficial */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-[#DFCBB5] bg-[#FBEBE1] shadow-sm shrink-0 flex items-center justify-center">
            <img 
              src={HERITAGE_EMBLEM_LOGO} 
              alt="Emblema Oficial Barbería La Casa del Rey" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#FBEBE1] text-[#7C571C] text-[10px] font-mono font-bold rounded-full border border-[#DFCBB5] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C49756]" />
                <span>EST. 2016 • TRADICIÓN DE BARBERÍA</span>
              </span>
              <span className="text-[10px] font-mono text-[#6F5A4B] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7C571C]" /> BOGOTÁ • 3 SEDES (CHICÓ, USAQUÉN, CHAPINERO)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#221A14] mb-1.5 leading-tight">
              Reserva de Turno & <span className="text-[#7C571C]">Cuidado Tradicional</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#4F4539] leading-relaxed mb-4 font-sans max-w-2xl">
              Selecciona tu sede de preferencia, el maestro barbero de tu confianza y el horario que mejor se adapte a tu agenda. Turnos individuales con toallas al vapor o reservas grupales.
            </p>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 rounded-full bg-[#FBEBE1] border border-[#DFCBB5] shadow-inner">
              <button
                id="btn-switch-individual"
                onClick={() => setBookingType('individual')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  bookingType === 'individual'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cita Individual</span>
              </button>

              <button
                id="btn-switch-grupal"
                onClick={() => setBookingType('grupal')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  bookingType === 'grupal'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-bold'
                    : 'text-[#6F5A4B] hover:text-[#221A14]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Reserva Grupal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
