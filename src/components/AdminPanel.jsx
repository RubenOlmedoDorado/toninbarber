import React, { useState, useEffect, useMemo } from 'react';

/**
 * Modal para Reprogramar Cita (Exclusivo Superusuario)
 * Consulta en tiempo real las horas libres de la nueva fecha elegida en /api/disponibilidad
 * y permite confirmar el cambio mediante PATCH a /api/admin-citas con x-admin-pass.
 */
function ModalReprogramar({ cita, adminToken, onClose, onRescheduled }) {
  const [newDate, setNewDate] = useState(cita.fecha || '');
  const [newTime, setNewTime] = useState('');
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [reprogramadaExito, setReprogramadaExito] = useState(false);

  // Fecha mínima: Hoy en formato YYYY-MM-DD
  const hoyStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

  // Cargar horas disponibles al cambiar la fecha
  useEffect(() => {
    if (!newDate) {
      setHorasDisponibles([]);
      return;
    }

    setCargandoHoras(true);
    setErrorModal('');

    const duracion = cita.duracion || 30;
    fetch(`/api/disponibilidad?date=${newDate}&duracion=${duracion}`)
      .then(res => res.json())
      .then(data => {
        const slots = data.disponibles || [];
        setHorasDisponibles(slots);
        // Si la hora ya no está libre en la nueva fecha, reiniciar selección
        if (newTime && !slots.includes(newTime)) {
          setNewTime('');
        }
      })
      .catch(err => {
        console.error('Error al consultar disponibilidad:', err);
        setErrorModal('Error al obtener horas disponibles');
        setHorasDisponibles([]);
      })
      .finally(() => {
        setCargandoHoras(false);
      });
  }, [newDate, cita.duracion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      setErrorModal('Por favor, selecciona una fecha y una hora libre.');
      return;
    }

    setGuardando(true);
    setErrorModal('');

    try {
      const res = await fetch('/api/admin-citas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': adminToken
        },
        body: JSON.stringify({
          eventId: cita.eventId,
          action: 'reschedule',
          newDate: newDate,
          newTime: newTime,
          duracion: cita.duracion || 30
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo reprogramar la cita');
      }

      setReprogramadaExito(true);
      if (onRescheduled) {
        onRescheduled(cita.eventId, newDate, newTime);
      }
    } catch (err) {
      setErrorModal(err.message || 'Error al reprogramar la cita');
    } finally {
      setGuardando(false);
    }
  };

  // Enlace para WhatsApp con mensaje pre-redactado
  const cleanPhone = (cita.cleanPhone || cita.telefono || '').replace(/\D/g, '').slice(-9);
  const waPhone = cleanPhone.length === 9 ? `34${cleanPhone}` : '';
  const waMensaje = encodeURIComponent(
    `Hola ${cita.cliente}, te escribimos de Toñín Barber para confirmarte que tu cita ha sido reprogramada para el día ${newDate} a las ${newTime}. ¡Nos vemos en la barbería!`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-outline-variant/40 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border border-outline-variant/30 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">edit_calendar</span>
          <h3 className="font-headline-lg text-xl sm:text-2xl text-primary uppercase tracking-wider">
            Reprogramar Cita
          </h3>
        </div>

        {/* Resumen de la cita actual */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 mb-5 text-xs text-on-surface-variant space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold text-on-surface">Cliente:</span>
            <span className="font-bold text-on-surface">{cita.cliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-on-surface">Servicio:</span>
            <span>{cita.servicio}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-on-surface">Fecha y hora actual:</span>
            <span className="text-primary font-bold">{cita.fecha} · {cita.hora}</span>
          </div>
        </div>

        {errorModal && (
          <div className="mb-4 p-3 bg-error-container/20 border border-error-container/40 rounded-xl text-xs text-error font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorModal}</span>
          </div>
        )}

        {reprogramadaExito ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h4 className="text-lg font-bold text-on-surface">¡Cita reprogramada con éxito!</h4>
            <p className="text-xs text-on-surface-variant">
              Nueva fecha: <strong className="text-primary">{newDate}</strong> a las <strong className="text-primary">{newTime}</strong>
            </p>

            <div className="flex flex-col gap-2 pt-2">
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone}?text=${waMensaje}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all font-label-tag"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Avisar al cliente por WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-label-tag"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                Nueva Fecha
              </label>
              <input
                type="date"
                required
                min={hoyStr}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setNewTime('');
                }}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary focus:bg-surface-container outline-none transition-all text-sm [color-scheme:dark]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label-tag">
                  Hora Libre
                </label>
                {cargandoHoras && (
                  <span className="text-[11px] text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                    <span>Consultando agenda...</span>
                  </span>
                )}
              </div>

              {!newDate ? (
                <p className="text-xs text-on-surface-variant/60 italic p-3 bg-surface-container-low rounded-xl">
                  Selecciona primero una fecha para ver los huecos disponibles.
                </p>
              ) : cargandoHoras ? (
                <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-on-surface-variant">
                  Comprobando huecos libres en Google Calendar...
                </div>
              ) : horasDisponibles.length === 0 ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  El peluquero no puede a esa hora o ese día. Prueba con otra fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {horasDisponibles.map((h) => {
                    const isSelected = newTime === h;
                    return (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setNewTime(h)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-primary-container text-on-primary-fixed border-primary shadow-sm'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary/40'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !newDate || !newTime}
                className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer font-label-tag flex items-center gap-1.5"
              >
                {guardando ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Confirmar Cambio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Panel de Administración Principal (Exclusivo Superusuario)
 */
function AdminPanel({ onNavigateHome }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validandoAuth, setValidandoAuth] = useState(false);

  // Pestaña activa dentro del panel ('citas' | 'bloqueos')
  const [adminTab, setAdminTab] = useState('citas');

  // Estados de datos de citas
  const [citasAdmin, setCitasAdmin] = useState([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'hoy' | 'pending' | 'attended' | 'no_show' | 'reincidentes'
  const [accionEnCursoId, setAccionEnCursoId] = useState(null);
  const [mensajeAccion, setMensajeAccion] = useState(null);

  // Estado para el modal de reprogramación
  const [citaAReprogramar, setCitaAReprogramar] = useState(null);

  // Estados para el formulario de bloqueo de agenda
  const [bloqueoFecha, setBloqueoFecha] = useState('');
  const [bloqueoDiaCompleto, setBloqueoDiaCompleto] = useState(true);
  const [bloqueoHoraInicio, setBloqueoHoraInicio] = useState('16:00');
  const [bloqueoHoraFin, setBloqueoHoraFin] = useState('21:00');
  const [bloqueoMotivo, setBloqueoMotivo] = useState('');
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false);

  const hoyStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

  // Función para obtener las citas reales desde Google Calendar con x-admin-pass
  const fetchCitas = async (passToUse) => {
    const token = passToUse || adminToken || sessionStorage.getItem('tonin_admin_pass');
    if (!token) return false;

    setCargandoCitas(true);
    setErrorCitas('');

    try {
      const res = await fetch('/api/admin-citas', {
        method: 'GET',
        headers: {
          'x-admin-pass': token
        }
      });

      const data = await res.json();

      if (res.status === 401) {
        handleLogout();
        setErrorMsg('Contraseña incorrecta o sesión expirada.');
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

  // Comprobar si ya estaba autenticado en la sesión actual
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
      const res = await fetch('/api/admin-citas', {
        method: 'GET',
        headers: {
          'x-admin-pass': cleanInput
        }
      });

      const data = await res.json();

      if (res.status === 401) {
        setErrorMsg('Contraseña incorrecta. Acceso no autorizado.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al validar las credenciales.');
      }

      // Autenticación exitosa
      setIsAuthenticated(true);
      setAdminToken(cleanInput);
      sessionStorage.setItem('tonin_admin_authenticated', 'true');
      sessionStorage.setItem('tonin_admin_pass', cleanInput);
      setCitasAdmin(data.citas || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al validar credenciales.');
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

  // =========================================================================
  // GESTIÓN DE ESTADOS: ASISTIÓ / FALLÓ (PATCH /api/admin-citas)
  // =========================================================================
  const handleUpdateStatus = async (cita, newStatus) => {
    setAccionEnCursoId(cita.eventId);
    setMensajeAccion(null);

    try {
      const res = await fetch('/api/admin-citas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': adminToken
        },
        body: JSON.stringify({
          eventId: cita.eventId,
          action: 'status',
          status: newStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar el estado de la cita');
      }

      // Actualizar estado local inmediatamente
      setCitasAdmin(prev => prev.map(c => {
        if (c.eventId === cita.eventId) {
          return { ...c, status: newStatus };
        }
        return c;
      }));

      const textoStatus = newStatus === 'attended' 
        ? 'marcada como ASISTIÓ' 
        : newStatus === 'no_show' 
        ? 'marcada como AUSENCIA (Falló)' 
        : 'restablecida a PENDIENTE';

      setMensajeAccion({
        tipo: 'exito',
        texto: `Cita de ${cita.cliente} ${textoStatus}. Sincronizado en Google Calendar.`
      });
    } catch (err) {
      setMensajeAccion({
        tipo: 'error',
        texto: 'Error al cambiar estado: ' + err.message
      });
    } finally {
      setAccionEnCursoId(null);
    }
  };

  // =========================================================================
  // ELIMINAR CITA O DESBLOQUEAR (DELETE /api/admin-citas)
  // =========================================================================
  const handleEliminarEvento = async (item) => {
    const esBloqueo = item.isBloqueo || item.type === 'block';
    const titulo = esBloqueo ? 'este bloqueo de agenda' : `la cita de ${item.cliente}`;
    const advertencia = esBloqueo
      ? '¿Estás seguro de que deseas desbloquear este tramo horario? Los clientes podrán volver a reservar.'
      : `¿Estás seguro de que quieres eliminar la cita de ${item.cliente} (${item.fecha} a las ${item.hora})?\n\nEsta acción eliminará el evento de Google Calendar sin requerir PIN.`;

    const confirmado = window.confirm(advertencia);
    if (!confirmado) return;

    setAccionEnCursoId(item.eventId);
    setMensajeAccion(null);

    try {
      const res = await fetch('/api/admin-citas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': adminToken
        },
        body: JSON.stringify({ eventId: item.eventId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar el evento');
      }

      setCitasAdmin(prev => prev.filter(c => c.eventId !== item.eventId));
      setMensajeAccion({
        tipo: 'exito',
        texto: `${esBloqueo ? 'Bloqueo eliminado' : 'Cita eliminada'} con éxito de Google Calendar.`
      });
    } catch (err) {
      setMensajeAccion({
        tipo: 'error',
        texto: 'Error al eliminar: ' + err.message
      });
    } finally {
      setAccionEnCursoId(null);
    }
  };

  // =========================================================================
  // CREAR BLOQUEO DE AGENDA (POST /api/admin-citas)
  // =========================================================================
  const handleCrearBloqueo = async (e) => {
    e.preventDefault();
    if (!bloqueoFecha) {
      alert('Debes seleccionar una fecha para el bloqueo.');
      return;
    }

    setGuardandoBloqueo(true);
    setMensajeAccion(null);

    try {
      const res = await fetch('/api/admin-citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pass': adminToken
        },
        body: JSON.stringify({
          date: bloqueoFecha,
          isFullDay: bloqueoDiaCompleto,
          startTime: bloqueoHoraInicio,
          endTime: bloqueoHoraFin,
          reason: bloqueoMotivo || 'No disponible'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el bloqueo en Google Calendar');
      }

      setMensajeAccion({
        tipo: 'exito',
        texto: `Bloqueo para el día ${bloqueoFecha} creado correctamente en Google Calendar.`
      });

      // Limpiar formulario y refrescar lista
      setBloqueoMotivo('');
      setBloqueoFecha('');
      fetchCitas();
    } catch (err) {
      setMensajeAccion({
        tipo: 'error',
        texto: 'Error al crear bloqueo: ' + err.message
      });
    } finally {
      setGuardandoBloqueo(false);
    }
  };

  // Callback al terminar de reprogramar una cita
  const handleCitaReprogramada = (eventId, newDate, newTime) => {
    setCitasAdmin(prev => prev.map(c => {
      if (c.eventId === eventId) {
        return {
          ...c,
          fecha: newDate,
          hora: newTime
        };
      }
      return c;
    }));
  };

  // =========================================================================
  // FILTRADO Y ESTADÍSTICAS
  // =========================================================================
  const appointmentsOnly = useMemo(() => {
    return citasAdmin.filter(c => c.type !== 'block' && !c.isBloqueo);
  }, [citasAdmin]);

  const blocksOnly = useMemo(() => {
    return citasAdmin.filter(c => c.type === 'block' || c.isBloqueo);
  }, [citasAdmin]);

  const citasFiltradas = useMemo(() => {
    let list = appointmentsOnly;

    // Filtro por estado
    if (filtroEstado === 'hoy') {
      list = list.filter(c => c.fecha === hoyStr);
    } else if (filtroEstado === 'pending') {
      list = list.filter(c => c.status === 'pending');
    } else if (filtroEstado === 'attended') {
      list = list.filter(c => c.status === 'attended');
    } else if (filtroEstado === 'no_show') {
      list = list.filter(c => c.status === 'no_show');
    } else if (filtroEstado === 'reincidentes') {
      list = list.filter(c => c.noShowCount > 0);
    }

    // Filtro por término de búsqueda
    const q = busqueda.toLowerCase().trim();
    if (!q) return list;

    return list.filter(c => {
      const clienteMatch = (c.cliente || '').toLowerCase().includes(q);
      const telMatch = (c.telefono || '').toLowerCase().includes(q);
      const servMatch = (c.servicio || '').toLowerCase().includes(q);
      const fechaMatch = (c.fecha || '').toLowerCase().includes(q);
      return clienteMatch || telMatch || servMatch || fechaMatch;
    });
  }, [appointmentsOnly, filtroEstado, busqueda, hoyStr]);

  const citasHoyCount = useMemo(() => {
    return appointmentsOnly.filter(c => c.fecha === hoyStr).length;
  }, [appointmentsOnly, hoyStr]);

  const reincidentesCount = useMemo(() => {
    return appointmentsOnly.filter(c => c.noShowCount > 0).length;
  }, [appointmentsOnly]);

  // VISTA 1: LOGIN SUPERUSUARIO
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
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

  // VISTA 2: PANEL DE CONTROL COMPLETO
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body-md antialiased selection:bg-primary selection:text-on-primary-fixed relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Barra de Navegación Superior */}
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
              <p className="text-[11px] text-on-surface-variant leading-none hidden sm:block">Gestor Integral de Agenda</p>
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
        
        {/* Cabecera y Tarjetas de Indicadores */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline-xl text-3xl sm:text-4xl text-primary tracking-wide uppercase drop-shadow-sm">
              Panel de Control
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-label-tag mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sincronizado con Google Calendar en tiempo real</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-tag">Citas Hoy</span>
              <span className="text-xl sm:text-2xl font-bold text-primary font-headline-xl">
                {cargandoCitas ? '--' : citasHoyCount}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-tag">Total Citas</span>
              <span className="text-xl sm:text-2xl font-bold text-on-surface font-headline-xl">
                {cargandoCitas ? '--' : appointmentsOnly.length}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-tag">Bloqueos</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 font-headline-xl">
                {cargandoCitas ? '--' : blocksOnly.length}
              </span>
            </div>
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-3 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-tag">Reincidentes</span>
              <span className="text-xl sm:text-2xl font-bold text-red-400 font-headline-xl">
                {cargandoCitas ? '--' : reincidentesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Notificación de Acción */}
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

        {/* Error de conexión */}
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

        {/* Pestañas de Navegación del Panel: Citas de Clientes vs Bloquear Horas / Días */}
        <div className="flex border-b border-outline-variant/30 mb-6 gap-2 sm:gap-4">
          <button
            onClick={() => setAdminTab('citas')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider font-label-tag flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminTab === 'citas'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Citas de Clientes</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface">
              {appointmentsOnly.length}
            </span>
          </button>

          <button
            onClick={() => setAdminTab('bloqueos')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider font-label-tag flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminTab === 'bloqueos'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lock_clock</span>
            <span>Bloquear Horas / Días</span>
            {blocksOnly.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {blocksOnly.length}
              </span>
            )}
          </button>
        </div>

        {/* ===================================================================== */}
        {/* SECCIÓN 1: CITAS DE CLIENTES                                          */}
        {/* ===================================================================== */}
        {adminTab === 'citas' && (
          <div className="space-y-6">
            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-lg">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por cliente, teléfono, servicio o fecha..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-11 pr-10 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all shadow-inner"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Filtro por estado */}
              <div className="flex items-center gap-2">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs font-semibold text-on-surface outline-none focus:border-primary cursor-pointer font-label-tag"
                >
                  <option value="todos">Todas las Citas</option>
                  <option value="hoy">Solo Citas de Hoy</option>
                  <option value="pending">Solo Pendientes</option>
                  <option value="attended">Solo Asistieron (✅)</option>
                  <option value="no_show">Solo Ausencias (❌)</option>
                  <option value="reincidentes">Solo Reincidentes (⚠️)</option>
                </select>

                <button
                  onClick={() => fetchCitas()}
                  disabled={cargandoCitas}
                  className="px-3.5 py-2.5 rounded-xl bg-primary-container text-on-primary-fixed font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer font-label-tag disabled:opacity-50"
                  title="Refrescar citas"
                >
                  <span className={`material-symbols-outlined text-[17px] ${cargandoCitas ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span className="hidden sm:inline">{cargandoCitas ? '...' : 'Actualizar'}</span>
                </button>
              </div>
            </div>

            {/* Listado de Citas */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-3xl overflow-hidden shadow-2xl">
              {cargandoCitas ? (
                <div className="p-8 text-center text-on-surface-variant space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-xs">Sincronizando agenda con Google Calendar...</p>
                </div>
              ) : citasFiltradas.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center mb-4 text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-3xl">event_busy</span>
                  </div>
                  <h3 className="font-headline-xl text-xl text-primary tracking-wide mb-1">
                    {busqueda || filtroEstado !== 'todos' ? 'No se encontraron citas con esos filtros' : 'No hay citas registradas'}
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-sm font-label-tag">
                    {busqueda || filtroEstado !== 'todos'
                      ? 'Prueba a cambiar el filtro de estado o borrar el término de búsqueda.'
                      : 'No hay citas programadas para los próximos 60 días.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {citasFiltradas.map((cita) => {
                    const isHoy = cita.fecha === hoyStr;
                    const isOperating = accionEnCursoId === cita.eventId;
                    const cleanPhone = (cita.cleanPhone || cita.telefono || '').replace(/\D/g, '').slice(-9);
                    const waPhone = cleanPhone.length === 9 ? `34${cleanPhone}` : '';
                    const waText = encodeURIComponent(
                      `Hola ${cita.cliente}, te escribimos de Toñín Barber para recordarte tu cita el día ${cita.fecha} a las ${cita.hora} (${cita.servicio}). ¡Te esperamos!`
                    );

                    return (
                      <div
                        key={cita.eventId}
                        className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-surface-container-high/40 ${
                          cita.status === 'attended'
                            ? 'bg-emerald-950/10'
                            : cita.status === 'no_show'
                            ? 'bg-red-950/15'
                            : ''
                        }`}
                      >
                        {/* Columna Izquierda: Datos del Cliente y Servicio */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              cita.status === 'attended'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : cita.status === 'no_show'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-primary/20 text-primary border-primary/40'
                            }`}
                          >
                            {cita.cliente.charAt(0).toUpperCase() || 'C'}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-on-surface text-base truncate">
                                {cita.cliente}
                              </span>

                              {isHoy && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[9px] font-bold uppercase tracking-wider">
                                  Hoy
                                </span>
                              )}

                              {/* Alerta de Reincidente */}
                              {cita.noShowCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                  <span className="material-symbols-outlined text-[13px]">warning</span>
                                  <span>Reincidente ({cita.noShowCount} {cita.noShowCount === 1 ? 'ausencia' : 'ausencias'})</span>
                                </span>
                              )}

                              {/* Badge de Estado Actual */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  cita.status === 'attended'
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : cita.status === 'no_show'
                                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                    : 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant'
                                }`}
                              >
                                {cita.status === 'attended' ? '✅ Asistió' : cita.status === 'no_show' ? '❌ Falló' : '⏳ Pendiente'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                              <span className="font-semibold text-primary/90 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">content_cut</span>
                                <span>{cita.servicio}</span>
                              </span>

                              {cita.telefono && cita.telefono !== 'No disponible' && (
                                <a
                                  href={`tel:${cita.telefono}`}
                                  className="hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">call</span>
                                  <span>{cita.telefono}</span>
                                </a>
                              )}

                              {cita.pin && (
                                <span className="font-mono text-on-surface-variant/70">
                                  PIN: {cita.pin}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Columna Centro: Fecha y Hora */}
                        <div className="flex items-center gap-4 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/30 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs text-on-surface">
                            <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                            <span className="font-bold">{cita.fecha}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span>{cita.hora}</span>
                            {cita.horaFin && (
                              <span className="text-[11px] text-on-surface-variant font-normal">
                                - {cita.horaFin}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Columna Derecha: Acciones Rápidas */}
                        <div className="flex flex-wrap items-center gap-1.5 justify-end shrink-0">
                          {/* Botón Asistió */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(cita, cita.status === 'attended' ? 'pending' : 'attended')}
                            disabled={isOperating}
                            title="Marcar asistencia (evento verde en Google Calendar)"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-label-tag ${
                              cita.status === 'attended'
                                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                : 'bg-surface-container-high hover:bg-emerald-950/40 text-on-surface hover:text-emerald-300 border border-outline-variant/40'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">check</span>
                            <span>{cita.status === 'attended' ? 'Asistió' : 'Asistió'}</span>
                          </button>

                          {/* Botón Falló */}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(cita, cita.status === 'no_show' ? 'pending' : 'no_show')}
                            disabled={isOperating}
                            title="Marcar ausencia (evento rojo en Google Calendar)"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-label-tag ${
                              cita.status === 'no_show'
                                ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
                                : 'bg-surface-container-high hover:bg-red-950/40 text-on-surface hover:text-red-300 border border-outline-variant/40'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                            <span>{cita.status === 'no_show' ? 'Falló' : 'Falló'}</span>
                          </button>

                          {/* Botón Cambiar Fecha */}
                          <button
                            type="button"
                            onClick={() => setCitaAReprogramar(cita)}
                            disabled={isOperating}
                            title="Reprogramar fecha y hora"
                            className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary border border-primary/30 hover:border-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-label-tag"
                          >
                            <span className="material-symbols-outlined text-[15px]">event_repeat</span>
                            <span className="hidden sm:inline">Reprogramar</span>
                          </button>

                          {/* Botón WhatsApp */}
                          {waPhone && (
                            <a
                              href={`https://wa.me/${waPhone}?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Avisar por WhatsApp"
                              className="w-8 h-8 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            </a>
                          )}

                          {/* Botón Eliminar Cita */}
                          <button
                            type="button"
                            onClick={() => handleEliminarEvento(cita)}
                            disabled={isOperating}
                            title="Eliminar cita permanentemente"
                            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECCIÓN 2: BLOQUEAR HORAS / DÍAS DE AGENDA                           */}
        {/* ===================================================================== */}
        {adminTab === 'bloqueos' && (
          <div className="space-y-6">
            {/* Formulario de Nuevo Bloqueo */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">lock_clock</span>
                <h3 className="font-headline-lg text-xl sm:text-2xl text-primary uppercase tracking-wider">
                  Crear Bloqueo de Agenda
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Bloquea días completos o tramos de horas específicos en Google Calendar. Durante este horario, ningún cliente podrá reservar citas.
              </p>

              <form onSubmit={handleCrearBloqueo} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                      Fecha del Bloqueo
                    </label>
                    <input
                      type="date"
                      required
                      min={hoyStr}
                      value={bloqueoFecha}
                      onChange={(e) => setBloqueoFecha(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary outline-none transition-all text-sm [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                      Motivo del Bloqueo (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cierre por descanso, Curso de barbería, Médico..."
                      value={bloqueoMotivo}
                      onChange={(e) => setBloqueoMotivo(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Switch Día Completo */}
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-label-tag block">
                      Bloquear Día Completo
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Cierra toda la jornada de atención de ese día.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bloqueoDiaCompleto}
                      onChange={(e) => setBloqueoDiaCompleto(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>

                {/* Si no es día completo: Selectores de hora de inicio y fin */}
                {!bloqueoDiaCompleto && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                        Hora Inicio
                      </label>
                      <input
                        type="time"
                        value={bloqueoHoraInicio}
                        onChange={(e) => setBloqueoHoraInicio(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary outline-none transition-all text-sm [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 font-label-tag">
                        Hora Fin
                      </label>
                      <input
                        type="time"
                        value={bloqueoHoraFin}
                        onChange={(e) => setBloqueoHoraFin(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-on-surface focus:border-primary outline-none transition-all text-sm [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={guardandoBloqueo || !bloqueoFecha}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-fixed font-label-button text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {guardandoBloqueo ? (
                      <>
                        <span className="material-symbols-outlined text-[17px] animate-spin">progress_activity</span>
                        <span>Creando Bloqueo...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[17px]">lock</span>
                        <span>Bloquear en Calendario</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Bloqueos Activos */}
            <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <h4 className="font-headline-lg text-lg text-on-surface uppercase tracking-wider">
                    Bloqueos Activos ({blocksOnly.length})
                  </h4>
                </div>
              </div>

              {blocksOnly.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-xs">
                  No hay bloqueos activos de agenda registrados.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {blocksOnly.map((b) => (
                    <div key={b.eventId} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">lock</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                            <span>{b.cliente || 'Bloqueo de agenda'}</span>
                            {b.isFullDay && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider">
                                Día Completo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                            <span>{b.fecha}</span>
                            {!b.isFullDay && (
                              <>
                                <span>·</span>
                                <span className="text-primary font-medium">{b.hora}{b.horaFin ? ` - ${b.horaFin}` : ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarEvento(b)}
                        title="Desbloquear este horario para que los clientes puedan reservar"
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-label-tag"
                      >
                        <span className="material-symbols-outlined text-[16px]">lock_open</span>
                        <span>Desbloquear</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Reprogramación */}
      {citaAReprogramar && (
        <ModalReprogramar
          cita={citaAReprogramar}
          adminToken={adminToken}
          onClose={() => setCitaAReprogramar(null)}
          onRescheduled={handleCitaReprogramada}
        />
      )}
    </div>
  );
}

export default AdminPanel;
