import React from 'react';
import { Barbero } from '../types';
import { UserCheck, Star, Award, Scissors, ArrowRight } from 'lucide-react';
import { HERITAGE_AVATAR_PROFILE } from '../utils/assets';

interface BarbersTeamProps {
  barberos: Barbero[];
  onSelectBarbero: (barberoId: number) => void;
}

export const BarbersTeam: React.FC<BarbersTeamProps> = ({
  barberos,
  onSelectBarbero,
}) => {
  return (
    <section id="seccion-barberos" className="py-4 px-2 sm:px-0 scroll-mt-20">
      <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#7C571C]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#7C571C] font-mono">
              GREMIO DE MAESTROS BARBEROS
            </h2>
            <span className="px-2 py-0.5 bg-[#FBEBE1] text-[#7C571C] text-[10px] font-mono rounded-full border border-[#DFCBB5]">
              {barberos.length} MAESTROS DISPONIBLES
            </span>
          </div>
          <p className="text-xs text-[#6F5A4B] mt-0.5 font-sans">
            Especialistas con titulación clásica en navaja libre, tijera alemana y rituales de toalla al vapor
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {barberos.map((b) => (
          <div
            key={b.id}
            id={`barber-card-${b.id}`}
            className="gsap-expand-card p-5 rounded-2xl bg-[#FFF1E9] border border-[#DFCBB5] hover:border-[#7C571C] transition-all flex flex-col justify-between shadow-sm hover:shadow-md group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#DFCBB5] group-hover:border-[#7C571C] shadow-sm shrink-0 bg-[#FBEBE1] flex items-center justify-center">
                <img
                  src={b.foto || HERITAGE_AVATAR_PROFILE}
                  alt={b.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 gsap-parallax-img"
                  data-parallax="true"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-[#C49756] text-xs">
                    <Star className="w-3.5 h-3.5 fill-[#C49756]" />
                    <span className="text-xs font-bold text-[#221A14]">5.0</span>
                    <span className="text-[10px] text-[#6F5A4B]">/ 120+ clientes</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-mono font-bold rounded-full border border-[#86EFAC]/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                    DISPONIBLE
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-[#221A14] tracking-tight truncate">
                  {b.nombre}
                </h3>

                <p className="text-xs text-[#6F5A4B] mt-1 font-sans flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#7C571C]" />
                  <span>Oficio: <strong className="text-[#221A14]">{b.especialidad}</strong></span>
                </p>

                {b.descripcion && (
                  <p className="text-[11px] text-[#6F5A4B] italic mt-1.5 line-clamp-2 leading-relaxed">
                    "{b.descripcion}"
                  </p>
                )}

                {b.sucursalNombre && (
                  <span className="inline-block text-[10px] font-mono text-[#7C571C] mt-1 bg-[#FBEBE1] px-2 py-0.5 rounded border border-[#DFCBB5]">
                    📍 {b.sucursalNombre}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#DFCBB5]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#6F5A4B] font-mono flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Silla y esterilizador listos</span>
              </span>

              <button
                id={`btn-select-barber-${b.id}`}
                onClick={() => onSelectBarbero(b.id)}
                className="px-3.5 py-1.5 rounded-full bg-[#7C571C] hover:bg-[#684714] text-[#FFFFFF] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Elegir Maestro</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
