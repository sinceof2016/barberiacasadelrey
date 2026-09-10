import { useState, useEffect } from 'react';
import { RelojColombiaInfo, Cita, Barbero } from '../types';

/**
 * Utilidades para sincronización horaria con Colombia (Zona Horaria America/Bogota UTC-5).
 * Colombia no utiliza horario de verano, por lo que UTC-5 es constante todo el año.
 */

export interface ColombiaDateTimeResult {
  fecha: string; // YYYY-MM-DD
  hora24: string; // HH:mm
  hora12: string; // hh:mm AM/PM
  horaCompleta: string; // hh:mm:ss AM/PM
  totalMinutos: number; // minutos desde medianoche (0..1439)
  año: number;
  mes: number; // 1-12
  dia: number; // 1-31
  fechaTexto: string; // Ej: "Sábado, 5 de Septiembre de 2026"
  zona: string;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export function getColombiaDateTime(dateInput: Date = new Date()): ColombiaDateTimeResult {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  });

  const parts = formatter.formatToParts(dateInput);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const yearStr = getPart('year');
  const monthStr = getPart('month');
  const dayStr = getPart('day');
  const hourStr = getPart('hour');
  const minuteStr = getPart('minute');
  const secondStr = getPart('second');

  const año = parseInt(yearStr, 10);
  const mes = parseInt(monthStr, 10);
  const dia = parseInt(dayStr, 10);
  const hour24Num = parseInt(hourStr, 10);
  const minuteNum = parseInt(minuteStr, 10);
  const secondNum = parseInt(secondStr, 10);

  const fecha = `${yearStr}-${monthStr}-${dayStr}`;
  const hora24 = `${hourStr}:${minuteStr}`;
  const totalMinutos = hour24Num * 60 + minuteNum;

  // Formato 12 horas
  const ampm = hour24Num >= 12 ? 'PM' : 'AM';
  const hour12Num = hour24Num % 12 || 12;
  const hour12Str = String(hour12Num).padStart(2, '0');
  const hora12 = `${hour12Str}:${minuteStr} ${ampm}`;
  const horaCompleta = `${hour12Str}:${minuteStr}:${secondStr} ${ampm}`;

  // Nombre del día en español usando fecha local simulada
  const dateObj = new Date(año, mes - 1, dia);
  const diaSemana = DIAS_ES[dateObj.getDay()] || '';
  const nombreMes = MESES_ES[mes - 1] || '';
  const fechaTexto = `${diaSemana}, ${dia} de ${nombreMes} de ${año}`;

  return {
    fecha,
    hora24,
    hora12,
    horaCompleta,
    totalMinutos,
    año,
    mes,
    dia,
    fechaTexto,
    zona: 'America/Bogota (UTC-5)'
  };
}

/**
 * Convierte cualquier string de hora (ej: "09:00 AM", "01:30 PM", "14:30") a minutos del día.
 */
export function parseSlotToMinutes(horaStr: string): number {
  if (!horaStr) return 0;
  const clean = horaStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const nums = clean.replace(/[^\d:]/g, '');
  const [hhStr, mmStr = '0'] = nums.split(':');
  let hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;

  if (isPM && hh < 12) hh += 12;
  if (isAM && hh === 12) hh = 0;

  return hh * 60 + mm;
}

/**
 * Determina si una fecha y horario ya transcurrió según el reloj oficial de Colombia.
 */
export function isSlotPassedInColombia(slotHora: string, fechaSeleccionada: string): boolean {
  if (!fechaSeleccionada || !slotHora) return false;
  const colTime = getColombiaDateTime();

  // Si la fecha es anterior a hoy en Colombia, ya pasó
  if (fechaSeleccionada < colTime.fecha) {
    return true;
  }

  // Si la fecha es posterior a hoy en Colombia, no ha pasado
  if (fechaSeleccionada > colTime.fecha) {
    return false;
  }

  // Si es hoy, comparar minutos transcurridos
  const slotMin = parseSlotToMinutes(slotHora);
  return slotMin <= colTime.totalMinutos;
}

/**
 * Hook de React para mantener un reloj en vivo sincronizado con Colombia.
 */
export function useColombiaClock() {
  const [colTime, setColTime] = useState<ColombiaDateTimeResult>(() => getColombiaDateTime());

  useEffect(() => {
    // Actualizar cada segundo para sincronización precisa
    const timer = setInterval(() => {
      setColTime(getColombiaDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return colTime;
}

export const HORARIOS_CONFIG_12H = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM'
];

export interface ResumenDisponibilidadHoy {
  fecha: string;
  totalBarberos: number;
  totalSlotsDia: number;
  totalCuposDia: number;
  slotsPasados: number;
  slotsRestantesHoy: number;
  cuposRestantesHoy: number;
  cuposDisponiblesHoy: number;
  franjasDisponiblesHoy: number;
  citasHoyPendientes: number;
  citasHoyPasadas: number;
  citasHoyTotal: number;
  estaCerradoHoy: boolean;
}

/**
 * Calcula en tiempo real la cantidad de cupos y horarios disponibles para hoy
 * cruzando los horarios configurados, los turnos ya reservados y el reloj oficial de Colombia.
 * NO tiene en cuenta los turnos que ya pasaron de la hora actual.
 */
export function calcularDisponibilidadHoy(
  citas: Cita[],
  barberos: Barbero[],
  colTime: ColombiaDateTimeResult = getColombiaDateTime()
): ResumenDisponibilidadHoy {
  const fechaHoy = colTime.fecha;
  const barberosCount = barberos && barberos.length > 0 ? barberos.length : 2;
  const citasHoy = (citas || []).filter(c => c.fecha === fechaHoy && c.estado !== 'Cancelada');

  // Separar citas: NO tener en cuenta las citas cuya hora ya transcurrió en Colombia
  const citasHoyPendientes = citasHoy.filter(c => {
    const slotMin = parseSlotToMinutes(c.hora);
    return slotMin > colTime.totalMinutos;
  });

  const citasHoyPasadas = citasHoy.filter(c => {
    const slotMin = parseSlotToMinutes(c.hora);
    return slotMin <= colTime.totalMinutos;
  });

  let cuposDisponiblesHoy = 0;
  let franjasDisponiblesHoy = 0;
  let slotsPasados = 0;

  HORARIOS_CONFIG_12H.forEach(hora12 => {
    const slotMinutos = parseSlotToMinutes(hora12);
    // Excluir estrictamente las franjas horarias que ya pasaron de la hora actual
    const esPasado = slotMinutos <= colTime.totalMinutos;

    if (esPasado) {
      slotsPasados++;
      return;
    }

    // Buscar citas confirmadas en este horario futuro (solo pendientes, nunca pasadas)
    const citasEnSlot = citasHoyPendientes.filter(c => {
      const clean = (c.hora || '').trim().toUpperCase();
      // Comparar tanto en formato 12H como si tuviera ceros a la izquierda
      return clean === hora12 || clean.replace(/^0/, '') === hora12.replace(/^0/, '');
    });

    let sillasOcupadas = 0;
    citasEnSlot.forEach(c => {
      if (c.tipo === 'Grupal') {
        sillasOcupadas += c.totalPersonas || c.detalles?.length || 1;
      } else {
        sillasOcupadas += 1;
      }
    });

    const cuposLibresEnSlot = Math.max(0, barberosCount - sillasOcupadas);
    if (cuposLibresEnSlot > 0) {
      franjasDisponiblesHoy++;
      cuposDisponiblesHoy += cuposLibresEnSlot;
    }
  });

  const slotsRestantesHoy = Math.max(0, HORARIOS_CONFIG_12H.length - slotsPasados);
  const cuposRestantesHoy = slotsRestantesHoy * barberosCount;

  return {
    fecha: fechaHoy,
    totalBarberos: barberosCount,
    totalSlotsDia: HORARIOS_CONFIG_12H.length,
    totalCuposDia: HORARIOS_CONFIG_12H.length * barberosCount,
    slotsPasados,
    slotsRestantesHoy,
    cuposRestantesHoy,
    cuposDisponiblesHoy,
    franjasDisponiblesHoy,
    citasHoyPendientes: citasHoyPendientes.length,
    citasHoyPasadas: citasHoyPasadas.length,
    citasHoyTotal: citasHoy.length,
    estaCerradoHoy: colTime.totalMinutos >= parseSlotToMinutes('07:00 PM')
  };
}
