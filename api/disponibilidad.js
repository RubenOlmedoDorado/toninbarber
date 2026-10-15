import 'dotenv/config';
import { google } from 'googleapis';
import { 
  parseMadridDateTime, 
  getMadridDayOfWeek 
} from './_timezone.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, duracion } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'La fecha es obligatoria' });
  }

  const durationNum = parseInt(duracion, 10) || 30;
  // Margen de limpieza invisible de 10 min
  const BUFFER_CLEANING_MINUTES = 10;
  const totalSlotMinutes = durationNum + BUFFER_CLEANING_MINUTES;

  try {
    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.events']
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // 1. Obtener eventos de todo el día solicitado en horario de Madrid
    const dayStart = parseMadridDateTime(date, '00:00').dateObj.toISOString();
    const dayEnd = parseMadridDateTime(date, '23:59:59').dateObj.toISOString();

    const calendarResponse = await calendar.events.list({
      calendarId,
      timeMin: dayStart,
      timeMax: dayEnd,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = calendarResponse.data.items || [];

    // 2. Si hay algún evento que marque día cerrado o libre, retornar array vacío
    for (let ev of events) {
      if (ev.summary) {
        const summaryLower = ev.summary.toLowerCase();
        if (summaryLower.includes('cerrado') || summaryLower.includes('libre')) {
          return res.status(200).json({ disponibles: [] });
        }
      }
    }

    // 3. Determinar franja de horario comercial
    const dayOfWeek = getMadridDayOfWeek(date); // 0 Domingo, 1 Lunes... 6 Sábado

    // Domingos cerrado
    if (dayOfWeek === 0) {
      return res.status(200).json({ disponibles: [] });
    }

    // Franja de apertura activa (Lunes a Sábado: 16:00 - 21:00)
    const ranges = [];
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      ranges.push({ startH: 16, startM: 0, endH: 21, endM: 0 });
    }

    if (ranges.length === 0) {
      return res.status(200).json({ disponibles: [] });
    }

    const now = new Date();
    const disponibles = [];

    // 4. Generar bloques cada 15 min y filtrar colisiones en horario exacto de Madrid
    for (let range of ranges) {
      let currentMinutes = range.startH * 60 + range.startM;
      const closingMinutes = range.endH * 60 + range.endM;

      while (currentMinutes + totalSlotMinutes <= closingMinutes) {
        const slotH = Math.floor(currentMinutes / 60);
        const slotM = currentMinutes % 60;
        const timeStr = `${slotH.toString().padStart(2, '0')}:${slotM.toString().padStart(2, '0')}`;

        const { dateObj: slotStart } = parseMadridDateTime(date, timeStr);
        const slotEnd = new Date(slotStart.getTime() + totalSlotMinutes * 60000);

        // Si la fecha es hoy, descartar horas que ya hayan pasado respecto a la hora actual
        if (slotStart <= now) {
          currentMinutes += 15;
          continue;
        }

        // Comprobar solapamiento con cualquier evento existente en el calendario
        let hasCollision = false;
        for (let ev of events) {
          const evStart = new Date(ev.start.dateTime || ev.start.date);
          const evEnd = new Date(ev.end.dateTime || ev.end.date);

          if (slotStart < evEnd && slotEnd > evStart) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          disponibles.push(timeStr);
        }

        currentMinutes += 15;
      }
    }

    return res.status(200).json({ disponibles });
  } catch (error) {
    console.error('Error al comprobar disponibilidad en Google Calendar:', error);
    return res.status(500).json({ error: error.message });
  }
}

