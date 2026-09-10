import React from 'react';
import { Calendar, AlertTriangle, Check, X, Clock, MapPin, Trash2, CalendarPlus } from 'lucide-react';

export type CalendarActionType = 'create' | 'delete' | 'sync_all';

interface CalendarConfirmDialogProps {
  isOpen: boolean;
  actionType: CalendarActionType;
  title: string;
  description: string;
  itemSummary?: string;
  dateStr?: string;
  timeStr?: string;
  location?: string;
  itemsCount?: number;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CalendarConfirmDialog: React.FC<CalendarConfirmDialogProps> = ({
  isOpen,
  actionType,
  title,
  description,
  itemSummary,
  dateStr,
  timeStr,
  location = 'Barbería La Casa del Rey - Cra. 15 # 85-32, Bogotá',
  itemsCount,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDestructive = actionType === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#1C1512] border border-[#3D2E26] rounded-2xl p-5 sm:p-6 shadow-2xl text-[#FAF6EE] relative"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isDestructive 
              ? 'bg-[#3A1818] border-[#EF4444]/40 text-[#EF4444]' 
              : 'bg-[#2A2019] border-[#C59B27]/40 text-[#C59B27]'
          }`}>
            {isDestructive ? (
              <Trash2 className="w-5 h-5" />
            ) : actionType === 'sync_all' ? (
              <Calendar className="w-5 h-5" />
            ) : (
              <CalendarPlus className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold font-royal text-[#FAF6EE] leading-tight">
              {title}
            </h3>
            <p className="text-xs text-[#A8988B] mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#8A796D] hover:text-[#FAF6EE] p-1 rounded-lg hover:bg-[#2A1E18] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Card */}
        <div className="bg-[#120E0C] border border-[#2D221D] rounded-xl p-3.5 space-y-2 mb-5 text-xs font-mono">
          {itemSummary && (
            <div className="flex items-start gap-2">
              <span className="text-[#8A796D] uppercase text-[10px] w-18 shrink-0">Evento:</span>
              <span className="text-[#FAF6EE] font-medium leading-tight">{itemSummary}</span>
            </div>
          )}

          {dateStr && (
            <div className="flex items-center gap-2">
              <span className="text-[#8A796D] uppercase text-[10px] w-18 shrink-0">Fecha:</span>
              <div className="flex items-center gap-1.5 text-[#E5B869]">
                <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>{dateStr} {timeStr ? `• ${timeStr}` : ''}</span>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-start gap-2">
              <span className="text-[#8A796D] uppercase text-[10px] w-18 shrink-0">Lugar:</span>
              <div className="flex items-center gap-1.5 text-[#BDB2A7]">
                <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          )}

          {itemsCount !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[#8A796D] uppercase text-[10px] w-18 shrink-0">Cantidad:</span>
              <span className="text-[#FAF6EE] font-bold">{itemsCount} turno(s) a sincronizar</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#261B16] flex items-center gap-1.5 text-[10px] text-[#A8988B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
            <span>Calendario Principal de Google (@gmail.com)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            id="btn-cancel-calendar-action"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-[#261B16] hover:bg-[#33241E] text-[#BDB2A7] hover:text-[#FAF6EE] text-xs font-mono transition-colors border border-[#3D2E26]"
          >
            Cancelar
          </button>
          
          <button
            id="btn-confirm-calendar-action"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg ${
              isDestructive
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-red-950/40'
                : 'bg-[#C59B27] hover:bg-[#D4A373] text-[#120E0C] shadow-amber-950/40'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : isDestructive ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Evento</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar y Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
