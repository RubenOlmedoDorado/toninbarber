import React, { useState, useEffect } from 'react';
import Servicios from './components/Servicios';
import Resenas from './components/Resenas';
import Galeria from './components/Galeria';
import Informacion from './components/Informacion';
import FormularioReserva from './components/FormularioReserva';
import MisCitas from './components/MisCitas';

function App() {
  const [activeTab, setActiveTab] = useState('servicios');
  const [isReservaOpen, setIsReservaOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isMisCitasOpen, setIsMisCitasOpen] = useState(false);
  const [hasSavedBooking, setHasSavedBooking] = useState(false);

  useEffect(() => {
    try {
      const isActiva = localStorage.getItem('tonin_cita_activa') === 'true';
      const saved = JSON.parse(localStorage.getItem('tonin_bookings') || '[]');
      const single = JSON.parse(localStorage.getItem('tonin_cita') || 'null');
      setHasSavedBooking(isActiva || (Array.isArray(saved) && saved.length > 0) || !!single);
    } catch (e) {
      setHasSavedBooking(false);
    }
  }, [isReservaOpen, isMisCitasOpen]);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setIsReservaOpen(true);
  };

  const tabs = [
    { id: 'servicios', label: 'Servicios', icon: 'content_cut' },
    { id: 'resenas', label: 'Reseñas', icon: 'star' },
    { id: 'imagenes', label: 'Imágenes', icon: 'photo_camera' },
    { id: 'informacion', label: 'Información', icon: 'info' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased selection:bg-primary selection:text-on-primary-fixed flex flex-col relative overflow-x-hidden">
      
      {/* Luz Ambiental de fondo de la marca Toñín Barber */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] lg:w-[850px] h-[350px] sm:h-[500px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      {/* Contenedor Principal Responsive: Móvil (<640px) tipo App, Tablet/Escritorio elegante y amplio */}
      <div className="w-full max-w-5xl mx-auto flex flex-col px-4 sm:px-6 lg:px-8 pt-5 pb-20">
        
        {/* Barra superior de utilidad: Botón Mis Citas */}
        <div className="w-full flex justify-end items-center mb-4 sm:mb-6">
          <button
            onClick={() => setIsMisCitasOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-on-surface text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer font-label-tag"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">calendar_month</span>
            <span>Mis Citas</span>
            {hasSavedBooking && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Cabecera de Marca (Header de Toñín Barber) */}
        <header className="flex flex-col items-center text-center mb-8">
          {/* Logo real de Toñín Barber */}
          <div className="relative mb-3.5 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-container-high p-1 border-2 border-primary/50 shadow-[0_0_30px_rgba(245,158,11,0.22)] overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Logo Toñín Barber" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="material-symbols-outlined text-primary text-4xl hidden">content_cut</span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary-fixed flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[13px] font-bold">verified</span>
            </span>
          </div>

          {/* Nombre con tipografía original Anton de la marca */}
          <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-6xl tracking-wider text-primary uppercase drop-shadow-sm leading-tight">
            TOÑÍN BARBER
          </h1>

          {/* Subtítulo oficial */}
          <p className="text-xs sm:text-sm text-on-surface-variant font-label-tag uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
            <span>Servicio exclusivo con cita previa</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
          </p>
        </header>

        {/* Barra de Navegación por Pestañas (Segmented Pill Tabs Responsive - Grid simétrico anti-descuadre) */}
        <nav className="w-full max-w-xl mx-auto bg-surface-container-low border border-outline-variant/30 p-1 sm:p-1.5 rounded-full grid grid-cols-4 gap-1 mb-8 shadow-inner items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-2 sm:py-2.5 px-1 sm:px-2 rounded-full text-[11px] sm:text-xs md:text-sm font-label-tag font-bold uppercase tracking-tight sm:tracking-wider transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-center ${
                  isActive
                    ? 'bg-primary-container text-on-primary-fixed shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high/60'
                }`}
              >
                <span className="hidden md:inline material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Contenido Dinámico según la Pestaña Activa */}
        <main className="flex-1 w-full animate-in fade-in duration-200">
          {activeTab === 'servicios' && (
            <Servicios onSelectService={handleSelectService} />
          )}

          {activeTab === 'resenas' && (
            <Resenas />
          )}

          {activeTab === 'imagenes' && (
            <Galeria />
          )}

          {activeTab === 'informacion' && (
            <Informacion />
          )}
        </main>
      </div>

      {/* Modales */}
      {isReservaOpen && (
        <FormularioReserva
          service={selectedService}
          onClose={() => {
            setIsReservaOpen(false);
            setSelectedService(null);
          }}
        />
      )}

      {isMisCitasOpen && (
        <MisCitas onClose={() => setIsMisCitasOpen(false)} />
      )}
    </div>
  );
}

export default App;
