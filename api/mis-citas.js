import 'dotenv/config';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const phone = req.body?.phone || req.query?.phone;
  const pin = req.body?.pin || req.query?.pin;

  if (!phone || !pin) {
    return res.status(400).json({ error: 'El teléfono y el PIN son obligatorios' });
  }

  const cleanPhone = phone.toString().trim();
  const cleanPin = pin.toString().trim();

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

    // Buscar eventos en Google Calendar por teléfono en privateExtendedProperty
    let response;
    try {
      response = await calendar.events.list({
        calendarId,
        privateExtendedProperty: `phone=${cleanPhone}`,
        singleEvents: true,
        orderBy: 'startTime'
      });
    } catch (listError) {
      console.error('Error listando eventos con privateExtendedProperty:', listError);
      throw listError;
    }

    let events = response.data.items || [];

    // Fallback: si no devolvió eventos por extendedProperty, probar con búsqueda q:phone
    if (events.length === 0) {
      try {
        const fallback = await calendar.events.list({
          calendarId,
          q: cleanPhone,
          singleEvents: true,
          orderBy: 'startTime'
        });
        events = (fallback.data.items || []).filter(ev => 
          (ev.extendedProperties?.private?.phone === cleanPhone) || 
          (ev.description && ev.description.includes(cleanPhone))
        );
      } catch (fbErr) {
        console.warn('Fallback q:phone warning:', fbErr.message);
      }
    }

    // Filtrar citas que no estén canceladas
    const activeEvents = events.filter(ev => ev.status !== 'cancelled');

    // Comprobar si el PIN de 4 dígitos coincide
    const matchingEvent = activeEvents.find(ev => {
      const evPin = ev.extendedProperties?.private?.pin;
      return evPin && evPin.toString().trim() === cleanPin;
    });

    if (!matchingEvent) {
      return res.status(404).json({ error: 'Cita no encontrada o PIN incorrecto' });
    }

    // Extraer datos formateados para el cliente
    const evStart = new Date(matchingEvent.start.dateTime || matchingEvent.start.date);
    const dateFormatted = evStart.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const timeFormatted = evStart.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const serviceName = matchingEvent.summary 
      ? matchingEvent.summary.replace(/^Cita:\s*[^–-]+[-–]\s*/i, '').replace(/^Cita:\s*/i, '').trim()
      : 'Servicio Barbería';

    const cita = {
      eventId: matchingEvent.id,
      summary: matchingEvent.summary,
      serviceName: serviceName,
      date: dateFormatted,
      time: timeFormatted,
      phone: cleanPhone,
      pin: cleanPin
    };

    return res.status(200).json({ 
      success: true, 
      cita,
      citas: [cita]
    });

  } catch (error) {
    console.error('Error al recuperar cita en api/mis-citas:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar citas: ' + error.message });
  }
}
