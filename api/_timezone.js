/**
 * Utilidades de fecha y zona horaria para Barbería Toñín Barber (Europe/Madrid)
 * Garantiza que todas las fechas y horas se procesen de forma 100% sincronizada
 * tanto en local como en los servidores Linux/UTC de Vercel.
 */

export const MADRID_TIMEZONE = 'Europe/Madrid';

// Obtiene el offset de Europe/Madrid para una fecha dada ('+01:00' o '+02:00')
export function getMadridOffset(dateStr, timeStr = '12:00') {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const d = new Date(`${dateStr}T${cleanTime}Z`);
  if (isNaN(d.getTime())) {
    return '+01:00';
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MADRID_TIMEZONE,
    timeZoneName: 'longOffset'
  }).formatToParts(d);
  const offset = parts.find(p => p.type === 'timeZoneName')?.value;
  return offset ? offset.replace('GMT', '') : '+01:00';
}

// Devuelve un objeto Date y un string RFC3339 en la zona horaria de Madrid
export function parseMadridDateTime(dateStr, timeStr = '00:00') {
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const offset = getMadridOffset(dateStr, cleanTime);
  const rfc3339 = `${dateStr}T${cleanTime}${offset}`;
  const dateObj = new Date(rfc3339);
  return { dateObj, rfc3339, offset };
}

// Formatea cualquier objeto Date a string RFC3339 con el offset de Madrid (ej. 2026-10-29T16:00:00+01:00)
export function formatMadridRfc3339(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(dateObj);

  const getPart = (type) => parts.find(p => p.type === type)?.value;
  const datePart = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const timePart = `${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;

  const offsetParts = new Intl.DateTimeFormat('en-US', {
    timeZone: MADRID_TIMEZONE,
    timeZoneName: 'longOffset'
  }).formatToParts(dateObj);
  const offset = offsetParts.find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || '+01:00';

  return `${datePart}T${timePart}${offset}`;
}

// Formatea la fecha a YYYY-MM-DD en zona horaria Madrid
export function formatMadridDate(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: MADRID_TIMEZONE }).format(dateObj);
}

// Formatea la hora a HH:mm en zona horaria Madrid
export function formatMadridTime(d) {
  if (!d) return '';
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID_TIMEZONE
  });
}

// Obtiene el día de la semana (0: Domingo, 1: Lunes... 6: Sábado) para una fecha YYYY-MM-DD en Madrid
export function getMadridDayOfWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Al usar mediodía UTC (12:00 UTC), siempre cae dentro del mismo día calendario en Europa
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}
