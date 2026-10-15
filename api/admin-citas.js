import 'dotenv/config';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verificación de Seguridad del Superusuario (Exclusivamente desde variable de entorno)
  const authHeader = req.headers['authorization'] || req.headers['x-admin-password'];
  const queryPass = req.query?.password || req.query?.pass;
  const rawProvidedPass = (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : queryPass || '').toString().trim();
  const cleanProvidedPass = rawProvidedPass.replace(/["'\\]/g, '').trim();

  const envPass = (process.env.ADMIN_PASS || '')
    .replace(/["'\\]/g, '')
    .trim();

  if (!envPass || cleanProvidedPass !== envPass) {
    return res.status(401).json({ error: 'Contraseña incorrecta. Acceso no autorizado.' });
  }

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

    // Rango de fechas: Desde el inicio de hoy hasta dentro de 60 días
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endWindow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfToday.toISOString(),
      timeMax: endWindow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500
    });

    const items = response.data.items || [];

    const citas = items
      .filter(ev => ev.status !== 'cancelled')
      .map(ev => {
        const startRaw = ev.start?.dateTime || ev.start?.date;
        const endRaw = ev.end?.dateTime || ev.end?.date;
        const startDate = startRaw ? new Date(startRaw) : null;
        const endDate = endRaw ? new Date(endRaw) : null;

        // Formato de fecha YYYY-MM-DD
        const fecha = startDate ? startDate.toISOString().split('T')[0] : '';
        const horaInicio = startDate && ev.start?.dateTime ? startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Madrid'
        }) : 'Todo el día';
        const horaFin = endDate && ev.end?.dateTime ? endDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Madrid'
        }) : '';

        // Extraer información del resumen y descripción
        const summary = ev.summary || '';
        const description = ev.description || '';
        const privateProps = ev.extendedProperties?.private || {};

        let cliente = '';
        let servicio = '';
        let telefono = privateProps.phone || '';
        const pin = privateProps.pin || '';

        // Analizar summary tipo "Cita: Nombre - Servicio" o "Cita: Nombre"
        if (summary.startsWith('Cita:')) {
          const parts = summary.replace(/^Cita:\s*/i, '').split(' - ');
          cliente = parts[0]?.trim() || '';
          servicio = parts[1]?.trim() || '';
        } else {
          cliente = summary;
        }

        // Si no se encontró teléfono en extendedProperties, buscarlo en description
        if (!telefono && description) {
          const phoneMatch = description.match(/(?:Telefono|Tel|Teléfono):\s*([0-9+\s]+)/i);
          if (phoneMatch) {
            telefono = phoneMatch[1].replace(/\s+/g, '');
          } else {
            const digitMatch = description.match(/\b\d{9}\b/);
            if (digitMatch) telefono = digitMatch[0];
          }
        }

        // Si servicio no está definido, usar valor por defecto o summary
        if (!servicio) {
          servicio = privateProps.service || (summary.toLowerCase().includes('cerrado') ? 'Bloqueo (Cerrado)' : 'Corte / Servicio');
        }

        const isBloqueo = summary.toLowerCase().includes('cerrado') || summary.toLowerCase().includes('libre');

        return {
          eventId: ev.id,
          cliente: cliente || 'Sin nombre',
          telefono: telefono || 'No disponible',
          servicio: servicio || 'Servicio de Barbería',
          pin: pin,
          fecha: fecha,
          hora: horaInicio,
          horaFin: horaFin,
          startIso: startRaw,
          isBloqueo: isBloqueo,
          summary: summary
        };
      });

    return res.status(200).json({
      success: true,
      total: citas.length,
      citas: citas
    });

  } catch (error) {
    console.error('Error al obtener citas en admin-citas:', error);
    return res.status(500).json({
      error: 'Error al conectar con Google Calendar: ' + error.message
    });
  }
}

