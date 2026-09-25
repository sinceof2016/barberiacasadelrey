import React, { useState } from 'react';
import { Servicio } from '../types';
import { 
  Sparkles, 
  Clock, 
  Check, 
  Plus, 
  ShieldCheck, 
  ArrowRight,
  Coffee,
  Scissors,
  Flame,
  Droplet
} from 'lucide-react';
import { HERITAGE_BANNER_MASTER } from '../utils/assets';

interface ServiceCatalogProps {
  servicios: Servicio[];
  onSelectServicio: (servicioId: number) => void;
  selectedServiceId?: number | null;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  servicios,
  onSelectServicio,
  selectedServiceId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [selectedIds, setSelectedIds] = useState<number[]>(
    selectedServiceId ? [selectedServiceId] : []
  );

  const formatPrecio = (precio: number) => {
    // Si el precio viene en miles (ej. 45000 COP) o en USD (ej. 45)
    if (precio >= 1000) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(precio);
    }
    return `$${precio.toFixed(2)}`;
  };

  const getServicePerk = (s: Servicio) => {
    const nombre = s.nombre.toLowerCase();
    if (nombre.includes('ritual') || nombre.includes('maestro') || nombre.includes('combo') || nombre.includes('triada')) {
      return { icon: <Coffee className="w-4 h-4 text-[#7C571C]" />, text: 'Bebida premium incluida' };
    }
    if (nombre.includes('afeitado') || nombre.includes('vapor')) {
      return { icon: <Flame className="w-4 h-4 text-[#7C571C]" />, text: 'Toallas dobles de vapor' };
    }
    if (nombre.includes('barba') || nombre.includes('bigote')) {
      return { icon: <Droplet className="w-4 h-4 text-[#7C571C]" />, text: 'Aceite revitalizante y masaje' };
    }
    return { icon: <Scissors className="w-4 h-4 text-[#7C571C]" />, text: 'Acabado con pomada artesanal' };
  };

  const getServiceTag = (s: Servicio) => {
    const nombre = s.nombre.toLowerCase();
    if (nombre.includes('ritual') || nombre.includes('maestro') || s.id === 3) {
      return { label: '★ RECOMENDADO DE LA CASA', isPrimary: true };
    }
    if (nombre.includes('combo') || nombre.includes('triada')) {
      return { label: 'COMBOS ESPECIALES', isPrimary: false };
    }
    if (nombre.includes('barba') || nombre.includes('bigote')) {
      return { label: 'BARBA & BIGOTE', isPrimary: false };
    }
    if (nombre.includes('afeitado')) {
      return { label: 'AFEITADO CLÁSICO', isPrimary: false };
    }
    return { label: 'CORTE DE CABELLO', isPrimary: false };
  };

  const categories = [
    'Todos',
    'Corte de Cabello',
    'Afeitado Clásico',
    'Barba & Bigote',
    'Combos Especiales',
  ];

  const filteredServices = servicios.filter((s) => {
    if (activeCategory === 'Todos') return true;
    const nombre = s.nombre.toLowerCase();
    if (activeCategory === 'Corte de Cabello') {
      return nombre.includes('corte') && !nombre.includes('combo') && !nombre.includes('triada');
    }
    if (activeCategory === 'Afeitado Clásico') {
      return nombre.includes('afeitado') || nombre.includes('barba');
    }
    if (activeCategory === 'Barba & Bigote') {
      return nombre.includes('barba') || nombre.includes('bigote');
    }
    if (activeCategory === 'Combos Especiales') {
      return nombre.includes('combo') || nombre.includes('ritual') || nombre.includes('triada') || s.id === 3;
    }
    return true;
  });

  const toggleSelect = (serviceId: number) => {
    if (selectedIds.includes(serviceId)) {
      setSelectedIds(selectedIds.filter((id) => id !== serviceId));
    } else {
      setSelectedIds([serviceId]); // Single selection for booking flow
    }
  };

  const selectedCount = selectedIds.length;
  const selectedTotal = servicios
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.precio, 0);

  const handleContinue = () => {
    if (selectedIds.length > 0) {
      onSelectServicio(selectedIds[0]);
    } else if (servicios.length > 0) {
      onSelectServicio(servicios[0].id);
    }
  };

  return (
    <div id="seccion-servicios" className="w-full pb-24 scroll-mt-20">
      {/* 1. Header Section */}
      <section className="text-center pt-2 pb-6 px-4">
        <div className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase font-semibold text-[#7C571C] mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#C49756]" />
          <span>TRADICIÓN BARBERO DESDE 2016</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#221A14] font-bold tracking-tight mb-2">
          Cuidado Tradicional & Estilo Clásico
        </h1>
        <p className="text-sm sm:text-base text-[#4F4539] max-w-xl mx-auto font-sans leading-relaxed">
          Técnicas centenarias, toallas aromáticas al vapor y la serenidad de una pausa bien merecida.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-[#C49756]/70">
          <span className="w-8 h-px bg-[#DFCBB5]" />
          <span className="text-xs">❖</span>
          <span className="w-8 h-px bg-[#DFCBB5]" />
        </div>
      </section>

      {/* 2. Hero Visual Asset Card */}
      <section className="px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#DFCBB5] aspect-[16/8] sm:aspect-[21/9]">
          <img
            src={HERITAGE_BANNER_MASTER}
            alt="Maestros Afeitadores Barbería Tradicional"
            className="w-full h-full object-cover object-center transform scale-102 transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#221A14]/85 via-[#221A14]/30 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[#FEeee3]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#221A14]/80 backdrop-blur-md text-[#FEeee3] text-xs font-medium rounded-full border border-[#DFCBB5]/30 flex items-center gap-1.5 shadow-sm">
                <span className="text-[#C49756]">★</span> Maestros Afeitadores • Navaja de Acero Damasco
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Filter Pills */}
      <section className="px-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7C571C] text-[#FFFFFF] shadow-sm font-semibold'
                    : 'bg-[#FBEBE1] text-[#4F4539] hover:bg-[#F5E5DB] hover:text-[#221A14] border border-[#DFCBB5]/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Services List */}
      <section className="px-4 space-y-4">
        {filteredServices.length === 0 ? (
          <div className="bg-[#FFF1E9] rounded-2xl p-8 text-center border border-[#DFCBB5]">
            <p className="text-[#4F4539] text-sm">No se encontraron servicios en esta categoría.</p>
          </div>
        ) : (
          filteredServices.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            const tag = getServiceTag(s);
            const perk = getServicePerk(s);

            return (
              <div
                key={s.id}
                id={`service-card-${s.id}`}
                className={`gsap-expand-card p-5 rounded-2xl border transition-all duration-200 bg-[#FFF1E9] relative ${
                  isSelected
                    ? 'border-[#7C571C] ring-2 ring-[#7C571C]/20 shadow-md'
                    : 'border-[#DFCBB5] hover:border-[#C49756]/60 shadow-sm'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      tag.isPrimary
                        ? 'bg-[#7C571C]/10 text-[#7C571C] border border-[#7C571C]/20'
                        : 'bg-[#FBEBE1] text-[#6F5A4B]'
                    }`}
                  >
                    {tag.label}
                  </span>
                  <span className="text-xs text-[#6F5A4B] font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C49756]" />
                    {s.duracionMinutos} min
                  </span>
                </div>

                {/* Title & Price */}
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-serif text-lg font-bold text-[#221A14] tracking-tight">
                    {s.nombre}
                  </h3>
                  <span className="text-lg font-serif font-bold text-[#7C571C] ml-3 shrink-0">
                    {formatPrecio(s.precio)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#4F4539] leading-relaxed mb-4 font-sans">
                  {s.descripcion ||
                    'Experiencia tradicional de corte y cuidado facial con toallas aromatizadas y productos de origen botánico.'}
                </p>

                {/* Perk highlight & CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-[#DFCBB5]/50 gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#6F5A4B]">
                    {perk.icon}
                    <span>{perk.text}</span>
                  </div>

                  <button
                    id={`btn-select-catalog-${s.id}`}
                    onClick={() => {
                      toggleSelect(s.id);
                      onSelectServicio(s.id);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#382F28] text-[#FEEEE3] shadow'
                        : 'bg-[#FBEBE1] text-[#7C571C] hover:bg-[#7C571C] hover:text-[#FFFFFF] border border-[#DFCBB5]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Agregado</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 5. Warranty Card */}
      <section className="px-4 mt-6">
        <div className="p-4 rounded-2xl bg-[#FBEBE1] border border-[#DFCBB5] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FFF1E9] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#221A14] font-serif mb-1">
              Garantía La Casa del Rey
            </h4>
            <p className="text-xs text-[#4F4539] leading-relaxed font-sans">
              Si tu experiencia no alcanza la perfección esperada, la próxima sesión es cortesía de la casa.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Sticky Floating Summary Docket (When at least 1 service is selected) */}
      {selectedCount > 0 && (
        <div 
          id="summary-floating-docket"
          className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-[#382F28] text-[#FEEEE3] p-3.5 rounded-2xl shadow-xl border border-[#DFCBB5]/30 flex items-center justify-between backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div>
            <div className="text-[10px] tracking-wider uppercase text-[#C49756] font-mono font-bold">
              TU RESERVA
            </div>
            <div className="text-xs text-[#FEEEE3]">
              {selectedCount} servicio seleccionado ({formatPrecio(selectedTotal)})
            </div>
          </div>

          <button
            id="btn-continue-reservation"
            onClick={handleContinue}
            className="px-4 py-2 bg-[#C49756] hover:bg-[#D4A766] text-[#221A14] font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>CONTINUAR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
