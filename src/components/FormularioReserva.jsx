import React, { useState, useEffect } from 'react';
import { serviciosData } from './Servicios';

const FormularioReserva = ({ service, onClose }) => {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    serviceId: service ? service.id.toString() : '',
    pin: localStorage.getItem('tonin_pin') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successEventId, setSuccessEventId] = useState(null);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  // Issue #4: Carga dinámica de horas disponibles según fecha y servicio (duración)
  useEffect(() => {
    if (!formData.date || !formData.serviceId) {
      setHorasDisponibles([]);
      return;
    }

    const selectedServiceData = serviciosData.find(s => s.id.toString() === formData.serviceId);
    const duracion = selectedServiceData ? selectedServiceData.duracion : 30;

    setCargandoHoras(true);
    fetch(`/api/disponibilidad?date=${formData.date}&duracion=${duracion}`)
      .then(res => res.json())
      .then(data => {
        const slots = data.disponibles || [];
        setHorasDisponibles(slots);
        // Si la hora previamente seleccionada ya no está libre, deseleccionarla
        if (formData.time && !slots.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: '' }));
        }
      })
      .catch(err => {
        console.error('Error al cargar horas disponibles:', err);
        setHorasDisponibles([]);
      })
      .finally(() => {
        setCargandoHoras(false);
      });
  }, [formData.date, formData.serviceId]);

  // Autocompletado para clientes recurrentes desde localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('tonin_cliente_nombre');
      const savedPhone = localStorage.getItem('tonin_cliente_telefono');
      const savedPin = localStorage.getItem('tonin_pin');

      if (savedName || savedPhone || savedPin) {
        setFormData(prev => ({
          ...prev,
          name: savedName || prev.name,
          phone: savedPhone || prev.phone,
          pin: savedPin || prev.pin
        }));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (service) {
      setFormData(prev => ({ ...prev, serviceId: service.id.toString() }));
    }
  }, [service]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.serviceId) {
      setError("Por favor, selecciona un servicio.");
      setLoading(false);
      return;
    }
    
    if (!formData.phone || formData.phone.length < 9) {
      setError('El número de teléfono es obligatorio y debe ser válido');
      setLoading(false);
      return;
    }

    if (!formData.pin || formData.pin.length !== 4) {
      setError('Debes crear un PIN de 4 dígitos numéricos para gestionar tu cita.');
      setLoading(false);
      return;
    }

    const selectedServiceData = serviciosData.find(s => s.id.toString() === formData.serviceId);

    try {
      const response = await fetch('/api/crear-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          serviceName: selectedServiceData.name,
          pin: formData.pin,
          duracion: selectedServiceData.duracion
        })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Error interno del servidor. Respuesta: ' + text.substring(0, 50));
      }

      if (!response.ok) {
        if (data.stack) {
          console.error('Error detallado del Backend:', data.error);
          console.error('Stack Trace:', data.stack);
        }
        throw new Error(data.error || 'Error al crear la cita');
      }
      
      // Auto-guardado de cita activa en localStorage
      const activeBooking = {
        eventId: data.eventId,
        serviceName: selectedServiceData.name,
        date: formData.date,
        time: formData.time,
        phone: formData.phone,
        pin: formData.pin
      };

      localStorage.setItem('tonin_cita_activa', 'true');
      localStorage.setItem('tonin_cita', JSON.stringify(activeBooking));
      localStorage.setItem('tonin_bookings', JSON.stringify([activeBooking]));
      localStorage.setItem('tonin_cliente_nombre', formData.name);
      localStorage.setItem('tonin_cliente_telefono', formData.phone);
      localStorage.setItem('tonin_pin', formData.pin);

      setSuccessEventId(data.eventId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleImmediateCancel = async () => {
    const confirmCancel = window.confirm('¿Estás seguro de que deseas eliminar esta reserva?');
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      const response = await fetch('/api/cancelar-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: successEventId, phone: formData.phone, pin: formData.pin })
      });
      if (!response.ok) throw new Error('Error al cancelar');
      alert('Reserva eliminada correctamente.');

      localStorage.removeItem('tonin_cita_activa');
      localStorage.removeItem('tonin_cita');
      localStorage.setItem('tonin_bookings', '[]');

      setSuccessEventId(null);
      onClose();
    } catch (err) {
      alert('Hubo un problema al cancelar. Por favor, contacta con nosotros.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Pantalla de Éxito
  if (successEventId) {
    const selectedServiceData = serviciosData.find(s => s.id.toString() === formData.serviceId);
    const serviceName = selectedServiceData ? selectedServiceData.name : 'Servicio';
    
    const textToCopy = `Cita confirmada en Tonín Barbería\nServicio: ${serviceName}\nFecha: ${formData.date}\nHora: ${formData.time}\n`;

    const handleCopy = () => {
      navigator.clipboard.writeText(textToCopy);
      alert('¡Datos copiados al portapapeles!');
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-surface rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-center max-h-[90vh] overflow-y-auto border border-outline-variant/40">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[36px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-headline-lg text-primary mb-1 uppercase tracking-wider">¡Cita Confirmada!</h2>
          <p className="text-on-surface-variant mb-5 text-xs sm:text-sm">Tu reserva se ha completado con éxito. Aquí tienes los detalles:</p>
          
          <div className="bg-surface-container rounded-xl p-4 sm:p-5 mb-5 text-left border border-outline-variant/30">
            <div className="flex justify-between border-b border-outline-variant/20 pb-2 mb-2">
              <span className="font-semibold text-on-surface-variant text-xs sm:text-sm">Servicio:</span>
              <span className="font-bold text-on-surface text-xs sm:text-sm">{serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/20 pb-2 mb-2">
              <span className="font-semibold text-on-surface-variant text-xs sm:text-sm">Fecha:</span>
              <span className="font-bold text-on-surface text-xs sm:text-sm">{formData.date}</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/20 pb-2 mb-3">
              <span className="font-semibold text-on-surface-variant text-xs sm:text-sm">Hora:</span>
              <span className="font-bold text-primary text-xs sm:text-sm">{formData.time}</span>
            </div>
            
            <p className="text-[11px] text-on-surface-variant/80 text-center leading-relaxed">
              Puedes gestionar o cancelar tus citas en la pestaña <strong>'Mis Citas'</strong> con tu número de teléfono y PIN.
            </p>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-button text-xs sm:text-sm uppercase tracking-wider font-bold border border-outline-variant/40 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base text-primary">content_copy</span>
              Copiar Datos
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-95"
            >
              Finalizar
            </button>
            <button
              onClick={handleImmediateCancel}
              disabled={isCancelling}
              className="mt-1 w-full py-2 rounded-xl text-error font-medium hover:bg-error/10 transition-colors text-xs flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              {isCancelling ? 'Cancelando...' : 'Me he equivocado, cancelar ahora'}
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Paso 1: Pop-up informativo del PIN de seguridad
  if (paso === 1) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-surface rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-center border border-outline-variant/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border border-outline-variant/30"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {/* Icono de seguridad destacado */}
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 text-primary flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <h3 className="font-headline-lg text-2xl text-primary uppercase tracking-wider mb-3">
            Crea tu PIN
          </h3>

          <div className="bg-surface-container rounded-xl p-4 sm:p-5 border border-outline-variant/30 text-left mb-6">
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-center sm:text-left">
              🛡️ <strong>Crea tu PIN:</strong> En el formulario te pediremos que inventes un PIN de 4 dígitos. Si necesitas cancelar la cita desde otro dispositivo, te pediremos tu teléfono y este PIN.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaso(2)}
            className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-95"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    );
  }

  // Paso 2: Formulario de reserva
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-outline-variant/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border border-outline-variant/30"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
        
        <h2 className="text-xl sm:text-2xl font-headline-lg text-primary mb-1 uppercase tracking-wider">Reservar Cita</h2>
        <p className="text-xs text-on-surface-variant mb-5">Elige fecha y hora para tu servicio con Toñín.</p>
        
        {error && (
          <div className="mb-4 p-3.5 bg-error/20 border border-error/30 text-error rounded-xl text-xs sm:text-sm font-medium leading-relaxed">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
              Servicio
            </label>
            <select 
              required
              className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none appearance-none transition-all text-sm font-medium" 
              value={formData.serviceId} 
              onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
            >
              <option value="" disabled>Selecciona tu servicio...</option>
              {serviciosData.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duracion} min) - {s.price}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
              Nombre y Apellidos
            </label>
            <input 
              type="text" 
              required 
              placeholder="Ej: Rubén García"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
              Teléfono Móvil
            </label>
            <input 
              type="tel" 
              required 
              placeholder="Ej: 600 000 000"
              className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
              Crea un PIN de 4 dígitos (para gestionar tu cita)
            </label>
            <input 
              type="password" 
              inputMode="numeric"
              required 
              pattern="[0-9]{4}" 
              placeholder="•••• (4 dígitos numéricos)" 
              maxLength={4} 
              className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm tracking-widest text-center font-bold" 
              value={formData.pin} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFormData({...formData, pin: val});
              }} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                Fecha
              </label>
              <input 
                type="date" 
                required 
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm [color-scheme:dark]" 
                value={formData.date} 
                onChange={(e) => { setFormData({...formData, date: e.target.value, time: ''}); }} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                Hora
              </label>
              <select 
                required 
                disabled={cargandoHoras || !formData.date || horasDisponibles.length === 0}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none appearance-none transition-all text-sm font-medium disabled:opacity-50" 
                value={formData.time} 
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              >
                {!formData.date ? (
                  <option value="" disabled>Elige primero una fecha</option>
                ) : cargandoHoras ? (
                  <option value="" disabled>Cargando horas disponibles...</option>
                ) : horasDisponibles.length === 0 ? (
                  <option value="" disabled>No hay horas disponibles este día</option>
                ) : (
                  <>
                    <option value="" disabled>--:--</option>
                    {horasDisponibles.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="mt-2 w-full py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormularioReserva;
