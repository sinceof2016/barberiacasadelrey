import React, { useState } from 'react';
import { Usuario } from '../types';
import { loginUsuario, restablecerClaveAdmin } from '../services/api';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  BarberPoleRibbon 
} from './VintageBarberIcons';
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
  const [restableciendo, setRestableciendo] = useState<boolean>(false);
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

  const handleRestablecerClaveAdmin = async () => {
    setRestableciendo(true);
    setError(null);
    try {
      const res = await restablecerClaveAdmin('admin123');
      setEmail('admin@casadelrey.com');
      setPassword('admin123');
      setMensajeExito(res.mensaje || 'Clave restablecida exitosamente a: admin123');
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer clave');
    } finally {
      setRestableciendo(false);
    }
  };

  const autofillCredenciales = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090605]/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1A1412] border border-[#3D2E26] p-6 shadow-2xl font-mono text-xs overflow-hidden">
        {/* Vintage Barber Ribbon Accent */}
        <BarberPoleRibbon className="h-1.5 absolute top-0 left-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#2E2019] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#C59B27]/50 bg-[#0E0A09] shadow-md shrink-0 flex items-center justify-center">
              <img 
                src={LOGO_CASA_DEL_REY} 
                alt="Barbería La Casa del Rey" 
                className="w-full h-full object-cover object-center" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-royal text-base font-bold text-[#FAF6EE] uppercase tracking-wide">
                Portal del Personal
              </h3>
              <p className="text-[11px] text-[#8A796D]">Barbería La Casa del Rey • Acceso Restringido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A796D] hover:text-[#FAF6EE] text-sm p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8A796D]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@casadelrey.com"
                required
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
              Contraseña de Acceso:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-[#8A796D]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-[#3E161C] border border-[#6B242D] text-[#FCA5A5] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="p-2.5 rounded-lg bg-[#1C2C1D] border border-[#2D472F] text-[#86EFAC] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando || restableciendo}
            className="w-full py-2.5 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs rounded-lg transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{cargando ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}</span>
          </button>
        </form>

        {/* Sección: Restablecer Clave de Administrador & Cuentas Preconfiguradas */}
        <div className="mt-4 pt-3 border-t border-[#2E2019] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#E5B869] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Restablecer o Autocompletar:
            </span>
            <button
              type="button"
              onClick={handleRestablecerClaveAdmin}
              disabled={restableciendo}
              className="text-[10px] text-[#E5B869] hover:text-[#FAF6EE] flex items-center gap-1 px-2 py-0.5 rounded bg-[#2A1E18] border border-[#3D2E26] hover:border-[#C59B27] transition-colors cursor-pointer"
              title="Restablece la contraseña del administrador a su valor predeterminado (admin123)"
            >
              <RotateCcw className={`w-3 h-3 ${restableciendo ? 'animate-spin' : ''}`} />
              <span>{restableciendo ? 'Restableciendo...' : 'Restablecer Clave Admin'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => autofillCredenciales('admin@casadelrey.com', 'admin123')}
              className="p-2 rounded bg-[#0E0A09] border border-[#3D2E26] hover:border-[#C59B27] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[#E5B869] font-bold mb-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Salón</span>
              </div>
              <div className="text-[#8A796D] truncate text-[9px]">Sin acceso a API</div>
              <div className="text-[#A8988B] font-bold text-[9px]">admin123</div>
            </button>

            <button
              type="button"
              onClick={() => autofillCredenciales('caja.chico@casadelrey.com', 'caja123')}
              className="p-2 rounded bg-[#0E0A09] border border-[#3D2E26] hover:border-[#C59B27] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[#86EFAC] font-bold mb-0.5">
                <UserCheck className="w-3 h-3" />
                <span>Caja Chicó</span>
              </div>
              <div className="text-[#8A796D] truncate text-[9px]">Aislada Chicó</div>
              <div className="text-[#A8988B] font-bold text-[9px]">caja123</div>
            </button>

            <button
              type="button"
              onClick={() => autofillCredenciales('caja.usaquen@casadelrey.com', 'caja123')}
              className="p-2 rounded bg-[#0E0A09] border border-[#3D2E26] hover:border-[#C59B27] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[#86EFAC] font-bold mb-0.5">
                <UserCheck className="w-3 h-3" />
                <span>Caja Usaquén</span>
              </div>
              <div className="text-[#8A796D] truncate text-[9px]">Aislada Usaquén</div>
              <div className="text-[#A8988B] font-bold text-[9px]">caja123</div>
            </button>
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] text-[#8A796D]">
          <span>¿Eres un cliente? El acceso a servicios y reservas es público sin necesidad de iniciar sesión.</span>
        </div>
      </div>
    </div>
  );
};
