import React from 'react';

const resenasData = [
  {
    id: 1,
    author: 'Rubén',
    date: 'Oct 2026',
    rating: 5,
    service: 'Corte + Barba',
    barber: 'Toñín',
    comment: 'Atención al detalle insuperable. El degradado quedó milimétrico y el arreglo de barba con toalla caliente fue una experiencia de 10. Mi barbero de confianza.'
  },
  {
    id: 2,
    author: 'David M.',
    date: 'Oct 2026',
    rating: 5,
    service: 'Corte',
    barber: 'Toñín',
    comment: 'Puntualidad absoluta, trato impecable y un corte perfecto. El sistema de cita previa va genial, llegas y te atienden en el minuto exacto.'
  },
  {
    id: 3,
    author: 'Carlos R.',
    date: 'Sep 2026',
    rating: 5,
    service: 'Mechas + Corte',
    barber: 'Toñín',
    comment: 'Increíble trabajo con el color y el corte. Es difícil encontrar a alguien que entienda exactamente el tono que buscas y lo clave a la primera. Muy recomendable.'
  },
  {
    id: 4,
    author: 'Alejandro',
    date: 'Sep 2026',
    rating: 5,
    service: 'Corte + Cejas',
    barber: 'Toñín',
    comment: 'Fade limpio y perfilado de cejas perfecto con navaja. Se nota los años de experiencia y la pasión por el oficio.'
  },
  {
    id: 5,
    author: 'Marcos G.',
    date: 'Ago 2026',
    rating: 5,
    service: 'Corte',
    barber: 'Toñín',
    comment: 'Llevo cortándome el pelo con Toñín más de un año y nunca defrauda. Profesionalidad y buen ambiente garantizados siempre.'
  },
  {
    id: 6,
    author: 'Javier L.',
    date: 'Ago 2026',
    rating: 5,
    service: 'Corte + Barba',
    barber: 'Toñín',
    comment: 'El mejor corte urbano de la zona. Se toma su tiempo con cada cliente para que salgas impecable.'
  }
];

const Resenas = () => {
  return (
    <div className="flex flex-col gap-5">
      {/* Resumen de valoración con identidad Toñín Barber */}
      <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 border border-outline-variant/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-headline-xl text-primary tracking-wider leading-none">
            5.0
          </div>
          <div className="flex flex-col">
            <div className="flex text-primary text-base tracking-widest">
              ★★★★★
            </div>
            <span className="text-xs text-on-surface-variant font-label-tag tracking-wider uppercase mt-1">
              Basado en 50+ reseñas verificadas
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          100% Recomendado
        </div>
      </div>

      {/* Grid de Reseñas: 1 columna en móvil, 2 columnas en tablet/escritorio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resenasData.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/20 hover:border-primary/40 shadow-md flex flex-col justify-between gap-3 transition-all duration-200"
          >
            <div>
              {/* Fila superior: Estrellas y Autor / Fecha */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex text-primary text-sm tracking-widest">
                  {'★'.repeat(item.rating)}
                </div>
                <div className="text-xs font-medium text-on-surface-variant font-label-tag">
                  {item.author} · {item.date}
                </div>
              </div>

              {/* Comentario */}
              <p className="text-sm text-on-surface/90 leading-relaxed font-body-md">
                "{item.comment}"
              </p>
            </div>

            {/* Fila inferior: Servicio y Barbero */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
              <span className="font-semibold text-on-surface">{item.service}</span>
              <span>Barbero: <strong className="text-primary font-bold">{item.barber}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resenas;
