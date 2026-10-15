import React, { useState } from 'react';
import FormularioReserva from './FormularioReserva';

const Hero = () => {
  const [isReservaOpen, setIsReservaOpen] = useState(false);
  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 pt-8 lg:pt-16 pb-8 lg:pb-24 relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] lg:w-[700px] h-[300px] lg:h-[700px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Text & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/90 shadow-sm mb-4 lg:mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-tag text-[11px] lg:text-xs uppercase tracking-widest text-primary font-bold">Auténtico Street Style</span>
          </div>

          <h1 className="font-headline-xl text-[40px] lg:text-6xl tracking-wider text-primary uppercase drop-shadow-sm leading-tight mb-4">
            TU BARBERÍA <br className="hidden lg:block"/> DE BARRIO
          </h1>

          <p className="font-body-md lg:font-body-lg text-[14px] lg:text-[18px] text-on-surface-variant max-w-xs lg:max-w-xl mb-6 lg:mb-10 leading-relaxed">
            Cortes precisos, degradados quirúrgicos y el trato cercano de toda la vida en tu rincón urbano.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8 lg:mb-10">
            <button 
              onClick={() => setIsReservaOpen(true)}
              className="w-full sm:w-auto py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_24px_rgba(245,158,11,0.38)] flex items-center justify-center gap-2"
            >
              <span>¡Reserva tu cita!</span>
              <span className="hidden sm:inline material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {isReservaOpen && (
            <FormularioReserva 
              service={null}
              onClose={() => setIsReservaOpen(false)}
              onSuccess={() => setIsReservaOpen(false)}
            />
          )}

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm lg:max-w-md">
            <div className="flex items-center gap-2 lg:gap-3 py-2 lg:py-3 px-3 lg:px-4 bg-surface-container rounded-lg lg:rounded-xl shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[18px] lg:text-[24px]">verified</span>
              <span className="font-label-tag text-[11px] lg:text-xs text-on-surface uppercase tracking-wide text-left font-bold">Atención Personalizada</span>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 py-2 lg:py-3 px-3 lg:px-4 bg-surface-container rounded-lg lg:rounded-xl shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-[18px] lg:text-[24px]">local_fire_department</span>
              <span className="font-label-tag text-[11px] lg:text-xs text-on-surface uppercase tracking-wide text-left font-bold">Ambiente Auténtico</span>
            </div>
          </div>
        </div>

        {/* Right Column: Image */}
        <div className="lg:col-span-5 flex items-center justify-center relative mt-8 lg:mt-0">
          <div className="relative w-full max-w-[280px] lg:max-w-[420px] aspect-square mx-auto flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/40 via-primary-container/30 to-on-tertiary-container/30 rounded-2xl lg:rounded-3xl blur-xl lg:blur-3xl transition-all duration-500"></div>
            <div className="relative w-full h-full lg:rounded-2xl lg:bg-surface-container-low/60 lg:border lg:border-outline-variant/30 flex items-center justify-center lg:shadow-2xl">
              <img 
                alt="Tonín Barber - Tu Barbería de Barrio" 
                className="relative w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] lg:drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)] transform transition-transform duration-300 hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkjSVuzlF8DORn-C-4_jICMjuLILD0cpt3tcQPAbHWivl5rlApy1VesHItl6iw9m64NlPyVaOH8lSERl1DUBATucrJKXR05I8z1hzU598l-fFVLkwQ5N-72RzmYoza8aAEaBl0I9y3vjxtWE_fD-L95oCgyiY1htTS88DzH062OYc5ay-TDAKxfFR7v-ZxrDj7R20hiSv1Z1tjgrEZK62sXh-3SM3Df2uYS5IFnhih-mBUjL6D1j0hjskEycWFWi_PUYc"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
