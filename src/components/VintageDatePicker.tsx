import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Clock, Check } from 'lucide-react';
import { VintageWaxSeal, BarberPoleRibbon } from './VintageBarberIcons';
import { getColombiaDateTime } from '../utils/colombiaTime';

interface VintageDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  label?: string;
  id?: string;
  align?: 'left' | 'right';
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const VintageDatePicker: React.FC<VintageDatePickerProps> = ({
  value,
  onChange,
  minDate,
  label = 'Fecha del Turno',
  id = 'vintage-datepicker',
  align = 'left',
}) => {
  const [desplegado, setDesplegado] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parseFecha = (str?: string) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const fechaSeleccionada = parseFecha(value);
  const [mesVista, setMesVista] = useState<number>(fechaSeleccionada.getMonth());
  const [añoVista, setAñoVista] = useState<number>(fechaSeleccionada.getFullYear());

  // Keep view in sync when value changes externally
  useEffect(() => {
    const f = parseFecha(value);
    setMesVista(f.getMonth());
    setAñoVista(f.getFullYear());
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDesplegado(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDesplegado(false);
    };

    if (desplegado) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [desplegado]);

  const irMesAnterior = () => {
    if (mesVista === 0) {
      setMesVista(11);
      setAñoVista(prev => prev - 1);
    } else {
      setMesVista(prev => prev - 1);
    }
  };

  const irMesSiguiente = () => {
    if (mesVista === 11) {
      setMesVista(0);
      setAñoVista(prev => prev + 1);
    } else {
      setMesVista(prev => prev + 1);
    }
  };

  const formatFechaBonita = (str: string) => {
    if (!str) return 'Selecciona una fecha';
    const d = parseFecha(str);
    return d.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const colNow = getColombiaDateTime();
  const hoyStr = colNow.fecha;

  const minFechaObj = minDate ? parseFecha(minDate) : null;
  if (minFechaObj) {
    minFechaObj.setHours(0, 0, 0, 0);
  }

  // Generate matrix of days for the month view
  const primerDiaMes = new Date(añoVista, mesVista, 1);
  const ultimoDiaMes = new Date(añoVista, mesVista + 1, 0);
  const totalDias = ultimoDiaMes.getDate();

  // Day of week for day 1 (0 = Sunday in JS, convert to 0 = Monday)
  let diaInicioSemana = primerDiaMes.getDay() - 1;
  if (diaInicioSemana === -1) diaInicioSemana = 6; // Sunday is 6

  const diasCeldas: { dia: number; fechaStr: string; esValido: boolean; esHoy: boolean; esSeleccionado: boolean }[] = [];

  for (let i = 1; i <= totalDias; i++) {
    const celdaDate = new Date(añoVista, mesVista, i);
    celdaDate.setHours(0, 0, 0, 0);
    const mStr = (mesVista + 1).toString().padStart(2, '0');
    const dStr = i.toString().padStart(2, '0');
    const fechaStr = `${añoVista}-${mStr}-${dStr}`;

    const esValido = !minFechaObj || celdaDate >= minFechaObj;
    const esHoy = fechaStr === hoyStr;
    const esSeleccionado = fechaStr === value;

    diasCeldas.push({ dia: i, fechaStr, esValido, esHoy, esSeleccionado });
  }

  const seleccionarDia = (fechaStr: string) => {
    onChange(fechaStr);
    setDesplegado(false);
  };

  const seleccionarHoy = () => {
    onChange(hoyStr);
    setDesplegado(false);
  };

  const seleccionarMañana = () => {
    const [y, m, d] = hoyStr.split('-').map(Number);
    const mDate = new Date(y, m - 1, d + 1);
    const mStr = (mDate.getMonth() + 1).toString().padStart(2, '0');
    const diaStr = mDate.getDate().toString().padStart(2, '0');
    onChange(`${mDate.getFullYear()}-${mStr}-${diaStr}`);
    setDesplegado(false);
  };

  return (
    <div ref={containerRef} className="relative font-sans">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-[#7C571C] mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#7C571C]" />
            <span>{label}</span>
          </span>
          <span className="text-[9px] text-[#6F5A4B] font-normal lowercase tracking-normal">
            (clic para calendario)
          </span>
        </label>
      )}

      {/* Trigger Button that displays current selected date and unfolds the calendar */}
      <div className="flex gap-1.5">
        <button
          type="button"
          id={id}
          onClick={() => setDesplegado(!desplegado)}
          className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs transition-all border text-left cursor-pointer shadow-xs ${
            desplegado
              ? 'bg-[#FFF8F5] border-[#7C571C] text-[#221A14] ring-2 ring-[#7C571C]/20 shadow-md'
              : 'bg-[#FFF8F5] border-[#DFCBB5] hover:border-[#7C571C] text-[#221A14]'
          }`}
          aria-expanded={desplegado}
          aria-haspopup="dialog"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#FBEBE1] border border-[#DFCBB5] flex items-center justify-center text-[#7C571C] shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-[#221A14] capitalize block text-xs">
                {formatFechaBonita(value)}
              </span>
              <span className="text-[10px] text-[#6F5A4B] block font-mono">
                {value}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <span className="text-[10px] uppercase font-bold text-[#7C571C] hidden sm:inline-block bg-[#FBEBE1] px-2 py-0.5 rounded-full border border-[#DFCBB5]">
              {desplegado ? 'Cerrar' : 'Desplegar'}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#7C571C] transition-transform duration-200 ${desplegado ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      {/* Hidden fallback native datepicker */}
      <input
        type="date"
        value={value}
        min={minDate}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Desplegable Vintage Calendar Popover */}
      {desplegado && (
        <div 
          className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 z-50 w-[calc(100vw-2.5rem)] max-w-[320px] sm:w-80 bg-[#FFF8F5] border border-[#DFCBB5] rounded-2xl shadow-2xl p-3.5 sm:p-4 font-mono text-xs overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ring-1 ring-[#DFCBB5]`}
        >
          <BarberPoleRibbon className="h-1 -mx-4 -mt-4 mb-3" />

          {/* Header Month / Year with Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DFCBB5]">
            <button
              type="button"
              onClick={irMesAnterior}
              className="p-1.5 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] border border-[#DFCBB5] transition-colors cursor-pointer"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-[#7C571C]" />
            </button>

            <div className="text-center">
              <span className="font-serif font-bold text-sm text-[#221A14] tracking-wide block">
                {MESES[mesVista]} {añoVista}
              </span>
              <span className="text-[9px] text-[#6F5A4B] uppercase tracking-widest font-mono">
                Libro de Turnos
              </span>
            </div>

            <button
              type="button"
              onClick={irMesSiguiente}
              className="p-1.5 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[#221A14] border border-[#DFCBB5] transition-colors cursor-pointer"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4 text-[#7C571C]" />
            </button>
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={seleccionarHoy}
              className="flex-1 py-1 px-2 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[10px] text-[#7C571C] border border-[#DFCBB5] text-center font-bold transition-colors cursor-pointer"
            >
              Hoy ({colNow.dia} {MESES[colNow.mes - 1]?.slice(0, 3) || ''})
            </button>
            <button
              type="button"
              onClick={seleccionarMañana}
              className="flex-1 py-1 px-2 rounded-lg bg-[#FBEBE1] hover:bg-[#F5E5DB] text-[10px] text-[#221A14] border border-[#DFCBB5] text-center transition-colors cursor-pointer font-bold"
            >
              Mañana
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-[#7C571C]">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for month start offset */}
            {Array.from({ length: diaInicioSemana }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-1" />
            ))}

            {/* Actual day cells */}
            {diasCeldas.map(celda => {
              if (!celda.esValido) {
                return (
                  <button
                    key={celda.fechaStr}
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg text-xs font-mono text-[#DFCBB5] opacity-40 cursor-not-allowed bg-transparent"
                  >
                    {celda.dia}
                  </button>
                );
              }

              return (
                <button
                  key={celda.fechaStr}
                  type="button"
                  onClick={() => seleccionarDia(celda.fechaStr)}
                  className={`p-1.5 rounded-lg text-xs font-mono font-bold transition-all relative cursor-pointer ${
                    celda.esSeleccionado
                      ? 'bg-[#7C571C] text-[#FFFFFF] shadow-md font-extrabold scale-105 ring-2 ring-[#7C571C]/30'
                      : celda.esHoy
                      ? 'bg-[#FBEBE1] text-[#7C571C] border border-[#7C571C] hover:bg-[#F5E5DB]'
                      : 'hover:bg-[#FBEBE1] text-[#221A14] border border-transparent hover:border-[#DFCBB5]'
                  }`}
                >
                  {celda.dia}
                  {celda.esHoy && !celda.esSeleccionado && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7C571C]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom indicator */}
          <div className="mt-3 pt-2 border-t border-[#DFCBB5] flex items-center justify-between text-[10px] text-[#6F5A4B]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C571C]" />
              <span className="font-bold text-[#221A14]">Hoy</span>
            </span>
            <button
              type="button"
              onClick={() => setDesplegado(false)}
              className="text-[#7C571C] font-bold hover:underline cursor-pointer"
            >
              Cerrar calendario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
