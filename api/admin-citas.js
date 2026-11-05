import 'dotenv/config';
import { google } from 'googleapis';
import { 
  MADRID_TIMEZONE, 
  parseMadridDateTime, 
  formatMadridDate, 
  formatMadridTime,
  formatMadridRfc3339 
} from './_timezone.js';

/**
 * Backend de Gestión de Citas y Bloqueos de Agenda (Exclusivo Superusuario)
 * Protegido mediante middleware de seguridad con x-admin-pass.
 * Métodos soportados:
 * - GET: Listar citas actuales/futuras + cálculo de historial de ausencias (no_show).
 * - POST: Bloquear día completo o tramo horario en Google Calendar.
 * - PATCH: Marcar asistencia (attended / no_show) o reprogramar fecha/hora de cita.
 * - DELETE: Eliminar cita o desbloquear tramo de agenda sin requerir PIN.
 */
export default async function handler(req, res) {
  // 1. Middleware de Seguridad Obligatorio
  const adminPass = req.headers['x-admin-pass'];
  const envPass = process.env.ADMIN_PASS;
  const cleanEnvPass = (envPass || '').replace(/^["']|["']$/g, '').trim();

  if (!adminPass || (adminPass !== envPass && adminPass !== cleanEnvPass)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // 2. Inicialización de Credenciales y Google Calendar API
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

    // =========================================================================
    // MÉTODO GET: Listar citas actuales/futuras + Historial de ausencias
    // =========================================================================
    if (req.method === 'GET') {
      // Ventana de consulta: Desde hace 60 días hasta dentro de 60 días
      const past60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const future60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId,
        timeMin: past60Days,
        timeMax: future60Days,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500
      });

      const allItems = response.data.items || [];
      const validItems = allItems.filter(ev => ev.status !== 'cancelled');

      // Paso 1: Recorrer eventos para contar ausencias (no_show) por teléfono
      const noShowCounts = {};
      for (const ev of validItems) {
        const privateProps = ev.extendedProperties?.private || {};
        let rawPhone = privateProps.phone || '';

        if (!rawPhone && ev.description) {
          const match = ev.description.match(/(?:Telefono|Tel|Teléfono):\s*([0-9+\s]+)/i) || ev.description.match(/\b\d{9}\b/);
          if (match) rawPhone = match[1] || match[0];
        }

        const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-9) : '';
        const status = privateProps.status || 'pending';

        if (status === 'no_show' && cleanPhone) {
          noShowCounts[cleanPhone] = (noShowCounts[cleanPhone] || 0) + 1;
        }
      }

      // Paso 2: Filtrar citas actuales/futuras y las del día de hoy en Europe/Madrid
      const todayMadrid = formatMadridDate(new Date());
      const startOfToday = parseMadridDateTime(todayMadrid, '00:00').dateObj;

      const citas = [];

      for (const ev of validItems) {
        const startRaw = ev.start?.dateTime || ev.start?.date;
        const endRaw = ev.end?.dateTime || ev.end?.date;
        const startDate = startRaw ? new Date(startRaw) : null;
        const endDate = endRaw ? new Date(endRaw) : (startDate ? new Date(startDate.getTime() + 30 * 60000) : null);

        const fecha = startDate ? formatMadridDate(startDate) : (startRaw?.includes('T') ? '' : startRaw || '');
        const isTodayOrFuture = fecha >= todayMadrid || (endDate && endDate >= startOfToday);

        if (!isTodayOrFuture) {
          continue; // Perteneció al pasado, solo se usó para el historial de no_show
        }

        const summary = ev.summary || '';
        const description = ev.description || '';
        const privateProps = ev.extendedProperties?.private || {};

        let rawPhone = privateProps.phone || '';
        if (!rawPhone && description) {
          const match = description.match(/(?:Telefono|Tel|Teléfono):\s*([0-9+\s]+)/i) || description.match(/\b\d{9}\b/);
          if (match) rawPhone = match[1] || match[0];
        }
        const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-9) : '';

        // Detectar si es un bloqueo de agenda
        const summaryLower = summary.toLowerCase();
        const isBloqueo = privateProps.type === 'block' || 
          summaryLower.includes('bloqueado') || 
          summaryLower.includes('cerrado') || 
          summaryLower.includes('libre');

        const type = isBloqueo ? 'block' : (privateProps.type || 'appointment');
        const status = privateProps.status || 'pending';
        const noShowCount = (type === 'appointment' && cleanPhone) ? (noShowCounts[cleanPhone] || 0) : 0;

        let cliente = '';
        let servicio = '';

        if (type === 'block') {
          cliente = summary.replace(/^🔒\s*BLOQUEADO\s*[-–:]*\s*/i, '').trim() || (privateProps.reason || 'Bloqueo de agenda');
          servicio = 'Bloqueo de agenda';
        } else if (summary.startsWith('Cita:')) {
          const parts = summary.replace(/^Cita:\s*/i, '').split(' - ');
          cliente = parts[0]?.trim() || '';
          servicio = parts[1]?.trim() || '';
        } else {
          cliente = summary;
        }

        if (!servicio && type !== 'block') {
          servicio = privateProps.service || 'Servicio Barbería';
        }

        const horaInicio = startDate && ev.start?.dateTime ? formatMadridTime(startDate) : 'Día completo';
        const horaFin = endDate && ev.end?.dateTime ? formatMadridTime(endDate) : '';

        citas.push({
          eventId: ev.id,
          cliente: cliente || 'Sin nombre',
          telefono: rawPhone || 'No disponible',
          cleanPhone: cleanPhone,
          servicio: servicio || 'Servicio de Barbería',
          pin: privateProps.pin || '',
          fecha: fecha,
          hora: horaInicio,
          horaFin: horaFin,
          startIso: startRaw,
          endIso: endRaw,
          isBloqueo: isBloqueo,
          type: type,
          status: status, // 'pending' | 'attended' | 'no_show'
          noShowCount: noShowCount,
          reason: privateProps.reason || '',
          isFullDay: privateProps.isFullDay === 'true' || !ev.start?.dateTime || (horaInicio === '09:00' && horaFin === '21:00'),
          duracion: privateProps.duracion || (startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) - 10 : 30),
          summary: summary,
          colorId: ev.colorId || null
        });
      }

      return res.status(200).json({
        success: true,
        total: citas.length,
        citas: citas
      });
    }

    // =========================================================================
    // MÉTODO PATCH: Marcar Asistencia (attended / no_show) y Reprogramar Cita
    // =========================================================================
    if (req.method === 'PATCH') {
      const { eventId, action } = req.body || {};

      if (!eventId || !action) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios (eventId, action)' });
      }

      // Obtener el evento existente para preservar sus extendedProperties
      const existing = await calendar.events.get({ calendarId, eventId });
      if (!existing || !existing.data) {
        return res.status(404).json({ error: 'Evento no encontrado en Google Calendar' });
      }

      const currentPrivate = existing.data.extendedProperties?.private || {};

      // Caso 1: Actualización de Estado (Asistió / Falló / Pendiente)
      if (action === 'status') {
        const { status } = req.body;
        if (!['pending', 'attended', 'no_show'].includes(status)) {
          return res.status(400).json({ error: 'Estado inválido. Debe ser pending, attended o no_show' });
        }

        // Color en Google Calendar: 10 = Verde (asistió), 11 = Rojo (no_show), null = color por defecto
        const colorId = status === 'attended' ? '10' : (status === 'no_show' ? '11' : null);

        await calendar.events.patch({
          calendarId,
          eventId,
          requestBody: {
            colorId: colorId,
            extendedProperties: {
              private: {
                ...currentPrivate,
                status: status
              }
            }
          }
        });

        return res.status(200).json({
          success: true,
          message: `Estado actualizado a ${status}`,
          status: status,
          colorId: colorId
        });
      }

      // Caso 2: Reprogramación de Fecha y Hora
      if (action === 'reschedule') {
        const { newDate, newTime } = req.body;

        if (!newDate || !newTime) {
          return res.status(400).json({ error: 'Debes indicar newDate y newTime' });
        }

        const BUFFER_CLEANING_MINUTES = 10;
        let duracionNum = parseInt(req.body.duracion || currentPrivate.duracion, 10);

        if (!duracionNum || isNaN(duracionNum)) {
          if (existing.data.start?.dateTime && existing.data.end?.dateTime) {
            const diffMinutes = Math.round(
              (new Date(existing.data.end.dateTime).getTime() - new Date(existing.data.start.dateTime).getTime()) / 60000
            );
            duracionNum = Math.max(15, diffMinutes - BUFFER_CLEANING_MINUTES);
          } else {
            duracionNum = 30;
          }
        }

        const totalSlotMinutes = duracionNum + BUFFER_CLEANING_MINUTES;
        const { dateObj: startDate, rfc3339: startDateTimeIso } = parseMadridDateTime(newDate, newTime);
        const endDate = new Date(startDate.getTime() + totalSlotMinutes * 60000);
        const endDateTimeIso = formatMadridRfc3339(endDate);

        await calendar.events.patch({
          calendarId,
          eventId,
          requestBody: {
            start: {
              dateTime: startDateTimeIso,
              timeZone: MADRID_TIMEZONE
            },
            end: {
              dateTime: endDateTimeIso,
              timeZone: MADRID_TIMEZONE
            },
            extendedProperties: {
              private: {
                ...currentPrivate,
                duracion: duracionNum.toString()
              }
            }
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Cita reprogramada correctamente con éxito',
          newDate: newDate,
          newTime: newTime
        });
      }

      return res.status(400).json({ error: `Acción desconocida: ${action}` });
    }

    // =========================================================================
    // MÉTODO POST: Bloquear Día Completo o Tramo de Horas
    // =========================================================================
    if (req.method === 'POST') {
      const { date, isFullDay, startTime, endTime, reason } = req.body || {};

      if (!date) {
        return res.status(400).json({ error: 'La fecha es obligatoria' });
      }

      let startH_M = '09:00';
      let endH_M = '21:00';

      if (!isFullDay) {
        startH_M = startTime || '16:00';
        endH_M = endTime || '21:00';
      }

      const { rfc3339: startDateTimeIso } = parseMadridDateTime(date, startH_M);
      const { rfc3339: endDateTimeIso } = parseMadridDateTime(date, endH_M);

      const blockSummary = `🔒 BLOQUEADO - ${(reason || 'No disponible').trim()}`;

      const blockEvent = {
        summary: blockSummary,
        description: `Bloqueo de agenda creado desde el Panel de Administración.${reason ? ' Motivo: ' + reason : ''}`,
        colorId: '8', // Color gris oscuro en Google Calendar
        start: {
          dateTime: startDateTimeIso,
          timeZone: MADRID_TIMEZONE
        },
        end: {
          dateTime: endDateTimeIso,
          timeZone: MADRID_TIMEZONE
        },
        extendedProperties: {
          private: {
            type: 'block',
            isFullDay: isFullDay ? 'true' : 'false',
            reason: (reason || 'No disponible').trim(),
            startTime: startH_M,
            endTime: endH_M
          }
        }
      };

      const created = await calendar.events.insert({
        calendarId,
        requestBody: blockEvent
      });

      return res.status(200).json({
        success: true,
        message: 'Bloqueo registrado en Google Calendar con éxito',
        eventId: created.data.id
      });
    }

    // =========================================================================
    // MÉTODO DELETE: Eliminar Cita o Desbloquear Tramo Horario
    // =========================================================================
    if (req.method === 'DELETE') {
      const eventId = req.body?.eventId || req.query?.eventId;

      if (!eventId) {
        return res.status(400).json({ error: 'El parámetro eventId es obligatorio' });
      }

      try {
        await calendar.events.delete({ calendarId, eventId });
      } catch (delErr) {
        if (delErr.code !== 404 && delErr.code !== 410) {
          throw delErr;
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Evento eliminado correctamente de Google Calendar'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(`Error en api/admin-citas [${req.method}]:`, error);
    return res.status(500).json({
      error: 'Error interno en Google Calendar: ' + (error.message || error.toString())
    });
  }
}
