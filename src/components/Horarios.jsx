import React from 'react';

const Horarios = () => {
  return (
    <div id="horarios" className="flex flex-col bg-surface-container-low rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border border-outline-variant/30 flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
          <span className="font-label-tag text-[11px] lg:text-xs uppercase tracking-widest text-primary font-bold">Disponibilidad</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span className="font-label-tag text-xs text-primary font-bold uppercase">Abierto</span>
        </div>
      </div>

      <h3 className="font-headline-xl-mobile lg:font-headline-xl text-[28px] lg:text-3xl text-on-surface uppercase tracking-wider mb-6">
        HORARIOS DE ATENCIÓN
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[16px] font-bold text-on-surface">Lunes a Viernes</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">Turno Tarde</span>
            </div>
          </div>
          <span className="font-headline-sm text-xl text-primary font-bold">16:00 - 21:00</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[16px] font-bold text-on-surface">Lunes a Viernes</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">Turno Tarde</span>
            </div>
          </div>
          <span className="font-headline-sm text-xl text-primary font-bold">16:00 - 21:00</span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-[16px] font-bold text-on-surface">Sábados</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">Fines de semana</span>
            </div>
          </div>
          <span className="font-body-md text-[14px] font-bold text-primary">Bajo Cita Previa</span>
        </div>
      </div>
    </div>
  );
};

export default Horarios;

