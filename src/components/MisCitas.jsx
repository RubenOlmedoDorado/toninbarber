import React, { useState, useEffect } from 'react';

const MisCitas = ({ onClose }) => {
  // Comprobar si hay una cita activa guardada en localStorage
  const getStoredBooking = () => {
    try {
      const single = JSON.parse(localStorage.getItem('tonin_cita') || 'null');
      if (single && single.date && single.time) return single;

      const list = JSON.parse(localStorage.getItem('tonin_bookings') || '[]');
      if (Array.isArray(list) && list.length > 0) return list[0];
    } catch (e) {
      console.warn('Error leyendo cita de localStorage:', e);
    }
    return null;
  };

  const [activeBooking, setActiveBooking] = useState(getStoredBooking);

  // Estados para el formulario de recuperación (cuando no hay cita en el navegador)
  const [phone, setPhone] = useState(() => localStorage.getItem('tonin_cliente_telefono') || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sincronizar estado si localStorage cambia
  useEffect(() => {
    const stored = getStoredBooking();
    setActiveBooking(stored);
  }, []);

  // Cancelar la cita activa
  const handleCancel = async () => {
    if (!activeBooking) return;

    const confirmed = window.confirm('¿Estás seguro de que quieres anular tu cita? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setCancelling(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/cancelar-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeBooking.eventId,
          phone: activeBooking.phone || phone,
          pin: activeBooking.pin || pin
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la cita');
      }

      // Limpiar localStorage (conservando nombre y teléfono del cliente para futuros autocompletados)
      localStorage.removeItem('tonin_cita_activa');
      localStorage.removeItem('tonin_cita');
      localStorage.setItem('tonin_bookings', '[]');

      setActiveBooking(null);
      setSuccessMsg('Tu cita ha sido cancelada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la cita. Inténtalo de nuevo.');
    } finally {
      setCancelling(false);
    }
  };

  // Buscar cita por teléfono y PIN (si entra desde otro móvil)
  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!phone || phone.length < 9) {
      setError('Por favor, introduce un teléfono móvil válido.');
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/mis-citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cita no encontrada o PIN incorrecto');
      }

      const foundCita = data.cita || (data.citas && data.citas[0]);
      if (!foundCita) {
        throw new Error('Cita no encontrada o PIN incorrecto');
      }

      const newActive = {
        eventId: foundCita.eventId || foundCita.id,
        serviceName: foundCita.serviceName || (foundCita.summary ? foundCita.summary.replace(/^Cita:\s*[^–-]+[-–]\s*/i, '').replace(/^Cita:\s*/i, '').trim() : 'Servicio Barbería'),
        date: foundCita.date,
        time: foundCita.time,
        phone: phone,
        pin: pin
      };

      // Guardar en localStorage para este navegador
      localStorage.setItem('tonin_cita_activa', 'true');
      localStorage.setItem('tonin_cita', JSON.stringify(newActive));
      localStorage.setItem('tonin_bookings', JSON.stringify([newActive]));
      localStorage.setItem('tonin_cliente_telefono', phone);
      localStorage.setItem('tonin_pin', pin);

      setActiveBooking(newActive);
      setSuccessMsg('¡Cita encontrada y guardada en este dispositivo!');
    } catch (err) {
      setError(err.message || 'Cita no encontrada o PIN incorrecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-outline-variant/40">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border border-outline-variant/30 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
        
        {/* Título de la sección */}
        <h2 className="text-xl sm:text-2xl font-headline-lg text-primary mb-1 uppercase tracking-wider">
          Mis Citas
        </h2>
        <p className="text-xs text-on-surface-variant mb-5">
          {activeBooking 
            ? 'Gestiona o cancela tu reserva activa.' 
            : 'Consulta tu cita con tu teléfono y PIN de 4 dígitos.'}
        </p>

        {/* Mensajes de Feedback */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-error/20 border border-error/30 text-error rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* CASO 1: HAY UNA CITA GUARDADA EN EL NAVEGADOR -> OCULTA CUALQUIER FORMULARIO */}
        {activeBooking ? (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-label-tag">
                  Tu Cita Activa
                </h3>
              </div>
              <span className="text-[10px] text-green-400 font-bold bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Confirmada
              </span>
            </div>

            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 shadow-xl relative overflow-hidden">
              <h4 className="text-lg font-bold text-on-surface mb-3">
                {activeBooking.serviceName || 'Servicio Barbería'}
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant mb-4 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant/70 uppercase font-semibold">Fecha</p>
                    <p className="font-bold text-on-surface text-xs sm:text-sm">{activeBooking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">schedule</span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant/70 uppercase font-semibold">Hora</p>
                    <p className="font-bold text-on-surface text-xs sm:text-sm">{activeBooking.time}</p>
                  </div>
                </div>
              </div>

              {activeBooking.pin && (
                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4 bg-surface-container-high/60 px-3.5 py-2 rounded-xl border border-outline-variant/20">
                  <span className="text-[11px] font-medium">PIN de gestión:</span>
                  <span className="font-mono font-bold text-primary tracking-widest text-sm bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                    {activeBooking.pin}
                  </span>
                </div>
              )}

              {/* Botón rojo Cancelar Cita */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-400 hover:text-red-300 border border-red-500/40 hover:border-red-500 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider font-label-button shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className={`material-symbols-outlined text-base ${cancelling ? 'animate-spin' : ''}`}>
                  {cancelling ? 'progress_activity' : 'delete'}
                </span>
                <span>
                  {cancelling ? 'Cancelando...' : 'Cancelar Cita'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* CASO 2: NO HAY CITA EN EL NAVEGADOR -> PEQUEÑO FORMULARIO PIDIENDO TELÉFONO Y PIN */
          <div className="animate-in fade-in duration-200">
            <div className="text-center p-4 bg-surface-container/60 rounded-2xl border border-outline-variant/30 mb-5">
              <div className="w-11 h-11 rounded-full bg-surface-container-high text-primary flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-2xl">smartphone</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface mb-1">Buscar cita activa</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Introduce el número de teléfono y el PIN de 4 dígitos que elegiste al reservar para recuperar tu cita.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-label-tag">
                  Teléfono Móvil
                </label>
                <input 
                  type="tel" 
                  required 
                  placeholder="Ej: 600 000 000"
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 font-label-tag">
                  PIN de 4 dígitos
                </label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  required 
                  pattern="[0-9]{4}" 
                  placeholder="•••• (4 números)" 
                  maxLength={4} 
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container-high outline-none transition-all text-sm tracking-widest text-center font-bold" 
                  value={pin} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                  }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="mt-1 w-full py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(245,158,11,0.25)] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                  {loading ? 'progress_activity' : 'search'}
                </span>
                <span>{loading ? 'Buscando cita...' : 'Buscar mi cita'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisCitas;
