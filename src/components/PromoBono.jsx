import React from 'react';

const PromoBono = () => {
  return (
    <div className="relative w-full h-full rounded-2xl lg:rounded-3xl bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-lowest p-6 lg:p-10 overflow-hidden shadow-2xl border border-primary/30 flex flex-col justify-between">
      <div className="absolute -top-10 -right-10 w-40 lg:w-48 h-40 lg:h-48 bg-primary/20 rounded-full blur-2xl"></div>
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary-container via-primary to-on-tertiary"></div>
      
      <div>
        <div className="flex items-center justify-between gap-2 mt-1 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary-fixed font-label-tag text-[11px] lg:text-xs font-bold tracking-wider uppercase">
            <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            OFERTA EXCLUSIVA
          </span>
          <div className="flex items-center gap-1 text-primary font-bold">
            <span className="material-symbols-outlined text-[18px]">military_tech</span>
            <span className="font-label-tag text-[11px] lg:text-xs tracking-wider uppercase">Ahorro Máximo</span>
          </div>
        </div>

        <h3 className="font-headline-lg lg:font-headline-xl text-[28px] lg:text-4xl text-primary uppercase tracking-wider mb-4">
          BONO DE BARBERÍA
        </h3>
        
        <div className="bg-surface-container-lowest/80 rounded-xl lg:rounded-2xl p-4 lg:p-6 mb-6 border border-outline-variant/20">
          <p className="font-headline-xl-mobile lg:font-headline-xl text-[28px] lg:text-3xl text-on-surface uppercase tracking-wide leading-tight">
            4 CORTES + <span className="text-primary underline decoration-primary/40 underline-offset-4">1 CORTE DE REGALO</span>
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-8">
          <div className="flex items-start gap-2.5 text-on-surface-variant font-body-sm lg:font-body-md text-[12px] lg:text-[14px]">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">check_circle</span>
            <span>Los 4 cortes deben usarse en un plazo de 30 días.</span>
          </div>
          <div className="flex items-start gap-2.5 text-on-surface-variant font-body-sm lg:font-body-md text-[12px] lg:text-[14px]">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">verified</span>
            <span>Válido por 6 meses desde la fecha de emisión y compra.</span>
          </div>
        </div>
      </div>

      <div className="w-full py-5 px-6 rounded-xl bg-surface-container-high border border-primary/20 text-center shadow-inner">
        <p className="font-title-md text-[16px] lg:text-[18px] font-bold tracking-wide text-primary mb-1">
          ¿Quieres tu bono?
        </p>
        <p className="font-body-sm lg:font-body-md text-on-surface-variant">
          Adquiere tu bono directamente en nuestro local consultando con el peluquero.
        </p>
      </div>
    </div>
  );
};

export default PromoBono;
