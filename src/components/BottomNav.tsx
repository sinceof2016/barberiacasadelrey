import React from 'react';
import { Scissors, Calendar, Ticket, Award } from 'lucide-react';
import { TabType } from './Navbar';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav 
      id="heritage-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,0px)] bg-[#FBEBE1]/95 backdrop-blur-xl border-t border-[#DFCBB5] shadow-[0_-2px_12px_rgba(44,29,17,0.08)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-4">
        {/* Tab 1: Servicios */}
        <button
          id="bottom-tab-servicios"
          onClick={() => {
            setActiveTab('servicios');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
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

        {/* Tab 2: Reservar */}
        <button
          id="bottom-tab-reservar"
          onClick={() => {
            setActiveTab('reservar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'reservar'
              ? 'text-[#7C571C]'
              : 'text-[#6F5A4B] hover:text-[#221A14]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className={`text-[10px] tracking-wider uppercase mt-1 ${activeTab === 'reservar' ? 'font-bold' : 'font-medium'}`}>
            Reservar
          </span>
          {activeTab === 'reservar' && (
            <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
          )}
        </button>

        {/* Tab 3: Barberos */}
        <button
          id="bottom-tab-barberos"
          onClick={() => {
            setActiveTab('barberos' as TabType);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === ('barberos' as TabType)
              ? 'text-[#7C571C]'
              : 'text-[#6F5A4B] hover:text-[#221A14]'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className={`text-[10px] tracking-wider uppercase mt-1 ${activeTab === ('barberos' as TabType) ? 'font-bold' : 'font-medium'}`}>
            Barberos
          </span>
          {activeTab === ('barberos' as TabType) && (
            <span className="w-1 h-1 rounded-full bg-[#7C571C] mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
