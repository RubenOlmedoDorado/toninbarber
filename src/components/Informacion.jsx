import React from 'react';

const Informacion = () => {
  const diasHorario = [
    { dia: 'Lunes', horas: '16:00 - 21:00', abierto: true },
    { dia: 'Martes', horas: '16:00 - 21:00', abierto: true },
    { dia: 'Miércoles', horas: '16:00 - 21:00', abierto: true },
    { dia: 'Jueves', horas: '16:00 - 21:00', abierto: true },
    { dia: 'Viernes', horas: '16:00 - 21:00', abierto: true },
    { dia: 'Sábados', horas: 'Bajo Cita Previa (Consultar)', abierto: true },
    { dia: 'Domingos', horas: 'Cerrado', abierto: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Layout Responsive: 1 columna en móvil, 2 columnas en tablet/escritorio */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Columna Izquierda: Equipo, Política de Cancelación y Redes */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Nuestro Equipo */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-md flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-primary/50 text-primary flex items-center justify-center shadow-lg mb-3 overflow-hidden p-1">
              <img 
                src="/logo.png" 
                alt="Toñín Barber" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="material-symbols-outlined text-3xl hidden">content_cut</span>
            </div>
            <h3 className="font-headline-lg text-2xl text-primary uppercase tracking-wider">Toñín</h3>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-0.5 font-label-tag">
              Barbero & Estilista
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant/90 mt-3 leading-relaxed font-body-md">
              Especialista en degradados milimétricos, técnicas clásicas a tijera y ritual completo de barba con toalla caliente.
            </p>
          </div>

          {/* Política de Cancelación */}
          <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 border border-outline-variant/30 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <h4 className="font-title-md text-base font-bold text-on-surface">Política de cancelación</h4>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Las citas no pueden cancelarse con menos de 1 hora de antelación. Límite de 1 reserva activa por semana.
            </p>
          </div>

          {/* Redes Sociales */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 shadow-md flex items-center justify-between">
            <div>
              <h4 className="font-title-md text-sm sm:text-base font-bold text-on-surface">Instagram Oficial</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">@tonin.barber</p>
            </div>
            <a
              href="https://instagram.com/tonin.barber"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl bg-surface-container-high hover:bg-primary text-primary hover:text-on-primary-fixed border border-outline-variant/30 hover:border-primary flex items-center justify-center transition-all shadow-md active:scale-95"
              aria-label="Instagram de Toñín Barber"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Columna Derecha: Horario de Atención */}
        <div className="md:col-span-7">
          <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 border border-outline-variant/30 shadow-md h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
                  <h4 className="font-headline-lg text-xl sm:text-2xl text-on-surface uppercase tracking-wider">
                    Horarios de Atención
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-primary/20">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-tag text-[10px] text-primary font-bold uppercase tracking-wider">Cita Previa</span>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-outline-variant/20 text-sm">
                {diasHorario.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <span className={`font-medium ${item.abierto ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                      {item.dia}
                    </span>
                    <span className={`text-xs sm:text-sm text-right ${item.abierto ? 'text-primary font-bold' : 'text-on-surface-variant/40 italic'}`}>
                      {item.horas}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/20 text-center text-xs text-on-surface-variant/70">
              Ubicación privada en San Fernando de Henares · Atención 100% individual
            </div>
          </div>
        </div>

      </div>

      <p className="text-center text-xs text-on-surface-variant/60 font-label-tag uppercase tracking-widest py-3">
        © {new Date().getFullYear()} TOÑÍN BARBER · PASIÓN POR EL OFICIO
      </p>
    </div>
  );
};

export default Informacion;
