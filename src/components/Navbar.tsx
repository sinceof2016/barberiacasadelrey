import React from 'react';
import { 
  CalendarCheck, 
  Scissors, 
  Coins, 
  Lock, 
  LogOut, 
  Users, 
  ShieldCheck,
  Calendar,
  Bell,
  Sparkles,
  Terminal,
  Search,
  Award
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Usuario, puedeUsuarioVerApi, esUsuarioAdmin, esUsuarioDavid } from '../types';
import { 
  HERITAGE_EMBLEM_LOGO, 
  HERITAGE_AVATAR_PROFILE 
} from '../utils/assets';

export type TabType = 
  | 'reservar' 
  | 'servicios' 
  | 'barberos'
  | 'agenda' 
  | 'cortes' 
  | 'contabilidad' 
  | 'usuarios' 
  | 'api' 
  | 'clientes';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalCitas: number;
  usuario: Usuario | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  googleUser?: User | null;
  onOpenGoogleCalendar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalCitas,
  usuario,
  onOpenLogin,
  onLogout,
  googleUser,
  onOpenGoogleCalendar,
}) => {
  const esAdmin = esUsuarioAdmin(usuario);
  const esDavid = esUsuarioDavid(usuario);
  const puedeVerApi = puedeUsuarioVerApi(usuario);
  const esPersonal = !!usuario;

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'servicios': return 'SERVICIOS & CARTA';
      case 'reservar': return 'RESERVA DE TURNO';
      case 'barberos': return 'MAESTROS BARBEROS';
      case 'agenda': return 'LIBRO DE TURNOS';
      case 'cortes': return 'CORTES DEL DÍA';
      case 'contabilidad': return 'CAJA & FINANZAS';
      case 'clientes': return 'DIRECTORIO DE CLIENTES';
      case 'usuarios': return 'GESTIÓN DE USUARIOS';
      case 'api': return 'CONSOLA DE API REST';
      default: return 'CASA DEL REY';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8F5]/90 backdrop-blur-xl border-b border-[#DFCBB5]/50 shadow-[0_1px_8px_rgba(44,29,17,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Identity with Emblem */}
          <div 
            onClick={() => setActiveTab('servicios')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#C49756] bg-[#221A14] shadow-md group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center ring-2 ring-[#DFCBB5]/50">
              <img
                src={HERITAGE_EMBLEM_LOGO}
                alt="Emblema Barbería La Casa del Rey"
                className="w-full h-full object-cover scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-[#221A14] tracking-tight group-hover:text-[#7C571C] transition-colors leading-tight block">
                  La Casa del Rey
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-semibold">
                  BARBERÍA CLÁSICA
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#7C571C] font-semibold block leading-tight">
                {getTabSubtitle()}
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#FBEBE1] p-1 rounded-full border border-[#DFCBB5]/60 shadow-inner">
            <button
              id="nav-tab-servicios"
              onClick={() => setActiveTab('servicios')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                activeTab === 'servicios'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              Servicios
            </button>

            <button
              id="nav-tab-reservar"
              onClick={() => setActiveTab('reservar')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                activeTab === 'reservar'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              Reservar
            </button>

            <button
              id="nav-tab-barberos"
              onClick={() => setActiveTab('barberos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                activeTab === 'barberos'
                  ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                  : 'text-[#6F5A4B] hover:text-[#221A14]'
              }`}
            >
              Barberos
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google Calendar sync / Bell */}
            {onOpenGoogleCalendar && (
              <button
                id="btn-calendar-sync"
                onClick={onOpenGoogleCalendar}
                className={`p-2 rounded-full border transition-all cursor-pointer relative ${
                  googleUser
                    ? 'bg-[#EBF7EE] text-[#15803D] border-[#86EFAC]'
                    : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border-[#DFCBB5]'
                }`}
                title={googleUser ? `Sincronizado con ${googleUser.email}` : "Conectar Google Calendar"}
              >
                <Calendar className="w-4 h-4" />
                {googleUser && (
                  <span className="w-2 h-2 rounded-full bg-[#15803D] absolute top-0.5 right-0.5" />
                )}
              </button>
            )}

            {/* Auth / Personal Profile */}
            {!usuario ? (
              <button
                id="btn-login-personal"
                onClick={onOpenLogin}
                className="bg-[#7C571C] hover:bg-[#684714] text-[#FFFFFF] text-xs font-medium px-3.5 py-1.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1.5 tracking-wider cursor-pointer font-sans"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ACCESO PERSONAL</span>
                <span className="sm:hidden">ACCESO</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#FBEBE1] pl-2 pr-1.5 py-1 rounded-full border border-[#DFCBB5] shadow-sm">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#DFCBB5] shrink-0">
                  <img
                    src={usuario.avatarUrl || HERITAGE_AVATAR_PROFILE}
                    alt={usuario.nombre}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="hidden sm:block text-left text-xs pr-1">
                  <span className="text-[#221A14] font-bold block leading-none truncate max-w-[120px]">
                    {usuario.nombre}
                  </span>
                  <span className="text-[9px] uppercase font-mono text-[#7C571C] font-semibold">
                    {puedeVerApi ? '★ SuperAdmin' : usuario.rol}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-full text-[#6F5A4B] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ribbon Administrativo cuando hay sesión activa de personal */}
      {esPersonal && (
        <div className="border-t border-[#DFCBB5] bg-[#FBEBE1] px-4 sm:px-6 lg:px-8 py-1.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#6F5A4B]">
              <Sparkles className="w-3.5 h-3.5 text-[#7C571C]" />
              <span className="font-bold text-[#221A14]">{usuario?.nombre}</span>
              <span>• Panel de Control</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full lg:w-auto">
              <button
                id="nav-tab-agenda"
                onClick={() => setActiveTab('agenda')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'agenda'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                    : 'bg-[#FFF8F5] text-[#4F4539] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Libro de Turnos</span>
                {totalCitas > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#F5E5DB] text-[#7C571C] font-bold">
                    {totalCitas}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-cortes"
                onClick={() => setActiveTab('cortes')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cortes'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                    : 'bg-[#FFF8F5] text-[#4F4539] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cortes & Barberos</span>
              </button>

              <button
                id="nav-tab-contabilidad"
                onClick={() => setActiveTab('contabilidad')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'contabilidad'
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                    : 'bg-[#FFF8F5] text-[#4F4539] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Contabilidad & Caja</span>
              </button>

              {esAdmin && (
                <button
                  id="nav-tab-clientes"
                  onClick={() => setActiveTab('clientes')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'clientes'
                      ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                      : 'bg-[#FFF8F5] text-[#4F4539] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Base de Clientes</span>
                </button>
              )}

              {esDavid && (
                <button
                  id="nav-tab-usuarios"
                  onClick={() => setActiveTab('usuarios')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'usuarios'
                      ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                      : 'bg-[#FFF8F5] text-[#4F4539] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </button>
              )}

              {puedeVerApi && (
                <button
                  id="nav-tab-api"
                  onClick={() => setActiveTab('api')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'api'
                      ? 'bg-[#221A14] text-[#C49756] shadow-sm font-semibold border border-[#C49756]'
                      : 'bg-[#FFF8F5] text-[#7C571C] hover:bg-[#F5E5DB] border border-[#DFCBB5]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>API REST</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
