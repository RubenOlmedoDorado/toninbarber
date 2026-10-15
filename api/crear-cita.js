import 'dotenv/config';
import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('--- NUEVA PETICION ---');
  process.env.TZ = 'Europe/Madrid';

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Body recibido:', req.body);

  const { name, phone, date, time, serviceName, duracion, pin } = req.body;

  if (!name || !phone || !date || !time || !serviceName || !duracion || !pin) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  console.log('Existe Email:', !!process.env.GOOGLE_CLIENT_EMAIL);
  console.log('Existe Key:', !!process.env.GOOGLE_PRIVATE_KEY);

  try {
    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    let auth;
    try {
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar.events']
      });
      console.log('Autenticacion JWT creada correctamente');
    } catch (authError) {
      console.error('Fallo en la creacion de google.auth.JWT:', authError);
      throw authError;
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Calcular horas (Margen de limpieza de 10 min invisible para el cliente)
    const BUFFER_CLEANING_MINUTES = 10;
    const duracionConMargen = Number(duracion) + BUFFER_CLEANING_MINUTES;

    const startDateTimeStr = `${date}T${time}:00`;
    const startDate = new Date(startDateTimeStr);
    const endDate = new Date(startDate.getTime() + duracionConMargen * 60000);

    const startDateTimeIso = startDate.toISOString();
    const endDateTimeIso = endDate.toISOString();

    // 1. Buscar colisiones
    const dayStart = new Date(`${date}T00:00:00`).toISOString();
    const dayEnd = new Date(`${date}T23:59:59`).toISOString();

    let response;
    try {
      response = await calendar.events.list({
        calendarId,
        timeMin: dayStart,
        timeMax: dayEnd,
        singleEvents: true,
        orderBy: 'startTime'
      });
      console.log('Primera lectura (events.list) exitosa, items:', response.data.items?.length);
    } catch (listError) {
      console.error('Fallo en la primera lectura (events.list):', listError);
      throw listError;
    }

    const events = response.data.items || [];
    
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 0) return res.status(400).json({ error: 'El local esta cerrado los domingos' });
    
    const h = startDate.getHours();
    const m = startDate.getMinutes();
    const totalMins = h * 60 + m;
    
    // Validar horario comercial (Solo tardes: 16:00 - 21:00)
    let isBusinessHours = false;
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (totalMins >= 16 * 60 && totalMins < 21 * 60) {
        isBusinessHours = true;
      }
    }
    
    if (!isBusinessHours) {
      return res.status(400).json({ error: 'Fuera de horario. Disponible de Lunes a Viernes de 16:00 a 21:00 (Turno Tarde)' });
    }

    let hasOverlap = false;
    for (let ev of events) {
      // Comprobar bloqueo por día libre o festivo
      if (ev.summary) {
        const summaryLower = ev.summary.toLowerCase();
        if (summaryLower.includes('cerrado') || summaryLower.includes('libre')) {
          return res.status(400).json({ 
            error: 'La barbería está cerrada este día por festivo o descanso. Por favor, elige otra fecha.' 
          });
        }
      }

      const evStart = new Date(ev.start.dateTime || ev.start.date);
      const evEnd = new Date(ev.end.dateTime || ev.end.date);
      
      if (
        (ev.description && ev.description.includes(phone)) || 
        (ev.extendedProperties?.private?.phone === phone)
      ) {
        return res.status(400).json({ error: 'Ya tienes una cita reservada para este dia' });
      }

      if (startDate < evEnd && endDate > evStart) {
        hasOverlap = true;
      }
    }

    if (hasOverlap) {
      return res.status(400).json({ error: 'Ese hueco ya esta ocupado, por favor prueba a elegir otra hora.' });
    }

    
    // Anti-spam por telefono: citas distanciadas al menos 6 dias
    const sixDaysMs = 7 * 24 * 60 * 60 * 1000;
    const checkMin = new Date(startDate.getTime() - sixDaysMs).toISOString();
    const checkMax = new Date(startDate.getTime() + sixDaysMs).toISOString();
    
    let spamCheck;
    try {
      spamCheck = await calendar.events.list({
        calendarId,
        timeMin: checkMin,
        timeMax: checkMax,
        privateExtendedProperty: "phone=" + phone,
        singleEvents: true
      });
      console.log('Lectura anti-spam 6 dias exitosa, items:', spamCheck.data.items?.length);
    } catch (spamError) {
      console.error('Fallo en lectura anti-spam 6 dias:', spamError);
      throw spamError;
    }
    
    // Fallback if privateExtendedProperty doesn't catch it (older events might not have it)
    let spamEvents = spamCheck.data.items || [];
    if (spamEvents.length === 0) {
      // Also check using query just in case
      let spamCheckQ = await calendar.events.list({
        calendarId,
        timeMin: checkMin,
        timeMax: checkMax,
        q: phone,
        singleEvents: true
      });
      spamEvents = spamCheckQ.data.items || [];
    }

    for (let ev of spamEvents) {
      const evStart = new Date(ev.start.dateTime || ev.start.date);
      // Validar si realmente pertenece a este telefono (en q:phone podria ser coincidencia parcial)
      const isOwner = (ev.extendedProperties?.private?.phone === phone) || (ev.description && ev.description.includes(phone));
      if (isOwner) {
        // Ignorar la hora para que el cálculo sea por día natural
        const date1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const date2 = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
        const diffMs = Math.abs(date1.getTime() - date2.getTime());
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 6) {
          return res.status(400).json({ error: 'Debes dejar al menos 6 dias de diferencia entre tus citas. Tienes una cita demasiado cerca de esta fecha.' });
        }
      }
    }

    // 2. Crear evento en Google Calendar
    const event = {
      summary: `Cita: ${name} - ${serviceName}`,
      description: `Telefono: ${phone}`,
      start: {
        dateTime: startDateTimeIso,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDateTimeIso,
        timeZone: 'Europe/Madrid',
      },
      extendedProperties: {
        private: {
          phone: phone.toString().trim(),
          pin: pin.toString().trim()
        }
      }
    };
    
    try {
      const createdEvent = await calendar.events.insert({ calendarId, requestBody: event });
      res.status(200).json({ success: true, eventId: createdEvent.data.id });
      console.log('Evento insertado (events.insert) exitosamente con ID:', createdEvent.data.id);
    } catch (insertError) {
      console.error('Fallo en la insercion (events.insert):', insertError);
      throw insertError;
    }

    // 4. Devolver respuesta
    
  } catch (error) {
    console.error('Error atrapado en el catch principal:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}