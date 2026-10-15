import React from 'react';

const Footer = () => {
  const [cancelMessage, setCancelMessage] = React.useState(null);
  const [savedBookings, setSavedBookings] = React.useState([]);

  React.useEffect(() => {
    try {
      const bookings = JSON.parse(localStorage.getItem('tonin_bookings') || '[]');
      // Filter out past bookings automatically? Simple approach: keep all, let the user cancel or let them pile up.
      // Better: keep all for now to keep it simple.
      setSavedBookings(bookings);
    } catch (e) {
      // Ignore
    }
  }, []);

  const handleCancelSaved = async (token) => {
    const confirmCancel = window.confirm('¿Estás seguro de que deseas cancelar esta reserva?');
    if (!confirmCancel) return;
    
    setCancelMessage(null);
    try {
      const res = await fetch('/api/cancelar-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if(res.ok) {
        setCancelMessage({ type: 'success', text: '✅ Cita cancelada con éxito.' });
        const updatedBookings = savedBookings.filter(b => b.token !== token);
        setSavedBookings(updatedBookings);
        localStorage.setItem('tonin_bookings', JSON.stringify(updatedBookings));
      } else {
        setCancelMessage({ type: 'error', text: '❌ No se pudo cancelar (puede que ya haya pasado).' });
        // Optionally remove if it failed because it's past, but we leave it for manual cleanup.
      }
    } catch(error) { 
      setCancelMessage({ type: 'error', text: '❌ Error de conexión al cancelar la cita.' });
    }
  };

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/20 pt-16 pb-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 flex flex-col items-center text-center">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center p-0.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container via-primary-container to-on-tertiary opacity-80"></div>
            <div className="relative w-full h-full bg-surface-container-lowest rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]">content_cut</span>
            </div>
          </div>
          <span className="font-headline-lg text-2xl tracking-wider text-primary uppercase">Tonín Barbería</span>
        </div>
        
        <p className="font-title-md text-[18px] lg:text-3xl italic text-primary tracking-wide mb-3 max-w-2xl">
          “Se garantiza profesionalidad. Muchas gracias.”
        </p>
        
        <span className="font-label-tag text-xs text-on-surface-variant uppercase tracking-widest mb-8 block">
          TONÍN BARBERÍA • PASIÓN POR EL OFICIO
        </span>
        
        <div className="w-full max-w-xs h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-8"></div>
        
        <div className="flex flex-wrap justify-center gap-4 lg:gap-8 mb-8 text-on-surface-variant font-label-tag text-[11px] lg:text-xs uppercase tracking-wider">
          <a className="hover:text-primary transition-colors" href="#">Inicio</a>
          <a className="hover:text-primary transition-colors" href="#servicios">Tarifas</a>
          <a className="hover:text-primary transition-colors" href="#galeria">El Estilo</a>
          <a className="hover:text-primary transition-colors" href="#promociones">Bono de Barbería</a>
          <a className="hover:text-primary transition-colors" href="#horarios">Horarios</a>
        </div>
        
        <div className="mb-8 w-full max-w-xs">
          <a 
            href="https://instagram.com/tonin.barber" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full py-3.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-title-md text-[16px] font-bold text-on-surface">@tonin.barber</span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">Síguenos</span>
              </div>
            </div>
          </a>
        </div>

        <div className="w-full max-w-sm mb-12">
          <h3 className="font-title-md text-[16px] font-bold text-on-surface mb-3 uppercase">¿Necesitas cancelar tu cita?</h3>
          
          {savedBookings.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {savedBookings.map((booking) => (
                <div key={booking.token} className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3">
                  <div className="text-left text-sm text-on-surface-variant">
                    <p className="font-bold text-on-surface mb-1">Cita Guardada</p>
                    <p>El {booking.date} a las {booking.time}</p>
                    <p className="text-xs mt-1">Servicio: {booking.serviceName}</p>
                  </div>
                  <button 
                    onClick={() => handleCancelSaved(booking.token)}
                    className="w-full py-2 rounded-lg bg-error/10 text-error font-bold uppercase tracking-wider hover:bg-error hover:text-on-error transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Cancelar esta cita
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-on-surface-variant mb-2">O introduce tu código manualmente:</p>
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault();
            const token = e.target.token.value;
            if(!token) return;
            setCancelMessage(null);
            try {
              const res = await fetch('/api/cancelar-cita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
              });
              if(res.ok) {
                setCancelMessage({ type: 'success', text: '✅ Cita cancelada con éxito. Esperamos verte pronto.' });
                e.target.reset();
                // Limpiar de localStorage también por si acaso
                const updatedBookings = savedBookings.filter(b => b.token !== token);
                setSavedBookings(updatedBookings);
                localStorage.setItem('tonin_bookings', JSON.stringify(updatedBookings));
              } else {
                setCancelMessage({ type: 'error', text: '❌ Error al cancelar. Revisa el token e inténtalo de nuevo.' });
              }
            } catch(error) { 
              setCancelMessage({ type: 'error', text: '❌ Error de conexión al cancelar la cita.' });
            }
          }}>
            <input name="token" type="text" placeholder="Introduce tu Token" required className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-on-surface focus:border-primary outline-none" />
            <button type="submit" className="py-2 px-4 rounded-xl bg-error text-on-error font-bold uppercase tracking-wider hover:bg-error-container hover:text-on-error-container transition-colors text-sm">
              Cancelar
            </button>
          </form>
          {cancelMessage && (
            <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${cancelMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {cancelMessage.text}
            </div>
          )}
        </div>

        <p className="font-body-sm text-xs text-on-surface-variant/60">© 2025 Tonín Barber. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
