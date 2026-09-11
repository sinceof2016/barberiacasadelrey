import React, { useState } from 'react';
import { Usuario } from '../types';
import { loginUsuario } from '../services/api';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { BarberPoleRibbon } from './VintageBarberIcons';
import { LOGO_CASA_DEL_REY } from '../utils/assets';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (usuario: Usuario) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa tu correo y contraseña');
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const res = await loginUsuario(email.trim(), password.trim());
      setMensajeExito(res.mensaje);
      setTimeout(() => {
        onLoginSuccess(res.usuario);
        onClose();
        setMensajeExito(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#221A14]/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#FFF8F5] border border-[#DFCBB5] p-6 shadow-2xl font-mono text-xs overflow-hidden">
        {/* Vintage Barber Ribbon Accent */}
        <BarberPoleRibbon className="h-1.5 absolute top-0 left-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#DFCBB5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C49756] bg-[#FBEBE1] shadow-md shrink-0 flex items-center justify-center p-0.5">
              <img 
                src={LOGO_CASA_DEL_REY} 
                alt="Barbería La Casa del Rey" 
                className="w-full h-full object-cover object-center rounded-full" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[9px] font-mono text-[#7C571C] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-[#C49756]" />
                <span>Acceso Restringido</span>
              </div>
              <h3 className="font-serif text-base font-bold text-[#221A14] uppercase tracking-wide">
                Portal del Personal
              </h3>
              <p className="text-[11px] text-[#6F5A4B]">Barbería La Casa del Rey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6F5A4B] hover:text-[#221A14] text-base p-1 transition-colors rounded-lg hover:bg-[#FBEBE1]"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-[10px] text-[#4F4539] block uppercase font-bold mb-1">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#7C571C]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@casadelrey.com"
                required
                autoComplete="email"
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] placeholder:text-[#A8988B] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] focus:ring-1 focus:ring-[#7C571C]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#4F4539] block uppercase font-bold mb-1">
              Contraseña de Acceso:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-[#7C571C]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] placeholder:text-[#A8988B] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] focus:ring-1 focus:ring-[#7C571C]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F87171]/40 text-[#991B1B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs rounded-lg transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{cargando ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#DFCBB5] text-center text-[11px] text-[#6F5A4B]">
          <span>¿Eres un cliente? Los servicios y reservas están disponibles libremente en el portal principal sin requerir inicio de sesión.</span>
        </div>
      </div>
    </div>
  );
};
