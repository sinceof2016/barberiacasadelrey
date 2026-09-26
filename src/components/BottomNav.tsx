import React from 'react';
import { Scissors, Calendar, Award, CalendarCheck, PlusCircle, BookOpen } from 'lucide-react';
import { TabType } from './Navbar';
import { Usuario } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  usuario?: Usuario | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  usuario,
}) => {
  const esPersonal = !!usuario;

  // En la vista de agendamiento para clientes, el módulo de reserva cuenta con su propia
  // barra inferior flotante ("Resumen" + "Siguiente" / "Confirmar") estilo WeBook.
  if (activeTab === 'reservar' && !esPersonal) {
    return null;
  }

  return (
    <nav 
      id="heritage-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,0px)] bg-[#FFF8F5]/95 backdrop-blur-xl border-t border-[#DFCBB5] shadow-[0_-2px_12px_rgba(44,29,17,0.08)] sm:hidden"
    >
      <div className={`max-w-md mx-auto grid ${esPersonal ? 'grid-cols-5' : 'grid-cols-3'} h-16 items-center px-2`}>
        {esPersonal ? (
          <>
            {/* Staff Tab 1: Registrar Corte */}
            <button
              id="bottom-tab-registrar-corte"
              onClick={() => {
                setActiveTab('registrar-corte');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'registrar-corte'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className={`text-[9px] tracking-wider uppercase mt-1 truncate ${activeTab === 'registrar-corte' ? 'font-bold' : 'font-medium'}`}>
                + Corte
              </span>
              {activeTab === 'registrar-corte' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>

            {/* Staff Tab 2: Libro Cortes */}
            <button
              id="bottom-tab-cortes"
              onClick={() => {
                setActiveTab('cortes');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'cortes'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Scissors className="w-5 h-5" />
              <span className={`text-[9px] tracking-wider uppercase mt-1 truncate ${activeTab === 'cortes' ? 'font-bold' : 'font-medium'}`}>
                Cortes
              </span>
              {activeTab === 'cortes' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>

            {/* Staff Tab 3: Agenda */}
            <button
              id="bottom-tab-agenda"
              onClick={() => {
                setActiveTab('agenda');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'agenda'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
              <span className={`text-[9px] tracking-wider uppercase mt-1 truncate ${activeTab === 'agenda' ? 'font-bold' : 'font-medium'}`}>
                Agenda
              </span>
              {activeTab === 'agenda' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>

            {/* Staff Tab 4: Reservar */}
            <button
              id="bottom-tab-reservar-staff"
              onClick={() => {
                setActiveTab('reservar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'reservar'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className={`text-[9px] tracking-wider uppercase mt-1 truncate ${activeTab === 'reservar' ? 'font-bold' : 'font-medium'}`}>
                Reservar
              </span>
              {activeTab === 'reservar' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>

            {/* Staff Tab 5: Servicios */}
            <button
              id="bottom-tab-servicios-staff"
              onClick={() => {
                setActiveTab('servicios');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'servicios'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className={`text-[9px] tracking-wider uppercase mt-1 truncate ${activeTab === 'servicios' ? 'font-bold' : 'font-medium'}`}>
                Salón
              </span>
              {activeTab === 'servicios' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>
          </>
        ) : (
          <>
            {/* Client Tab 1: Reservar */}
            <button
              id="bottom-tab-reservar"
              onClick={() => {
                setActiveTab('reservar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'reservar'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <div className={`p-1 rounded-xl ${activeTab === 'reservar' ? 'bg-[#7C571C] text-[#FFFFFF]' : ''}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-wider uppercase mt-0.5 ${activeTab === 'reservar' ? 'font-bold text-[#7C571C]' : 'font-medium'}`}>
                Reservar
              </span>
            </button>

            {/* Client Tab 2: Servicios */}
            <button
              id="bottom-tab-servicios"
              onClick={() => {
                setActiveTab('servicios');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'servicios'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Scissors className="w-5 h-5" />
              <span className={`text-[10px] tracking-wider uppercase mt-1 ${activeTab === 'servicios' ? 'font-bold' : 'font-medium'}`}>
                Servicios
              </span>
              {activeTab === 'servicios' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>

            {/* Client Tab 3: Barberos */}
            <button
              id="bottom-tab-barberos"
              onClick={() => {
                setActiveTab('barberos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer min-h-[44px] ${
                activeTab === 'barberos'
                  ? 'text-[#7C571C]'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className={`text-[10px] tracking-wider uppercase mt-1 ${activeTab === 'barberos' ? 'font-bold' : 'font-medium'}`}>
                Barberos
              </span>
              {activeTab === 'barberos' && (
                <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
              )}
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
