import React, { useState } from 'react';

export const serviciosData = [
  {
    id: 1,
    name: 'Corte',
    duracion: 30,
    time: '30 min',
    price: '10,00 €',
    popular: true,
    description: 'Corte clásico o moderno adaptado a tus facciones, con degradado limpio a máquina y acabado a tijera.'
  },
  {
    id: 2,
    name: 'Corte + Cejas',
    duracion: 35,
    time: '35 min',
    price: '12,00 €',
    popular: false,
    description: 'Corte completo con perfilado fino de cejas con navaja para un acabado impecable.'
  },
  {
    id: 3,
    name: 'Corte + Barba',
    duracion: 45,
    time: '45 min',
    price: '14,00 €',
    popular: true,
    description: 'Ritual completo: corte de pelo y arreglo minucioso de barba con toalla caliente, hidratación y navaja.'
  },
  {
    id: 4,
    name: 'Mechas + Corte',
    duracion: 90,
    time: '90 min',
    price: '29,00 €',
    popular: false,
    description: 'Combo top: decoloración profesional, matizado en tendencia y corte de pelo con peinado final.'
  },
  {
    id: 5,
    name: 'Mechas',
    duracion: 60,
    time: '60 min',
    price: '20,00 €',
    popular: false,
    description: 'Aplicación de mechas en tonos modernos con productos de máxima protección para tu cabello.'
  },
  {
    id: 6,
    name: 'Decoloración',
    duracion: 70,
    time: '70 min',
    price: '20,00 €',
    popular: false,
    description: 'Decoloración global o base, ideal para rubio platino o preparación para tintes y colores fantasía.'
  }
];

const ServiceCard = ({ service, onSelectService }) => {
  const [showDesc, setShowDesc] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-2xl p-4 sm:p-5 border border-outline-variant/30 hover:border-primary/50 shadow-md transition-all duration-200 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-3">
        {/* Izquierda: Título, duración y botón de descripción */}
        <div className="flex flex-col min-w-0 pr-2">
          <h4 className="font-title-md text-base sm:text-lg font-bold text-on-surface truncate">
            {service.name}
          </h4>
          <span className="font-label-tag text-xs text-primary/90 font-medium mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {service.time}
          </span>
          <button
            type="button"
            onClick={() => setShowDesc(!showDesc)}
            className="text-left text-xs font-medium text-on-surface-variant hover:text-primary mt-2 underline underline-offset-2 transition-colors cursor-pointer w-fit"
          >
            {showDesc ? 'Ocultar descripción' : 'Ver descripción'}
          </button>
        </div>

        {/* Derecha: Botón de reserva con identidad Toñín Barber */}
        <button
          type="button"
          onClick={() => onSelectService(service)}
          className="shrink-0 bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs sm:text-sm font-bold py-2.5 px-3.5 sm:px-4 rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.25)] active:scale-95 transition-all whitespace-nowrap uppercase tracking-wider"
        >
          Reservar | {service.price}
        </button>
      </div>

      {/* Descripción desplegable */}
      {showDesc && (
        <div className="mt-1 pt-3 border-t border-outline-variant/20 text-xs sm:text-sm text-on-surface-variant/90 leading-relaxed animate-in fade-in duration-150">
          {service.description}
        </div>
      )}
    </div>
  );
};

const Servicios = ({ onSelectService }) => {
  const serviciosPopulares = serviciosData.filter((s) => s.popular);

  return (
    <div className="flex flex-col gap-8">
      {/* Bloque 1: Servicios más populares */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <h3 className="font-headline-lg text-lg sm:text-xl uppercase tracking-wider text-primary">
              Servicios Más Populares
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Top Demandados
          </span>
        </div>

        {/* Responsive Grid: 1 columna en móvil, 2 en tablet/escritorio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviciosPopulares.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelectService={onSelectService}
            />
          ))}
        </div>
      </div>

      {/* Bloque 2: Todos los servicios */}
      <div>
        <div className="mb-3 px-1">
          <h3 className="font-headline-lg text-lg sm:text-xl uppercase tracking-wider text-on-surface">
            Todos los Servicios
          </h3>
        </div>

        {/* Responsive Grid: 1 columna en móvil, 2 en tablet/escritorio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviciosData.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelectService={onSelectService}
            />
          ))}

          {/* Tarjeta de Bono Ahorro integrada con estética Toñín Barber */}
          <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl p-5 border border-primary/40 shadow-lg relative overflow-hidden flex flex-col justify-between gap-3 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary-fixed font-label-tag text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">military_tech</span>
                Bono Ahorro
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                1 Corte de Regalo
              </span>
            </div>

            <div>
              <h4 className="font-headline-lg text-lg sm:text-xl text-on-surface uppercase tracking-wider mb-1">
                Bono de Barbería (4 Cortes + 1 Gratis)
              </h4>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Los 4 cortes deben usarse en un plazo de 30 días. Válido por 6 meses desde su adquisición.
              </p>
            </div>

            <div className="text-xs font-medium text-on-surface/90 bg-surface-container-lowest/80 p-3 rounded-xl border border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              <span>Consulta y adquiere tu bono directamente con Toñín en tu próxima visita.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Servicios;
