/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Servicio, Barbero, Cita, Usuario, puedeUsuarioVerApi, esUsuarioAdmin, esUsuarioDavid } from './types';
import { getServicios, getBarberos, getAllCitas } from './services/api';
import { Navbar, TabType } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ServiceCatalog } from './components/ServiceCatalog';
import { BarbersTeam } from './components/BarbersTeam';
import { IndividualBookingForm } from './components/IndividualBookingForm';
import { GroupBookingForm } from './components/GroupBookingForm';
import { AppointmentsList } from './components/AppointmentsList';
import { ApiConsole } from './components/ApiConsole';
import { DailyCutsModule } from './components/DailyCutsModule';
import { AccountingModule } from './components/AccountingModule';
import { LoginModal } from './components/LoginModal';
import { UserManagementModule } from './components/UserManagementModule';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { CustomerReportModule } from './components/CustomerReportModule';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseAuth';
import { MapPin, Phone, Clock, Terminal, Scissors, Coins, Lock, Users, ShieldAlert } from 'lucide-react';
import { 
  VintageCrownIcon, 
  StraightRazorIcon, 
  VintageBarberPole, 
  BarberPoleRibbon 
} from './components/VintageBarberIcons';
import { BottomNav } from './components/BottomNav';
import { LOGO_CASA_DEL_REY, BG_BARBERIA, BG_BARBERIA_WEBP } from './utils/assets';

const DAVID_ORJUELA_SUPERADMIN: Usuario = {
  id: 'USR-DAVID-01',
  nombre: 'David Orjuela',
  email: 'orjueladavid32@gmail.com',
  rol: 'SuperAdmin',
  sucursalAsignada: 'todas',
  puedeVerApi: true,
  activo: true,
  creadoEn: '2026-09-01T07:00:00.000Z'
};

export default function App() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Authentication state
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const manualLogout = sessionStorage.getItem('cdr_manual_logout');
      if (manualLogout === 'true') {
        return null;
      }
      const guardado = localStorage.getItem('casa_del_rey_usuario');
      if (guardado) {
        const u: Usuario = JSON.parse(guardado);
        // Garantizar que David Orjuela siempre tenga rol SuperAdmin con acceso total y API visible
        if (
          u.email?.toLowerCase().includes('orjuela') ||
          u.email?.toLowerCase().includes('david') ||
          u.nombre?.toLowerCase().includes('david') ||
          u.rol === 'SuperAdmin'
        ) {
          u.rol = 'SuperAdmin';
          u.puedeVerApi = true;
          u.sucursalAsignada = 'todas';
        }
        return u;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Tab & Flow management
  const [activeTab, setActiveTab] = useState<TabType>('servicios');
  const [bookingType, setBookingType] = useState<'individual' | 'grupal'>('individual');
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | undefined>(undefined);
  const [preselectedBarberId, setPreselectedBarberId] = useState<number | undefined>(undefined);

  // Google Calendar integration state (using in-memory auth tokens per security mandates)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleCalendarModalOpen, setGoogleCalendarModalOpen] = useState<boolean>(false);
  const [customerReportModalOpen, setCustomerReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setGoogleUser(currentUser);
      // Si el usuario de Google es David Orjuela (orjueladavid32@gmail.com), auto-activar su perfil SuperAdmin
      if (currentUser?.email) {
        const emailLower = currentUser.email.toLowerCase();
        if (emailLower.includes('orjuela') || emailLower.includes('david')) {
          setUsuario(prev => {
            if (prev && prev.rol === 'SuperAdmin') return prev;
            const davidUser: Usuario = {
              id: 'USR-DAVID-01',
              nombre: currentUser.displayName || 'David Orjuela',
              email: currentUser.email,
              rol: 'SuperAdmin',
              sucursalAsignada: 'todas',
              puedeVerApi: true,
              activo: true,
              creadoEn: '2026-09-01T07:00:00.000Z'
            };
            try {
              localStorage.setItem('casa_del_rey_usuario', JSON.stringify(davidUser));
            } catch (e) {
              console.error(e);
            }
            return davidUser;
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (usr: Usuario) => {
    try {
      sessionStorage.removeItem('cdr_manual_logout');
      localStorage.setItem('casa_del_rey_usuario', JSON.stringify(usr));
    } catch (e) {
      console.error(e);
    }
    setUsuario(usr);
  };

  const handleLogout = () => {
    setUsuario(null);
    try {
      localStorage.removeItem('casa_del_rey_usuario');
      sessionStorage.setItem('cdr_manual_logout', 'true');
    } catch (e) {
      console.error(e);
    }
    if (
      activeTab === 'agenda' || 
      activeTab === 'cortes' || 
      activeTab === 'contabilidad' || 
      activeTab === 'clientes' ||
      activeTab === 'usuarios' || 
      activeTab === 'api'
    ) {
      setActiveTab('reservar');
    }
  };

  const cargarDatos = async () => {
    try {
      const [dataServicios, dataBarberos, dataCitas] = await Promise.all([
        getServicios().catch(() => []),
        getBarberos().catch(() => []),
        getAllCitas().catch(() => []),
      ]);
      setServicios(dataServicios);
      setBarberos(dataBarberos);
      setCitas(dataCitas);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSelectServicio = (servicioId: number) => {
    setPreselectedServiceId(servicioId);
    setBookingType('individual');
    setActiveTab('reservar');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSelectBarbero = (barberoId: number) => {
    setPreselectedBarberId(barberoId);
    setBookingType('individual');
    setActiveTab('reservar');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleBookingSuccess = (nuevaCita: Cita) => {
    setCitas(prev => [nuevaCita, ...prev]);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] relative flex flex-col font-sans selection:bg-[#C49756] selection:text-[#FFFFFF] bg-[#FFF8F5] text-[#221A14] pb-16">
      {/* Subtle Warm Heritage Background Texture */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 bg-[#FFF8F5]" 
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#DFCBB5_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Banner & Vintage Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCitas={citas.length}
        usuario={usuario}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        googleUser={googleUser}
        onOpenGoogleCalendar={() => setGoogleCalendarModalOpen(true)}
      />

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {cargando ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 font-mono text-xs text-[#A8988B]">
            <div className="w-10 h-10 rounded-xl bg-[#1A1412] border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27] shadow-lg animate-pulse">
              <VintageCrownIcon className="w-6 h-6" />
            </div>
            <p className="font-royal text-sm text-[#FAF6EE]">Abriendo puertas de Barbería La Casa del Rey...</p>
          </div>
        ) : (
          <>
            {/* View: RESERVAR CITA */}
            {activeTab === 'reservar' && (
              <section className="space-y-6">
                <HeroBanner
                  bookingType={bookingType}
                  setBookingType={setBookingType}
                />

                <div className="max-w-4xl mx-auto">
                  {bookingType === 'individual' ? (
                    <IndividualBookingForm
                      servicios={servicios}
                      barberos={barberos}
                      preselectedServiceId={preselectedServiceId}
                      preselectedBarberId={preselectedBarberId}
                      onBookingSuccess={handleBookingSuccess}
                    />
                  ) : (
                    <GroupBookingForm
                      servicios={servicios}
                      onBookingSuccess={handleBookingSuccess}
                    />
                  )}
                </div>

                {/* Quick services teaser below */}
                <div className="pt-6 border-t border-[#3D2E26]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-royal font-bold uppercase tracking-widest text-[#E5B869] flex items-center gap-2">
                      <StraightRazorIcon className="w-4 h-4 text-[#C59B27]" />
                      <span>CARTA CLÁSICA DE SERVICIOS</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('servicios')}
                      className="text-xs font-mono text-[#E5B869] hover:text-[#FAF6EE] font-bold transition-colors cursor-pointer"
                    >
                      [Ver Carta Completa] &rarr;
                    </button>
                  </div>
                  <ServiceCatalog
                    servicios={servicios}
                    onSelectServicio={handleSelectServicio}
                  />
                </div>
              </section>
            )}

            {/* View: SERVICIOS */}
            {activeTab === 'servicios' && (
              <section className="space-y-8">
                <ServiceCatalog
                  servicios={servicios}
                  onSelectServicio={handleSelectServicio}
                />
                <BarbersTeam
                  barberos={barberos}
                  onSelectBarbero={handleSelectBarbero}
                />
              </section>
            )}

            {/* View: BARBEROS */}
            {activeTab === 'barberos' && (
              <section className="space-y-8">
                <BarbersTeam
                  barberos={barberos}
                  onSelectBarbero={handleSelectBarbero}
                />
              </section>
            )}

            {/* View: AGENDA Y GESTIÓN DE CITAS */}
            {activeTab === 'agenda' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#3D2E26] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <VintageBarberPole className="w-4 h-4 text-[#C59B27]" />
                      <h2 className="text-sm font-royal font-bold tracking-wide text-[#FAF6EE] uppercase">
                        Libro de Turnos & Agenda del Salón
                      </h2>
                    </div>
                    <p className="text-xs text-[#A8988B] mt-0.5 font-mono">
                      Supervisa citas individuales y comitivas de caballeros en tiempo real
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#1A1412] text-[#FAF6EE] text-[10px] font-mono font-bold rounded-md border border-[#3D2E26]">
                    SINCRONIZACIÓN ACTIVA
                  </span>
                </div>

                <AppointmentsList
                  citas={citas}
                  servicios={servicios}
                  barberos={barberos}
                  onRefresh={cargarDatos}
                  onOpenNewBooking={() => setActiveTab('reservar')}
                  googleUser={googleUser}
                  onOpenGoogleCalendarModal={() => setGoogleCalendarModalOpen(true)}
                  onOpenReporteClientes={() => setCustomerReportModalOpen(true)}
                  esAdmin={esUsuarioAdmin(usuario)}
                  sucursalAsignada={usuario?.sucursalAsignada}
                />
              </section>
            )}

            {/* View: REGISTRO DE CORTES DEL DÍA & DIVISIÓN POR BARBERO */}
            {activeTab === 'cortes' && (
              <section className="space-y-4">
                <DailyCutsModule
                  servicios={servicios}
                  barberos={barberos}
                  citas={citas}
                  onDataUpdated={cargarDatos}
                />
              </section>
            )}

            {/* View: CONTABILIDAD & ARQUEO DE CAJA */}
            {activeTab === 'contabilidad' && (
              <section className="space-y-4">
                <AccountingModule
                  barberos={barberos}
                  onDataUpdated={cargarDatos}
                  usuario={usuario}
                />
              </section>
            )}

            {/* View: BASE DE DATOS & DIRECTORIO DE CLIENTES (SOLO ADMINISTRADOR Y SUPERADMIN) */}
            {activeTab === 'clientes' && (
              <section className="space-y-4">
                <CustomerReportModule
                  servicios={servicios}
                  barberos={barberos}
                />
              </section>
            )}

            {/* View: GESTIÓN DE USUARIOS & PERSONAL (EXCLUSIVO DAVID ORJUELA) */}
            {activeTab === 'usuarios' && esUsuarioDavid(usuario) && (
              <section className="space-y-4">
                <UserManagementModule usuarioActual={usuario} />
              </section>
            )}

            {/* View: CONSOLA DE PRUEBAS & API (EXCLUSIVO DAVID ORJUELA / SUPER ADMIN) */}
            {activeTab === 'api' && (
              puedeUsuarioVerApi(usuario) ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#3D2E26] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#C59B27]" />
                        <h2 className="text-sm font-royal font-bold tracking-wide text-[#FAF6EE] uppercase">
                          Tablero de Desarrollador & API REST Vintage
                        </h2>
                      </div>
                      <p className="text-xs text-[#A8988B] mt-0.5 font-mono">
                        Consola interactiva sobre el servidor Express v4 en puerto 3000 • Acceso Titular Autorizado
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#1A1412] text-[#86EFAC] text-[10px] font-mono font-bold rounded-md border border-[#3D2E26]">
                      PUERTO 3000 ACTIVO
                    </span>
                  </div>

                  <ApiConsole />
                </section>
              ) : (
                <div className="bg-[#1A1412] border border-[#3D2E26] rounded-xl p-8 text-center space-y-3 font-mono">
                  <div className="w-12 h-12 rounded-full bg-[#3E161C] border border-[#6B242D] text-[#F87171] mx-auto flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-royal font-bold text-[#FAF6EE] uppercase tracking-wide">
                    Acceso Restringido
                  </h3>
                  <p className="text-xs text-[#A8988B] max-w-md mx-auto leading-relaxed">
                    La sección de consola de API no está disponible para usuarios con rol de Administrador de salón. Esta sección está reservada exclusivamente para David Orjuela.
                  </p>
                  <button
                    onClick={() => setActiveTab('agenda')}
                    className="px-4 py-2 bg-[#C59B27] text-[#120E0C] font-bold text-xs rounded-lg hover:bg-[#D4A373] transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Ir al Libro de Turnos
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Login Modal para Personal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Google Calendar Management Modal */}
      <GoogleCalendarModal
        isOpen={googleCalendarModalOpen}
        onClose={() => setGoogleCalendarModalOpen(false)}
        citas={citas}
      />

      {/* Reporte de Base de Datos de Clientes Modal */}
      <CustomerReportModule
        isModal={true}
        isOpen={customerReportModalOpen}
        onClose={() => setCustomerReportModalOpen(false)}
        servicios={servicios}
        barberos={barberos}
      />

      {/* Heritage Barber Footer */}
      <footer className="border-t border-[#DFCBB5] bg-[#FBEBE1] mt-12 text-xs text-[#4F4539] font-sans relative pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#DFCBB5] bg-[#FFF8F5] shadow-sm shrink-0 flex items-center justify-center">
                  <img 
                    src={LOGO_CASA_DEL_REY} 
                    alt="Barbería La Casa del Rey" 
                    className="w-full h-full object-cover object-center" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-serif font-bold text-sm text-[#221A14] tracking-tight">BARBERÍA LA CASA DEL REY</span>
              </div>
              <p className="text-xs leading-relaxed text-[#6F5A4B] font-sans">
                Genuina barbería tradicional masculina fundada con honor y oficio. Cortes de cabello de filigrana, afeitados con navaja clásica y toallas calientes aromatizadas.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[#7C571C] text-xs uppercase tracking-wider mb-2 font-mono">HORARIOS DEL SALÓN</h4>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-1.5 text-[#221A14]">
                  <Clock className="w-3.5 h-3.5 text-[#7C571C]" />
                  <span>LUN - SÁB: 09:00 - 19:30</span>
                </li>
                <li className="flex items-center gap-1.5 text-[#6F5A4B]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>DOM & FEST: 10:00 - 16:00</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#7C571C] text-xs uppercase tracking-wider mb-2 font-mono">SEDE TRADICIONAL</h4>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-1.5 text-[#221A14]">
                  <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
                  <span>Cra. 15 # 85-32, Chicó Real, Bogotá</span>
                </li>
                <li className="flex items-center gap-1.5 text-[#221A14]">
                  <Phone className="w-3.5 h-3.5 text-[#7C571C]" />
                  <span>+57 (300) 123-4567</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DFCBB5] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#6F5A4B]">
            <span>© {new Date().getFullYear()} BARBERÍA LA CASA DEL REY • EST. 2016</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#15803D] font-mono text-[9px] bg-[#EBF7EE] px-2 py-0.5 rounded-full border border-[#86EFAC]/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse"></span>
                Servicio Cloud Conectado
              </span>
              <span>•</span>
              <span>TRADICIÓN & ARTE DE BARBERÍA</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
