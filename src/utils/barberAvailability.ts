import { 
  Barbero, 
  Cita, 
  HorarioSlot, 
  DisponibilidadResponse, 
  TipoBloqueoSlot,
  CalendarioBarbero
} from '../types';
import { HORARIOS_CONFIG, DIAS_SEMANA_NOMBRES, serviciosCasaDelRey } from '../services/localData';
import { parseSlotToMinutes, getColombiaDateTime } from './colombiaTime';

/**
 * Obtiene el índice del día de la semana (0: Domingo, 1: Lunes, ..., 6: Sábado)
 * asegurando que no sufra desfaces por zona horaria.
 */
export function getDiaSemana(fechaStr: string): number {
  if (!fechaStr) return 0;
  const [y, m, d] = fechaStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.getDay();
}

/**
 * Retorna el nombre en español del día de la semana (0 = Domingo)
 */
export function getNombreDia(dia: number): string {
  return DIAS_SEMANA_NOMBRES[dia] || 'Desconocido';
}

/**
 * Retorna una descripción legible de los días laborales de un barbero
 * Ej: [1, 2, 3, 4, 5] -> "Lunes a Viernes"
 */
export function getDiasLaboralesTexto(dias: number[] = [1, 2, 3, 4, 5, 6]): string {
  if (!dias || dias.length === 0) return 'Sin horario asignado';
  if (dias.length === 7) return 'Lunes a Domingo (Todos los días)';
  
  const sorted = [...dias].sort((a, b) => a - b);
  const nombres = sorted.map(d => DIAS_SEMANA_NOMBRES[d]);

  // Patrones habituales
  if (dias.length === 5 && dias.includes(1) && dias.includes(2) && dias.includes(3) && dias.includes(4) && dias.includes(5)) {
    return 'Lunes a Viernes';
  }
  if (dias.length === 5 && dias.includes(2) && dias.includes(3) && dias.includes(4) && dias.includes(5) && dias.includes(6)) {
    return 'Martes a Sábado';
  }
  if (dias.length === 6 && !dias.includes(0)) {
    return 'Lunes a Sábado';
  }
  if (dias.length === 6 && !dias.includes(1)) {
    return 'Martes a Domingo';
  }
  if (dias.length === 5 && dias.includes(0) && dias.includes(3) && dias.includes(4) && dias.includes(5) && dias.includes(6)) {
    return 'Miércoles a Domingo';
  }

  return nombres.join(', ');
}

/**
 * Retorna una descripción legible de los días de descanso de un barbero
 * Ej: [0, 6] -> "Sábados y Domingos"
 */
export function getDiasDescansoTexto(dias: number[] = [0]): string {
  if (!dias || dias.length === 0) return 'Sin días de descanso';
  const nombres = dias.map(d => DIAS_SEMANA_NOMBRES[d]);
  if (nombres.length === 1) return nombres[0];
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return nombres.join(', ');
}

/**
 * Verifica si un barbero está programado para laborar en una fecha específica
 */
export function isBarberoLaborandoEnFecha(
  barbero: Barbero, 
  fechaStr: string
): { labora: boolean; motivoNoLabora?: string; diaSemana: number; diaSemanaNombre: string } {
  const diaSemana = getDiaSemana(fechaStr);
  const diaSemanaNombre = getNombreDia(diaSemana);

  // Días laborales configurados en su calendario
  const diasLaborales = barbero.diasLaborales || barbero.calendario?.diasLaborales || [1, 2, 3, 4, 5, 6];
  const diasDescanso = barbero.diasDescanso || barbero.calendario?.diasDescanso || [0];

  // 1. Revisar si es día de descanso semanal
  if (diasDescanso.includes(diaSemana) || !diasLaborales.includes(diaSemana)) {
    return {
      labora: false,
      motivoNoLabora: `${barbero.nombre} no labora los ${diaSemanaNombre}s (Día de descanso programado).`,
      diaSemana,
      diaSemanaNombre
    };
  }

  // 2. Revisar excepciones específicas del calendario (vacaciones, permisos)
  const excepciones = barbero.calendario?.excepciones || [];
  const excepcionHoy = excepciones.find(e => e.fecha === fechaStr);
  if (excepcionHoy) {
    if (excepcionHoy.tipo === 'Descanso' || excepcionHoy.tipo === 'Vacaciones' || excepcionHoy.tipo === 'Permiso') {
      return {
        labora: false,
        motivoNoLabora: `${barbero.nombre} no está disponible el ${fechaStr} (${excepcionHoy.tipo}: ${excepcionHoy.motivo || 'Ausencia programada'}).`,
        diaSemana,
        diaSemanaNombre
      };
    }
  }

  return {
    labora: true,
    diaSemana,
    diaSemanaNombre
  };
}

/**
 * Evalúa la disponibilidad de un slot horario (ej: "01:00 PM") para un barbero individual
 */
export function evaluarSlotParaBarbero(
  barbero: Barbero,
  fechaStr: string,
  slot12: string,
  slot24: string,
  citasDelBarberoEnFecha: Cita[],
  colTime: { fecha: string; totalMinutos: number; hora12: string }
): HorarioSlot {
  const slotMinutos = parseSlotToMinutes(slot12);
  const esFechaPasada = fechaStr < colTime.fecha;
  const esHoy = fechaStr === colTime.fecha;
  const esPasado = esFechaPasada || (esHoy && slotMinutos <= colTime.totalMinutos);

  // 1. Horario ya transcurrido en tiempo real en Colombia
  if (esPasado) {
    return {
      hora12: slot12,
      hora24: slot24,
      disponible: false,
      esPasado: true,
      tipoBloqueo: 'pasado',
      barberoNombre: barbero.nombre,
      motivoOcupado: esFechaPasada
        ? 'Fecha ya transcurrida en el calendario'
        : `Horario ya transcurrido (Hora Bogotá: ${colTime.hora12})`
    };
  }

  // 2. Verificar si labora en esta fecha
  const estadoLaboral = isBarberoLaborandoEnFecha(barbero, fechaStr);
  if (!estadoLaboral.labora) {
    return {
      hora12: slot12,
      hora24: slot24,
      disponible: false,
      esPasado: false,
      tipoBloqueo: 'dia_descanso',
      barberoNombre: barbero.nombre,
      motivoOcupado: estadoLaboral.motivoNoLabora || `Día de descanso de ${barbero.nombre}`
    };
  }

  // 3. Revisar jornada laboral del barbero (horaInicio y horaFin)
  const jornada = barbero.jornada || barbero.calendario?.jornada || {
    horaInicio: '09:00 AM',
    horaFin: '07:00 PM'
  };

  const inicioMinutos = parseSlotToMinutes(jornada.horaInicio || '09:00 AM');
  const finMinutos = parseSlotToMinutes(jornada.horaFin || '07:00 PM');

  if (slotMinutos < inicioMinutos) {
    return {
      hora12: slot12,
      hora24: slot24,
      disponible: false,
      esPasado: false,
      tipoBloqueo: 'fuera_jornada',
      barberoNombre: barbero.nombre,
      motivoOcupado: `Fuera del turno laboral de ${barbero.nombre} (Inicia a las ${jornada.horaInicio})`
    };
  }

  if (slotMinutos >= finMinutos) {
    return {
      hora12: slot12,
      hora24: slot24,
      disponible: false,
      esPasado: false,
      tipoBloqueo: 'fuera_jornada',
      barberoNombre: barbero.nombre,
      motivoOcupado: `Fuera del turno laboral de ${barbero.nombre} (Finaliza a las ${jornada.horaFin})`
    };
  }

  // 4. Revisar receso de almuerzo del barbero
  if (jornada.recesoInicio && jornada.recesoFin) {
    const recesoInicioMin = parseSlotToMinutes(jornada.recesoInicio);
    const recesoFinMin = parseSlotToMinutes(jornada.recesoFin);
    if (slotMinutos >= recesoInicioMin && slotMinutos < recesoFinMin) {
      return {
        hora12: slot12,
        hora24: slot24,
        disponible: false,
        esPasado: false,
        tipoBloqueo: 'receso',
        barberoNombre: barbero.nombre,
        motivoOcupado: `Receso de almuerzo de ${barbero.nombre} (${jornada.recesoInicio} a ${jornada.recesoFin})`
      };
    }
  }

  // 5. Revisar citas ya agendadas con este barbero (considerando duración del servicio)
  const DURACION_DEFAULT = 40;
  const citaConflicto = citasDelBarberoEnFecha.find(c => {
    const cIni = parseSlotToMinutes(c.hora);
    const serv = serviciosCasaDelRey.find(s => s.id === c.servicioId);
    const duracion = serv ? serv.duracionMinutos : DURACION_DEFAULT;
    const cFin = cIni + duracion;
    return slotMinutos >= cIni && slotMinutos < cFin;
  });

  if (citaConflicto) {
    return {
      hora12: slot12,
      hora24: slot24,
      disponible: false,
      esPasado: false,
      tipoBloqueo: 'reservado',
      barberoNombre: barbero.nombre,
      motivoOcupado: `Turno reservado en la agenda de ${barbero.nombre}`
    };
  }

  // 6. Turno disponible en la agenda del barbero
  return {
    hora12: slot12,
    hora24: slot24,
    disponible: true,
    esPasado: false,
    tipoBloqueo: 'disponible',
    barberoNombre: barbero.nombre
  };
}

/**
 * Calcula la disponibilidad completa para una fecha, sede y barbero (o cualquier barbero)
 */
export function calcularDisponibilidadConCalendarios(
  fechaStr: string,
  barberoIdInput: number | string | undefined | null,
  sucursalIdInput: string | undefined | null,
  todosLosBarberos: Barbero[],
  todasLasCitas: Cita[],
  colombiaDateTimeInput?: any
): DisponibilidadResponse {
  const colTime = colombiaDateTimeInput || getColombiaDateTime();
  const diaSemana = getDiaSemana(fechaStr);
  const diaSemanaNombre = getNombreDia(diaSemana);

  const sucursalFiltro = sucursalIdInput && sucursalIdInput !== 'todas' ? sucursalIdInput : null;
  const barberoIdNum = barberoIdInput && !isNaN(Number(barberoIdInput)) ? Number(barberoIdInput) : null;

  // Filtrar barberos activos de la sede seleccionada
  const barberosDeLaSede = sucursalFiltro
    ? todosLosBarberos.filter(b => b.sucursalId === sucursalFiltro)
    : todosLosBarberos;

  // Filtrar citas activas para la fecha
  const citasDia = todasLasCitas.filter(
    c => c.fecha === fechaStr && c.estado !== 'Cancelada' && (!sucursalFiltro || c.sucursalId === sucursalFiltro)
  );

  // CASO 1: SELECCIÓN DE UN BARBERO ESPECÍFICO
  if (barberoIdNum) {
    const barbero = todosLosBarberos.find(b => b.id === barberoIdNum);
    if (!barbero) {
      return {
        exito: false,
        negocio: 'Barbería La Casa del Rey',
        fecha: fechaStr,
        diaSemana,
        diaSemanaNombre,
        barberoId: String(barberoIdInput),
        horariosDisponibles: [],
        slots: [],
        relojColombia: colTime
      };
    }

    const estadoLaboral = isBarberoLaborandoEnFecha(barbero, fechaStr);
    const citasDelBarbero = citasDia.filter(c => Number(c.barberoId) === barberoIdNum);

    const slots = HORARIOS_CONFIG.map(cfg => {
      return evaluarSlotParaBarbero(
        barbero,
        fechaStr,
        cfg.hora12,
        cfg.hora24,
        citasDelBarbero,
        colTime
      );
    });

    const horariosDisponibles = slots.filter(s => s.disponible).map(s => s.hora12);

    let mensajeEstado: string | undefined = undefined;
    if (!estadoLaboral.labora) {
      mensajeEstado = estadoLaboral.motivoNoLabora;
    } else if (horariosDisponibles.length === 0) {
      mensajeEstado = `Agenda completa: No quedan turnos libres con ${barbero.nombre} para esta fecha.`;
    }

    return {
      exito: true,
      negocio: 'Barbería La Casa del Rey',
      fecha: fechaStr,
      diaSemana,
      diaSemanaNombre,
      esDiaDescansoBarbero: !estadoLaboral.labora,
      mensajeEstado,
      barberoId: String(barbero.id),
      barberoNombre: barbero.nombre,
      sucursalId: barbero.sucursalId,
      horariosDisponibles,
      slots,
      calendarioBarbero: barbero.calendario || {
        barberoId: barbero.id,
        barberoNombre: barbero.nombre,
        sucursalId: barbero.sucursalId || 'suc-chico',
        diasLaborales: barbero.diasLaborales || [1, 2, 3, 4, 5, 6],
        diasDescanso: barbero.diasDescanso || [0],
        jornada: barbero.jornada || { horaInicio: '09:00 AM', horaFin: '07:00 PM' }
      },
      relojColombia: colTime
    };
  }

  // CASO 2: CUALQUIER BARBERO DISPONIBLE (PRIMER SILLÓN DISPONIBLE)
  // Se evalúa qué barberos están en turno y libres para cada slot horario
  const slots = HORARIOS_CONFIG.map(cfg => {
    const slotMinutos = parseSlotToMinutes(cfg.hora12);
    const esFechaPasada = fechaStr < colTime.fecha;
    const esHoy = fechaStr === colTime.fecha;
    const esPasado = esFechaPasada || (esHoy && slotMinutos <= colTime.totalMinutos);

    if (esPasado) {
      return {
        hora12: cfg.hora12,
        hora24: cfg.hora24,
        disponible: false,
        esPasado: true,
        tipoBloqueo: 'pasado' as TipoBloqueoSlot,
        motivoOcupado: esFechaPasada
          ? 'Fecha ya transcurrida en el calendario'
          : `Horario ya transcurrido (Hora Bogotá: ${colTime.hora12})`
      };
    }

    // Verificar para cada barbero de la sede si está en turno y libre en este slot
    const barberosLibresEnSlot: { id: number; nombre: string }[] = [];

    for (const b of barberosDeLaSede) {
      const citasDelBarbero = citasDia.filter(c => Number(c.barberoId) === b.id);
      const evalBarbero = evaluarSlotParaBarbero(b, fechaStr, cfg.hora12, cfg.hora24, citasDelBarbero, colTime);
      if (evalBarbero.disponible) {
        barberosLibresEnSlot.push({ id: b.id, nombre: b.nombre });
      }
    }

    if (barberosLibresEnSlot.length > 0) {
      return {
        hora12: cfg.hora12,
        hora24: cfg.hora24,
        disponible: true,
        esPasado: false,
        tipoBloqueo: 'disponible' as TipoBloqueoSlot,
        barberosDisponibles: barberosLibresEnSlot,
        barberoNombre: barberosLibresEnSlot.map(b => b.nombre).join(', ')
      };
    }

    // Si nadie está disponible, identificar el motivo común
    const barberosLaborandoHoy = barberosDeLaSede.filter(b => isBarberoLaborandoEnFecha(b, fechaStr).labora);
    let motivoOcupado = 'Todos los sillones de esta sede están reservados a esta hora';
    let tipoBloqueo: TipoBloqueoSlot = 'reservado';

    if (barberosLaborandoHoy.length === 0) {
      motivoOcupado = 'No hay barberos programados en esta sede para hoy';
      tipoBloqueo = 'dia_descanso';
    } else {
      // Revisar si están en receso o fuera de jornada
      const enReceso = barberosLaborandoHoy.every(b => {
        const j = b.jornada || b.calendario?.jornada;
        if (!j?.recesoInicio || !j?.recesoFin) return false;
        const rIni = parseSlotToMinutes(j.recesoInicio);
        const rFin = parseSlotToMinutes(j.recesoFin);
        return slotMinutos >= rIni && slotMinutos < rFin;
      });

      if (enReceso) {
        motivoOcupado = 'Hora de receso y descanso del personal de la sede';
        tipoBloqueo = 'receso';
      }
    }

    return {
      hora12: cfg.hora12,
      hora24: cfg.hora24,
      disponible: false,
      esPasado: false,
      tipoBloqueo,
      motivoOcupado
    };
  });

  const horariosDisponibles = slots.filter(s => s.disponible).map(s => s.hora12);

  return {
    exito: true,
    negocio: 'Barbería La Casa del Rey',
    fecha: fechaStr,
    diaSemana,
    diaSemanaNombre,
    barberoId: 'Cualquier barbero',
    sucursalId: sucursalFiltro || 'todas',
    horariosDisponibles,
    slots,
    relojColombia: colTime
  };
}
