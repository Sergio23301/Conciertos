// ============================================
// CONFIGURACIÓN — URLs de tus microservicios
// ============================================
const API_DJANGO      = 'http://127.0.0.1:8000/api/conciertos/';
const API_AUTH_LOGIN  = 'http://127.0.0.1:8000/api/auth/login/';
const API_AUTH_REG    = 'http://127.0.0.1:8000/api/auth/registro/';
const API_JAVA        = 'http://127.0.0.1:8080/api/boletos/comprar';
const API_OCUPADOS    = 'http://127.0.0.1:8080/api/boletos/ocupados';
const API_TICKET      = 'http://127.0.0.1:8000/api/enviar-ticket/';
const PRECIO_BOLETO   = 850;

// ============================================
// ESTADO GLOBAL
// ============================================
let conciertoActual = null;
let seleccionados   = 0;
let usuarioActual   = null;

// ============================================
// PERSISTENCIA — localStorage
// ============================================
const LS_KEY = 'ticketlive_usuario';

function guardarSesion(datos) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(datos)); } catch (_) {}
}
function cargarSesion() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (_) { return null; }
}
function borrarSesion() {
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
}

// ============================================
// PESTAÑAS DEL MODAL (Login / Registro)
// ============================================
function activarTab(tab) {
    const esLogin = (tab === 'login');
    document.getElementById('tab-login').setAttribute('aria-selected', esLogin ? 'true' : 'false');
    document.getElementById('tab-registro').setAttribute('aria-selected', esLogin ? 'false' : 'true');
    document.getElementById('panel-login').style.display    = esLogin ? 'block' : 'none';
    document.getElementById('panel-registro').style.display = esLogin ? 'none'  : 'block';
    const primerCampo = esLogin
        ? document.getElementById('login-usuario')
        : document.getElementById('reg-nombre');
    setTimeout(() => primerCampo.focus(), 50);
}

document.getElementById('tab-login').addEventListener('click',    () => activarTab('login'));
document.getElementById('tab-registro').addEventListener('click', () => activarTab('registro'));

// ============================================
// ABRIR / CERRAR MODAL
// ============================================
function abrirModalLogin(tabInicial = 'login') {
    const overlay = document.getElementById('overlay-login');
    overlay.style.display = 'flex';
    limpiarFormularios();
    activarTab(tabInicial);
    overlay.addEventListener('keydown', trampaFoco);
}

function cerrarModalLogin() {
    const overlay = document.getElementById('overlay-login');
    overlay.style.display = 'none';
    overlay.removeEventListener('keydown', trampaFoco);
}

function limpiarFormularios() {
    ['login-usuario','login-password','reg-nombre','reg-usuario','reg-email','reg-password']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = ''; el.classList.remove('campo-invalido'); }
        });
    ['login-error','reg-error','reg-exito'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function trampaFoco(e) {
    if (e.key !== 'Tab') return;
    const focusables = document.getElementById('modal-login')
        .querySelectorAll('button:not([style*="display:none"]), input:not([style*="display:none"]), [tabindex]:not([tabindex="-1"])');
    const primero = focusables[0];
    const ultimo  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primero.focus();
    }
}

// ============================================
// LOGIN → Django (8000) con fallback demo
// ============================================
async function loginUsuario() {
    const username = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    const btn      = document.getElementById('btn-submit-login');
    const texto    = btn.querySelector('.auth-btn-texto');
    const spinner  = btn.querySelector('.auth-spinner');

    if (!username || !password) {
        mostrarMensaje(errorEl, 'Completa todos los campos.', 'error');
        return;
    }

    // ==========================================================
    // 🚀 REDIRECCIÓN AUTOMÁTICA PARA ADMIN (Puerto 8000)
    // ==========================================================
    if (username === 'admin' && password === '1234') {
        console.log("Detectado Administrador: Sergio. Redirigiendo...");
        setBtnEstado(btn, texto, spinner, true, 'Accediendo...');
        
        // Usamos location.assign para forzar el cambio de puerto
        setTimeout(() => {
            window.location.assign("http://127.0.0.1:8000/admin/");
        }, 1000);
        return; 
    }

    setBtnEstado(btn, texto, spinner, true, 'Verificando...');
    errorEl.style.display = 'none';

    try {
        const res = await fetch(API_AUTH_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) throw new Error('Credenciales incorrectas.');

        const datos = await res.json();
        aplicarLogin({
            nombre: datos.nombre || username,
            rol: datos.rol || 'Usuario',
            token: datos.token || null
        });

    } catch (err) {
        console.warn('Modo demo activo...');
        const DEMO = [
            { username: 'sergio', password: '1234', nombre: 'Sergio', rol: 'Usuario' },
            { username: 'admin',  password: '1234', nombre: 'Admin',  rol: 'Admin' }
        ];

        const match = DEMO.find(u => u.username === username && u.password === password);
        if (match) {
            aplicarLogin({ nombre: match.nombre, rol: match.rol, token: 'demo' });
        } else {
            mostrarMensaje(errorEl, 'Usuario o contraseña incorrectos.', 'error');
        }
    } finally {
        if (username !== 'admin') {
            setBtnEstado(btn, texto, spinner, false, 'Entrar al sistema');
        }
    }
}

// ============================================
// REGISTRO → Django (8000) con fallback demo
// ============================================
async function registrarUsuario() {
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const username = document.getElementById('reg-usuario').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl  = document.getElementById('reg-error');
    const exitoEl  = document.getElementById('reg-exito');
    const btn      = document.getElementById('btn-submit-registro');
    const texto    = btn.querySelector('.auth-btn-texto');
    const spinner  = btn.querySelector('.auth-spinner');

    errorEl.style.display = 'none';
    exitoEl.style.display = 'none';
    ['reg-nombre','reg-usuario','reg-email','reg-password']
        .forEach(id => document.getElementById(id).classList.remove('campo-invalido'));

    const errores = [];
    if (!nombre)                           { errores.push('El nombre es obligatorio.');                       document.getElementById('reg-nombre').classList.add('campo-invalido'); }
    if (!username || username.length < 3)  { errores.push('El usuario debe tener al menos 3 caracteres.');   document.getElementById('reg-usuario').classList.add('campo-invalido'); }
    if (!email || !email.includes('@'))    { errores.push('Ingresa un correo válido.');                       document.getElementById('reg-email').classList.add('campo-invalido'); }
    if (!password || password.length < 6) { errores.push('La contraseña debe tener al menos 6 caracteres.'); document.getElementById('reg-password').classList.add('campo-invalido'); }

    if (errores.length) {
        mostrarMensaje(errorEl, errores[0], 'error');
        return;
    }

    setBtnEstado(btn, texto, spinner, true, 'Creando cuenta...');

    try {
        const res = await fetch(API_AUTH_REG, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: nombre, username, email, password })
        });
        if (res.status === 400) {
            const data = await res.json().catch(() => ({}));
            const primerError = Object.values(data).flat()[0] || 'Error al crear la cuenta.';
            throw new Error(primerError);
        }
        if (!res.ok) throw new Error(`Error del servidor (${res.status}).`);

        // ✅ Guardado real en PostgreSQL via Django
        mostrarMensaje(exitoEl, `¡Cuenta creada! Inicia sesión, ${nombre}.`, 'exito');
        setTimeout(() => {
            activarTab('login');
            document.getElementById('login-usuario').value = username;
            document.getElementById('login-password').focus();
        }, 1800);

    } catch (err) {
        console.warn('Django no disponible. Guardando en modo demo...');
        const usuariosLocales = JSON.parse(localStorage.getItem('ticketlive_nuevos_usuarios') || '[]');
        const existe = usuariosLocales.find(u => u.username === username);
        if (existe) {
            mostrarMensaje(errorEl, 'Ese nombre de usuario ya está en uso.', 'error');
            document.getElementById('reg-usuario').classList.add('campo-invalido');
            return;
        }
        usuariosLocales.push({ nombre, username, email, password, rol: 'Usuario' });
        localStorage.setItem('ticketlive_nuevos_usuarios', JSON.stringify(usuariosLocales));
        mostrarMensaje(exitoEl, `¡Cuenta creada (modo demo)! Inicia sesión, ${nombre}.`, 'exito');
        setTimeout(() => {
            activarTab('login');
            document.getElementById('login-usuario').value = username;
            document.getElementById('login-password').focus();
        }, 1800);
    } finally {
        setBtnEstado(btn, texto, spinner, false, 'Crear cuenta');
    }
}

// ============================================
// HELPERS DE FORMULARIO
// ============================================
function setBtnEstado(btn, textoEl, spinnerEl, cargando, textoBtn) {
    btn.disabled            = cargando;
    textoEl.textContent     = textoBtn;
    spinnerEl.style.display = cargando ? 'inline-block' : 'none';
}

function mostrarMensaje(el, msg, tipo) {
    el.textContent   = msg;
    el.style.display = 'block';
    if (tipo === 'exito') {
        el.classList.remove('auth-error');
        el.classList.add('auth-success');
    } else {
        el.classList.remove('auth-success');
        el.classList.add('auth-error');
    }
}

// ============================================
// SESIÓN — aplicar, cerrar, botón pago
// ============================================
function aplicarLogin(datos) {
    usuarioActual = datos;
    guardarSesion(datos);
    document.getElementById('estado-invitado').style.display = 'none';
    document.getElementById('estado-usuario').style.display  = 'flex';
    document.getElementById('saludo-usuario').textContent    = `👋 ${datos.nombre}`;
    document.getElementById('badge-rol').textContent         = datos.rol || 'Usuario';
    actualizarBotonPago();
    cerrarModalLogin();
    mostrarToast(`¡Bienvenido, ${datos.nombre}! 🎟`, 'exito');
}

function cerrarSesion() {
    usuarioActual = null;
    borrarSesion();
    document.getElementById('estado-invitado').style.display = 'flex';
    document.getElementById('estado-usuario').style.display  = 'none';
    actualizarBotonPago();
    mostrarToast('Sesión cerrada correctamente.', 'exito');
}

function actualizarBotonPago() {
    const btn  = document.getElementById('btn-confirmar-pago');
    const hint = document.getElementById('pago-hint-login');
    if (!btn) return;
    if (usuarioActual) {
        btn.disabled    = (seleccionados === 0);
        btn.textContent = seleccionados > 0 ? 'Confirmar pago' : 'Selecciona un asiento';
        if (hint) hint.classList.add('oculto');
    } else {
        btn.disabled    = true;
        btn.textContent = '🔒 Inicia sesión para comprar';
        if (hint) hint.classList.remove('oculto');
    }
}

// ============================================
// PASO A — CARGAR CONCIERTOS: Django (8000)
// ============================================
async function cargarConciertos() {
    try {
        const respuesta = await fetch(API_DJANGO);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
        const conciertos = await respuesta.json();
        const lista = document.getElementById('lista-conciertos');
        lista.innerHTML = '';
        if (conciertos.length === 0) {
            lista.innerHTML = '<p style="color:var(--gris);text-align:center;padding:40px;">No hay eventos disponibles por el momento.</p>';
            return;
        }
        document.getElementById('total-eventos').textContent = `${conciertos.length} eventos`;
        conciertos.forEach((c, i) => lista.appendChild(crearTarjeta(c, i + 1)));
    } catch (error) {
        console.error('Error al conectar con Django (8000):', error);
        document.getElementById('lista-conciertos').innerHTML = `
            <div class="estado-carga">
                <p style="color:#e63c3c;">No se pudo conectar con el servidor.<br>
                <small style="color:var(--gris);">${error.message}</small></p>
            </div>`;
    }
}

function crearTarjeta(concierto, numero) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-concierto';
    const fecha = new Date(concierto.fecha);
    const fechaFormato = fecha.toLocaleDateString('es-MX', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    tarjeta.innerHTML = `
        <span class="tarjeta-numero">${String(numero).padStart(2,'0')}</span>
        <h3 class="tarjeta-artista">${concierto.artista.nombre}</h3>
        <p class="tarjeta-meta">📍 <span>${concierto.recinto.nombre}</span> — ${concierto.recinto.ciudad}</p>
        <p class="tarjeta-fecha">🗓 <strong>${fechaFormato}</strong></p>
        <button class="btn-ver-mapa" data-id="${concierto.id}">Ver asientos y comprar →</button>
    `;
    tarjeta.querySelector('.btn-ver-mapa').addEventListener('click', () => abrirMapa(concierto));
    return tarjeta;
}

// ============================================
// PASO B — ABRIR MAPA (async — espera a Java)
// ============================================
// ============================================
// PASO B — ABRIR MAPA (async — espera a Java)
// ============================================
async function abrirMapa(concierto) {
    // 1. Guardamos el concierto seleccionado en el estado global
    conciertoActual = concierto;
    seleccionados   = 0;

    // 2. Actualizamos los textos de la interfaz con los datos del concierto
    document.getElementById('mapa-artista').textContent  = concierto.artista.nombre;
    document.getElementById('mapa-detalles').textContent = 
        `${concierto.recinto.nombre} · ${concierto.recinto.ciudad} · ` +
        new Date(concierto.fecha).toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

    // 3. Limpiamos y preparamos el ticket de compra
    document.getElementById('ticket-evento').textContent   = concierto.artista.nombre;
    document.getElementById('ticket-recinto').textContent  = concierto.recinto.nombre;
    document.getElementById('ticket-cantidad').textContent = '0';
    document.getElementById('ticket-total').textContent    = '$0';
    document.getElementById('ticket-resumen').style.display = 'none';

    // 4. Limpiamos la cuadrícula de asientos antes de generarla
    const cuadricula = document.getElementById('cuadricula-asientos');
    cuadricula.innerHTML = '';

    // 5. Dibujamos los asientos en blanco (los 50 que definimos)
    generarAsientos(cuadricula);

    // 6. ¡CLAVE! Pedimos a Java los asientos ocupados usando el ID de este concierto
    // Esto evita que los asientos de Ariana se vean en el de Sabrina
    await cargarAsientosOcupados(concierto.id); 

    // 7. Cambiamos de vista (Ocultamos cartelera y mostramos mapa)
    document.getElementById('seccion-cartelera').style.display = 'none';
    document.getElementById('seccion-hero').style.display      = 'none';
    
    const seccionMapa = document.getElementById('seccion-mapa');
    seccionMapa.style.display = 'flex';
    
    // 8. Hacemos scroll suave hacia arriba del mapa
    seccionMapa.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// PASO C — GENERAR ASIENTOS (data-id único)
// ============================================
// Agrega estas variables al inicio de tu archivo si no las tienes
const MAX_BOLETOS = 8;

function generarAsientos(cuadricula) {
    // 1. Limpiamos la cuadrícula para que no se dupliquen
    cuadricula.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        const asiento = document.createElement('div');
        const idAsiento = `A${i + 1}`;
        asiento.className = 'asiento';
        asiento.dataset.id = idAsiento;
        asiento.innerText = idAsiento;

        // --- ESTA ES LA LÓGICA DE MULTI-SELECCIÓN ---
        asiento.addEventListener('click', function() {
            // Si ya está ocupado (rojo), no hacemos nada
            if (this.classList.contains('ocupado')) return;

            // Si ya está seleccionado (azul), lo desmarcamos
            if (this.classList.contains('seleccionado')) {
                this.classList.remove('seleccionado');
            } 
            // Si no está seleccionado, revisamos que no pase de 8
            else {
                const totalSeleccionados = document.querySelectorAll('.asiento.seleccionado').length;
                if (totalSeleccionados < 8) {
                    this.classList.add('seleccionado');
                } else {
                    alert("Solo puedes seleccionar hasta 8 boletos");
                }
            }
            
            // IMPORTANTE: Llamamos a la función que cuenta y suma los precios
            actualizarTicket();
        });

        cuadricula.appendChild(asiento);
    }
}
// ============================================
// SINCRONIZACIÓN — Ocupados desde Java (8080)
// ============================================
// Busca esta línea y cámbiala:
// ============================================
// SINCRONIZACIÓN — Ocupados desde Java (8080)
// ============================================
async function cargarAsientosOcupados(conciertoId) { 
    try {
        // 1. Llamamos a Java pasando el ID del concierto en la URL
        const resp = await fetch(`${API_OCUPADOS}/${conciertoId}`); 
        
        if (!resp.ok) throw new Error(`Java respondió ${resp.status}`);
        
        const ocupados = await resp.json(); // Recibimos la lista de asientos, ej: ["A1", "A5"]

        // 2. Marcamos como ocupados los asientos que recibimos
        ocupados.forEach(id => {
            const el = document.querySelector(`.asiento[data-id="${id}"]`);
            if (el) {
                el.classList.add('ocupado');
                el.classList.remove('seleccionado');
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('aria-label', `Asiento ${id} — Ocupado`);
                el.style.cursor = 'not-allowed';

                // Clonamos para eliminar los clics en asientos ocupados
                const clone = el.cloneNode(true);
                el.replaceWith(clone);
            }
        });

        console.log(`✅ Asientos ocupados para el concierto ${conciertoId}:`, ocupados);
    } catch (error) {
        console.warn('⚠️ No se pudieron cargar los asientos ocupados:', error.message);
    }
}

// ============================================
// ACTUALIZAR TICKET
// ============================================
function actualizarTicket() {
    // 1. Contamos todos los asientos que tienen la clase 'seleccionado'
    seleccionados = document.querySelectorAll('#cuadricula-asientos .asiento.seleccionado').length;
    
    const resumen = document.getElementById('ticket-resumen');
    
    if (seleccionados > 0) {
        // 2. Mostramos la cantidad y el precio total formateado
        document.getElementById('ticket-cantidad').textContent = seleccionados;
        document.getElementById('ticket-total').textContent =
            `$${(seleccionados * PRECIO_BOLETO).toLocaleString('es-MX')}`;
        
        // 3. Hacemos que el cuadrito del ticket aparezca
        resumen.style.display = 'block';
    } else {
        // 4. Si no hay nada, lo escondemos
        resumen.style.display = 'none';
    }
    
    // 5. Revisamos si el botón de "Pagar" debe activarse o no
    actualizarBotonPago();
}

// ============================================
// VOLVER A LA CARTELERA (A prueba de balas)
// ============================================
const btnVolver = document.getElementById('btn-volver');
if (btnVolver) {
    btnVolver.addEventListener('click', () => {

        document.getElementById('seccion-mapa').style.display = 'none';
        document.getElementById('seccion-cartelera').style.removeProperty('display');

        const hero = document.getElementById('seccion-hero');
        if (hero) hero.style.removeProperty('display');

        setTimeout(() => {
            document.getElementById('seccion-cartelera').scrollIntoView({ behavior: 'smooth' });
        }, 150);

        const ticketResumen = document.getElementById('ticket-resumen');
        if (ticketResumen) ticketResumen.style.display = 'none';

        seleccionados = 0;
        conciertoActual = null;
    });
}

// ============================================
// PASO D — CONFIRMAR PAGO (MODAL AMARILLO + JAVA + DJANGO)
// ============================================

// 1. EL BOTÓN VERDE: Ahora solo abre el modal amarillo
document.getElementById('btn-confirmar-pago').addEventListener('click', () => {
    const asientosMarcados = document.querySelectorAll('.asiento.seleccionado');

    if (asientosMarcados.length === 0 || !usuarioActual) {
        mostrarToast('Selecciona al menos un asiento e inicia sesión', 'error');
        return;
    }

    // Calculamos el total para mostrarlo en el modal amarillo
    const totalVenta = asientosMarcados.length * PRECIO_BOLETO;
    document.getElementById('pago-total-monto').textContent = `$${totalVenta.toLocaleString('es-MX')}`;
    
    // MOSTRAMOS TU MODAL AMARILLO (Sin ventanas grises)
    document.getElementById('overlay-pago').classList.remove('oculto');
});

// 2. EL BOTÓN DEL MODAL AMARILLO: Aquí sucede la magia real
document.getElementById('btn-pagar-ahora').addEventListener('click', async () => {
    
    // Leemos los datos de los cuadritos amarillos
    const tarjeta = document.getElementById('input-tarjeta').value;
    const exp = document.getElementById('input-exp').value;
    const cvc = document.getElementById('input-cvc').value;

    if (!tarjeta || tarjeta.length < 16 || !exp || !cvc) {
        alert("❌ Por favor, ingresa los datos completos de tu tarjeta.");
        return;
    }

    // Cerramos el modal para empezar el proceso
    document.getElementById('overlay-pago').classList.add('oculto');
    mostrarToast("💳 Procesando pago...", "exito");

    const btn = document.getElementById('btn-confirmar-pago');
    btn.textContent = 'Procesando...';
    btn.disabled = true;

    const asientosMarcados = document.querySelectorAll('.asiento.seleccionado');

    try {
        // --- 1. REGISTRO EN JAVA (8080) ---
        for (let asientoEl of asientosMarcados) {
            const idAsiento = asientoEl.getAttribute('data-id');
            const res = await fetch(API_JAVA, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(usuarioActual.token ? { 'Authorization': `Bearer ${usuarioActual.token}` } : {})
                },
                body: JSON.stringify({
                    asiento: idAsiento,
                    conciertoId: conciertoActual?.id
                })
            });

            const resultado = await res.json();
            if (resultado.estado !== 'EXITO') {
                throw new Error(resultado.mensaje || 'Error al ocupar uno de los asientos.');
            }
        }

        // --- 2. ENVÍO DE CORREO EN DJANGO (8000) ---
        try {
            await fetch(API_TICKET, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre:   usuarioActual.nombre,
                    email:    usuarioActual.email || 'sergio@ejemplo.com',
                    artista:  conciertoActual.artista.nombre,
                    cantidad: asientosMarcados.length, 
                    asiento:  Array.from(asientosMarcados).map(a => a.getAttribute('data-id')).join(', '),
                    precio:   PRECIO_BOLETO,
                    lugar:    conciertoActual.recinto.nombre,
                    fecha:    new Date(conciertoActual.fecha).toLocaleDateString()
                })
            });
            console.log("📧 Ticket enviado satisfactoriamente");
        } catch (e) {
            console.warn("⚠️ No se pudo enviar el correo, pero la compra fue exitosa.");
        }

        // --- 3. ACTUALIZACIÓN VISUAL ---
        asientosMarcados.forEach(asientoSeleccionado => {
            asientoSeleccionado.classList.remove('seleccionado');
            asientoSeleccionado.classList.add('ocupado');
            const clone = asientoSeleccionado.cloneNode(true);
            asientoSeleccionado.replaceWith(clone);
        });

        seleccionados = 0;
        document.getElementById('ticket-resumen').style.display = 'none';
        mostrarToast(`¡Compra exitosa! Revisa tu correo 🎟`, 'exito');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message, 'error');
    } finally {
        btn.textContent = 'Confirmar pago';
        btn.disabled = false;
        actualizarBotonPago();
    }
});

// Botón de cerrar (X) del modal de pago
document.getElementById('btn-cerrar-pago-modal').addEventListener('click', () => {
    document.getElementById('overlay-pago').classList.add('oculto');
});
// ============================================
// TOAST
// ============================================
function mostrarToast(mensaje, tipo = 'exito') {
    const anterior = document.getElementById('toast');
    if (anterior) anterior.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = mensaje;
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%;
        transform:translateX(-50%) translateY(80px);
        background:${tipo === 'exito' ? '#2ec27e' : '#e63c3c'};
        color:#000; font-family:'DM Sans',sans-serif; font-weight:600; font-size:15px;
        padding:14px 28px; border-radius:6px; border:3px solid #000;
        box-shadow:4px 4px 0 #000; z-index:1000;
        transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
        max-width:90vw; text-align:center;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(80px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ============================================
// ACCESIBILIDAD — alto contraste
// ============================================
const btnContraste = document.getElementById('btn-contraste');
if (btnContraste) {
    btnContraste.addEventListener('click', () => document.body.classList.toggle('alto-contraste'));
}
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'c' && e.target.tagName !== 'INPUT')
        document.body.classList.toggle('alto-contraste');
    if (e.key === 'Escape') cerrarModalLogin();
});

// ============================================
// EVENTOS DEL MODAL
// ============================================
document.getElementById('btn-abrir-login').addEventListener('click',  () => abrirModalLogin('login'));
document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModalLogin);
document.getElementById('btn-logout').addEventListener('click',       cerrarSesion);
document.getElementById('overlay-login').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay-login')) cerrarModalLogin();
});

document.getElementById('btn-submit-login').addEventListener('click',    loginUsuario);
document.getElementById('btn-submit-registro').addEventListener('click', registrarUsuario);

// Enter en campos
document.getElementById('login-usuario').addEventListener('keydown',  e => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });
document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') loginUsuario(); });
document.getElementById('reg-password').addEventListener('keydown',   e => { if (e.key === 'Enter') registrarUsuario(); });

// Limpiar estado inválido al escribir
['login-usuario','login-password','reg-nombre','reg-usuario','reg-email','reg-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function () {
        this.classList.remove('campo-invalido');
    });
});

// Mostrar / ocultar contraseña
document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const inp = btn.previousElementSibling;
        inp.type  = inp.type === 'password' ? 'text' : 'password';
    });
});

// Link de login desde hint del botón de pago
document.getElementById('btn-pago-login-link').addEventListener('click', () => abrirModalLogin('login'));

// ============================================
// ARRANQUE — restaurar sesión + cargar datos
// ============================================
const sesionGuardada = cargarSesion();
if (sesionGuardada) aplicarLogin(sesionGuardada);

// ============================================
// LÓGICA DE CIERRE DE SESIÓN (AL CLIC EN EL NOMBRE)
// ============================================
// Cambiamos 'usuario-nombre' por 'saludo-usuario' para que coincida con tu HTML
const elementoNombre = document.getElementById('saludo-usuario'); 

if (elementoNombre) {
    elementoNombre.style.cursor = "pointer";
    elementoNombre.title = "Clic para salir";

    elementoNombre.onclick = () => {
        const deseaSalir = confirm("¿Deseas salir de tu cuenta?");
        if (deseaSalir) {
            elementoNombre.innerText = "Saliendo...";
            setTimeout(() => {
                localStorage.removeItem('ticketlive_usuario');
                alert("Has salido de tu cuenta correctamente.");
                location.reload(); 
            }, 1500);
        }
    };
}

// ESTA SUELE SER LA ÚLTIMA LÍNEA
cargarConciertos();