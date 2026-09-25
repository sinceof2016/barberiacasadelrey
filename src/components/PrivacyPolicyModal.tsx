import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Scale, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Printer, 
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { VintageCrownIcon, BarberPoleRibbon, StraightRazorIcon } from './VintageBarberIcons';
import { LOGO_CASA_DEL_REY } from '../utils/assets';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [seccionActiva, setSeccionActiva] = useState<string>('marco');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#221A14]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-[#FFF8F5] border-2 border-[#C49756] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative font-sans text-[#221A14]">
        {/* Cinta Vintage Superior */}
        <div className="h-2 w-full overflow-hidden shrink-0">
          <BarberPoleRibbon className="w-full h-full" />
        </div>

        {/* Encabezado del Modal */}
        <div className="p-5 sm:p-6 border-b border-[#DFCBB5] bg-[#FBEBE1] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] border border-[#C49756] flex items-center justify-center p-1 shadow-sm shrink-0">
              <img 
                src={LOGO_CASA_DEL_REY} 
                alt="La Casa del Rey" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#221A14] uppercase tracking-wide">
                  Política de Tratamiento de Datos Personales
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
                  Ley 1581 de 2012 • Colombia
                </span>
              </div>
              <p className="text-xs text-[#6F5A4B] mt-0.5">
                Barbería La Casa del Rey S.A.S. • Habeas Data & Transparencia Institucional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2EAE1] text-[#7C571C] border border-[#DFCBB5] transition-colors cursor-pointer"
              title="Imprimir política"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F2EAE1] text-[#6F5A4B] hover:text-[#221A14] border border-[#DFCBB5] transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido con Navegación Lateral / Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs text-[#4F4539] leading-relaxed">
          {/* Banner de Compromiso y Resumen Ejecutivo */}
          <div className="bg-[#FFFFFF] border border-[#DFCBB5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#7C571C] font-serif font-bold text-sm">
              <Scale className="w-4 h-4" />
              <span>Declaración de Cumplimiento Normativo (República de Colombia)</span>
            </div>
            <p className="text-xs text-[#6F5A4B]">
              En cumplimiento del <strong className="text-[#221A14]">Artículo 15 de la Constitución Política de Colombia</strong>, la <strong className="text-[#221A14]">Ley Estatutaria 1581 de 2012</strong>, el <strong className="text-[#221A14]">Decreto Reglamentario 1377 de 2013</strong> y las directrices de la <strong className="text-[#221A14]">Superintendencia de Industria y Comercio (SIC)</strong>, Barbería La Casa del Rey adopta la presente Política para garantizar la debida custodia, confidencialidad y libre ejercicio de los derechos de Habeas Data de todos nuestros clientes, visitantes y personal.
            </p>
          </div>

          {/* 1. Responsable del Tratamiento */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase tracking-wide flex items-center gap-2 border-b border-[#DFCBB5] pb-1.5">
              <Building2 className="w-4 h-4 text-[#7C571C]" />
              <span>1. Identificación del Responsable del Tratamiento</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5]">
              <div>
                <span className="text-[10px] text-[#8C7667] font-bold uppercase block">Razón Comercial / Titular:</span>
                <span className="font-bold text-[#221A14]">Barbería La Casa del Rey S.A.S.</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7667] font-bold uppercase block">NIT / Registro Mercantil:</span>
                <span className="font-mono text-[#221A14]">901.842.610-4 (Cámara de Comercio de Bogotá)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7667] font-bold uppercase block">Domicilio Principal:</span>
                <span className="text-[#221A14]">Bogotá D.C., Colombia</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7667] font-bold uppercase block">Canal Exclusivo de Privacidad:</span>
                <span className="font-mono text-[#7C571C] font-bold">privacidad@casadelrey.com</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[#F2EAE1] flex flex-wrap items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
                  <strong>Sede Chicó:</strong> Cl. 93 # 13-45
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
                  <strong>Sede Usaquén:</strong> Cra. 6 # 119-32
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#7C571C]" />
                  <strong>Sede Chapinero:</strong> Cl. 67 # 5-20
                </span>
              </div>
            </div>
          </div>

          {/* 2. Finalidades del Tratamiento */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase tracking-wide flex items-center gap-2 border-b border-[#DFCBB5] pb-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#7C571C]" />
              <span>2. Finalidades del Tratamiento de Datos</span>
            </h3>
            <p className="text-xs text-[#6F5A4B]">
              Los datos personales recolectados a través de nuestro sitio web, reservas en línea y terminales de caja serán tratados con las siguientes finalidades legítimas:
            </p>
            <ul className="space-y-2 bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C] mt-1.5 shrink-0" />
                <span><strong>Gestión de Reservas & Citas:</strong> Agendamiento, confirmación, recordatorio por WhatsApp o SMS, y reprogramación de turnos con los maestros barberos seleccionados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C] mt-1.5 shrink-0" />
                <span><strong>Prestación del Servicio Tradicional:</strong> Registro de preferencias de corte, diseño de barba y cuidados capilares para ofrecer una atención a la medida.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C] mt-1.5 shrink-0" />
                <span><strong>Facturación & Cobro:</strong> Emisión de facturas electrónicas, recibos de caja y control contable conforme al Estatuto Tributario colombiano.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C] mt-1.5 shrink-0" />
                <span><strong>Seguridad & Auditoría:</strong> Prevención de accesos no autorizados, protección contra ataques de fuerza bruta y preservación de registros en Bóveda Cifrada.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C571C] mt-1.5 shrink-0" />
                <span><strong>Cero Venta a Terceros:</strong> Barbería La Casa del Rey <strong className="text-[#991B1B]">NUNCA</strong> vende, alquila ni cede bases de datos de clientes a empresas externas de publicidad.</span>
              </li>
            </ul>
          </div>

          {/* 3. Derechos de los Titulares (Derechos ARCO) */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase tracking-wide flex items-center gap-2 border-b border-[#DFCBB5] pb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#7C571C]" />
              <span>3. Derechos del Titular de la Información (Habeas Data)</span>
            </h3>
            <p className="text-xs text-[#6F5A4B]">
              Conforme al Artículo 8 de la Ley 1581 de 2012, tú como cliente o titular posees los siguientes derechos fundamentales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5]">
                <strong className="text-[#221A14] block text-[11px] mb-1">A. Conocer, Actualizar y Rectificar</strong>
                <p className="text-[11px] text-[#6F5A4B]">Acceder a tus datos y solicitar correcciones si están incompletos, inexactos o desactualizados.</p>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5]">
                <strong className="text-[#221A14] block text-[11px] mb-1">B. Solicitar Prueba de Autorización</strong>
                <p className="text-[11px] text-[#6F5A4B]">Obtener copia de la aceptación otorgada al momento de agendar tu cita.</p>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5]">
                <strong className="text-[#221A14] block text-[11px] mb-1">C. Revocar Consentimiento o Supresión</strong>
                <p className="text-[11px] text-[#6F5A4B]">Solicitar la eliminación total de tus datos cuando no exista obligación legal o tributaria de conservarlos.</p>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5]">
                <strong className="text-[#221A14] block text-[11px] mb-1">D. Acudir ante la SIC</strong>
                <p className="text-[11px] text-[#6F5A4B]">Presentar quejas ante la Superintendencia de Industria y Comercio en caso de vulneración a tus derechos.</p>
              </div>
            </div>
          </div>

          {/* 4. Procedimiento de Consultas y Reclamos (PQRS) */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase tracking-wide flex items-center gap-2 border-b border-[#DFCBB5] pb-1.5">
              <Mail className="w-4 h-4 text-[#7C571C]" />
              <span>4. Canales de Atención y Tiempos de Respuesta Legales</span>
            </h3>
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DFCBB5] space-y-3">
              <p className="text-xs text-[#6F5A4B]">
                Para ejercer tus derechos de acceso, consulta o eliminación de datos, puedes radicar tu solicitud por cualquiera de estos medios oficiales:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#FBEBE1] rounded-lg border border-[#DFCBB5]">
                  <strong className="text-[#7C571C] block mb-0.5">📧 Vía Correo Electrónico:</strong>
                  <span className="font-mono text-[#221A14]">privacidad@casadelrey.com</span>
                  <p className="text-[10px] text-[#6F5A4B] mt-1">Asunto: "Ejercicio Derechos Habeas Data - [Tu Nombre]"</p>
                </div>
                <div className="p-3 bg-[#FBEBE1] rounded-lg border border-[#DFCBB5]">
                  <strong className="text-[#7C571C] block mb-0.5">🏢 Presencial en Sedes:</strong>
                  <span className="text-[#221A14]">En recepción de Chicó, Usaquén o Chapinero</span>
                  <p className="text-[10px] text-[#6F5A4B] mt-1">Con presentación de documento de identidad.</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#F2EAE1] space-y-1 text-[11px]">
                <p><strong>⏱️ Plazo para Consultas:</strong> Máximo diez (10) días hábiles contados a partir de la fecha de recibo.</p>
                <p><strong>⏱️ Plazo para Reclamos y Supresión:</strong> Máximo quince (15) días hábiles contados a partir de la radicación.</p>
              </div>
            </div>
          </div>

          {/* 5. Criptografía y Seguridad Técnica */}
          <div className="space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#221A14] uppercase tracking-wide flex items-center gap-2 border-b border-[#DFCBB5] pb-1.5">
              <Lock className="w-4 h-4 text-[#7C571C]" />
              <span>5. Medidas de Seguridad de la Información</span>
            </h3>
            <p className="text-xs text-[#6F5A4B]">
              Barbería La Casa del Rey implementa estándares internacionales de seguridad de la información:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] text-center space-y-1">
                <span className="font-bold text-[#7C571C] block">AES-256-GCM</span>
                <span className="text-[10px] text-[#6F5A4B]">Cifrado militar en reposo de teléfonos y notas privadas.</span>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] text-center space-y-1">
                <span className="font-bold text-[#7C571C] block">TLS 1.3 / HTTPS</span>
                <span className="text-[10px] text-[#6F5A4B]">Canal de transmisión encriptado de extremo a extremo.</span>
              </div>
              <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#DFCBB5] text-center space-y-1">
                <span className="font-bold text-[#7C571C] block">Respaldo Cloud 24H</span>
                <span className="text-[10px] text-[#6F5A4B]">Snapshots automáticos diarios en Google Cloud Storage.</span>
              </div>
            </div>
          </div>

          {/* 6. Vigencia */}
          <div className="bg-[#FBEBE1] p-4 rounded-xl border border-[#DFCBB5] text-[11px] text-[#6F5A4B] space-y-1">
            <p><strong>📅 Vigencia y Modificaciones:</strong> La presente Política de Privacidad rige a partir del 1 de septiembre de 2026 y permanecerá vigente mientras sea necesario para cumplir las finalidades descritas o los plazos legales de conservación fiscal y comercial.</p>
            <p className="text-[10px] text-[#8C7667]">Última actualización de auditoría: Septiembre de 2026 • Barbería La Casa del Rey.</p>
          </div>
        </div>

        {/* Pie de Acción del Modal */}
        <div className="p-4 sm:p-5 border-t border-[#DFCBB5] bg-[#FFFFFF] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#6F5A4B]">
            <Sparkles className="w-3.5 h-3.5 text-[#C49756]" />
            <span>Tus datos son custodiados con honor y respeto en La Casa del Rey.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#7C571C] hover:bg-[#634516] text-[#FAF6EE] font-bold rounded-xl transition-all shadow-md active:scale-98 uppercase tracking-wider text-xs cursor-pointer font-mono"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
