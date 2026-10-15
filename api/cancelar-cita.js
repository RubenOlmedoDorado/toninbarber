import 'dotenv/config';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, token, phone, pin } = req.body || {};
  const queryEventId = req.query?.eventId || req.query?.token;
  const targetId = eventId || token || queryEventId;

  if (!targetId && (!phone || !pin)) {
    return res.status(400).json({ error: 'Se requiere el ID de la cita o el teléfono y PIN' });
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

    let targetEventId = null;

    // 1. Si tenemos un eventId o token directo
    if (targetId) {
      const cleanId = targetId.toString().trim();
      try {
        const directEv = await calendar.events.get({ calendarId, eventId: cleanId });
        if (directEv && directEv.data && directEv.data.status !== 'cancelled') {
          targetEventId = directEv.data.id;
        }
      } catch (directErr) {
        // Puede que fuera un token guardado con anterioridad
        try {
          const listRes = await calendar.events.list({
            calendarId,
            privateExtendedProperty: `token=${cleanId}`,
            singleEvents: true
          });
          if (listRes.data.items && listRes.data.items.length > 0) {
            targetEventId = listRes.data.items[0].id;
          }
        } catch (tokErr) {
          console.log('No encontrado por token antiguo:', tokErr.message);
        }
      }
    }

    // 2. Si no se localizó por ID y se enviaron phone y pin
    if (!targetEventId && phone && pin) {
      const cleanPhone = phone.toString().trim();
      const cleanPin = pin.toString().trim();
      try {
        const listRes = await calendar.events.list({
          calendarId,
          privateExtendedProperty: `phone=${cleanPhone}`,
          singleEvents: true
        });
        const match = (listRes.data.items || []).find(ev => 
          ev.extendedProperties?.private?.pin === cleanPin && ev.status !== 'cancelled'
        );
        if (match) {
          targetEventId = match.id;
        }
      } catch (searchErr) {
        console.warn('Error buscando por phone/pin para cancelar:', searchErr.message);
      }
    }

    // 3. Eliminar el evento en Google Calendar si se localizó
    if (targetEventId) {
      try {
        await calendar.events.delete({ calendarId, eventId: targetEventId });
        console.log('Cita eliminada con éxito de Google Calendar:', targetEventId);
      } catch (deleteError) {
        if (deleteError.code !== 404 && deleteError.code !== 410) {
          throw deleteError;
        }
        console.log('El evento ya estaba eliminado en Google Calendar.');
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Cita cancelada correctamente' 
    });
  } catch (error) {
    console.error('Error al cancelar la cita:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al cancelar la cita: ' + error.message 
    });
  }
}
