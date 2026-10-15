import React, { useState } from 'react';

const Galeria = () => {
  const [activeImage, setActiveImage] = useState(null);

  const fotos = [
    { 
      src: '/gallery/corte7.jpg', 
      alt: 'Diseño Freestyle a Navaja & Fade',
      position: 'object-[center_25%]'
    },
    { 
      src: '/gallery/corte6.jpg', 
      alt: 'Taper Fade & Textura Mullet',
      position: 'object-[center_30%]'
    },
    { 
      src: '/gallery/corte1.png', 
      alt: 'Degradado Fade & Tijera',
      position: 'object-center'
    },
    { 
      src: '/gallery/corte2.png', 
      alt: 'Textura Superior & Acabado Mate',
      position: 'object-center'
    },
    { 
      src: '/gallery/corte3.png', 
      alt: 'Corte Urbano Street Style',
      position: 'object-center'
    },
    { 
      src: '/gallery/corte4.png', 
      alt: 'Perfilado de Barba & Ritual Navaja',
      position: 'object-center'
    },
    { 
      src: '/gallery/corte5.png', 
      alt: 'Diseño Personalizado & Fade',
      position: 'object-center'
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Grid Responsive: 2 columnas en móvil, 3 columnas en escritorio */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {fotos.map((foto, index) => (
          <div
            key={index}
            onClick={() => setActiveImage(foto)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30 hover:border-primary/60 cursor-pointer shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <img
              src={foto.src}
              alt={foto.alt}
              className={`w-full h-full object-cover ${foto.position || 'object-center'} transition-transform duration-500 group-hover:scale-105`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-[11px] font-medium text-white/90 truncate">
                {foto.alt}
              </span>
            </div>
            {/* Icono de expandir en la esquina inferior derecha */}
            <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-high/90 text-primary border border-primary/30 flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary-fixed shadow-md">
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </div>
          </div>
        ))}
      </div>

      {/* Botón Instagram estilo Toñín Barber */}
      <div className="flex justify-center mt-2">
        <a
          href="https://instagram.com/tonin.barber"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/30 hover:border-primary/50 font-label-button text-xs sm:text-sm uppercase tracking-wider font-bold transition-all shadow-md active:scale-95 group"
        >
          <span className="material-symbols-outlined text-lg text-primary">photo_camera</span>
          <span>Ver más trabajos en Instagram</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </a>
      </div>

      {/* Modal Lightbox */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-lg sm:max-w-xl w-full max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-surface-container-high text-on-surface hover:text-primary hover:bg-surface-container-highest flex items-center justify-center transition-colors border border-outline-variant/40"
              aria-label="Cerrar vista previa"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-outline-variant/30 bg-surface-container-lowest"
            />
            <p className="text-on-surface-variant text-xs sm:text-sm mt-3 text-center font-medium font-body-md">
              {activeImage.alt} · <span className="text-primary font-bold">Toñín Barber</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Galeria;
