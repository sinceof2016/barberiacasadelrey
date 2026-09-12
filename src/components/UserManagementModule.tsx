import React, { useState, useEffect } from 'react';
import { Usuario, RolUsuario, Barbero, Sucursal, Servicio } from '../types';
import { 
  getUsuarios, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario, 
  restablecerClaveAdmin, 
  cambiarClaveUsuario,
  getBarberos,
  actualizarBarbero,
  crearBarbero,
  eliminarBarbero,
  getSucursales,
  actualizarSucursal,
  crearSucursal,
  eliminarSucursal,
  getServicios,
  actualizarServicio,
  crearServicio,
  eliminarServicio
} from '../services/api';
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
  Building2,
  Scissors,
  Edit3,
  Save,
  X,
  Sparkles,
  MapPin,
  Phone,
  Clock,
  FileText,
  Plus,
  PlusCircle
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
  onDataUpdated?: () => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  usuarioActual,
  onDataUpdated,
}) => {
  // Sub-tabs: 'usuarios' | 'barberos' | 'sedes' | 'servicios'
  const [subTab, setSubTab] = useState<'usuarios' | 'barberos' | 'sedes' | 'servicios'>('usuarios');

  // Estados de datos
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Form states para crear usuario
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rol, setRol] = useState<RolUsuario>('Cajero');
  const [sucursalAsignada, setSucursalAsignada] = useState<string>('suc-chico');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Modal / Edición de Usuario
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<Usuario | null>(null);
  const [editNombreUsuario, setEditNombreUsuario] = useState<string>('');
  const [editRolUsuario, setEditRolUsuario] = useState<RolUsuario>('Cajero');
  const [editSucursalUsuario, setEditSucursalUsuario] = useState<string>('suc-chico');
  const [guardandoUsuario, setGuardandoUsuario] = useState<boolean>(false);

  // Modal / Edición de Barbero
  const [barberoEnEdicion, setBarberoEnEdicion] = useState<Barbero | null>(null);
  const [editNombreBarbero, setEditNombreBarbero] = useState<string>('');
  const [editEspecialidadBarbero, setEditEspecialidadBarbero] = useState<string>('');
  const [editDescripcionBarbero, setEditDescripcionBarbero] = useState<string>('');
  const [editSucursalBarbero, setEditSucursalBarbero] = useState<string>('suc-chico');
  const [guardandoBarbero, setGuardandoBarbero] = useState<boolean>(false);

  // Modal / Edición de Sede
  const [sedeEnEdicion, setSedeEnEdicion] = useState<Sucursal | null>(null);
  const [editNombreSede, setEditNombreSede] = useState<string>('');
  const [editDireccionSede, setEditDireccionSede] = useState<string>('');
  const [editTelefonoSede, setEditTelefonoSede] = useState<string>('');
  const [editHorarioSede, setEditHorarioSede] = useState<string>('');
  const [editDescripcionSede, setEditDescripcionSede] = useState<string>('');
  const [guardandoSede, setGuardandoSede] = useState<boolean>(false);

  // Modal / Edición de Servicio
  const [servicioEnEdicion, setServicioEnEdicion] = useState<Servicio | null>(null);
  const [editNombreServicio, setEditNombreServicio] = useState<string>('');
  const [editPrecioServicio, setEditPrecioServicio] = useState<number>(0);
  const [editDuracionServicio, setEditDuracionServicio] = useState<number>(30);
  const [editDescripcionServicio, setEditDescripcionServicio] = useState<string>('');
  const [editCategoriaServicio, setEditCategoriaServicio] = useState<'individual' | 'grupal'>('individual');
  const [guardandoServicio, setGuardandoServicio] = useState<boolean>(false);

  // Modal / Crear Nuevo Servicio
  const [mostrarModalNuevoServicio, setMostrarModalNuevoServicio] = useState<boolean>(false);
  const [nuevoNombreServicio, setNuevoNombreServicio] = useState<string>('');
  const [nuevoPrecioServicio, setNuevoPrecioServicio] = useState<number>(35000);
  const [nuevoDuracionServicio, setNuevoDuracionServicio] = useState<number>(45);
  const [nuevoDescripcionServicio, setNuevoDescripcionServicio] = useState<string>('');
  const [nuevoCategoriaServicio, setNuevoCategoriaServicio] = useState<'individual' | 'grupal'>('individual');
  const [creandoServicio, setCreandoServicio] = useState<boolean>(false);

  // Modal / Crear Nueva Sucursal
  const [mostrarModalNuevaSede, setMostrarModalNuevaSede] = useState<boolean>(false);
  const [nuevoNombreSede, setNuevoNombreSede] = useState<string>('');
  const [nuevoDireccionSede, setNuevoDireccionSede] = useState<string>('');
  const [nuevoTelefonoSede, setNuevoTelefonoSede] = useState<string>('');
  const [nuevoHorarioSede, setNuevoHorarioSede] = useState<string>('Lunes a Sábado: 8:00 AM - 8:00 PM');
  const [nuevoDescripcionSede, setNuevoDescripcionSede] = useState<string>('');
  const [creandoSede, setCreandoSede] = useState<boolean>(false);

  // Modal / Crear Nuevo Barbero
  const [mostrarModalNuevoBarbero, setMostrarModalNuevoBarbero] = useState<boolean>(false);
  const [nuevoNombreBarbero, setNuevoNombreBarbero] = useState<string>('');
  const [nuevoEspecialidadBarbero, setNuevoEspecialidadBarbero] = useState<string>('Maestro Barbero & Navaja Libre');
  const [nuevoDescripcionBarbero, setNuevoDescripcionBarbero] = useState<string>('');
  const [nuevoSucursalBarbero, setNuevoSucursalBarbero] = useState<string>('suc-chico');
  const [creandoBarbero, setCreandoBarbero] = useState<boolean>(false);

  const notificarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const cargarTodo = async () => {
    setCargando(true);
    setError(null);
    try {
      const [uData, bData, sData, srvData] = await Promise.all([
        getUsuarios().catch(() => []),
        getBarberos().catch(() => []),
        getSucursales().catch(() => SUCURSALES_CASA_DEL_REY),
        getServicios().catch(() => [])
      ]);
      setUsuarios(uData);
      setBarberos(bData);
      setSucursales(sData && sData.length > 0 ? sData : SUCURSALES_CASA_DEL_REY);
      setServicios(srvData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del módulo de administración');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // --- ACCIONES DE USUARIOS ---
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const sucursalFinal = rol === 'Administrador' || rol === 'SuperAdmin' ? 'todas' : sucursalAsignada;
      const res = await crearUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
        rol,
        sucursalAsignada: sucursalFinal,
      });

      setUsuarios(prev => [...prev, res.usuario]);
      notificarExito(res.mensaje || 'Usuario registrado exitosamente');

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

  const iniciarEdicionUsuario = (u: Usuario) => {
    setUsuarioEnEdicion(u);
    setEditNombreUsuario(u.nombre);
    setEditRolUsuario(u.rol);
    setEditSucursalUsuario(u.sucursalAsignada || 'suc-chico');
  };

  const handleGuardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEnEdicion) return;
    if (!editNombreUsuario.trim()) {
      alert('El nombre del usuario no puede estar vacío');
      return;
    }

    setGuardandoUsuario(true);
    try {
      const sucursalFinal = editRolUsuario === 'Administrador' || editRolUsuario === 'SuperAdmin'
        ? 'todas'
        : editSucursalUsuario;

      const updatedList = await actualizarUsuario({
        id: usuarioEnEdicion.id,
        nombre: editNombreUsuario.trim(),
        rol: editRolUsuario,
        sucursalAsignada: sucursalFinal,
      });

      setUsuarios(updatedList);
      setUsuarioEnEdicion(null);
      notificarExito(`✓ Usuario "${editNombreUsuario.trim()}" actualizado correctamente`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar el usuario: ' + err.message);
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleEliminar = async (id: string, nombreUser: string) => {
    if (id === 'USR-ADMIN-01' || id === 'USR-DAVID-01' || nombreUser.toLowerCase().includes('david orjuela')) {
      alert('No es posible revocar al Super Administrador Principal de La Casa del Rey.');
      return;
    }

    if (!window.confirm(`¿Confirmas revocar el acceso y eliminar la cuenta de "${nombreUser}"?`)) {
      return;
    }

    try {
      const res = await eliminarUsuario(id);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      notificarExito(res.mensaje || 'Usuario revocado correctamente');
    } catch (err: any) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleRestablecerClaveUsuario = async (u: Usuario) => {
    const claveDefault = u.rol === 'Administrador' || u.rol === 'SuperAdmin' ? 'admin123' : 'caja123';
    const nuevaClave = window.prompt(
      `Restablecer contraseña para "${u.nombre}" (${u.email}):\nIngresa la nueva contraseña o confirma "${claveDefault}":`,
      claveDefault
    );

    if (nuevaClave === null) return;
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

  // --- ACCIONES DE BARBEROS ---
  const iniciarEdicionBarbero = (b: Barbero) => {
    setBarberoEnEdicion(b);
    setEditNombreBarbero(b.nombre);
    setEditEspecialidadBarbero(b.especialidad);
    setEditDescripcionBarbero(b.descripcion || '');
    setEditSucursalBarbero(b.sucursalId || 'suc-chico');
  };

  const handleGuardarEdicionBarbero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberoEnEdicion) return;
    if (!editNombreBarbero.trim()) {
      alert('El nombre del barbero es obligatorio');
      return;
    }

    setGuardandoBarbero(true);
    try {
      const sucursalObj = getSucursalById(editSucursalBarbero);
      const barberoActualizado: Barbero = {
        ...barberoEnEdicion,
        nombre: editNombreBarbero.trim(),
        especialidad: editEspecialidadBarbero.trim() || barberoEnEdicion.especialidad,
        descripcion: editDescripcionBarbero.trim(),
        sucursalId: editSucursalBarbero,
        sucursalNombre: sucursalObj?.nombre || 'Sede Chicó'
      };

      const updatedBarberos = await actualizarBarbero(barberoActualizado);
      setBarberos(updatedBarberos);
      setBarberoEnEdicion(null);
      notificarExito(`✓ Maestro Barbero "${barberoActualizado.nombre}" actualizado con éxito`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar el barbero: ' + err.message);
    } finally {
      setGuardandoBarbero(false);
    }
  };

  // --- ACCIONES DE SEDES ---
  const iniciarEdicionSede = (s: Sucursal) => {
    setSedeEnEdicion(s);
    setEditNombreSede(s.nombre);
    setEditDireccionSede(s.direccion);
    setEditTelefonoSede(s.telefono);
    setEditHorarioSede(s.horario || 'Lunes a Sábado: 8:00 AM - 8:00 PM');
    setEditDescripcionSede(s.descripcion || '');
  };

  const handleGuardarEdicionSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sedeEnEdicion) return;
    if (!editNombreSede.trim()) {
      alert('El nombre de la sede es obligatorio');
      return;
    }

    setGuardandoSede(true);
    try {
      const sedeActualizada: Sucursal = {
        ...sedeEnEdicion,
        nombre: editNombreSede.trim(),
        direccion: editDireccionSede.trim() || sedeEnEdicion.direccion,
        telefono: editTelefonoSede.trim() || sedeEnEdicion.telefono,
        horario: editHorarioSede.trim() || sedeEnEdicion.horario,
        descripcion: editDescripcionSede.trim() || sedeEnEdicion.descripcion,
      };

      const updatedSucursales = await actualizarSucursal(sedeActualizada);
      setSucursales(updatedSucursales);
      setSedeEnEdicion(null);
      notificarExito(`✓ Sede "${sedeActualizada.nombre}" actualizada con éxito`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar la sede: ' + err.message);
    } finally {
      setGuardandoSede(false);
    }
  };

  // --- ACCIONES DE SERVICIOS ---
  const iniciarEdicionServicio = (srv: Servicio) => {
    setServicioEnEdicion(srv);
    setEditNombreServicio(srv.nombre);
    setEditPrecioServicio(srv.precio);
    setEditDuracionServicio(srv.duracionMinutos);
    setEditDescripcionServicio(srv.descripcion || '');
    setEditCategoriaServicio((srv.categoria as any) || 'individual');
  };

  const handleGuardarEdicionServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioEnEdicion) return;
    if (!editNombreServicio.trim()) {
      alert('El nombre del servicio es obligatorio');
      return;
    }
    if (editPrecioServicio <= 0) {
      alert('El precio debe ser un número mayor a cero');
      return;
    }

    setGuardandoServicio(true);
    try {
      const servicioActualizado: Servicio = {
        ...servicioEnEdicion,
        nombre: editNombreServicio.trim(),
        precio: Number(editPrecioServicio),
        duracionMinutos: Number(editDuracionServicio) || 30,
        descripcion: editDescripcionServicio.trim(),
        categoria: editCategoriaServicio,
      };

      const updatedServicios = await actualizarServicio(servicioActualizado);
      setServicios(updatedServicios);
      setServicioEnEdicion(null);
      notificarExito(`✓ Servicio "${servicioActualizado.nombre}" actualizado con éxito`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al actualizar el servicio: ' + err.message);
    } finally {
      setGuardandoServicio(false);
    }
  };

  const handleCrearNuevoServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreServicio.trim()) {
      alert('El nombre del servicio es obligatorio');
      return;
    }
    if (nuevoPrecioServicio <= 0) {
      alert('El precio debe ser un número mayor a cero');
      return;
    }

    setCreandoServicio(true);
    try {
      const nuevoServicioData = {
        nombre: nuevoNombreServicio.trim(),
        precio: Number(nuevoPrecioServicio),
        duracionMinutos: Number(nuevoDuracionServicio) || 45,
        descripcion: nuevoDescripcionServicio.trim() || 'Servicio clásico de barbería y corte tradicional',
        categoria: nuevoCategoriaServicio,
      };

      const updatedServicios = await crearServicio(nuevoServicioData);
      setServicios(updatedServicios);
      setMostrarModalNuevoServicio(false);
      setNuevoNombreServicio('');
      setNuevoPrecioServicio(35000);
      setNuevoDuracionServicio(45);
      setNuevoDescripcionServicio('');
      setNuevoCategoriaServicio('individual');
      notificarExito(`✓ Nuevo servicio "${nuevoServicioData.nombre}" añadido con éxito al catálogo`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al crear el servicio: ' + err.message);
    } finally {
      setCreandoServicio(false);
    }
  };

  const handleEliminarServicio = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Confirmas eliminar el servicio "${nombre}" del catálogo oficial?`)) {
      return;
    }
    try {
      const updatedServicios = await eliminarServicio(id);
      setServicios(updatedServicios);
      notificarExito(`✓ Servicio "${nombre}" eliminado del catálogo`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al eliminar servicio: ' + err.message);
    }
  };

  // --- CREAR Y ELIMINAR SUCURSAL ---
  const handleCrearNuevaSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreSede.trim()) {
      alert('El nombre de la sede es obligatorio');
      return;
    }
    if (!nuevoDireccionSede.trim()) {
      alert('La dirección de la sede es obligatoria');
      return;
    }

    setCreandoSede(true);
    try {
      const nuevaSedeData = {
        nombre: nuevoNombreSede.trim(),
        direccion: nuevoDireccionSede.trim(),
        telefono: nuevoTelefonoSede.trim() || '+57 310 000 0000',
        horario: nuevoHorarioSede.trim() || 'Lunes a Sábado: 8:00 AM - 8:00 PM',
        descripcion: nuevoDescripcionSede.trim() || 'Sucursal oficial de La Casa del Rey',
      };

      const updatedSucursales = await crearSucursal(nuevaSedeData);
      setSucursales(updatedSucursales);
      setMostrarModalNuevaSede(false);
      setNuevoNombreSede('');
      setNuevoDireccionSede('');
      setNuevoTelefonoSede('');
      setNuevoHorarioSede('Lunes a Sábado: 8:00 AM - 8:00 PM');
      setNuevoDescripcionSede('');
      notificarExito(`✓ Nueva sucursal "${nuevaSedeData.nombre}" inaugurada y habilitada con éxito`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al crear la sede: ' + err.message);
    } finally {
      setCreandoSede(false);
    }
  };

  const handleEliminarSede = async (id: string, nombre: string) => {
    if (id === 'suc-chico' || id === 'suc-cedritos' || id === 'suc-usaquen') {
      if (!window.confirm(`La sede "${nombre}" es una de las sedes fundacionales. ¿Estás absolutamente seguro de eliminarla?`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Confirmas eliminar la sede "${nombre}"?`)) {
        return;
      }
    }

    try {
      const updatedSucursales = await eliminarSucursal(id);
      setSucursales(updatedSucursales);
      notificarExito(`✓ Sede "${nombre}" eliminada del sistema`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al eliminar sede: ' + err.message);
    }
  };

  // --- CREAR Y ELIMINAR BARBERO ---
  const handleCrearNuevoBarbero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombreBarbero.trim()) {
      alert('El nombre del barbero es obligatorio');
      return;
    }

    setCreandoBarbero(true);
    try {
      const sucursalObj = getSucursalById(nuevoSucursalBarbero);
      const nuevoBarberoData = {
        nombre: nuevoNombreBarbero.trim(),
        especialidad: nuevoEspecialidadBarbero.trim() || 'Maestro Barbero',
        descripcion: nuevoDescripcionBarbero.trim() || 'Especialista en cortes clásicos, degradados y afeitado tradicional a navaja.',
        sucursalId: nuevoSucursalBarbero,
        sucursalNombre: sucursalObj?.nombre || 'Sede Chicó'
      };

      const updatedBarberos = await crearBarbero(nuevoBarberoData);
      setBarberos(updatedBarberos);
      setMostrarModalNuevoBarbero(false);
      setNuevoNombreBarbero('');
      setNuevoEspecialidadBarbero('Maestro Barbero & Navaja Libre');
      setNuevoDescripcionBarbero('');
      setNuevoSucursalBarbero('suc-chico');
      notificarExito(`✓ Maestro Barbero "${nuevoBarberoData.nombre}" incorporado con éxito`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al añadir maestro barbero: ' + err.message);
    } finally {
      setCreandoBarbero(false);
    }
  };

  const handleEliminarBarbero = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Confirmas retirar al maestro barbero "${nombre}" de la nómina activa?`)) {
      return;
    }
    try {
      const updatedBarberos = await eliminarBarbero(id);
      setBarberos(updatedBarberos);
      notificarExito(`✓ Maestro barbero "${nombre}" retirado de la nómina`);
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      alert('Error al retirar maestro barbero: ' + err.message);
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
      <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <BarberPoleRibbon className="h-1 absolute top-0 left-0 right-0" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <VintageCrownIcon className="w-5 h-5 text-[#7C571C]" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                Panel Super Admin & Personal de Salón
              </h2>
            </div>
            <p className="text-xs text-[#6F5A4B] font-mono mt-0.5">
              Gestión centralizada de usuarios de caja, datos de maestros barberos y nombres de sedes
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#FBEBE1] px-3 py-1.5 rounded-lg border border-[#DFCBB5] font-mono text-xs">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            <span className="text-[#6F5A4B]">Sesión Super Admin:</span>
            <span className="text-[#7C571C] font-bold">{usuarioActual?.nombre || 'David Orjuela'}</span>
          </div>
        </div>

        {/* Global Notifications */}
        {mensajeExito && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D] text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#DFCBB5]/60 font-mono text-xs overflow-x-auto no-scrollbar">
          <button
            id="subtab-usuarios"
            onClick={() => setSubTab('usuarios')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'usuarios'
                ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
                : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cuentas de Usuarios ({usuarios.length})</span>
          </button>

          <button
            id="subtab-barberos"
            onClick={() => setSubTab('barberos')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'barberos'
                ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
                : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5]'
            }`}
          >
            <StraightRazorIcon className="w-4 h-4" />
            <span>Maestros Barberos ({barberos.length})</span>
          </button>

          <button
            id="subtab-sedes"
            onClick={() => setSubTab('sedes')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'sedes'
                ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
                : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Sedes & Sucursales ({sucursales.length})</span>
          </button>

          <button
            id="subtab-servicios"
            onClick={() => setSubTab('servicios')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'servicios'
                ? 'bg-[#7C571C] text-[#FAF6EE] shadow-sm'
                : 'bg-[#FBEBE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Servicios & Precios ({servicios.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: GESTIÓN DE USUARIOS                             */}
      {/* ======================================================== */}
      {subTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario: Crear Nuevo Usuario */}
          <div className="lg:col-span-5 bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                  Registrar Colaborador
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold">
                CONTROL RBAC
              </span>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-3.5">
              {/* Nombre */}
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre Completo del Colaborador:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#6F5A4B]" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Mateo Gómez"
                    required
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Correo Electrónico (Usuario de Acceso):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#6F5A4B]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mateo@casadelrey.com"
                    required
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Contraseña Asignada:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-[#6F5A4B]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] placeholder-[#8A796D]"
                  />
                </div>
              </div>

              {/* Rol Selection */}
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Rol & Nivel de Permisos:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRol('Cajero')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      rol === 'Cajero'
                        ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Coins className="w-3.5 h-3.5 text-[#7C571C]" />
                      <span>Cajero</span>
                    </div>
                    <span className="text-[9px] block mt-1 text-[#6F5A4B]">
                      Caja, Cortes & Turnos Aislados
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRol('Administrador')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      rol === 'Administrador'
                        ? 'bg-[#FBEBE1] border-[#7C571C] text-[#221A14] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#DFCBB5] text-[#6F5A4B] hover:text-[#221A14]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <VintageCrownIcon className="w-3.5 h-3.5 text-[#7C571C]" />
                      <span>Administrador</span>
                    </div>
                    <span className="text-[9px] block mt-1 text-[#6F5A4B]">
                      Acceso Total Consolidado
                    </span>
                  </button>
                </div>
              </div>

              {/* Asignación de Sucursal */}
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  {rol === 'Cajero' ? 'Sucursal Asignada (Caja con Contabilidad Aislada):' : 'Alcance de Sucursales:'}
                </label>

                {rol === 'Cajero' ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3 top-2.5 text-[#7C571C]" />
                      <select
                        value={sucursalAsignada}
                        onChange={(e) => setSucursalAsignada(e.target.value)}
                        className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                      >
                        {sucursales.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.direccion})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-[#6F5A4B] leading-relaxed">
                      🔒 Este usuario de caja tendrá su libro de turnos y contabilidad <span className="text-[#7C571C] font-bold">aislados únicamente a esta sede</span>.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#DFCBB5] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#221A14]">
                      <Building2 className="w-4 h-4 text-[#7C571C]" />
                      <span>Todas las 3 Sucursales (Consolidado)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold">
                      GLOBAL
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full py-2.5 bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-mono font-bold text-xs rounded-lg transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 tracking-wider uppercase cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{guardando ? 'CREANDO USUARIO...' : 'REGISTRAR USUARIO'}</span>
              </button>
            </form>
          </div>

          {/* Lista de Usuarios Registrados */}
          <div className="lg:col-span-7 bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-5 shadow-sm font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14] tracking-wide">
                  Cuentas de Usuario Activas ({usuarios.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#6F5A4B]">ROLES CONFIGURADOS</span>
            </div>

            {cargando ? (
              <div className="py-8 text-center text-[#6F5A4B]">Cargando usuarios...</div>
            ) : usuarios.length === 0 ? (
              <div className="py-8 text-center text-[#6F5A4B]">No hay usuarios registrados</div>
            ) : (
              <div className="space-y-3">
                {usuarios.map(u => (
                  <div
                    key={u.id}
                    className="bg-[#FFFFFF] border border-[#DFCBB5] hover:border-[#7C571C] p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela')
                          ? 'bg-[#FBEBE1] border border-[#7C571C] text-[#7C571C]'
                          : u.rol === 'Administrador'
                            ? 'bg-[#FBEBE1] border border-[#DFCBB5] text-[#7C571C]'
                            : 'bg-[#EBF7EE] border border-[#86EFAC] text-[#15803D]'
                      }`}>
                        {u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela') ? (
                          <VintageCrownIcon className="w-4 h-4 text-[#7C571C]" />
                        ) : u.rol === 'Administrador' ? (
                          <VintageCrownIcon className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#221A14] text-xs">{u.nombre}</span>
                          {u.rol === 'SuperAdmin' || u.nombre.toLowerCase().includes('david orjuela') ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#FBEBE1] text-[#7C571C] border border-[#7C571C] flex items-center gap-1">
                              <VintageCrownIcon className="w-2.5 h-2.5" />
                              SUPER ADMIN (ACCESO TOTAL)
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              u.rol === 'Administrador'
                                ? 'bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5]'
                                : 'bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC]'
                            }`}>
                              {u.rol}
                            </span>
                          )}

                          {u.rol === 'SuperAdmin' || u.rol === 'Administrador' || u.nombre.toLowerCase().includes('david orjuela') ? (
                            <span className="px-2 py-0.5 rounded text-[9px] bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] font-bold flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" />
                              3 Sedes (Consolidado)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] bg-[#EBF7EE] text-[#15803D] border border-[#86EFAC] font-bold flex items-center gap-1">
                              <Store className="w-2.5 h-2.5 text-[#7C571C]" />
                              {getSucursalById(u.sucursalAsignada || 'suc-chico').nombre}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[#6F5A4B] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#6F5A4B]" />
                            {u.email}
                          </span>
                          <span>•</span>
                          <span>Alta: {formatDate(u.creadoEn)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                      {/* Botón Editar Nombre y Perfil */}
                      <button
                        type="button"
                        onClick={() => iniciarEdicionUsuario(u)}
                        className="px-2.5 py-1 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] border border-[#DFCBB5] transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                        title="Modificar nombre y sede del usuario"
                      >
                        <Edit3 className="w-3 h-3 text-[#7C571C]" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRestablecerClaveUsuario(u)}
                        className="px-2 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#FBEBE1] text-[#7C571C] border border-[#DFCBB5] transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                        title="Restablecer o cambiar la contraseña de este usuario"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clave</span>
                      </button>

                      {u.id === 'USR-ADMIN-01' || u.id === 'USR-DAVID-01' || u.nombre.toLowerCase().includes('david orjuela') ? (
                        <span className="text-[10px] text-[#7C571C] font-bold px-2 py-1 bg-[#FBEBE1] rounded border border-[#DFCBB5]">
                          TITULAR
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEliminar(u.id, u.nombre)}
                          className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors flex items-center gap-1 text-[10px] cursor-pointer border border-[#BA1A1A]/30"
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
      )}

      {/* ======================================================== */}
      {/* VISTA 2: GESTIÓN DE MAESTROS BARBEROS                    */}
      {/* ======================================================== */}
      {subTab === 'barberos' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <StraightRazorIcon className="w-5 h-5 text-[#7C571C]" />
                  <h3 className="font-serif text-base font-bold text-[#221A14] uppercase tracking-wide">
                    Maestros Barberos de La Casa del Rey
                  </h3>
                </div>
                <p className="text-xs text-[#6F5A4B] mt-0.5">
                  Gestiona la nómina, añade nuevos maestros barberos y personaliza sus datos y sedes
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <span className="px-3 py-1 bg-[#FBEBE1] text-[#7C571C] text-xs font-bold rounded-full border border-[#DFCBB5]">
                  {barberos.length} Barberos en Nómina
                </span>
                <button
                  type="button"
                  id="btn-crear-barbero"
                  onClick={() => setMostrarModalNuevoBarbero(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Barbero</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barberos.map(b => (
                <div
                  key={b.id}
                  className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#7C571C] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#7C571C] font-bold block uppercase">
                          ID #{b.id}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#221A14]">
                          {b.nombre}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-bold rounded-full border border-[#86EFAC]">
                        ACTIVO
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Oficio / Especialidad:</span>
                      <p className="text-xs text-[#221A14] font-medium">{b.especialidad}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Descripción Biográfica:</span>
                      <p className="text-xs text-[#6F5A4B] italic leading-relaxed line-clamp-3">
                        {b.descripcion || 'Especialista en cortes tradicionales, degradados a navaja libre y perfilado de barba al vapor.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#7C571C] pt-1">
                      <Store className="w-3.5 h-3.5" />
                      <span>{b.sucursalNombre || getSucursalById(b.sucursalId || 'suc-chico').nombre}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DFCBB5]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => iniciarEdicionBarbero(b)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarBarbero(b.id, b.nombre)}
                      className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6] border border-[#BA1A1A]/30 transition-all cursor-pointer"
                      title="Retirar barbero de nómina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: GESTIÓN DE SEDES & SUCURSALES                   */}
      {/* ======================================================== */}
      {subTab === 'sedes' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#7C571C]" />
                  <h3 className="font-serif text-base font-bold text-[#221A14] uppercase tracking-wide">
                    Sedes & Sucursales de La Casa del Rey
                  </h3>
                </div>
                <p className="text-xs text-[#6F5A4B] mt-0.5">
                  Gestiona las sucursales, apertura nuevas sedes físicas y actualiza sus datos de contacto
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <span className="px-3 py-1 bg-[#FBEBE1] text-[#7C571C] text-xs font-bold rounded-full border border-[#DFCBB5]">
                  {sucursales.length} {sucursales.length === 1 ? 'Sede' : 'Sedes'} Registradas
                </span>
                <button
                  type="button"
                  id="btn-crear-sede"
                  onClick={() => setMostrarModalNuevaSede(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Sede</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sucursales.map(s => (
                <div
                  key={s.id}
                  className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#7C571C] transition-all space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7C571C] font-bold uppercase tracking-wider">
                        {s.id}
                      </span>
                      <span className="px-2 py-0.5 bg-[#EBF7EE] text-[#15803D] text-[9px] font-bold rounded-full border border-[#86EFAC]">
                        OPERATIVA
                      </span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-[#221A14]">
                      {s.nombre}
                    </h4>

                    <div className="space-y-1.5 pt-1 text-xs">
                      <div className="flex items-start gap-2 text-[#6F5A4B]">
                        <MapPin className="w-3.5 h-3.5 text-[#7C571C] shrink-0 mt-0.5" />
                        <span>{s.direccion}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#6F5A4B]">
                        <Phone className="w-3.5 h-3.5 text-[#7C571C] shrink-0" />
                        <span>{s.telefono}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[#6F5A4B]">
                        <Clock className="w-3.5 h-3.5 text-[#7C571C] shrink-0" />
                        <span>{s.horario || 'Lun - Sáb: 8:00 AM - 8:00 PM'}</span>
                      </div>
                    </div>

                    {s.descripcion && (
                      <p className="text-[11px] text-[#6F5A4B] italic pt-1 border-t border-[#DFCBB5]/40">
                        {s.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DFCBB5]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => iniciarEdicionSede(s)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarSede(s.id, s.nombre)}
                      className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6] border border-[#BA1A1A]/30 transition-all cursor-pointer"
                      title="Eliminar sucursal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 4: GESTIÓN DE SERVICIOS & TARIFAS                  */}
      {/* ======================================================== */}
      {subTab === 'servicios' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCBB5] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-[#7C571C]" />
                  <h3 className="font-serif text-base font-bold text-[#221A14] uppercase tracking-wide">
                    Catálogo de Servicios & Precios Reales
                  </h3>
                </div>
                <p className="text-xs text-[#6F5A4B] mt-0.5">
                  Gestiona los servicios oficiales, precios (COP), duración y crea nuevas experiencias para los clientes
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <span className="px-3 py-1 bg-[#FBEBE1] text-[#7C571C] text-xs font-bold rounded-full border border-[#DFCBB5]">
                  {servicios.length} Servicios Activos
                </span>
                <button
                  type="button"
                  id="btn-crear-servicio"
                  onClick={() => setMostrarModalNuevoServicio(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Servicio</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicios.map(srv => (
                <div
                  key={srv.id}
                  className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#7C571C] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#7C571C] font-bold block uppercase">
                          ID #{srv.id}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#221A14]">
                          {srv.nombre}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 bg-[#FBEBE1] text-[#7C571C] text-[10px] font-bold rounded-full border border-[#DFCBB5]">
                        {srv.categoria === 'grupal' ? 'GRUPAL' : 'INDIVIDUAL'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-[#DFCBB5]/40">
                      <div>
                        <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">Precio Oficial:</span>
                        <span className="font-serif text-lg font-bold text-[#221A14]">
                          ${srv.precio.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6F5A4B] uppercase block font-bold">Duración:</span>
                        <span className="text-xs font-bold text-[#7C571C]">
                          {srv.duracionMinutos} min
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#6F5A4B] block uppercase font-bold">Descripción del Ritual:</span>
                      <p className="text-xs text-[#6F5A4B] italic leading-relaxed line-clamp-3">
                        {srv.descripcion || 'Ritual artesanal de cuidado masculino con los más altos estándares.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DFCBB5]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => iniciarEdicionServicio(srv)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarServicio(srv.id, srv.nombre)}
                      className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6] border border-[#BA1A1A]/30 transition-all cursor-pointer"
                      title="Eliminar servicio del catálogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {usuarioEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14]">
                  Modificar Usuario
                </h3>
              </div>
              <button
                onClick={() => setUsuarioEnEdicion(null)}
                className="p-1 rounded-lg text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionUsuario} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre Completo del Usuario:
                </label>
                <input
                  type="text"
                  value={editNombreUsuario}
                  onChange={(e) => setEditNombreUsuario(e.target.value)}
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Correo Electrónico (No modificable):
                </label>
                <input
                  type="email"
                  value={usuarioEnEdicion.email}
                  disabled
                  className="w-full bg-[#FBEBE1] border border-[#DFCBB5] text-[#6F5A4B] rounded-lg px-3 py-2 text-xs opacity-75 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Rol de Usuario:
                </label>
                <select
                  value={editRolUsuario}
                  onChange={(e) => setEditRolUsuario(e.target.value as RolUsuario)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  <option value="Cajero">Cajero (Caja & Turnos de Sede)</option>
                  <option value="Administrador">Administrador (Consolidado General)</option>
                  <option value="SuperAdmin">SuperAdmin (Acceso Total)</option>
                </select>
              </div>

              {editRolUsuario === 'Cajero' && (
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Sucursal Asignada (Aislamiento de Caja):
                  </label>
                  <select
                    value={editSucursalUsuario}
                    onChange={(e) => setEditSucursalUsuario(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                  >
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.direccion})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEnEdicion(null)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardandoUsuario ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / FORM: EDITAR BARBERO                             */}
      {/* ======================================================== */}
      {barberoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <StraightRazorIcon className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14]">
                  Modificar Maestro Barbero #{barberoEnEdicion.id}
                </h3>
              </div>
              <button
                onClick={() => setBarberoEnEdicion(null)}
                className="p-1 rounded-lg text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionBarbero} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre del Maestro Barbero:
                </label>
                <input
                  type="text"
                  value={editNombreBarbero}
                  onChange={(e) => setEditNombreBarbero(e.target.value)}
                  placeholder="Ej. Maestro David"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Oficio / Título de Especialidad:
                </label>
                <input
                  type="text"
                  value={editEspecialidadBarbero}
                  onChange={(e) => setEditEspecialidadBarbero(e.target.value)}
                  placeholder="Ej. Corte Clásico & Navaja Libre"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción Biográfica del Barbero:
                </label>
                <textarea
                  rows={3}
                  value={editDescripcionBarbero}
                  onChange={(e) => setEditDescripcionBarbero(e.target.value)}
                  placeholder="Trayectoria, técnicas dominadas y perfil clásico del maestro..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-3 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Sede Principal Asignada:
                </label>
                <select
                  value={editSucursalBarbero}
                  onChange={(e) => setEditSucursalBarbero(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.direccion})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBarberoEnEdicion(null)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoBarbero}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardandoBarbero ? 'Guardando...' : 'Guardar Maestro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / FORM: EDITAR SEDE & SUCURSAL                     */}
      {/* ======================================================== */}
      {sedeEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14]">
                  Modificar Sede: {sedeEnEdicion.id}
                </h3>
              </div>
              <button
                onClick={() => setSedeEnEdicion(null)}
                className="p-1 rounded-lg text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionSede} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre Oficial de la Sede:
                </label>
                <input
                  type="text"
                  value={editNombreSede}
                  onChange={(e) => setEditNombreSede(e.target.value)}
                  placeholder="Ej. Sede Chicó Real"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Dirección Física:
                </label>
                <input
                  type="text"
                  value={editDireccionSede}
                  onChange={(e) => setEditDireccionSede(e.target.value)}
                  placeholder="Ej. Calle 93 # 13-45"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Teléfono de Contacto:
                </label>
                <input
                  type="text"
                  value={editTelefonoSede}
                  onChange={(e) => setEditTelefonoSede(e.target.value)}
                  placeholder="Ej. +57 310 892 4512"
                  required
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Horario de Atención:
                </label>
                <input
                  type="text"
                  value={editHorarioSede}
                  onChange={(e) => setEditHorarioSede(e.target.value)}
                  placeholder="Ej. Lunes a Sábado: 8:00 AM - 8:00 PM"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción o Rasgos Distintivos:
                </label>
                <textarea
                  rows={2}
                  value={editDescripcionSede}
                  onChange={(e) => setEditDescripcionSede(e.target.value)}
                  placeholder="Ambiente, comodidades o características de la sede..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSedeEnEdicion(null)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSede}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardandoSede ? 'Guardando...' : 'Guardar Sede'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / FORM: EDITAR SERVICIO (PRECIO, NOMBRE, DESC)     */}
      {/* ======================================================== */}
      {servicioEnEdicion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#7C571C]" />
                <h3 className="font-serif text-sm font-bold uppercase text-[#221A14]">
                  Modificar Servicio & Tarifa
                </h3>
              </div>
              <button
                onClick={() => setServicioEnEdicion(null)}
                className="p-1 rounded-lg text-[#6F5A4B] hover:text-[#221A14] hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionServicio} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre del Servicio:
                </label>
                <input
                  type="text"
                  value={editNombreServicio}
                  onChange={(e) => setEditNombreServicio(e.target.value)}
                  required
                  placeholder="Ej. Corte de Cabello Real"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Precio Oficial (COP):
                  </label>
                  <input
                    type="number"
                    value={editPrecioServicio}
                    onChange={(e) => setEditPrecioServicio(Number(e.target.value))}
                    required
                    min={1000}
                    step={1000}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Duración (Minutos):
                  </label>
                  <input
                    type="number"
                    value={editDuracionServicio}
                    onChange={(e) => setEditDuracionServicio(Number(e.target.value))}
                    required
                    min={10}
                    max={180}
                    step={5}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Categoría de Servicio:
                </label>
                <select
                  value={editCategoriaServicio}
                  onChange={(e) => setEditCategoriaServicio(e.target.value as 'individual' | 'grupal')}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  <option value="individual">Individual (Turno tradicional)</option>
                  <option value="grupal">Grupal (Camaradería & Comitivas)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción del Servicio:
                </label>
                <textarea
                  rows={3}
                  value={editDescripcionServicio}
                  onChange={(e) => setEditDescripcionServicio(e.target.value)}
                  placeholder="Detalles del ritual, toallas calientes, productos incluidos..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServicioEnEdicion(null)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoServicio}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardandoServicio ? 'Guardando...' : 'Guardar Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / CREAR NUEVO SERVICIO                             */}
      {/* ======================================================== */}
      {mostrarModalNuevoServicio && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2 text-[#7C571C]">
                <Scissors className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-[#221A14]">
                  Añadir Nuevo Servicio al Catálogo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevoServicio(false)}
                className="p-1 text-[#6F5A4B] hover:text-[#221A14] rounded-lg hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoServicio} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre Oficial del Servicio:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombreServicio}
                  onChange={(e) => setNuevoNombreServicio(e.target.value)}
                  placeholder="Ej: Corte Ejecutivo & Lavado Especial"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Precio Oficial (COP):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={nuevoPrecioServicio}
                    onChange={(e) => setNuevoPrecioServicio(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Duración Estimada (Minutos):
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={nuevoDuracionServicio}
                    onChange={(e) => setNuevoDuracionServicio(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Modalidad / Categoría:
                </label>
                <select
                  value={nuevoCategoriaServicio}
                  onChange={(e) => setNuevoCategoriaServicio(e.target.value as 'individual' | 'grupal')}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  <option value="individual">Individual (Turno tradicional)</option>
                  <option value="grupal">Grupal (Camaradería & Comitivas)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción del Ritual:
                </label>
                <textarea
                  rows={3}
                  value={nuevoDescripcionServicio}
                  onChange={(e) => setNuevoDescripcionServicio(e.target.value)}
                  placeholder="Describe la experiencia, ritual, toalla caliente, navaja libre o productos aplicados..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoServicio(false)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoServicio}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{creandoServicio ? 'Guardando...' : 'Crear Servicio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / CREAR NUEVA SUCURSAL / SEDE                      */}
      {/* ======================================================== */}
      {mostrarModalNuevaSede && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2 text-[#7C571C]">
                <Store className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-[#221A14]">
                  Aperturar Nueva Sede
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevaSede(false)}
                className="p-1 text-[#6F5A4B] hover:text-[#221A14] rounded-lg hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevaSede} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre de la Sede / Sucursal:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombreSede}
                  onChange={(e) => setNuevoNombreSede(e.target.value)}
                  placeholder="Ej: Sede Rosales, Sede Chapinero Alto..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Dirección Física:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoDireccionSede}
                  onChange={(e) => setNuevoDireccionSede(e.target.value)}
                  placeholder="Ej: Calle 72 # 5-38, Bogotá"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Teléfono de Contacto:
                  </label>
                  <input
                    type="text"
                    value={nuevoTelefonoSede}
                    onChange={(e) => setNuevoTelefonoSede(e.target.value)}
                    placeholder="+57 312 345 6789"
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                    Horario de Atención:
                  </label>
                  <input
                    type="text"
                    value={nuevoHorarioSede}
                    onChange={(e) => setNuevoHorarioSede(e.target.value)}
                    placeholder="Lun - Sáb: 8:00 AM - 8:00 PM"
                    className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción o Referencia de la Sede:
                </label>
                <textarea
                  rows={2}
                  value={nuevoDescripcionSede}
                  onChange={(e) => setNuevoDescripcionSede(e.target.value)}
                  placeholder="Ambiente distinguido, sillones hidráulicos clásicos y café bar de cortesía..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaSede(false)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoSede}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{creandoSede ? 'Guardando...' : 'Aperturar Sede'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL / CREAR NUEVO MAESTRO BARBERO                      */}
      {/* ======================================================== */}
      {mostrarModalNuevoBarbero && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFF8F5] border-2 border-[#7C571C] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#DFCBB5] pb-3">
              <div className="flex items-center gap-2 text-[#7C571C]">
                <StraightRazorIcon className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold text-[#221A14]">
                  Incorporar Maestro Barbero a Nómina
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevoBarbero(false)}
                className="p-1 text-[#6F5A4B] hover:text-[#221A14] rounded-lg hover:bg-[#FBEBE1] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoBarbero} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Nombre Completo del Barbero:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoNombreBarbero}
                  onChange={(e) => setNuevoNombreBarbero(e.target.value)}
                  placeholder="Ej: Gabriel 'El Navaja' Méndez"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Especialidad u Oficio:
                </label>
                <input
                  type="text"
                  required
                  value={nuevoEspecialidadBarbero}
                  onChange={(e) => setNuevoEspecialidadBarbero(e.target.value)}
                  placeholder="Ej: Maestro Barbero & Navaja Libre"
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Sede Asignada:
                </label>
                <select
                  value={nuevoSucursalBarbero}
                  onChange={(e) => setNuevoSucursalBarbero(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7C571C] cursor-pointer"
                >
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#6F5A4B] block uppercase font-bold mb-1">
                  Descripción Biográfica:
                </label>
                <textarea
                  rows={3}
                  value={nuevoDescripcionBarbero}
                  onChange={(e) => setNuevoDescripcionBarbero(e.target.value)}
                  placeholder="Años de experiencia, estilos de corte predilectos, destreza con navaja o tijera..."
                  className="w-full bg-[#FFFFFF] border border-[#DFCBB5] text-[#221A14] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7C571C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoBarbero(false)}
                  className="px-3 py-2 rounded-lg bg-[#FBEBE1] text-[#221A14] hover:bg-[#F5E5DB] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoBarbero}
                  className="px-4 py-2 rounded-lg bg-[#7C571C] hover:bg-[#684815] text-[#FAF6EE] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{creandoBarbero ? 'Guardando...' : 'Incorporar a Nómina'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
