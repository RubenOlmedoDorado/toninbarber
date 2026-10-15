import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Componente inteligente para la instalación de la PWA según el dispositivo del usuario.
 * Detecta:
 * - Móvil iOS (iPhone / iPad) -> Muestra botón que abre Modal Bottom Sheet guiado.
 * - Móvil Android -> Escucha beforeinstallprompt y dispara instalación nativa.
 * - Escritorio -> Muestra bloque elegante con Código QR a https://toninbarber.es.
 */
function InstallAppPrompt({ variant = 'floating' }) {
  const [deviceType, setDeviceType] = useState('desktop'); // 'ios' | 'android' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 1. Detección de Dispositivo y Sistema Operativo
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator) return;

    // Comprobar si ya está instalada / ejecutándose en standalone
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standaloneMode);

    const ua = navigator.userAgent || navigator.vendor || window.opera || '';

    // Detección de iOS (iPhone, iPad, iPod o iPadOS en Safari)
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Detección de Android
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 2. Listener para beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      console.log('App Toñín Barber instalada');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Manejador de clic para Android
  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Para instalar Toñín Barber en tu Android, pulsa en el menú de opciones (⋮) de tu navegador Chrome y selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".'
      );
    }
  };

  // Manejador de clic para iOS
  const handleIosInstall = () => {
    setShowIosModal(true);
  };

  // Si ya está instalada o el usuario cerró el banner flotante
  if (isStandalone || (isDismissed && variant === 'floating')) {
    return null;
  }

  // =========================================================================
  // VARIANTE INLINE / ESCRITORIO (Para usar dentro de Información o secciones)
  // =========================================================================
  if (variant === 'inline' || deviceType === 'desktop') {
    return (
      <div className="w-full bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Luz Ambiental de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Texto e Información */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider font-label-tag">
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span>App Disponible para Móviles</span>
            </div>

            <h3 className="font-headline-xl text-2xl sm:text-3xl text-primary uppercase tracking-wide">
              Lleva a Toñín Barber en tu bolsillo
            </h3>

            <p className="text-sm text-on-surface-variant font-body-md leading-relaxed max-w-lg">
              Escanea este QR con tu móvil para instalar nuestra App y gestionar tus citas más rápido.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-on-surface-variant/80 font-label-tag">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span>iOS (Safari)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span>Android (Chrome)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                <span>Sin ocupar espacio</span>
              </div>
            </div>
          </div>

          {/* Tarjeta del Código QR */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="bg-white p-3.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-2 border-primary/40 relative group transition-transform hover:scale-105">
              <QRCodeSVG
                value="https://toninbarber.es"
                size={160}
                bgColor="#FFFFFF"
                fgColor="#121212"
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/logo.png",
                  x: undefined,
                  y: undefined,
                  height: 32,
                  width: 32,
                  excavate: true,
                }}
              />
            </div>
            <span className="text-[11px] font-bold text-primary font-mono tracking-wider mt-2.5 bg-surface-container-high px-3 py-0.5 rounded-full border border-outline-variant/30">
              toninbarber.es
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VARIANTE FLOTANTE: MÓVIL ANDROID O MÓVIL iOS
  // =========================================================================
  return (
    <>
      {/* Botón Flotante en la interfaz móvil */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom duration-300">
        <div className="bg-surface-container/95 backdrop-blur-md border border-primary/50 rounded-2xl p-3 sm:p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3">
          <button
            onClick={deviceType === 'ios' ? handleIosInstall : handleAndroidInstall}
            className="flex-1 flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
              <span className="material-symbols-outlined text-primary text-[22px]">
                {deviceType === 'ios' ? 'phone_iphone' : 'install_mobile'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors font-label-tag flex items-center gap-1.5">
                <span>📲 Instalar App</span>
                <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                  {deviceType === 'ios' ? 'iPhone' : 'Android'}
                </span>
              </span>
              <span className="text-[11px] text-on-surface-variant font-body-sm leading-tight">
                {deviceType === 'ios'
                  ? 'Toca para ver los 2 pasos rápidos'
                  : 'Reserva tus citas en 1 clic'}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={deviceType === 'ios' ? handleIosInstall : handleAndroidInstall}
              className="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-fixed text-xs font-bold uppercase tracking-wider hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer font-label-tag"
            >
              Instalar
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL GUÍA PARA MÓVIL iOS (BOTTOM SHEET ELEGANTE)                        */}
      {/* ========================================================================= */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
          <div
            className="w-full max-w-lg bg-surface-container border-t sm:border border-primary/40 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] relative animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de arrastre / Handle */}
            <div className="w-12 h-1 bg-outline-variant/60 rounded-full mx-auto mb-5 sm:hidden"></div>

            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high border-2 border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0 overflow-hidden p-1">
                  <img src="/logo.png" alt="Logo Toñín Barber" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-headline-xl text-xl sm:text-2xl text-primary uppercase tracking-wide leading-tight">
                    Instala la App de Toñín Barber
                  </h3>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-label-tag">
                    Guía Rápida para iPhone / iPad
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Subtítulo explicativo */}
            <p className="text-xs sm:text-sm text-on-surface-variant font-body-md mb-6 leading-relaxed">
              Es súper fácil. Para tener la app en tu iPhone y reservar en un clic, sigue estos dos pasos:
            </p>

            {/* Pasos Visuales */}
            <div className="space-y-4 mb-6">
              {/* Paso 1 */}
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-fixed font-headline-xl font-bold text-sm flex items-center justify-center shrink-0 shadow">
                  1
                </div>
                <div className="flex-1 text-xs sm:text-sm text-on-surface leading-snug">
                  <span>
                    Pulsa el botón <strong className="text-primary font-bold">Compartir</strong> (el cuadrado con la flecha hacia arriba) en la barra inferior de Safari.
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[11px] text-primary font-medium">
                    <span className="material-symbols-outlined text-[16px]">ios_share</span>
                    <span>Botón Compartir en Safari</span>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-fixed font-headline-xl font-bold text-sm flex items-center justify-center shrink-0 shadow">
                  2
                </div>
                <div className="flex-1 text-xs sm:text-sm text-on-surface leading-snug">
                  <span>
                    Selecciona <strong className="text-primary font-bold">Añadir a la pantalla de inicio</strong> (el icono del cuadrado con un símbolo +).
                  </span>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[11px] text-primary font-medium">
                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                    <span>Añadir a pantalla de inicio</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Entendido */}
            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-3.5 rounded-xl bg-primary-container text-on-primary-fixed font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer font-label-tag"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Entendido</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallAppPrompt;

