import React, { useState, useEffect } from 'react';
import { Usuario, RolUsuario } from '../types';
import { getUsuarios, crearUsuario, eliminarUsuario, restablecerClaveAdmin, cambiarClaveUsuario } from '../services/api';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  KeyRound, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Calendar,
  Lock,
  Eye,
  BadgeCheck,
  RotateCcw,
  Store,
  Building2
} from 'lucide-react';
import { 
  VintageCrownIcon, 
  StraightRazorIcon, 
  BarberPoleRibbon,
  VintageWaxSeal 
} from './VintageBarberIcons';
import { SUCURSALES_CASA_DEL_REY, getSucursalById } from '../data/sucursales';

interface UserManagementModuleProps {
  usuarioActual: Usuario | null;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  usuarioActual,
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rol, setRol] = useState<RolUsuario>('Cajero');
  const [sucursalAsignada, setSucursalAsignada] = useState<string>('suc-chico');
  const [guardando, setGuardando] = useState<boolean>(false);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const sucursalFinal = rol === 'Administrador' ? 'todas' : sucursalAsignada;
      const res = await crearUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
        rol,
        sucursalAsignada: sucursalFinal,
      });

      setUsuarios(prev => [...prev, res.usuario]);
      setMensajeExito(res.mensaje);
      setTimeout(() => setMensajeExito(null), 4000);

      // Limpiar formulario
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('Cajero');
      setSucursalAsignada('suc-chico');
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, nombreUser: string) => {
    if (id === 'USR-ADMIN-01') {
      alert('No es posible eliminar al Administrador Principal de Casa del Rey.');
      return;
    }

    if (!window.confirm(`¿Confirmas revocar el acceso y eliminar la cuenta de "${nombreUser}"?`)) {
      return;
    }

    try {
      const res = await eliminarUsuario(id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      alert(res.mensaje);
    } catch (err: any) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleRestablecerClaveUsuario = async (u: Usuario) => {
    const claveDefault = u.rol === 'Administrador' ? 'admin123' : 'caja123';
    const nuevaClave = window.prompt(
      `Restablecer contraseña para "${u.nombre}" (${u.email}):\nIngresa la nueva contraseña o deja "${claveDefault}":`,
      claveDefault
    );

    if (nuevaClave === null) return; // cancelado
    const claveFinal = nuevaClave.trim() || claveDefault;

    try {
      if (u.id === 'USR-ADMIN-01' || u.email.toLowerCase() === 'admin@casadelrey.com') {
        const res = await restablecerClaveAdmin(claveFinal);
        alert(`✓ ${res.mensaje}`);
      } else {
        const res = await cambiarClaveUsuario(u.id, claveFinal);
        alert(`✓ ${res.mensaje} (Nueva clave: ${claveFinal})`);
      }
    } catch (err: any) {
      alert('Error al restablecer la contraseña: ' + err.message);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C59B27]" />
              <h2 className="font-royal text-base sm:text-lg font-bold text-[#FAF6EE] uppercase tracking-wide">
                Gestión de Usuarios & Personal del Salón
              </h2>
            </div>
            <p className="text-xs text-[#8A796D] font-mono mt-0.5">
              Crea y administra cuentas de acceso para Administradores y Usuarios de Caja
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0E0A09] px-3 py-1.5 rounded-lg border border-[#3D2E26] font-mono text-xs">
            <ShieldCheck className="w-4 h-4 text-[#86EFAC]" />
            <span className="text-[#8A796D]">Sesión activa:</span>
            <span className="text-[#E5B869] font-bold">{usuarioActual?.nombre || 'Administrador'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario: Crear Nuevo Usuario */}
        <div className="lg:col-span-5 bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#C59B27]" />
              <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                Crear Nuevo Usuario
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#261B16] text-[#E5B869] border border-[#3D2E26]">
              CONTROL RBAC
            </span>
          </div>

          <form onSubmit={handleCrearUsuario} className="space-y-3.5">
            {/* Nombre */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Nombre Completo del Colaborador:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-[#8A796D]" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Mateo Gómez"
                  required
                  className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27] placeholder-[#5C4A3E]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Correo Electrónico (Usuario de Acceso):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8A796D]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mateo@casadelrey.com"
                  required
                  className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27] placeholder-[#5C4A3E]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Contraseña Asignada:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-[#8A796D]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27] placeholder-[#5C4A3E]"
                />
              </div>
            </div>

            {/* Rol Selection */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                Rol & Nivel de Permisos:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRol('Cajero')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    rol === 'Cajero'
                      ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] shadow'
                      : 'bg-[#0E0A09] border-[#3D2E26] text-[#8A796D] hover:text-[#FAF6EE]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Coins className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Cajero</span>
                  </div>
                  <span className="text-[9px] block mt-1 opacity-80">
                    Caja, Cortes & Turnos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRol('Administrador')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    rol === 'Administrador'
                      ? 'bg-[#2A1E18] border-[#C59B27] text-[#FAF6EE] shadow'
                      : 'bg-[#0E0A09] border-[#3D2E26] text-[#8A796D] hover:text-[#FAF6EE]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <VintageCrownIcon className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Administrador</span>
                  </div>
                  <span className="text-[9px] block mt-1 opacity-80">
                    Acceso Total + Usuarios
                  </span>
                </button>
              </div>
            </div>

            {/* Asignación de Sucursal */}
            <div>
              <label className="text-[10px] text-[#8A796D] block uppercase font-bold mb-1">
                {rol === 'Cajero' ? 'Sucursal Asignada (Caja con Contabilidad Aislada):' : 'Alcance de Sucursales:'}
              </label>

              {rol === 'Cajero' ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-2.5 text-[#C59B27]" />
                    <select
                      value={sucursalAsignada}
                      onChange={(e) => setSucursalAsignada(e.target.value)}
                      className="w-full bg-[#0E0A09] border border-[#3D2E26] text-[#FAF6EE] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#C59B27] cursor-pointer"
                    >
                      {SUCURSALES_CASA_DEL_REY.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} ({s.direccion})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-[#A8988B] leading-relaxed">
                    🔒 Este usuario de caja tendrá su contabilidad, arqueo de caja y egresos <span className="text-[#E5B869] font-bold">estrictamente aislados</span> a esta sede.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#0E0A09] border border-[#2E2019] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#FAF6EE]">
                    <Building2 className="w-4 h-4 text-[#C59B27]" />
                    <span>Todas las 3 Sucursales (Consolidado + División)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-[#261B16] text-[#E5B869] border border-[#3D2E26] font-bold">
                    GLOBAL
                  </span>
                </div>
              )}
            </div>

            {/* Role Capabilities Preview Card */}
            <div className="p-3 rounded-xl bg-[#0E0A09] border border-[#2E2019] space-y-1.5">
              <span className="text-[10px] text-[#C59B27] uppercase font-bold block">
                Privilegios para rol {rol}:
              </span>
              <ul className="text-[10px] text-[#A8988B] space-y-1">
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3 text-[#86EFAC] shrink-0" />
                  <span>Acceso a catálogo público de servicios y reservas</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3 text-[#86EFAC] shrink-0" />
                  <span>Libro de turnos y agenda de citas en tiempo real</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3 text-[#86EFAC] shrink-0" />
                  <span>Módulo de cortes del día & liquidación por barbero</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3 h-3 text-[#86EFAC] shrink-0" />
                  <span>
                    {rol === 'Cajero' 
                      ? `Contabilidad y arqueo aislados a la ${getSucursalById(sucursalAsignada).nombre}` 
                      : 'Contabilidad global con división por 3 sucursales'}
                  </span>
                </li>
                {rol === 'Administrador' && (
                  <>
                    <li className="flex items-center gap-1.5 font-bold text-[#E5B869]">
                      <VintageCrownIcon className="w-3 h-3 text-[#C59B27] shrink-0" />
                      <span>Crear / Administrar personal, asignar sedes y restablecer claves</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-[#E5B869]/80">
                      <ShieldCheck className="w-3 h-3 text-[#C59B27] shrink-0" />
                      <span>Sección de consola API restringida exclusivamente a Super Admin</span>
                    </li>
                  </>
                )}
              </ul>
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
              disabled={guardando}
              className="w-full py-2.5 bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] font-mono font-bold text-xs rounded-lg transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase"
            >
              <UserPlus className="w-4 h-4" />
              <span>{guardando ? 'CREANDO USUARIO...' : 'REGISTRAR USUARIO'}</span>
            </button>
          </form>
        </div>

        {/* Lista de Usuarios Registrados */}
        <div className="lg:col-span-7 bg-[#1A1412] border border-[#3D2E26] rounded-xl p-5 shadow-xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2E2019] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C59B27]" />
              <h3 className="font-royal text-sm font-bold uppercase text-[#FAF6EE] tracking-wide">
                Cuentas de Usuario Activas ({usuarios.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#8A796D]">ROLES CONFIGURADOS</span>
          </div>

          {cargando ? (
            <div className="py-8 text-center text-[#8A796D]">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div className="py-8 text-center text-[#8A796D]">No hay usuarios registrados</div>
          ) : (
            <div className="space-y-3">
              {usuarios.map(u => (
                <div
                  key={u.id}
                  className="bg-[#0E0A09] border border-[#2E2019] hover:border-[#3D2E26] p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                      u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela')
                        ? 'bg-[#3D2813] border border-[#F59E0B] text-[#FDE68A]'
                        : u.rol === 'Administrador'
                          ? 'bg-[#261B16] border border-[#C59B27] text-[#E5B869]'
                          : 'bg-[#1C241E] border border-[#2D472F] text-[#86EFAC]'
                    }`}>
                      {u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela') ? (
                        <VintageCrownIcon className="w-4 h-4 text-[#FDE68A]" />
                      ) : u.rol === 'Administrador' ? (
                        <VintageCrownIcon className="w-4 h-4" />
                      ) : (
                        <Coins className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#FAF6EE] text-xs">{u.nombre}</span>
                        {u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela') ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#451A03] text-[#FDE68A] border border-[#B45309] flex items-center gap-1">
                            <VintageCrownIcon className="w-2.5 h-2.5" />
                            SUPER ADMIN (TODAS LAS OPCIONES + API)
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            u.rol === 'Administrador'
                              ? 'bg-[#3E2D12] text-[#FCD34D] border border-[#6B4E1B]'
                              : 'bg-[#1C2C1D] text-[#86EFAC] border border-[#2D472F]'
                          }`}>
                            {u.rol === 'Administrador' ? 'ADMINISTRADOR (SIN API)' : u.rol}
                          </span>
                        )}

                        {u.rol === 'SuperAdmin' || u.rol === 'Administrador' || u.nombre.toLowerCase().includes('david orjuela') ? (
                          <span className="px-2 py-0.5 rounded text-[9px] bg-[#261B16] text-[#E5B869] border border-[#3D2E26] font-bold flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            3 Sedes (Consolidado)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] bg-[#141F15] text-[#86EFAC] border border-[#2D472F] font-bold flex items-center gap-1">
                            <Store className="w-2.5 h-2.5 text-[#C59B27]" />
                            {getSucursalById(u.sucursalAsignada || 'suc-chico').nombre}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#8A796D] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#705F53]" />
                          {u.email}
                        </span>
                        <span>•</span>
                        <span>Alta: {formatDate(u.creadoEn)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRestablecerClaveUsuario(u)}
                      className="px-2 py-1 rounded-lg bg-[#1A1412] hover:bg-[#2A1E18] text-[#E5B869] border border-[#3D2E26] hover:border-[#C59B27] transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                      title="Restablecer o cambiar la contraseña de este usuario"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer Clave</span>
                    </button>

                    {u.id === 'USR-ADMIN-01' || u.id === 'USR-DAVID-01' || u.id === 'USR-DAVID-02' || u.nombre.toLowerCase().includes('david orjuela') ? (
                      <span className="text-[10px] text-[#C59B27] font-bold px-2 py-1 bg-[#1A1412] rounded border border-[#3D2E26]">
                        {u.nombre.toLowerCase().includes('david orjuela') ? 'TITULAR SUPREMO' : 'ADMIN SALÓN'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEliminar(u.id, u.nombre)}
                        className="p-1.5 rounded-lg text-[#8A796D] hover:text-[#F87171] hover:bg-[#3E161C] transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revocar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
