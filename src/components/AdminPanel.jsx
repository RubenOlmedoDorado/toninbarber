import React, { useState, useEffect, useMemo } from 'react';

function AdminPanel({ onNavigateHome }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validandoAuth, setValidandoAuth] = useState(false);

  // Estados de datos de citas
  const [citasAdmin, setCitasAdmin] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cancelandoId, setCancelandoId] = useState(null);
  const [mensajeAccion, setMensajeAccion] = useState(null);

  // Función para obtener las citas reales desde Google Calendar
  const fetchCitas = async (passToUse) => {
    const token = passToUse || adminToken || sessionStorage.getItem('tonin_admin_pass');
    if (!token) return false;
    setCargandoCitas(true);
    setErrorCitas('');
    try {
      const res = await fetch(`/api/admin-citas?password=${encodeURIComponent(token)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-password': token
        }
      });
      const data = await res.json();
      if (res.status === 401) {
        handleLogout();
        setErrorMsg('Contraseña incorrecta');
        return false;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la agenda');
      }
      setCitasAdmin(data.citas || []);
      return true;
    } catch (err) {
      console.error('Error al cargar citas de Google Calendar:', err);
      setErrorCitas(err.message || 'Error al conectar con Google Calendar');
      return false;
    } finally {
      setCargandoCitas(false);
    }
  };

  // Comprobar si ya estaba autenticado en la sesión actual validando con el backend
  useEffect(() => {
    const isAuth = sessionStorage.getItem('tonin_admin_authenticated') === 'true';
    const savedPass = sessionStorage.getItem('tonin_admin_pass');
    if (isAuth && savedPass) {
      setAdminToken(savedPass);
      fetchCitas(savedPass).then((success) => {
        if (success) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('tonin_admin_authenticated');
          sessionStorage.removeItem('tonin_admin_pass');
          setIsAuthenticated(false);
        }
      });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanInput = password.trim();

    if (!cleanInput) {
      setErrorMsg('Por favor, introduce la contraseña.');
      return;
    }

    setValidandoAuth(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin-citas?password=${encodeURIComponent(cleanInput)}`, {
        headers: {
          'Authorization': `Bearer ${cleanInput}`,
          'x-admin-password': cleanInput
        }
      });
      const data = await res.json();

      if (res.status === 401) {
        setErrorMsg('Contraseña incorrecta');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      // Status 200: Autenticación exitosa validada por el backend
      setIsAuthenticated(true);
      setAdminToken(cleanInput);
      sessionStorage.setItem('tonin_admin_authenticated', 'true');
      sessionStorage.setItem('tonin_admin_pass', cleanInput);
      setCitasAdmin(data.citas || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al validar las credenciales.');
    } finally {
      setValidandoAuth(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAdminToken('');
    setCitasAdmin([]);
    sessionStorage.removeItem('tonin_admin_authenticated');
    sessionStorage.removeItem('tonin_admin_pass');
  };

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  // Cancelar cita directamente desde el panel
  const handleCancelarCita = async (cita) => {
    const nombre = cita.cliente || 'este cliente';
    const hora = cita.hora || '';
    const fecha = cita.fecha || '';
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres cancelar la cita de ${nombre} (${fecha} a las ${hora})?\n\nEsta acción eliminará el evento directamente de Google Calendar.`
    );
    if (!confirmacion) return;

    setCancelandoId(cita.eventId);
    setMensajeAccion(null);

    try {
      const res = await fetch('/api/cancelar-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: cita.eventId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cancelar la cita');
      }

      // Eliminar del estado local inmediatamente
      setCitasAdmin(prev => prev.filter(c => c.eventId !== cita.eventId));
      setMensajeAccion({
        tipo: 'exito',
        texto: `Cita de ${nombre} (${fecha} - ${hora}) cancelada con éxito.`
      });
    } catch (err) {
      setMensajeAccion({
        tipo: 'error',
        texto: 'Error al cancelar la cita: ' + err.message
      });
    } finally {
      setCancelandoId(null);
    }
  };

  // Filtrado en tiempo real según el término de búsqueda
  const citasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return citasAdmin;
    return citasAdmin.filter(c => {
      const clienteMatch = (c.cliente || '').toLowerCase().includes(q);
      const telMatch = (c.telefono || '').toLowerCase().includes(q);
      const servMatch = (c.servicio || '').toLowerCase().includes(q);
      const fechaMatch = (c.fecha || '').toLowerCase().includes(q);
      return clienteMatch || telMatch || servMatch || fechaMatch;
    });
  }, [citasAdmin, busqueda]);

  // Contadores estadísticos
  const hoyStr = new Date().toISOString().split('T')[0];
  const citasHoyCount = useMemo(() => {
    return citasAdmin.filter(c => c.fecha === hoyStr && !c.isBloqueo).length;
  }, [citasAdmin, hoyStr]);

  // VISTA 1: PANTALLA DE ACCESO RESTRINGIDO (INPUT DE CONTRASEÑA)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
        {/* Luz Ambiental de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Cabecera del login */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary/50 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <span className="material-symbols-outlined text-3xl text-primary">admin_panel_settings</span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl text-primary tracking-wider uppercase">
              TOÑÍN BARBER
            </h1>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-label-tag mt-1">
              Acceso Superusuario
            </p>
          </div>

          {/* Formulario de contraseña */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Contraseña Maestra
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Introduce la contraseña..."
                  autoFocus
                  className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-error-container/20 border border-error-container/40 rounded-xl text-xs text-error font-medium flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={validandoAuth}
              className="w-full py-3 rounded-xl bg-primary-container text-on-primary-fixed font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_2px_12px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer font-label-tag mt-2 disabled:opacity-60"
            >
              {validandoAuth ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  <span>Acceder al Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Volver a la web pública */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGoHome}
              className="text-xs text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 font-label-tag cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              <span>Volver a la web pública</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: PANEL DE SUPERUSUARIO (GESTIÓN DE CITAS EN TIEMPO REAL)
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body-md antialiased selection:bg-primary selection:text-on-primary-fixed relative overflow-x-hidden">
      {/* Luz Ambiental de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Barra de Navegación Superior del Admin */}
      <header className="w-full bg-surface-container border-b border-outline-variant/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-container-high border border-primary/50 overflow-hidden flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Logo Toñín Barber" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-xl text-lg text-primary tracking-wide">TOÑÍN BARBER</span>
                <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30">
                  Superusuario
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-none hidden sm:block">Panel de Administración</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleGoHome}
              className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer font-label-tag"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span className="hidden sm:inline">Ver Web</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 border border-secondary-container/50 text-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer font-label-tag"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Encabezado y resumen de estado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline-xl text-3xl sm:text-4xl text-primary tracking-wide uppercase drop-shadow-sm">
              Gestión de Citas
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-label-tag mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sincronizado con Google Calendar en tiempo real</span>
            </p>
          </div>

          {/* Tarjetas rápidas de indicadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 sm:px-4 flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-tag">Citas Hoy</span>
              <span className="text-xl sm:text-2xl font-bold text-primary font-headline-xl">
                {cargandoCitas ? '--' : citasHoyCount}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 sm:px-4 flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-tag">Total Próximas</span>
              <span className="text-xl sm:text-2xl font-bold text-on-surface font-headline-xl">
                {cargandoCitas ? '--' : citasAdmin.length}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 sm:px-4 flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-tag">Estado Sync</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[15px]">cloud_done</span>
                <span>En directo</span>
              </span>
            </div>
          </div>
        </div>

        {/* Notificación de Acción (Éxito o Error) */}
        {mensajeAccion && (
          <div
            className={`p-4 mb-6 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in ${
              mensajeAccion.tipo === 'exito'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-error-container/20 border-error-container/40 text-error'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[20px]">
                {mensajeAccion.tipo === 'exito' ? 'check_circle' : 'error'}
              </span>
              <span>{mensajeAccion.texto}</span>
            </div>
            <button
              onClick={() => setMensajeAccion(null)}
              className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error general al cargar */}
        {errorCitas && (
          <div className="p-4 mb-6 bg-error-container/20 border border-error-container/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-error">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span>{errorCitas}</span>
            </div>
            <button
              onClick={() => fetchCitas()}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/50 text-xs font-bold uppercase tracking-wider text-on-surface hover:text-primary transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Panel de Buscar: Input Grande y Estilizado + Botón Refrescar */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-lg">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[22px]">
              search
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-12 pr-10 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all shadow-inner"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => fetchCitas()}
              disabled={cargandoCitas}
              className="px-4 py-3 rounded-xl bg-primary-container text-on-primary-fixed font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer font-label-tag disabled:opacity-50"
              title="Refrescar citas de Google Calendar"
            >
              <span className={`material-symbols-outlined text-[18px] ${cargandoCitas ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{cargandoCitas ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Tabla o Lista de Tarjetas (Responsive) */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-3xl overflow-hidden shadow-2xl">
          {cargandoCitas ? (
            /* Esqueleto de carga animado */
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high"></div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-surface-container-high rounded"></div>
                      <div className="h-3 w-20 bg-surface-container-low rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-surface-container-high rounded hidden sm:block"></div>
                  <div className="h-4 w-20 bg-surface-container-high rounded hidden md:block"></div>
                  <div className="h-8 w-24 bg-surface-container-high rounded"></div>
                </div>
              ))}
            </div>
          ) : citasFiltradas.length === 0 ? (
            /* Estado vacío */
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center mb-4 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h3 className="font-headline-xl text-xl text-primary tracking-wide mb-1">
                {busqueda ? 'No se encontraron resultados' : 'No hay citas registradas'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm font-label-tag">
                {busqueda
                  ? `No se encontró ninguna cita con el criterio "${busqueda}". Prueba a buscar por otro término.`
                  : 'No hay citas pendientes sincronizadas en Google Calendar para los próximos 60 días.'}
              </p>
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="mt-4 px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs font-bold uppercase tracking-wider text-primary hover:bg-surface-container-low transition-all cursor-pointer font-label-tag"
                >
                  Ver todas las citas
                </button>
              )}
            </div>
          ) : (
            /* Tabla con resultados reales */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider font-label-tag">
                    <th className="py-4 px-4 sm:px-6">Cliente</th>
                    <th className="py-4 px-4 sm:px-6">Teléfono</th>
                    <th className="py-4 px-4 sm:px-6">Servicio</th>
                    <th className="py-4 px-4 sm:px-6">Fecha</th>
                    <th className="py-4 px-4 sm:px-6">Hora</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 font-body-md">
                  {citasFiltradas.map((cita) => {
                    const isHoy = cita.fecha === hoyStr;
                    const isCancellingThis = cancelandoId === cita.eventId;

                    return (
                      <tr
                        key={cita.eventId}
                        className={`hover:bg-surface-container-high/40 transition-colors ${
                          cita.isBloqueo ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Cliente */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                cita.isBloqueo
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-primary/20 text-primary border border-primary/40'
                              }`}
                            >
                              {cita.isBloqueo ? (
                                <span className="material-symbols-outlined text-[17px]">lock</span>
                              ) : (
                                cita.cliente.charAt(0).toUpperCase() || 'C'
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-on-surface flex items-center gap-2">
                                <span>{cita.cliente}</span>
                                {isHoy && (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[9px] font-bold uppercase tracking-wider">
                                    Hoy
                                  </span>
                                )}
                              </div>
                              {cita.pin && (
                                <span className="text-[10px] text-on-surface-variant/70 font-mono">
                                  PIN: {cita.pin}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Teléfono */}
                        <td className="py-4 px-4 sm:px-6">
                          {cita.telefono && cita.telefono !== 'No disponible' ? (
                            <a
                              href={`tel:${cita.telefono}`}
                              className="text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 font-medium group"
                            >
                              <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover:text-primary">
                                phone
                              </span>
                              <span>{cita.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-on-surface-variant/50 text-xs italic">No especificado</span>
                          )}
                        </td>

                        {/* Servicio */}
                        <td className="py-4 px-4 sm:px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              cita.isBloqueo
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-primary/10 border-primary/20 text-primary'
                            }`}
                          >
                            {cita.servicio}
                          </span>
                        </td>

                        {/* Fecha */}
                        <td className="py-4 px-4 sm:px-6 text-on-surface">
                          <span className="font-medium whitespace-nowrap">{cita.fecha}</span>
                        </td>

                        {/* Hora */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-1.5 text-primary font-bold">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span>{cita.hora}</span>
                            {cita.horaFin && (
                              <span className="text-xs text-on-surface-variant font-normal">
                                - {cita.horaFin}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleCancelarCita(cita)}
                            disabled={isCancellingThis}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-container/20 hover:bg-secondary-container/40 border border-secondary-container/50 text-secondary text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-label-tag disabled:opacity-50"
                            title="Cancelar cita en Google Calendar"
                          >
                            {isCancellingThis ? (
                              <>
                                <span className="material-symbols-outlined text-[15px] animate-spin">
                                  progress_activity
                                </span>
                                <span>Cancelando...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                <span>Cancelar Cita</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pie de tabla con resumen */}
          <div className="p-4 bg-surface-container-low/70 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[17px]">sync</span>
              <span>
                Mostrando {citasFiltradas.length} {citasFiltradas.length === 1 ? 'reserva' : 'reservas'}
                {busqueda && ` (filtradas de un total de ${citasAdmin.length})`}
              </span>
            </div>
            <span className="font-label-tag uppercase text-[10px] tracking-wider text-primary font-bold">
              Google Calendar Sync v2.0
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;
