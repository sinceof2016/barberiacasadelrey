export interface ColombiaDateTimeServer {
  fecha: string;        // 'YYYY-MM-DD'
  hora12: string;       // '08:30 AM'
  hora24: string;       // '08:30'
  hora: number;         // 8
  minutos: number;      // 30
  diaSemana: number;    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  totalMinutos: number; // 8 * 60 + 30 = 510
}

export function getColombiaDateTimeServer(): ColombiaDateTimeServer {
  const now = new Date();
  const optionsFecha: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const optionsHora: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const optionsHora24: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  const optionsDiaSemana: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Bogota',
    weekday: 'short',
  };

  const formateadorFecha = new Intl.DateTimeFormat('en-CA', optionsFecha);
  const fecha = formateadorFecha.format(now);

  const formateadorHora12 = new Intl.DateTimeFormat('en-US', optionsHora);
  const hora12 = formateadorHora12.format(now);

  const formateadorHora24 = new Intl.DateTimeFormat('en-US', optionsHora24);
  const hora24 = formateadorHora24.format(now);

  const partes24 = hora24.split(':');
  const horaNum = parseInt(partes24[0], 10) || 0;
  const minNum = parseInt(partes24[1], 10) || 0;

  const diaMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    Dom: 0, Lun: 1, Mar: 2, Mié: 3, Jue: 4, Vie: 5, Sáb: 6,
  };
  const diaStr = new Intl.DateTimeFormat('en-US', optionsDiaSemana).format(now);
  const diaSemana = diaMap[diaStr] !== undefined ? diaMap[diaStr] : now.getDay();

  return {
    fecha,
    hora12,
    hora24,
    hora: horaNum,
    minutos: minNum,
    diaSemana,
    totalMinutos: horaNum * 60 + minNum,
  };
}

export function normalizarHora(horaStr: string): { hora12: string; hora24: string } {
  const clean = horaStr.trim().toUpperCase();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = match12[3];
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const h24 = h.toString().padStart(2, '0');
    return {
      hora12: `${match12[1].padStart(2, '0')}:${m} ${ampm}`,
      hora24: `${h24}:${m}`
    };
  }

  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = match24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      hora12: `${h12.toString().padStart(2, '0')}:${m} ${ampm}`,
      hora24: `${h.toString().padStart(2, '0')}:${m}`
    };
  }

  return { hora12: clean, hora24: clean };
}

export function parseSlotToMinutesServer(slot: string): number {
  const norm = normalizarHora(slot);
  const [hStr, mStr] = norm.hora24.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}
